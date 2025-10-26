/**
 * 宠物领养页
 * 学生选择班级并领养宠物
 */
import { View, Text, Input } from '@tarojs/components';
import Taro, { useLoad } from '@tarojs/taro';
import { useState } from 'react';
import { request } from '../../utils/api';
import './index.scss';

/**
 * 班级信息接口
 */
interface ClassInfo {
  id: number;
  teacherId: number;
  year: string;
  className: string;
  subject: string;
  teacherName?: string;
}

export default function PetAdopt() {
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [petName, setPetName] = useState('');
  const [petDescription, setPetDescription] = useState('');
  const [loading, setLoading] = useState(false);

  /**
   * 加载学生已加入的班级
   */
  const fetchClasses = async () => {
    try {
      const data = await request<ClassInfo[]>({
        url: '/class/student',
        method: 'GET',
      });
      setClasses(data);
    } catch (error: any) {
      Taro.showToast({
        title: error.message || '加载班级失败',
        icon: 'none',
      });
    }
  };

  // 页面加载时获取班级列表
  useLoad(() => {
    // 检查是否是学生
    const role = Taro.getStorageSync('userRole');
    if (role !== 'student') {
      Taro.showToast({
        title: '只有学生可以领养宠物',
        icon: 'none',
      });
      setTimeout(() => {
        Taro.navigateBack();
      }, 1500);
      return;
    }

    fetchClasses();
  });

  /**
   * 领养宠物
   */
  const handleAdopt = async () => {
    if (!selectedClassId) {
      Taro.showToast({
        title: '请选择班级',
        icon: 'none',
      });
      return;
    }

    if (!petName.trim()) {
      Taro.showToast({
        title: '请输入宠物名字',
        icon: 'none',
      });
      return;
    }

    if (!petDescription.trim()) {
      Taro.showToast({
        title: '请输入宠物描述',
        icon: 'none',
      });
      return;
    }

    try {
      setLoading(true);
      Taro.showLoading({ title: 'AI生成中...' });

      const pet = await request<{
        id: number;
        name: string;
        description: string;
        imageUrl: string;
      }>({
        url: '/pets/adopt',
        method: 'POST',
        data: {
          classId: selectedClassId,
          name: petName.trim(),
          description: petDescription.trim(),
        },
      });

      Taro.hideLoading();
      Taro.showToast({
        title: '领养成功！',
        icon: 'success',
      });

      // 跳转到宠物详情页
      setTimeout(() => {
        Taro.redirectTo({ url: `/pages/pet-detail/index?id=${pet.id}` });
      }, 1500);
    } catch (error: any) {
      Taro.hideLoading();
      Taro.showToast({
        title: error.message || '领养失败',
        icon: 'none',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className='pet-adopt-page'>
      <View className='header'>
        <Text className='title'>领养宠物</Text>
        <Text className='subtitle'>选择班级并描述你的理想宠物，AI将为你生成专属形象！</Text>
      </View>

      <View className='form'>
        {/* 班级选择 */}
        <View className='form-item'>
          <Text className='label'>选择班级 *</Text>
          <View className='class-list'>
            {classes.length === 0 && (
              <Text className='empty-text'>暂无可用班级</Text>
            )}
            {classes.map((cls) => (
              <View
                key={cls.id}
                className={`class-item ${selectedClassId === cls.id ? 'active' : ''}`}
                onClick={() => setSelectedClassId(cls.id)}
              >
                <Text className='class-name'>
                  {cls.year} {cls.className} {cls.subject}
                </Text>
                {cls.teacherName && (
                  <Text className='teacher-name'>教师：{cls.teacherName}</Text>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* 宠物名字 */}
        <View className='form-item'>
          <Text className='label'>宠物名字 *</Text>
          <Input
            className='input'
            value={petName}
            onInput={(e) => setPetName(e.detail.value)}
            placeholder='给宠物起个名字'
            maxlength={20}
          />
        </View>

        {/* 宠物描述 */}
        <View className='form-item'>
          <Text className='label'>宠物描述 *</Text>
          <Input
            className='textarea'
            value={petDescription}
            onInput={(e) => setPetDescription(e.detail.value)}
            placeholder='描述你的宠物特征，例如：一只可爱的橙色小猫，戴着蝴蝶结'
            maxlength={200}
          />
          <Text className='hint'>AI会根据你的描述生成宠物形象</Text>
        </View>
      </View>

      {/* 提交按钮 */}
      <View className='submit-btn-wrapper'>
        <View
          className={`submit-btn ${loading || !selectedClassId || !petName.trim() || !petDescription.trim() ? 'disabled' : ''}`}
          onClick={handleAdopt}
        >
          {loading ? 'AI生成中...' : '立即领养'}
        </View>
      </View>
    </View>
  );
}
