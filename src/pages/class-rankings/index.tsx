/**
 * 班级积分排行榜页面
 * 显示班级内所有学生的积分排名
 */
import { View, Text } from '@tarojs/components';
import { useLoad } from '@tarojs/taro';
import Taro from '@tarojs/taro';
import { useState } from 'react';
import { request } from '../../utils/api';
import './index.scss';

/**
 * 排名数据类型
 */
interface Ranking {
  studentId: number;
  studentName: string;
  totalPoints: number;
}

/**
 * 班级积分排行榜页面组件
 */
export default function ClassRankings() {
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [loading, setLoading] = useState(true);
  const [className, setClassName] = useState('');

  /**
   * 页面加载时获取排名数据
   */
  useLoad((options) => {
    const id = parseInt(options.classId || '0');
    const name = options.className || '';
    
    if (!id) {
      Taro.showToast({ title: '班级ID无效', icon: 'none' });
      setTimeout(() => Taro.navigateBack(), 1500);
      return;
    }

    setClassName(decodeURIComponent(name));
    loadRankings(id);
  });

  /**
   * 加载积分排名
   */
  const loadRankings = async (classId: number) => {
    try {
      setLoading(true);
      const data = await request<{ rankings: Ranking[] }>({
        url: `/class/${classId}/rankings`,
        method: 'GET',
      });
      setRankings(data.rankings);
    } catch (error) {
      console.error('加载排名失败:', error);
      Taro.showToast({ title: '加载排名失败', icon: 'none' });
    } finally {
      setLoading(false);
    }
  };

  /**
   * 获取排名图标
   */
  const getRankIcon = (index: number) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `${index + 1}`;
  };

  /**
   * 获取排名样式类名
   */
  const getRankClass = (index: number) => {
    if (index === 0) return 'rank-first';
    if (index === 1) return 'rank-second';
    if (index === 2) return 'rank-third';
    return '';
  };

  if (loading) {
    return (
      <View className="rankings-page">
        <View className="loading">加载中...</View>
      </View>
    );
  }

  return (
    <View className="rankings-page">
      <View className="page-header">
        <Text className="class-name">{className}</Text>
        <Text className="subtitle">积分排行榜</Text>
      </View>

      {rankings.length === 0 ? (
        <View className="empty-state">
          <Text className="empty-icon">📊</Text>
          <Text className="empty-text">暂无排名数据</Text>
          <Text className="empty-hint">完成任务获得积分后将显示排名</Text>
        </View>
      ) : (
        <View className="rankings-list">
          {rankings.map((rank, index) => (
            <View key={rank.studentId} className={`rank-item ${getRankClass(index)}`}>
              <View className="rank-position">
                <Text className="rank-icon">{getRankIcon(index)}</Text>
              </View>
              <View className="rank-info">
                <Text className="student-name">{rank.studentName}</Text>
                <Text className="points-label">积分</Text>
              </View>
              <View className="rank-points">
                <Text className="points-value">{rank.totalPoints}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
