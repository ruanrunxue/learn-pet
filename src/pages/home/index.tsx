import { View } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useEffect } from 'react';
import './index.scss';

/**
 * 首页 - 重定向到班级列表
 * 作为底部导航的入口点
 */
export default function Home() {
  useEffect(() => {
    // 检查登录状态
    const token = Taro.getStorageSync('token');
    if (!token) {
      Taro.redirectTo({ url: '/pages/login/index' });
      return;
    }

    // 重定向到班级列表页
    Taro.redirectTo({ url: '/pages/class-list/index' });
  }, []);

  return (
    <View className="home-container">
      <View className="loading">加载中...</View>
    </View>
  );
}
