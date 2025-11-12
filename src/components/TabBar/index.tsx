import { View, Text } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { useState, useEffect } from "react";
import "./index.scss";

interface TabBarProps {
  current?: string; // 当前页面路径
}

/**
 * 自定义底部导航栏组件
 * 根据用户角色动态显示导航项
 */
export default function TabBar({ current = "" }: TabBarProps) {
  const [userRole, setUserRole] = useState("");

  useEffect(() => {
    const role = Taro.getStorageSync("userRole");
    setUserRole(role);
  }, []);

  const tabs = [
    {
      title: "首页",
      path: "/pages/class-list/index",
      icon: "🏠",
      roles: ["teacher", "student"],
    },
    {
      title: "资料",
      path: "/pages/materials/index",
      icon: "📚",
      roles: ["teacher", "student"],
    },
    {
      title: "任务",
      path: "/pages/tasks/index",
      icon: "📝",
      roles: ["teacher", "student"],
    },
    {
      title: "宠物",
      path: "/pages/pets/index",
      icon: "🐾",
      roles: ["student"], // 只对学生显示
    },
    {
      title: "设置",
      path: "/pages/settings/index",
      icon: "⚙️",
      roles: ["teacher", "student"],
    },
  ];

  // 根据角色过滤导航项
  const visibleTabs = tabs.filter((tab) => tab.roles.includes(userRole));

  /**
   * 处理导航栏点击
   * 使用reLaunch确保页面完全重新加载
   */
  const handleTabClick = (path: string) => {
    if (current !== path) {
      Taro.reLaunch({ url: path });
    }
  };

  return (
    <View className="custom-tab-bar">
      {visibleTabs.map((tab) => (
        <View
          key={tab.path}
          className={`tab-item ${current === tab.path ? "active" : ""}`}
          onClick={() => handleTabClick(tab.path)}
        >
          <Text className="tab-icon">{tab.icon}</Text>
          <Text className="tab-title">{tab.title}</Text>
        </View>
      ))}
    </View>
  );
}
