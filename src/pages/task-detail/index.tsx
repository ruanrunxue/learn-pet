import { View, Text, Button } from '@tarojs/components';
import { useLoad, useDidShow } from '@tarojs/taro';
import Taro from '@tarojs/taro';
import { useState } from 'react';
import { request, ApiError } from '../../utils/api';
import './index.scss';

/**
 * 任务数据类型
 */
interface Task {
  id: number;
  teacherId: number;
  classId: number;
  title: string;
  description: string;
  points: number;
  deadline: string;
  attachmentUrl: string | null;
  createdAt: string;
}

/**
 * 提交数据类型
 */
interface Submission {
  id: number;
  taskId: number;
  studentId: number;
  studentName?: string;
  description: string;
  attachmentUrl: string | null;
  submittedAt: string;
}

/**
 * 任务详情页面
 * 教师：查看任务详情和学生提交列表
 * 学生：查看任务详情和自己的提交状态
 */
export default function TaskDetail() {
  const [role, setRole] = useState<string>('');
  const [taskId, setTaskId] = useState<number>(0);
  const [task, setTask] = useState<Task | null>(null);
  const [mySubmission, setMySubmission] = useState<Submission | null>(null);
  const [hasCheckedSubmission, setHasCheckedSubmission] = useState(false);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(false);

  /**
   * 页面加载：获取任务ID和用户角色
   */
  useLoad(() => {
    const userRole = Taro.getStorageSync('userRole');
    const token = Taro.getStorageSync('token');

    if (!token) {
      Taro.redirectTo({ url: '/pages/login/index' });
      return;
    }

    const params = Taro.getCurrentInstance().router?.params;
    if (params?.id) {
      const id = parseInt(params.id);
      setTaskId(id);
      setRole(userRole);
      loadTask(id, userRole);
    }
  });

  /**
   * 页面显示：刷新数据
   */
  useDidShow(() => {
    if (taskId && role) {
      loadTask(taskId, role);
    }
  });

  /**
   * 加载任务详情
   */
  const loadTask = async (id: number, userRole: string) => {
    try {
      setLoading(true);

      const taskData = await request<Task>({
        url: `/tasks/${id}`,
        method: 'GET',
      });
      setTask(taskData);

      if (userRole === 'teacher') {
        loadSubmissions(id);
      } else if (userRole === 'student') {
        loadMySubmission(id);
      }
    } catch (error: any) {
      console.error('加载任务失败:', error);
      Taro.showToast({ title: error.message || '加载任务失败', icon: 'none' });
    } finally {
      setLoading(false);
    }
  };

  /**
   * 加载学生提交列表（教师）
   */
  const loadSubmissions = async (id: number) => {
    try {
      const data = await request<Submission[]>({
        url: `/tasks/${id}/submissions`,
        method: 'GET',
      });
      setSubmissions(data);
    } catch (error: any) {
      console.error('加载提交列表失败:', error);
    }
  };

  /**
   * 加载我的提交（学生）
   * 404表示未提交，其他错误需要提示
   */
  const loadMySubmission = async (id: number) => {
    try {
      const data = await request<Submission>({
        url: `/tasks/${id}/my-submission`,
        method: 'GET',
      });
      setMySubmission(data);
      setHasCheckedSubmission(true);
    } catch (error: any) {
      if (error instanceof ApiError && error.statusCode === 404) {
        setMySubmission(null);
        setHasCheckedSubmission(true);
      } else {
        console.error('加载提交状态失败:', error);
        Taro.showToast({ 
          title: '加载提交状态失败，请稍后重试', 
          icon: 'none' 
        });
        setHasCheckedSubmission(false);
      }
    }
  };

  /**
   * 提交任务（学生）
   */
  const handleSubmit = () => {
    Taro.navigateTo({ url: `/pages/task-submit/index?taskId=${taskId}` });
  };

  /**
   * 格式化日期显示
   */
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  /**
   * 判断任务是否已过期
   */
  const isExpired = () => {
    if (!task) return false;
    return new Date(task.deadline) < new Date();
  };

  if (loading || !task) {
    return (
      <View className="task-detail-page">
        <View className="loading">加载中...</View>
      </View>
    );
  }

  return (
    <View className="task-detail-page">
      <View className="task-info">
        <View className="task-header">
          <Text className="task-title">{task.title}</Text>
          <View className="task-points">
            <Text className="points-value">+{task.points}</Text>
            <Text className="points-label">积分</Text>
          </View>
        </View>

        <View className="task-meta">
          <View className="meta-item">
            <Text className="meta-label">截止时间：</Text>
            <Text className={`meta-value ${isExpired() ? 'expired' : ''}`}>
              {formatDate(task.deadline)}
            </Text>
            {isExpired() && <Text className="expired-badge">已过期</Text>}
          </View>
          <View className="meta-item">
            <Text className="meta-label">发布时间：</Text>
            <Text className="meta-value">{formatDate(task.createdAt)}</Text>
          </View>
        </View>

        <View className="task-content">
          <Text className="content-label">任务描述</Text>
          <Text className="content-text">{task.description}</Text>
        </View>

        {task.attachmentUrl && (
          <View className="task-attachment">
            <Text className="attachment-label">📎 附件</Text>
            <Text className="attachment-link">{task.attachmentUrl}</Text>
          </View>
        )}
      </View>

      {role === 'student' && (
        <View className="student-section">
          {mySubmission ? (
            <View className="my-submission">
              <Text className="section-title">✅ 我的提交</Text>
              <View className="submission-card">
                <Text className="submission-time">
                  提交时间：{formatDate(mySubmission.submittedAt)}
                </Text>
                <Text className="submission-desc">{mySubmission.description}</Text>
                {mySubmission.attachmentUrl && (
                  <View className="submission-attachment">
                    <Text>📎 附件：{mySubmission.attachmentUrl}</Text>
                  </View>
                )}
              </View>
            </View>
          ) : hasCheckedSubmission ? (
            <View className="submit-section">
              <View className="not-submitted-hint">
                <Text className="hint-text">📝 你还未提交此任务</Text>
              </View>
              <Button
                className="submit-btn"
                onClick={handleSubmit}
                disabled={isExpired()}
              >
                {isExpired() ? '任务已过期' : '提交作业'}
              </Button>
            </View>
          ) : (
            <View className="submit-section">
              <Text className="loading-text">加载提交状态...</Text>
            </View>
          )}
        </View>
      )}

      {role === 'teacher' && (
        <View className="teacher-section">
          <Text className="section-title">📋 学生提交 ({submissions.length})</Text>
          {submissions.length === 0 ? (
            <View className="empty-submissions">
              <Text>暂无学生提交</Text>
            </View>
          ) : (
            <View className="submissions-list">
              {submissions.map((submission) => (
                <View key={submission.id} className="submission-card">
                  <View className="submission-header">
                    <Text className="student-name">
                      👤 {submission.studentName || `学生${submission.studentId}`}
                    </Text>
                    <Text className="submission-time">
                      {formatDate(submission.submittedAt)}
                    </Text>
                  </View>
                  <Text className="submission-desc">{submission.description}</Text>
                  {submission.attachmentUrl && (
                    <View className="submission-attachment">
                      <Text>📎 附件</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
}
