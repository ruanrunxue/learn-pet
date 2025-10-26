/**
 * 设置页面
 * 显示用户信息、提供编辑入口和退出登录功能
 */
import { View, Text, Button } from '@tarojs/components';
import { useLoad, useDidShow } from '@tarojs/taro';
import Taro from '@tarojs/taro';
import { useState } from 'react';
import { request } from '../../utils/api';
import TabBar from '../../components/TabBar';
import './index.scss';

/**
 * 用户信息数据类型
 */
interface UserInfo {
  id: number;
  phone: string;
  name: string;
  school: string;
  role: 'teacher' | 'student';
}

/**
 * 设置页面组件
 */
export default function Settings() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * 页面加载时获取用户信息
   */
  useLoad(() => {
    loadUserInfo();
  });

  /**
   * 页面每次显示时刷新用户信息（从编辑页返回时）
   */
  useDidShow(() => {
    loadUserInfo();
  });

  /**
   * 加载用户信息
   */
  const loadUserInfo = async () => {
    try {
      setLoading(true);
      const data = await request<{ user: UserInfo }>({
        url: '/auth/me',
        method: 'GET',
      });
      setUserInfo(data.user);
    } catch (error) {
      console.error('获取用户信息失败:', error);
      Taro.showToast({ title: '获取用户信息失败', icon: 'none' });
    } finally {
      setLoading(false);
    }
  };

  /**
   * 跳转到编辑个人信息页面
   */
  const handleEditProfile = () => {
    Taro.navigateTo({ url: '/pages/settings/edit-profile/index' });
  };

  /**
   * 退出登录
   */
  const handleLogout = () => {
    Taro.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          Taro.clearStorageSync();
          Taro.reLaunch({ url: '/pages/login/index' });
        }
      },
    });
  };

  /**
   * 获取角色显示文本
   */
  const getRoleText = (role: string) => {
    return role === 'teacher' ? '教师' : '学生';
  };

  if (loading) {
    return (
      <View className="settings-page">
        <View className="loading">加载中...</View>
        <TabBar current="settings" />
      </View>
    );
  }

  if (!userInfo) {
    return (
      <View className="settings-page">
        <View className="error">获取用户信息失败</View>
        <TabBar current="settings" />
      </View>
    );
  }

  return (
    <View className="settings-page">
      <View className="settings-content">
        {/* 用户信息卡片 */}
        <View className="user-info-card">
          <View className="user-header">
            <View className="user-avatar">
              {userInfo.name.charAt(0)}
            </View>
            <View className="user-basic">
              <Text className="user-name">{userInfo.name}</Text>
              <Text className="user-role">{getRoleText(userInfo.role)}</Text>
            </View>
          </View>

          <View className="user-details">
            <View className="detail-item">
              <Text className="detail-label">手机号</Text>
              <Text className="detail-value">{userInfo.phone}</Text>
            </View>
            <View className="detail-item">
              <Text className="detail-label">学校</Text>
              <Text className="detail-value">{userInfo.school}</Text>
            </View>
          </View>
        </View>

        {/* 功能列表 */}
        <View className="settings-list">
          <View className="list-item" onClick={handleEditProfile}>
            <Text className="item-label">📝 编辑个人信息</Text>
            <Text className="item-arrow">›</Text>
          </View>
        </View>

        {/* 退出登录按钮 */}
        <View className="logout-section">
          <Button className="logout-btn" onClick={handleLogout}>
            退出登录
          </Button>
        </View>
      </View>

      <TabBar current="settings" />
    </View>
  );
}
