/**
 * 注册页面
 * 支持教师和学生注册
 */
import { View, Text, Input, Button, Picker } from '@tarojs/components';
import { useState } from 'react';
import Taro from '@tarojs/taro';
import { authApi } from '../../utils/api';
import './index.scss';

export default function Register() {
  const [role, setRole] = useState<'teacher' | 'student'>('student');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [school, setSchool] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const roleOptions = ['学生', '老师'];

  /**
   * 处理角色选择
   */
  const handleRoleChange = (e) => {
    const index = e.detail.value;
    setRole(index === 0 ? 'student' : 'teacher');
  };

  /**
   * 处理注册
   */
  const handleRegister = async () => {
    // 验证表单
    if (!phone || !name || !school || !password || !confirmPassword) {
      Taro.showToast({ title: '请填写完整信息', icon: 'none' });
      return;
    }

    if (password !== confirmPassword) {
      Taro.showToast({ title: '两次密码不一致', icon: 'none' });
      return;
    }

    if (phone.length !== 11) {
      Taro.showToast({ title: '请输入正确的手机号', icon: 'none' });
      return;
    }

    setLoading(true);
    try {
      await authApi.register({ phone, name, school, password, role });
      
      Taro.showToast({ title: '注册成功', icon: 'success' });
      
      // 延迟跳转到登录页
      setTimeout(() => {
        Taro.navigateBack();
      }, 1500);
    } catch (error: any) {
      Taro.showToast({ title: error.message || '注册失败', icon: 'none' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="register-container">
      <View className="register-header">
        <Text className="page-title">注册账号</Text>
      </View>

      <View className="register-form">
        <View className="form-item">
          <Text className="form-label">角色</Text>
          <Picker mode="selector" range={roleOptions} onChange={handleRoleChange}>
            <View className="picker">
              {role === 'student' ? '学生' : '老师'}
            </View>
          </Picker>
        </View>

        <View className="form-item">
          <Text className="form-label">手机号</Text>
          <Input
            className="form-input"
            type="number"
            placeholder="请输入手机号"
            value={phone}
            onInput={(e) => setPhone(e.detail.value)}
            maxlength={11}
          />
        </View>

        <View className="form-item">
          <Text className="form-label">姓名</Text>
          <Input
            className="form-input"
            type="text"
            placeholder="请输入姓名"
            value={name}
            onInput={(e) => setName(e.detail.value)}
          />
        </View>

        <View className="form-item">
          <Text className="form-label">学校</Text>
          <Input
            className="form-input"
            type="text"
            placeholder="请输入学校"
            value={school}
            onInput={(e) => setSchool(e.detail.value)}
          />
        </View>

        <View className="form-item">
          <Text className="form-label">密码</Text>
          <Input
            className="form-input"
            password
            placeholder="请输入密码"
            value={password}
            onInput={(e) => setPassword(e.detail.value)}
          />
        </View>

        <View className="form-item">
          <Text className="form-label">确认密码</Text>
          <Input
            className="form-input"
            password
            placeholder="请再次输入密码"
            value={confirmPassword}
            onInput={(e) => setConfirmPassword(e.detail.value)}
          />
        </View>

        <Button
          className="register-btn"
          type="primary"
          onClick={handleRegister}
          loading={loading}
        >
          注册
        </Button>
      </View>
    </View>
  );
}
