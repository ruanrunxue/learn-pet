import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useState, useEffect } from 'react';
import { request } from '../../utils/api';
import TabBar from '../../components/TabBar';
import './index.scss';

interface Task {
  id: number;
  teacherId: number;
  classId: number;
  title: string;
  description: string;
  points: number;
  deadline: string;
  createdAt: string;
}

/**
 * 任务页面
 * 显示当前班级的所有任务
 */
export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('');
  const [currentClassId, setCurrentClassId] = useState<number | null>(null);

  useEffect(() => {
    const role = Taro.getStorageSync('userRole');
    setUserRole(role);
    
    // 从全局状态或存储中获取当前选中的班级ID
    const classId = Taro.getStorageSync('currentClassId');
    if (classId) {
      setCurrentClassId(classId);
      loadTasks(classId);
    } else {
      setLoading(false);
    }
  }, []);

  const loadTasks = async (classId: number) => {
    try {
      setLoading(true);
      const data = await request<Task[]>({
        url: `/tasks/class/${classId}`,
        method: 'GET',
      });
      setTasks(data);
    } catch (error) {
      Taro.showToast({
        title: '加载失败',
        icon: 'none',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTaskClick = (task: Task) => {
    Taro.navigateTo({
      url: `/pages/task-detail/index?id=${task.id}`,
    });
  };

  const handlePublish = () => {
    Taro.navigateTo({
      url: '/pages/task-publish/index',
    });
  };

  if (!currentClassId) {
    return (
      <View className="tasks-container">
        <View className="page-content">
          <View className="empty">
            <Text>请先选择一个班级</Text>
            <View className="select-btn" onClick={() => Taro.redirectTo({ url: '/pages/class-list/index' })}>
              去选择班级
            </View>
          </View>
        </View>
        <TabBar current="/pages/tasks/index" />
      </View>
    );
  }

  return (
    <View className="tasks-container">
      <View className="page-content">
        <View className="header">
          <Text className="title">班级任务</Text>
          {userRole === 'teacher' && (
            <View className="publish-btn" onClick={handlePublish}>
              发布任务
            </View>
          )}
        </View>

        {loading ? (
          <View className="loading">加载中...</View>
        ) : tasks.length === 0 ? (
          <View className="empty">
            <Text>暂无任务</Text>
          </View>
        ) : (
          <View className="tasks-list">
            {tasks.map((task) => (
              <View
                key={task.id}
                className="task-item"
                onClick={() => handleTaskClick(task)}
              >
                <View className="task-header">
                  <Text className="task-title">{task.title}</Text>
                  <Text className="task-points">+{task.points}积分</Text>
                </View>
                <Text className="task-desc">{task.description}</Text>
                <View className="task-footer">
                  <Text className="deadline">
                    截止时间：{new Date(task.deadline).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
      
      <TabBar current="/pages/tasks/index" />
    </View>
  );
}
