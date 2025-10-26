/**
 * 班级列表页面
 * 教师显示创建的班级，学生显示已加入的班级
 */
import { View, Text, Button } from '@tarojs/components';
import { useState } from 'react';
import Taro, { useLoad } from '@tarojs/taro';
import { classApi } from '../../utils/api';
import TabBar from '../../components/TabBar';
import './index.scss';

export default function ClassList() {
  const [user, setUser] = useState<any>(null);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useLoad(() => {
    loadUserInfo();
  });

  /**
   * 加载用户信息
   */
  const loadUserInfo = () => {
    const userData = Taro.getStorageSync('user');
    if (!userData) {
      Taro.redirectTo({ url: '/pages/login/index' });
      return;
    }
    setUser(userData);
    loadClasses(userData.role);
  };

  /**
   * 加载班级列表
   * 根据用户角色调用不同的API
   */
  const loadClasses = async (role: string) => {
    setLoading(true);
    try {
      if (role === 'teacher') {
        const response = await classApi.getTeacherClasses();
        setClasses(response.classes);
      } else {
        const response = await classApi.getStudentClasses();
        setClasses(response.classes);
      }
    } catch (error: any) {
      Taro.showToast({ title: error.message || '加载失败', icon: 'none' });
    } finally {
      setLoading(false);
    }
  };

  /**
   * 创建班级（教师）
   */
  const handleCreateClass = () => {
    Taro.navigateTo({ url: '/pages/create-class/index' });
  };

  /**
   * 加入班级（学生）
   */
  const handleJoinClass = () => {
    Taro.navigateTo({ url: '/pages/join-class/index' });
  };

  /**
   * 查看班级详情
   */
  const handleClassDetail = (classId: number) => {
    Taro.navigateTo({ url: `/pages/class-detail/index?id=${classId}` });
  };

  /**
   * 退出登录
   */
  const handleLogout = () => {
    Taro.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          Taro.clearStorage();
          Taro.redirectTo({ url: '/pages/login/index' });
        }
      },
    });
  };

  if (!user) {
    return null;
  }

  return (
    <View className="class-list-container">
      <View className="header">
        <View className="user-info">
          <Text className="welcome">欢迎，{user.name}</Text>
          <Text className="role">{user.role === 'teacher' ? '教师' : '学生'} · {user.school}</Text>
        </View>
        <Button className="logout-btn" size="mini" onClick={handleLogout}>退出</Button>
      </View>

      <View className="class-list">
        {loading ? (
          <View className="empty-state">
            <Text>加载中...</Text>
          </View>
        ) : classes.length === 0 ? (
          <View className="empty-state">
            <Text className="empty-text">
              {user.role === 'teacher' ? '还没有创建班级' : '还没有加入班级'}
            </Text>
          </View>
        ) : (
          classes.map((cls) => (
            <View
              key={cls.id}
              className="class-item"
              onClick={() => handleClassDetail(cls.id)}
            >
              <View className="class-info">
                <Text className="class-name">{cls.className}</Text>
                <Text className="class-meta">{cls.year} · {cls.subject}</Text>
                {user.role === 'student' && cls.teacherName && (
                  <Text className="teacher-name">教师：{cls.teacherName}</Text>
                )}
              </View>
              <View className="class-arrow">→</View>
            </View>
          ))
        )}
      </View>

      <View className="action-button">
        {user.role === 'teacher' ? (
          <Button className="primary-btn" onClick={handleCreateClass}>
            创建班级
          </Button>
        ) : (
          <Button className="primary-btn" onClick={handleJoinClass}>
            加入班级
          </Button>
        )}
      </View>

      <TabBar current="/pages/class-list/index" />
    </View>
  );
}
