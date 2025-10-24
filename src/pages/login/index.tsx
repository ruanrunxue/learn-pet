/**
 * 登录页面
 * 用户可以选择角色（教师/学生）并登录
 */
import { View, Text, Input, Button, Picker } from "@tarojs/components";
import { useState } from "react";
import Taro from "@tarojs/taro";
import { authApi } from "../../utils/api";
import "./index.scss";

export default function Login() {
  const [role, setRole] = useState<"teacher" | "student">("teacher");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const roleOptions = ["老师", "学生"];

  /**
   * 处理角色选择
   */
  const handleRoleChange = (e) => {
    const index = e.detail.value;
    setRole(index === 0 ? "teacher" : "student");
  };

  /**
   * 处理登录
   */
  const handleLogin = async () => {
    if (!phone || !password) {
      Taro.showToast({ title: "请填写完整信息", icon: "none" });
      return;
    }

    setLoading(true);
    try {
      const response = await authApi.login({ phone, password, role });

      // 保存token和用户信息
      Taro.setStorageSync("token", response.token);
      Taro.setStorageSync("user", response.user);

      Taro.showToast({ title: "登录成功", icon: "success" });

      // 跳转到班级列表页面
      setTimeout(() => {
        Taro.redirectTo({ url: "/pages/class-list/index" });
      }, 1500);
    } catch (error: any) {
      Taro.showToast({ title: error.message || "登录失败", icon: "none" });
    } finally {
      setLoading(false);
    }
  };

  /**
   * 跳转到注册页面
   */
  const goToRegister = () => {
    Taro.navigateTo({ url: "/pages/register/index" });
  };

  return (
    <View className="login-container">
      <View className="login-header">
        <Text className="app-title">学宠 LearnPet</Text>
        <Text className="app-subtitle">教学宠物养成应用</Text>
      </View>

      <View className="login-form">
        <View className="form-item">
          <Text className="form-label">角色</Text>
          <Picker
            mode="selector"
            range={roleOptions}
            onChange={handleRoleChange}
          >
            <View className="picker">
              {role === "teacher" ? "老师" : "学生"}
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

        <Button
          className="login-btn"
          type="primary"
          onClick={handleLogin}
          loading={loading}
        >
          登录
        </Button>

        <View className="register-link" onClick={goToRegister}>
          <Text>还没有账号？点击注册</Text>
        </View>
      </View>
    </View>
  );
}
