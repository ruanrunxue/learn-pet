import { View, Text, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useState, useEffect } from 'react';
import { request } from '../../utils/api';
import TabBar from '../../components/TabBar';
import './index.scss';

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
 * 宠物页面
 * 学生查看和管理自己的宠物
 */
export default function Pets() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    const role = Taro.getStorageSync('userRole');
    setUserRole(role);

    if (role === 'student') {
      loadPets();
    } else {
      setLoading(false);
    }
  }, []);

  const loadPets = async () => {
    try {
      setLoading(true);
      const data = await request<Pet[]>({
        url: '/pets/my-pets',
        method: 'GET',
      });
      setPets(data);
    } catch (error) {
      Taro.showToast({
        title: '加载失败',
        icon: 'none',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePetClick = (pet: Pet) => {
    Taro.navigateTo({
      url: `/pages/pet-detail/index?id=${pet.id}`,
    });
  };

  const handleAdopt = () => {
    const classId = Taro.getStorageSync('currentClassId');
    if (!classId) {
      Taro.showToast({
        title: '请先选择班级',
        icon: 'none',
      });
      return;
    }
    Taro.navigateTo({
      url: `/pages/pet-adopt/index?classId=${classId}`,
    });
  };

  if (userRole !== 'student') {
    return (
      <View className="pets-container">
        <View className="page-content">
          <View className="empty">
            <Text>教师账号无法使用宠物功能</Text>
          </View>
        </View>
        <TabBar current="/pages/pets/index" />
      </View>
    );
  }

  return (
    <View className="pets-container">
      <View className="page-content">
        <View className="header">
          <Text className="title">我的宠物</Text>
          <View className="adopt-btn" onClick={handleAdopt}>
            领养宠物
          </View>
        </View>

        {loading ? (
          <View className="loading">加载中...</View>
        ) : pets.length === 0 ? (
          <View className="empty">
            <Text>还没有宠物，快去领养一只吧！</Text>
          </View>
        ) : (
          <View className="pets-list">
            {pets.map((pet) => (
              <View
                key={pet.id}
                className="pet-item"
                onClick={() => handlePetClick(pet)}
              >
                <Image src={pet.imageUrl} className="pet-image" mode="aspectFill" />
                <View className="pet-info">
                  <Text className="pet-name">{pet.name}</Text>
                  <Text className="pet-desc">{pet.description}</Text>
                  <View className="pet-stats">
                    <Text className="level">Lv.{pet.level}</Text>
                    <Text className="exp">经验值: {pet.experience}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
      
      <TabBar current="/pages/pets/index" />
    </View>
  );
}
