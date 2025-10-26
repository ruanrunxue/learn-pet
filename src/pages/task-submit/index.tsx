import { View, Text, Textarea, Button } from '@tarojs/components';
import { useLoad } from '@tarojs/taro';
import Taro from '@tarojs/taro';
import { useState } from 'react';
import { request } from '../../utils/api';
import './index.scss';

/**
 * 任务提交页面（学生专用）
 * 学生提交作业，描述完成情况
 */
export default function TaskSubmit() {
  const [taskId, setTaskId] = useState<number>(0);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  /**
   * 页面加载：验证学生权限，获取任务ID
   */
  useLoad(() => {
    const role = Taro.getStorageSync('userRole');
    if (role !== 'student') {
      Taro.showToast({ title: '只有学生可以提交任务', icon: 'none' });
      Taro.navigateBack();
      return;
    }

    const params = Taro.getCurrentInstance().router?.params;
    if (params?.taskId) {
      setTaskId(parseInt(params.taskId));
    }
  });

  /**
   * 提交任务
   */
  const handleSubmit = async () => {
    if (!description.trim()) {
      Taro.showToast({ title: '请输入作业描述', icon: 'none' });
      return;
    }

    try {
      setLoading(true);

      await request({
        url: `/tasks/${taskId}/submit`,
        method: 'POST',
        data: {
          description: description.trim(),
        },
      });

      Taro.showToast({ title: '提交成功！积分已到账', icon: 'success' });
      setTimeout(() => {
        Taro.navigateBack();
      }, 1500);
    } catch (error: any) {
      console.error('提交任务失败:', error);
      Taro.showToast({ 
        title: error.message || '提交任务失败', 
        icon: 'none' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="task-submit-page">
      <View className="page-header">
        <Text className="page-title">✍️ 提交作业</Text>
        <Text className="page-desc">描述你的完成情况，提交后自动获得积分！</Text>
      </View>

      <View className="form-container">
        <View className="form-item">
          <Text className="form-label">作业描述 *</Text>
          <Textarea
            className="form-textarea"
            placeholder="请详细描述你是如何完成这个任务的，包括过程、心得、遇到的问题等..."
            value={description}
            onInput={(e) => setDescription(e.detail.value)}
            maxlength={1000}
          />
          <Text className="char-count">{description.length}/1000</Text>
        </View>

        <View className="tips-box">
          <Text className="tips-title">💡 提交提示</Text>
          <Text className="tips-item">• 详细描述完成过程</Text>
          <Text className="tips-item">• 分享遇到的问题和解决方法</Text>
          <Text className="tips-item">• 总结学到的知识和心得</Text>
          <Text className="tips-item">• 提交后即可获得任务积分</Text>
        </View>

        <View className="button-container">
          <Button 
            className="cancel-btn" 
            onClick={() => Taro.navigateBack()}
          >
            取消
          </Button>
          <Button
            className="submit-btn"
            onClick={handleSubmit}
            loading={loading}
            disabled={loading}
          >
            {loading ? '提交中...' : '提交作业'}
          </Button>
        </View>
      </View>
    </View>
  );
}
