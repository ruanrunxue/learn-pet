/**
 * 班级详情页面
 * 教师可以查看学生列表并删除学生
 * 学生可以查看班级信息（预留积分排名）
 */
import { View, Text, Button } from '@tarojs/components';
import { useState } from 'react';
import Taro, { useLoad, useRouter } from '@tarojs/taro';
import { classApi } from '../../utils/api';
import './index.scss';

export default function ClassDetail() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [classInfo, setClassInfo] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useLoad(() => {
    const userData = Taro.getStorageSync('user');
    setUser(userData);
    loadClassDetail();
  });

  /**
   * 加载班级详情
   */
  const loadClassDetail = async () => {
    const classId = parseInt(router.params.id || '0');
    if (!classId) {
      Taro.showToast({ title: '班级ID无效', icon: 'none' });
      return;
    }

    setLoading(true);
    try {
      const response = await classApi.getClassDetail(classId);
      setClassInfo(response.class);
      setMembers(response.members);
    } catch (error: any) {
      Taro.showToast({ title: error.message || '加载失败', icon: 'none' });
    } finally {
      setLoading(false);
    }
  };

  /**
   * 删除学生（教师）
   */
  const handleRemoveStudent = async (studentId: number) => {
    Taro.showModal({
      title: '确认删除',
      content: '确定要将该学生移出班级吗？',
      success: async (res) => {
        if (res.confirm && classInfo) {
          try {
            await classApi.removeStudent(classInfo.id, studentId);
            Taro.showToast({ title: '删除成功', icon: 'success' });
            loadClassDetail();
          } catch (error: any) {
            Taro.showToast({ title: error.message || '删除失败', icon: 'none' });
          }
        }
      },
    });
  };

  if (loading || !classInfo || !user) {
    return (
      <View className="class-detail-container">
        <View className="loading">加载中...</View>
      </View>
    );
  }

  return (
    <View className="class-detail-container">
      <View className="class-header">
        <Text className="class-name">{classInfo.className}</Text>
        <Text className="class-meta">{classInfo.year} · {classInfo.subject}</Text>
      </View>

      {user.role === 'teacher' ? (
        <View className="members-section">
          <View className="section-title">
            <Text>班级成员（{members.length}人）</Text>
          </View>
          {members.length === 0 ? (
            <View className="empty-state">
              <Text className="empty-text">暂无学生</Text>
            </View>
          ) : (
            <View className="member-list">
              {members.map((member) => (
                <View key={member.id} className="member-item">
                  <View className="member-info">
                    <Text className="member-name">{member.name}</Text>
                    <Text className="member-school">{member.school}</Text>
                  </View>
                  <Button
                    className="remove-btn"
                    size="mini"
                    onClick={() => handleRemoveStudent(member.id)}
                  >
                    删除
                  </Button>
                </View>
              ))}
            </View>
          )}
        </View>
      ) : (
        <View className="student-section">
          <View className="section-title">
            <Text>积分排名</Text>
          </View>
          <View className="empty-state">
            <Text className="empty-text">功能开发中，敬请期待...</Text>
          </View>
        </View>
      )}
    </View>
  );
}
