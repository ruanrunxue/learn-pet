import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useState, useEffect } from 'react';
import TabBar from '../../components/TabBar';
import './index.scss';

/**
 * 设置页面
 * 显示用户信息和应用设置
 */
export default function Settings() {
  const [userInfo, setUserInfo] = useState({
    name: '',
    phone: '',
    school: '',
    role: '',
  });

  useEffect(() => {
    const name = Taro.getStorageSync('userName') || '';
    const phone = Taro.getStorageSync('userPhone') || '';
    const school = Taro.getStorageSync('userSchool') || '';
    const role = Taro.getStorageSync('userRole') || '';

    setUserInfo({ name, phone, school, role });
  }, []);

  const handleLogout = () => {
    Taro.showModal({
      title: '退出登录',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          Taro.clearStorage();
          Taro.reLaunch({ url: '/pages/login/index' });
        }
      },
    });
  };

  return (
    <View className="settings-container">
      <View className="page-content">
        <View className="header">
          <Text className="title">设置</Text>
        </View>

        <View className="user-section">
          <View className="user-info">
            <View className="avatar">
              <Text className="avatar-text">{userInfo.name.charAt(0)}</Text>
            </View>
            <View className="info">
              <Text className="name">{userInfo.name}</Text>
              <Text className="role">{userInfo.role === 'teacher' ? '教师' : '学生'}</Text>
            </View>
          </View>
        </View>

        <View className="settings-list">
          <View className="settings-group">
            <View className="settings-item">
              <Text className="label">手机号</Text>
              <Text className="value">{userInfo.phone}</Text>
            </View>
            <View className="settings-item">
              <Text className="label">学校</Text>
              <Text className="value">{userInfo.school}</Text>
            </View>
          </View>

          <View className="settings-group">
            <View className="settings-item clickable" onClick={() => Taro.showToast({ title: '功能开发中', icon: 'none' })}>
              <Text className="label">关于学宠</Text>
              <Text className="arrow">›</Text>
            </View>
          </View>
        </View>

        <View className="logout-section">
          <View className="logout-btn" onClick={handleLogout}>
            退出登录
          </View>
        </View>
      </View>
      
      <TabBar current="/pages/settings/index" />
    </View>
  );
}
