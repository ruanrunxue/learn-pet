/**
 * 宠物详情页
 * 查看宠物详情并喂养宠物
 */
import { View, Text, Image, Input } from '@tarojs/components';
import Taro, { useLoad } from '@tarojs/taro';
import { useState } from 'react';
import { request } from '../../utils/api';
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

/**
 * 用户积分信息接口
 */
interface UserPoints {
  totalPoints: number;
}

export default function PetDetail() {
  const [pet, setPet] = useState<Pet | null>(null);
  const [userPoints, setUserPoints] = useState(0);
  const [feedPoints, setFeedPoints] = useState('');
  const [loading, setLoading] = useState(true);
  const [feeding, setFeeding] = useState(false);

  /**
   * 获取宠物详情
   */
  const fetchPetDetail = async (petId: number) => {
    try {
      setLoading(true);
      const data = await request<Pet>({
        url: `/pets/${petId}`,
        method: 'GET',
      });
      setPet(data);

      // 获取用户积分
      const pointsData = await request<UserPoints>({
        url: `/pets/${petId}/points`,
        method: 'GET',
      });
      setUserPoints(pointsData.totalPoints || 0);
    } catch (error: any) {
      Taro.showToast({
        title: error.message || '加载失败',
        icon: 'none',
      });
      setTimeout(() => {
        Taro.navigateBack();
      }, 1500);
    } finally {
      setLoading(false);
    }
  };

  // 页面加载时获取宠物ID
  useLoad((options: { id?: string }) => {
    const petId = parseInt(options.id || '0');
    if (!petId) {
      Taro.showToast({
        title: '宠物不存在',
        icon: 'none',
      });
      setTimeout(() => {
        Taro.navigateBack();
      }, 1500);
      return;
    }

    fetchPetDetail(petId);
  });

  /**
   * 喂养宠物
   */
  const handleFeed = async () => {
    if (!pet) return;

    const points = parseInt(feedPoints);
    if (isNaN(points) || points <= 0) {
      Taro.showToast({
        title: '请输入有效积分',
        icon: 'none',
      });
      return;
    }

    if (points > userPoints) {
      Taro.showToast({
        title: '积分不足',
        icon: 'none',
      });
      return;
    }

    try {
      setFeeding(true);
      const updatedPet = await request<Pet>({
        url: `/pets/${pet.id}/feed`,
        method: 'POST',
        data: { points },
      });

      // 更新宠物信息和用户积分
      setPet(updatedPet);
      setUserPoints(userPoints - points);
      setFeedPoints('');

      Taro.showToast({
        title: '喂养成功！',
        icon: 'success',
      });
    } catch (error: any) {
      Taro.showToast({
        title: error.message || '喂养失败',
        icon: 'none',
      });
    } finally {
      setFeeding(false);
    }
  };

  /**
   * 计算升级进度百分比
   */
  const getLevelProgress = () => {
    if (!pet) return 0;
    const currentLevelExp = (pet.level - 1) * 100;
    const nextLevelExp = pet.level * 100;
    const progress = ((pet.experience - currentLevelExp) / (nextLevelExp - currentLevelExp)) * 100;
    return Math.min(Math.max(progress, 0), 100);
  };

  if (loading) {
    return (
      <View className='pet-detail-page'>
        <Text className='loading'>加载中...</Text>
      </View>
    );
  }

  if (!pet) {
    return (
      <View className='pet-detail-page'>
        <Text className='error'>宠物不存在</Text>
      </View>
    );
  }

  return (
    <View className='pet-detail-page'>
      {/* 宠物卡片 */}
      <View className='pet-card'>
        <Image
          className='pet-image'
          src={pet.imageUrl}
          mode='aspectFill'
        />
        <View className='pet-info'>
          <Text className='pet-name'>{pet.name}</Text>
          <Text className='pet-desc'>{pet.description}</Text>
        </View>
      </View>

      {/* 等级和经验 */}
      <View className='stats-card'>
        <View className='stat-item'>
          <Text className='stat-label'>等级</Text>
          <Text className='stat-value'>Lv.{pet.level}</Text>
        </View>
        <View className='stat-item'>
          <Text className='stat-label'>经验值</Text>
          <Text className='stat-value'>{pet.experience} EXP</Text>
        </View>
      </View>

      {/* 升级进度条 */}
      <View className='progress-card'>
        <Text className='progress-label'>升级进度</Text>
        <View className='progress-bar'>
          <View
            className='progress-fill'
            style={{ width: `${getLevelProgress()}%` }}
          />
        </View>
        <Text className='progress-text'>
          {Math.round(getLevelProgress())}% 升至 Lv.{pet.level + 1}
        </Text>
      </View>

      {/* 用户积分 */}
      <View className='points-card'>
        <Text className='points-label'>我的积分</Text>
        <Text className='points-value'>{userPoints} 分</Text>
      </View>

      {/* 喂养区域 */}
      <View className='feed-card'>
        <Text className='feed-title'>喂养宠物</Text>
        <Text className='feed-hint'>使用积分喂养宠物，增加经验值（1积分 = 1经验）</Text>
        <View className='feed-form'>
          <Input
            className='feed-input'
            type='number'
            value={feedPoints}
            onInput={(e) => setFeedPoints(e.detail.value)}
            placeholder='输入积分数量'
          />
          <View
            className={`feed-btn ${feeding || !feedPoints ? 'disabled' : ''}`}
            onClick={handleFeed}
          >
            {feeding ? '喂养中...' : '喂养'}
          </View>
        </View>
      </View>
    </View>
  );
}
