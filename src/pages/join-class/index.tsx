/**
 * 加入班级页面（学生专用）
 * 显示所有可加入的班级列表
 */
import { View, Text, Button } from '@tarojs/components';
import { useState } from 'react';
import Taro, { useLoad } from '@tarojs/taro';
import { classApi } from '../../utils/api';
import './index.scss';

export default function JoinClass() {
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useLoad(() => {
    loadAvailableClasses();
  });

  /**
   * 加载可加入的班级
   */
  const loadAvailableClasses = async () => {
    setLoading(true);
    try {
      const response = await classApi.getAvailableClasses();
      setClasses(response.classes);
    } catch (error: any) {
      Taro.showToast({ title: error.message || '加载失败', icon: 'none' });
    } finally {
      setLoading(false);
    }
  };

  /**
   * 加入班级
   */
  const handleJoin = async (classId: number) => {
    try {
      await classApi.joinClass(classId);
      Taro.showToast({ title: '加入成功', icon: 'success' });
      
      setTimeout(() => {
        Taro.navigateBack();
      }, 1500);
    } catch (error: any) {
      Taro.showToast({ title: error.message || '加入失败', icon: 'none' });
    }
  };

  return (
    <View className="join-class-container">
      {loading ? (
        <View className="empty-state">
          <Text>加载中...</Text>
        </View>
      ) : classes.length === 0 ? (
        <View className="empty-state">
          <Text className="empty-text">暂无可加入的班级</Text>
        </View>
      ) : (
        <View className="class-list">
          {classes.map((cls) => (
            <View key={cls.id} className="class-item">
              <View className="class-info">
                <Text className="class-name">{cls.className}</Text>
                <Text className="class-meta">{cls.year} · {cls.subject}</Text>
                <Text className="teacher-name">教师：{cls.teacherName}</Text>
              </View>
              <Button
                className="join-btn"
                size="mini"
                onClick={() => handleJoin(cls.id)}
              >
                加入
              </Button>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
