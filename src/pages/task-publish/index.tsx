import { View, Text, Input, Textarea, Button, Picker } from '@tarojs/components';
import { useLoad } from '@tarojs/taro';
import Taro from '@tarojs/taro';
import { useState } from 'react';
import { request } from '../../utils/api';
import './index.scss';

/**
 * 任务发布页面（教师专用）
 * 教师发布新任务，包含标题、描述、积分、截止时间等信息
 */
export default function TaskPublish() {
  const [classId, setClassId] = useState<number>(0);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [points, setPoints] = useState('');
  const [deadline, setDeadline] = useState('');
  const [loading, setLoading] = useState(false);

  /**
   * 页面加载：验证教师权限，获取班级ID
   */
  useLoad(() => {
    const role = Taro.getStorageSync('userRole');
    if (role !== 'teacher') {
      Taro.showToast({ title: '只有教师可以发布任务', icon: 'none' });
      Taro.navigateBack();
      return;
    }

    const params = Taro.getCurrentInstance().router?.params;
    if (params?.classId) {
      const id = parseInt(params.classId);
      if (id > 0) {
        setClassId(id);
      } else {
        Taro.showToast({ title: '无效的班级ID', icon: 'none' });
        Taro.navigateBack();
      }
    } else {
      Taro.showToast({ title: '请先选择班级', icon: 'none' });
      Taro.navigateBack();
    }
  });

  /**
   * 日期选择器变化事件
   */
  const handleDateChange = (e: any) => {
    setDeadline(e.detail.value);
  };

  /**
   * 发布任务
   */
  const handlePublish = async () => {
    if (!classId || classId <= 0) {
      Taro.showToast({ title: '无效的班级ID', icon: 'none' });
      return;
    }

    if (!title.trim()) {
      Taro.showToast({ title: '请输入任务标题', icon: 'none' });
      return;
    }

    if (!description.trim()) {
      Taro.showToast({ title: '请输入任务描述', icon: 'none' });
      return;
    }

    if (!points || parseInt(points) <= 0) {
      Taro.showToast({ title: '请输入有效的积分值', icon: 'none' });
      return;
    }

    if (!deadline) {
      Taro.showToast({ title: '请选择截止时间', icon: 'none' });
      return;
    }

    try {
      setLoading(true);

      await request({
        url: '/tasks/publish',
        method: 'POST',
        data: {
          classId,
          title: title.trim(),
          description: description.trim(),
          points: parseInt(points),
          deadline: new Date(deadline).toISOString(),
        },
      });

      Taro.showToast({ title: '任务发布成功', icon: 'success' });
      setTimeout(() => {
        Taro.navigateBack();
      }, 1500);
    } catch (error: any) {
      console.error('发布任务失败:', error);
      Taro.showToast({ 
        title: error.message || '发布任务失败', 
        icon: 'none' 
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * 获取当前日期（格式：YYYY-MM-DD）
   */
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return (
    <View className="task-publish-page">
      <View className="page-header">
        <Text className="page-title">📝 发布新任务</Text>
      </View>

      <View className="form-container">
        <View className="form-item">
          <Text className="form-label">任务标题 *</Text>
          <Input
            className="form-input"
            placeholder="请输入任务标题"
            value={title}
            onInput={(e) => setTitle(e.detail.value)}
            maxlength={50}
          />
        </View>

        <View className="form-item">
          <Text className="form-label">任务描述 *</Text>
          <Textarea
            className="form-textarea"
            placeholder="请详细描述任务要求和内容"
            value={description}
            onInput={(e) => setDescription(e.detail.value)}
            maxlength={500}
          />
        </View>

        <View className="form-item">
          <Text className="form-label">任务积分 *</Text>
          <Input
            className="form-input"
            type="number"
            placeholder="完成任务可获得的积分"
            value={points}
            onInput={(e) => setPoints(e.detail.value)}
          />
        </View>

        <View className="form-item">
          <Text className="form-label">截止时间 *</Text>
          <Picker
            mode="date"
            value={deadline}
            start={getTodayDate()}
            onChange={handleDateChange}
          >
            <View className="picker-view">
              {deadline ? (
                <Text className="picker-value">{deadline}</Text>
              ) : (
                <Text className="picker-placeholder">请选择截止时间</Text>
              )}
            </View>
          </Picker>
        </View>

        <View className="button-container">
          <Button 
            className="cancel-btn" 
            onClick={() => Taro.navigateBack()}
          >
            取消
          </Button>
          <Button
            className="publish-btn"
            onClick={handlePublish}
            loading={loading}
            disabled={loading}
          >
            {loading ? '发布中...' : '发布任务'}
          </Button>
        </View>
      </View>
    </View>
  );
}
