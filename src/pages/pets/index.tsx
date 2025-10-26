/**
 * 宠物列表页
 * 学生查看自己领养的所有宠物
 */
import { View, Text, Image } from '@tarojs/components';
import Taro, { useLoad, useDidShow } from '@tarojs/taro';
import { useState } from 'react';
import { request } from '../../utils/api';
import TabBar from '../../components/TabBar';
import './index.scss';

/**
 * 宠物信息接口
 */
interface Pet {
  id: number;
  studentId: number;
  classId: number;
  name: string;
  description: string;
  imageUrl: string;
  level: number;
  experience: number;
  createdAt: string;
}

export default function Pets() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('');

  /**
   * 获取所有宠物
   */
  const fetchPets = async () => {
    try {
      setLoading(true);
      const data = await request<Pet[]>({
        url: '/pets/my-pets',
        method: 'GET',
      });
      setPets(data);
    } catch (error: any) {
      Taro.showToast({
        title: error.message || '加载失败',
        icon: 'none',
      });
    } finally {
      setLoading(false);
    }
  };

  // 页面加载时检查角色
  useLoad(() => {
    const role = Taro.getStorageSync('userRole');
    setUserRole(role);

    if (role === 'student') {
      fetchPets();
    } else {
      setLoading(false);
    }
  });

  // 页面显示时刷新数据（从详情页返回）
  useDidShow(() => {
    const role = Taro.getStorageSync('userRole');
    if (role === 'student') {
      fetchPets();
    }
  });

  /**
   * 跳转到宠物详情页
   */
  const goToDetail = (petId: number) => {
    Taro.navigateTo({ url: `/pages/pet-detail/index?id=${petId}` });
  };

  /**
   * 跳转到领养页
   */
  const goToAdopt = () => {
    Taro.navigateTo({ url: '/pages/pet-adopt/index' });
  };

  /**
   * 计算升级进度百分比
   */
  const getLevelProgress = (experience: number, level: number) => {
    const currentLevelExp = (level - 1) * 100;
    const nextLevelExp = level * 100;
    const progress = ((experience - currentLevelExp) / (nextLevelExp - currentLevelExp)) * 100;
    return Math.min(Math.max(progress, 0), 100);
  };

  // 教师账号提示
  if (userRole !== 'student') {
    return (
      <View className='pets-page'>
        <View className='content'>
          <View className='empty'>
            <Text className='empty-text'>教师账号暂无宠物功能</Text>
            <Text className='empty-hint'>宠物系统专为学生设计</Text>
          </View>
        </View>
        <TabBar current='pets' />
      </View>
    );
  }

  return (
    <View className='pets-page'>
      {/* 头部 */}
      <View className='header'>
        <Text className='title'>我的宠物</Text>
        <View className='adopt-btn' onClick={goToAdopt}>
          领养宠物
        </View>
      </View>

      {/* 内容区域 */}
      <View className='content'>
        {loading && <Text className='loading'>加载中...</Text>}
        
        {!loading && pets.length === 0 && (
          <View className='empty'>
            <Text className='empty-text'>还没有宠物</Text>
            <Text className='empty-hint'>快去领养一只吧！</Text>
            <View className='empty-btn' onClick={goToAdopt}>
              领养宠物
            </View>
          </View>
        )}

        {!loading && pets.length > 0 && (
          <View className='pet-list'>
            {pets.map((pet) => (
              <View
                key={pet.id}
                className='pet-card'
                onClick={() => goToDetail(pet.id)}
              >
                <Image
                  className='pet-image'
                  src={pet.imageUrl}
                  mode='aspectFill'
                />
                <View className='pet-info'>
                  <Text className='pet-name'>{pet.name}</Text>
                  <Text className='pet-desc'>{pet.description}</Text>
                  <View className='pet-level'>
                    <Text className='level-text'>Lv.{pet.level}</Text>
                    <View className='progress-bar'>
                      <View
                        className='progress-fill'
                        style={{ width: `${getLevelProgress(pet.experience, pet.level)}%` }}
                      />
                    </View>
                    <Text className='exp-text'>{pet.experience} EXP</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* 底部导航 */}
      <TabBar current='pets' />
    </View>
  );
}
