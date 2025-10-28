import { View, Text } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { useState, useEffect } from "react";
import { request } from "../../utils/api";
import TabBar from "../../components/TabBar";
import "./index.scss";

interface Material {
  id: number;
  teacherId: number;
  name: string;
  fileType: string;
  fileUrl: string;
  tags: string[];
  createdAt: string;
}

/**
 * 学习资料页面
 * 显示所有学习资料，支持标签筛选
 */
export default function Materials() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState("");

  useEffect(() => {
    const role = Taro.getStorageSync("userRole");
    setUserRole(role);
    loadMaterials();
  }, []);

  const loadMaterials = async () => {
    try {
      setLoading(true);
      const data = await request<Material[]>({
        url: "/materials",
        method: "GET",
      });
      setMaterials(data);
    } catch (error) {
      Taro.showToast({
        title: "加载失败",
        icon: "none",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMaterialClick = (material: Material) => {
    Taro.navigateTo({
      url: `/pages/material-detail/index?id=${material.id}`,
    });
  };

  const handleUpload = () => {
    Taro.navigateTo({
      url: "/pages/material-upload/index",
    });
  };

  return (
    <View className="materials-container">
      <View className="page-content">
        <View className="header">
          <Text className="title">学习资料</Text>
          {userRole === "teacher" && (
            <View className="upload-btn" onClick={handleUpload}>
              上传资料
            </View>
          )}
        </View>

        {loading ? (
          <View className="loading">加载中...</View>
        ) : materials.length === 0 ? (
          <View className="empty">
            <Text>暂无学习资料</Text>
          </View>
        ) : (
          <View className="materials-list">
            {materials.map((material) => (
              <View
                key={material.id}
                className="material-item"
                onClick={() => handleMaterialClick(material)}
              >
                <View className="material-info">
                  <Text className="material-name">{material.name}</Text>
                  <Text className="material-type">{material.fileType}</Text>
                </View>
                {material.tags.length > 0 && (
                  <View className="tags">
                    {material.tags.map((tag, index) => (
                      <Text key={index} className="tag">
                        {tag}
                      </Text>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </View>

      <TabBar current="/pages/materials/index" />
    </View>
  );
}
