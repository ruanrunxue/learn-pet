import { View, Text, Button } from '@tarojs/components';
import Taro, { useLoad } from '@tarojs/taro';
import { useState } from 'react';
import { request } from '../../utils/api';
import './index.scss';

interface Material {
  id: number;
  teacherId: number;
  name: string;
  fileType: string;
  fileUrl: string;
  tags: string[];
  createdAt: string;
  teacherName?: string;
}

/**
 * 学习资料详情页面
 * 显示资料详细信息，支持下载和删除（教师）
 */
export default function MaterialDetail() {
  const [material, setMaterial] = useState<Material | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('');
  const [userId, setUserId] = useState(0);

  useLoad(() => {
    const role = Taro.getStorageSync('userRole');
    const user = Taro.getStorageSync('user');
    setUserRole(role);
    setUserId(user?.id || 0);

    const pages = Taro.getCurrentPages();
    const currentPage = pages[pages.length - 1];
    const materialId = currentPage.options?.id;

    if (materialId) {
      loadMaterial(Number(materialId));
    } else {
      Taro.showToast({ title: '资料ID缺失', icon: 'none' });
      setTimeout(() => Taro.navigateBack(), 1500);
    }
  });

  /**
   * 加载资料详情
   */
  const loadMaterial = async (id: number) => {
    try {
      setLoading(true);
      const data = await request<Material>({
        url: `/materials/${id}`,
        method: 'GET',
      });
      setMaterial(data);
    } catch (error: any) {
      Taro.showToast({
        title: error.message || '加载失败',
        icon: 'none',
      });
      setTimeout(() => Taro.navigateBack(), 1500);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 下载资料
   */
  const handleDownload = () => {
    if (!material) return;

    // H5环境直接打开链接
    if (process.env.TARO_ENV === 'h5') {
      window.open(material.fileUrl, '_blank');
    } else {
      // 小程序环境提示用户
      Taro.showModal({
        title: '下载提示',
        content: '请复制链接到浏览器下载',
        confirmText: '复制链接',
        success: (res) => {
          if (res.confirm) {
            Taro.setClipboardData({
              data: material.fileUrl,
              success: () => {
                Taro.showToast({ title: '链接已复制', icon: 'success' });
              },
            });
          }
        },
      });
    }
  };

  /**
   * 删除资料（仅教师且是自己上传的）
   */
  const handleDelete = () => {
    if (!material) return;

    Taro.showModal({
      title: '确认删除',
      content: '删除后无法恢复，确定要删除这个资料吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await request({
              url: `/materials/${material.id}`,
              method: 'DELETE',
            });

            Taro.showToast({ title: '删除成功', icon: 'success' });
            setTimeout(() => Taro.navigateBack(), 1500);
          } catch (error: any) {
            Taro.showToast({
              title: error.message || '删除失败',
              icon: 'none',
            });
          }
        }
      },
    });
  };

  if (loading) {
    return (
      <View className="material-detail-container">
        <View className="loading">加载中...</View>
      </View>
    );
  }

  if (!material) {
    return (
      <View className="material-detail-container">
        <View className="empty">资料不存在</View>
      </View>
    );
  }

  const fileTypeMap = {
    document: '📄 文档',
    video: '🎬 视频',
    audio: '🎵 音频',
    image: '🖼️ 图片',
    other: '📎 其他',
  };

  const isOwner = userRole === 'teacher' && userId === material.teacherId;

  return (
    <View className="material-detail-container">
      <View className="detail-card">
        <View className="header">
          <Text className="title">{material.name}</Text>
          <Text className="file-type">
            {fileTypeMap[material.fileType] || '📎 其他'}
          </Text>
        </View>

        {material.tags.length > 0 && (
          <View className="tags-section">
            <Text className="section-title">标签</Text>
            <View className="tags">
              {material.tags.map((tag, index) => (
                <Text key={index} className="tag">
                  {tag}
                </Text>
              ))}
            </View>
          </View>
        )}

        <View className="info-section">
          <View className="info-item">
            <Text className="info-label">上传时间</Text>
            <Text className="info-value">
              {new Date(material.createdAt).toLocaleString('zh-CN')}
            </Text>
          </View>
          {material.teacherName && (
            <View className="info-item">
              <Text className="info-label">上传教师</Text>
              <Text className="info-value">{material.teacherName}</Text>
            </View>
          )}
        </View>
      </View>

      <View className="action-section">
        <Button className="download-btn" type="primary" onClick={handleDownload}>
          下载资料
        </Button>

        {isOwner && (
          <Button className="delete-btn" onClick={handleDelete}>
            删除资料
          </Button>
        )}
      </View>
    </View>
  );
}
