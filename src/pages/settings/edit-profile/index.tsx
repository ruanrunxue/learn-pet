/**
 * 编辑个人信息页面
 * 允许用户修改姓名和学校信息
 */
import { View, Text, Input, Button } from '@tarojs/components';
import { useLoad } from '@tarojs/taro';
import Taro from '@tarojs/taro';
import { useState } from 'react';
import { request } from '../../../utils/api';
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
 * 编辑个人信息页面组件
 */
export default function EditProfile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [school, setSchool] = useState('');

  /**
   * 页面加载时获取用户信息
   */
  useLoad(() => {
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
      setName(data.user.name);
      setSchool(data.user.school);
    } catch (error) {
      console.error('获取用户信息失败:', error);
      Taro.showToast({ title: '获取用户信息失败', icon: 'none' });
    } finally {
      setLoading(false);
    }
  };

  /**
   * 保存用户信息
   */
  const handleSave = async () => {
    if (!name.trim()) {
      Taro.showToast({ title: '请输入姓名', icon: 'none' });
      return;
    }

    if (!school.trim()) {
      Taro.showToast({ title: '请输入学校', icon: 'none' });
      return;
    }

    try {
      setSaving(true);
      await request({
        url: '/auth/update-profile',
        method: 'PUT',
        data: { name: name.trim(), school: school.trim() },
      });

      Taro.showToast({ title: '保存成功', icon: 'success' });
      setTimeout(() => {
        Taro.navigateBack();
      }, 1500);
    } catch (error) {
      console.error('保存失败:', error);
      Taro.showToast({ title: '保存失败，请重试', icon: 'none' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View className="edit-profile-page">
        <View className="loading">加载中...</View>
      </View>
    );
  }

  return (
    <View className="edit-profile-page">
      <View className="page-content">
        <View className="form-section">
          <View className="form-item">
            <Text className="form-label">姓名</Text>
            <Input
              className="form-input"
              value={name}
              onInput={(e) => setName(e.detail.value)}
              placeholder="请输入姓名"
              maxlength={20}
            />
          </View>

          <View className="form-item">
            <Text className="form-label">学校</Text>
            <Input
              className="form-input"
              value={school}
              onInput={(e) => setSchool(e.detail.value)}
              placeholder="请输入学校"
              maxlength={50}
            />
          </View>

          <View className="form-tip">
            <Text className="tip-text">手机号和角色不支持修改</Text>
          </View>
        </View>

        <View className="button-section">
          <Button
            className="save-btn"
            onClick={handleSave}
            loading={saving}
            disabled={saving}
          >
            {saving ? '保存中...' : '保存'}
          </Button>
        </View>
      </View>
    </View>
  );
}
