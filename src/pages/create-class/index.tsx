/**
 * 创建班级页面（教师专用）
 */
import { View, Text, Input, Button } from '@tarojs/components';
import { useState } from 'react';
import Taro from '@tarojs/taro';
import { classApi } from '../../utils/api';
import './index.scss';

export default function CreateClass() {
  const currentYear = new Date().getFullYear().toString();
  const [year, setYear] = useState(currentYear);
  const [className, setClassName] = useState('');
  const [subject, setSubject] = useState('');
  const [loading, setLoading] = useState(false);

  /**
   * 处理创建班级
   */
  const handleCreate = async () => {
    if (!year || !className || !subject) {
      Taro.showToast({ title: '请填写完整信息', icon: 'none' });
      return;
    }

    setLoading(true);
    try {
      await classApi.createClass({ year, className, subject });
      
      Taro.showToast({ title: '创建成功', icon: 'success' });
      
      setTimeout(() => {
        Taro.navigateBack();
      }, 1500);
    } catch (error: any) {
      Taro.showToast({ title: error.message || '创建失败', icon: 'none' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="create-class-container">
      <View className="form">
        <View className="form-item">
          <Text className="form-label">年份</Text>
          <Input
            className="form-input"
            type="text"
            placeholder={currentYear}
            value={year}
            onInput={(e) => setYear(e.detail.value)}
          />
        </View>

        <View className="form-item">
          <Text className="form-label">班级</Text>
          <Input
            className="form-input"
            type="text"
            placeholder="例如：初二（1）班"
            value={className}
            onInput={(e) => setClassName(e.detail.value)}
          />
        </View>

        <View className="form-item">
          <Text className="form-label">学科</Text>
          <Input
            className="form-input"
            type="text"
            placeholder="例如：语文"
            value={subject}
            onInput={(e) => setSubject(e.detail.value)}
          />
        </View>

        <Button
          className="create-btn"
          type="primary"
          onClick={handleCreate}
          loading={loading}
        >
          创建班级
        </Button>
      </View>
    </View>
  );
}
