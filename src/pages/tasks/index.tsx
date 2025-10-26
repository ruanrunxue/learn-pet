import { View, Text, Button } from '@tarojs/components';
import { useLoad, useDidShow } from '@tarojs/taro';
import Taro from '@tarojs/taro';
import { useState } from 'react';
import TabBar from '../../components/TabBar';
import { request } from '../../utils/api';
import './index.scss';

/**
 * 任务数据类型
 */
interface Task {
  id: number;
  teacherId: number;
  classId: number;
  title: string;
  description: string;
  points: number;
  deadline: string;
  attachmentUrl: string | null;
  createdAt: string;
}

/**
 * 班级数据类型
 */
interface Class {
  id: number;
  teacherId: number;
  year: string;
  className: string;
  subject: string;
  teacherName?: string;
}

/**
 * 任务管理页面
 * 教师和学生共用，根据角色显示不同内容
 */
export default function Tasks() {
  const [role, setRole] = useState<string>('');
  const [classList, setClassList] = useState<Class[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);

  /**
   * 页面加载时：验证登录状态，获取用户角色和班级列表
   */
  useLoad(() => {
    const userRole = Taro.getStorageSync('userRole');
    const token = Taro.getStorageSync('token');

    if (!token) {
      Taro.redirectTo({ url: '/pages/login/index' });
      return;
    }

    setRole(userRole);
    loadClasses(userRole);
  });

  /**
   * 页面显示时：刷新任务列表
   */
  useDidShow(() => {
    if (selectedClassId) {
      loadTasks(selectedClassId);
    }
  });

  /**
   * 加载班级列表
   */
  const loadClasses = async (userRole: string) => {
    try {
      setLoading(true);
      const endpoint = userRole === 'teacher' ? '/class/teacher' : '/class/student';
      const response = await request<{ classes: Class[] }>({
        url: endpoint,
        method: 'GET',
      });
      const classes = response.classes;
      setClassList(classes);

      if (classes.length > 0) {
        setSelectedClassId(classes[0].id);
        loadTasks(classes[0].id);
      }
    } catch (error) {
      console.error('加载班级列表失败:', error);
      Taro.showToast({ title: '加载班级列表失败', icon: 'none' });
    } finally {
      setLoading(false);
    }
  };

  /**
   * 加载指定班级的任务列表
   */
  const loadTasks = async (classId: number) => {
    try {
      setLoading(true);
      const tasksList = await request<Task[]>({
        url: `/tasks/class/${classId}`,
        method: 'GET',
      });
      setTasks(tasksList);
    } catch (error) {
      console.error('加载任务列表失败:', error);
      Taro.showToast({ title: '加载任务列表失败', icon: 'none' });
    } finally {
      setLoading(false);
    }
  };

  /**
   * 切换班级选择
   */
  const handleClassChange = (classId: number) => {
    setSelectedClassId(classId);
    loadTasks(classId);
  };

  /**
   * 跳转到任务详情页
   */
  const handleTaskClick = (taskId: number) => {
    Taro.navigateTo({ url: `/pages/task-detail/index?id=${taskId}` });
  };

  /**
   * 跳转到发布任务页（教师）
   */
  const handlePublishTask = () => {
    if (!selectedClassId) {
      Taro.showToast({ title: '请先选择班级', icon: 'none' });
      return;
    }
    Taro.navigateTo({ url: `/pages/task-publish/index?classId=${selectedClassId}` });
  };

  /**
   * 格式化日期显示
   */
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  /**
   * 判断任务是否已过期
   */
  const isExpired = (deadline: string) => {
    return new Date(deadline) < new Date();
  };

  return (
    <View className="tasks-page">
      <View className="page-header">
        <Text className="page-title">📋 任务管理</Text>
      </View>

      {classList.length > 0 && (
        <View className="class-selector">
          {classList.map((cls) => (
            <View
              key={cls.id}
              className={`class-tab ${selectedClassId === cls.id ? 'active' : ''}`}
              onClick={() => handleClassChange(cls.id)}
            >
              <Text>{cls.year} {cls.className}</Text>
            </View>
          ))}
        </View>
      )}

      {role === 'teacher' && selectedClassId && (
        <View className="action-bar">
          <Button className="publish-btn" onClick={handlePublishTask}>
            ➕ 发布新任务
          </Button>
        </View>
      )}

      <View className="tasks-container">
        {loading ? (
          <View className="loading">加载中...</View>
        ) : tasks.length === 0 ? (
          <View className="empty-state">
            <Text className="empty-text">暂无任务</Text>
            {role === 'teacher' && (
              <Text className="empty-hint">点击上方按钮发布新任务</Text>
            )}
          </View>
        ) : (
          tasks.map((task) => (
            <View
              key={task.id}
              className="task-card"
              onClick={() => handleTaskClick(task.id)}
            >
              <View className="task-header">
                <Text className="task-title">{task.title}</Text>
                <View className="task-points">
                  <Text className="points-value">+{task.points}</Text>
                  <Text className="points-label">积分</Text>
                </View>
              </View>

              <Text className="task-description">{task.description}</Text>

              <View className="task-footer">
                <View className="deadline-info">
                  <Text className="deadline-label">截止：</Text>
                  <Text className={`deadline-value ${isExpired(task.deadline) ? 'expired' : ''}`}>
                    {formatDate(task.deadline)}
                  </Text>
                  {isExpired(task.deadline) && (
                    <Text className="expired-badge">已过期</Text>
                  )}
                </View>
                {task.attachmentUrl && (
                  <View className="attachment-icon">📎</View>
                )}
              </View>
            </View>
          ))
        )}
      </View>

      <TabBar current="tasks" />
    </View>
  );
}
