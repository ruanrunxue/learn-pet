import { View, Text, Input, Button } from "@tarojs/components";
import Taro, { useLoad } from "@tarojs/taro";
import { useState, useRef } from "react";
import { request } from "../../utils/api";
import "./index.scss";

/**
 * 学习资料上传页面
 * 支持拖拽上传、文件浏览、标签输入（回车确认）
 */
export default function MaterialUpload() {
  const [name, setName] = useState("");
  const [tagsList, setTagsList] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{
    url: string;
    name: string;
    extension: string;
  } | null>(null);
  const [dragOver, setDragOver] = useState(false);

  // 检查用户角色
  useLoad(() => {
    const role = Taro.getStorageSync("userRole");
    if (role !== "teacher") {
      Taro.showToast({ title: "只有教师可以上传资料", icon: "none" });
      setTimeout(() => Taro.navigateBack(), 1500);
    }

    // 设置拖拽事件（仅H5环境）
    if (process.env.TARO_ENV === "h5") {
      setupDragAndDrop();
    }
  });

  /**
   * 设置拖拽上传事件
   */
  const setupDragAndDrop = () => {
    const dropZone = document.querySelector(".drop-zone") as HTMLElement;
    if (!dropZone) return;

    dropZone.addEventListener("dragover", (e) => {
      e.preventDefault();
      setDragOver(true);
    });

    dropZone.addEventListener("dragleave", () => {
      setDragOver(false);
    });

    dropZone.addEventListener("drop", async (e) => {
      e.preventDefault();
      setDragOver(false);
      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        await uploadFile(files[0]);
      }
    });
  };

  /**
   * 处理标签输入（回车确认）
   */
  const handleTagInput = (e) => {
    const value = e.detail.value;

    // 检测回车键（keyCode 13 或 Enter）
    if (e.type === "confirm" || value.endsWith("\n")) {
      const tag = currentTag.trim();
      if (tag && !tagsList.includes(tag)) {
        setTagsList([...tagsList, tag]);
      }
      setCurrentTag("");
    } else {
      setCurrentTag(value);
    }
  };

  /**
   * 删除标签
   */
  const removeTag = (index: number) => {
    setTagsList(tagsList.filter((_, i) => i !== index));
  };

  /**
   * 浏览本地文件
   */
  const handleBrowseFile = () => {
    if (process.env.TARO_ENV === "h5") {
      const input = document.createElement("input");
      input.type = "file";
      input.accept =
        ".doc,.docx,.xls,.xlsx,.ppt,.pptx,.pdf,.jpg,.jpeg,.png,.gif,.mp3,.wav,.mp4,.avi,.mov,.zip,.rar";
      input.onchange = async (e: any) => {
        const file = e.target.files[0];
        if (file) {
          await uploadFile(file);
        }
      };
      input.click();
    } else {
      Taro.chooseMessageFile({
        count: 1,
        type: "file",
        success: async () => {
          Taro.showModal({
            title: "提示",
            content: "小程序文件上传功能正在完善中，请使用H5版本",
            showCancel: false,
          });
        },
      });
    }
  };

  /**
   * 上传文件
   */
  const uploadFile = async (file: File) => {
    try {
      setUploading(true);

      // 检查文件大小（限制50MB）
      if (file.size > 1 * 1024 * 1024 * 1024) {
        throw new Error("文件大小不能超过1GB");
      }
      console.log(file);

      // 构建FormData
      const formData = new FormData();
      formData.append("file", file);
      formData.append("visibility", "public");

      // 上传文件
      const token = Taro.getStorageSync("token");
      const uploadResponse = await fetch("/api/storage/upload", {
        method: "POST",
        body: formData,
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || "文件上传失败");
      }

      const { objectPath } = await uploadResponse.json();

      // 提取文件后缀（安全处理，避免没有扩展名的情况）
      const dotIndex = file.name.lastIndexOf(".");
      const extension = dotIndex > 0 && dotIndex < file.name.length - 1
        ? file.name.substring(dotIndex).toLowerCase()
        : "";

      setUploadedFile({
        url: objectPath,
        name: file.name,
        extension,
      });

      // 自动填充资料名称（如果未填写）
      if (!name) {
        setName(file.name.replace(extension, ""));
      }

      Taro.showToast({ title: "文件上传成功", icon: "success" });
    } catch (error: any) {
      console.error("Upload error:", error);
      Taro.showToast({
        title: error.message || "上传失败",
        icon: "none",
      });
    } finally {
      setUploading(false);
    }
  };

  /**
   * 提交资料
   */
  const handleSubmit = async () => {
    if (!name.trim()) {
      Taro.showToast({ title: "请输入资料名称", icon: "none" });
      return;
    }

    if (!uploadedFile) {
      Taro.showToast({ title: "请上传文件", icon: "none" });
      return;
    }

    try {
      setUploading(true);

      await request({
        url: "/materials/upload",
        method: "POST",
        data: {
          name: name.trim(),
          fileType: "other",
          fileUrl: uploadedFile.url,
          fileExtension: uploadedFile.extension, // 传递文件扩展名
          tags: tagsList,
        },
      });

      Taro.showToast({ title: "资料上传成功", icon: "success" });
      setTimeout(() => {
        Taro.navigateBack();
      }, 1500);
    } catch (error: any) {
      Taro.showToast({
        title: error.message || "提交失败",
        icon: "none",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <View className="material-upload-container">
      <View className="page-header">
        <Text className="page-title">上传学习资料</Text>
      </View>

      <View className="form-section">
        {/* 文件上传区 */}
        <View className="form-item">
          <Text className="label">文件附件 *</Text>
          <View
            className={`drop-zone ${dragOver ? "drag-over" : ""} ${uploadedFile ? "has-file" : ""}`}
            onClick={handleBrowseFile}
          >
            {uploadedFile ? (
              <View className="file-info">
                <View className="file-icon">📄</View>
                <View className="file-details">
                  <Text className="file-name">{uploadedFile.name}</Text>
                  <Text className="file-extension">
                    {uploadedFile.extension}
                  </Text>
                </View>
                <Text className="change-file">点击更换</Text>
              </View>
            ) : (
              <View className="upload-placeholder">
                <Text className="upload-icon">☁️</Text>
                <Text className="upload-text">点击浏览文件或拖拽到此处</Text>
                <Text className="upload-hint">
                  支持 Word, Excel, PPT, PDF, JPG, PNG, GIF, MP3, WAV, MP4, AVI,
                  MOV, ZIP, RAR
                </Text>
                <Text className="upload-size">文件大小限制：1GB</Text>
              </View>
            )}
          </View>
        </View>

        {/* 资料名称 */}
        <View className="form-item">
          <Text className="label">资料名称 *</Text>
          <Input
            className="input"
            placeholder="请输入资料名称"
            value={name}
            onInput={(e) => setName(e.detail.value)}
          />
        </View>

        {/* 标签输入 */}
        <View className="form-item">
          <Text className="label">标签（可选）</Text>
          <View className="tags-input-container">
            {tagsList.length > 0 && (
              <View className="tags-list">
                {tagsList.map((tag, index) => (
                  <View key={index} className="tag-item">
                    <Text className="tag-text">{tag}</Text>
                    <Text
                      className="tag-remove"
                      onClick={() => removeTag(index)}
                    >
                      ×
                    </Text>
                  </View>
                ))}
              </View>
            )}
            <Input
              className="tag-input"
              placeholder="输入标签后按回车确认"
              value={currentTag}
              onInput={(e) => setCurrentTag(e.detail.value)}
              onConfirm={handleTagInput}
            />
          </View>
          <Text className="hint">按回车键添加标签，支持多个标签</Text>
        </View>
      </View>

      {/* 提交按钮 */}
      <View className="submit-section">
        <Button className="cancel-btn" onClick={() => Taro.navigateBack()}>
          取消
        </Button>
        <Button
          className="submit-btn"
          type="primary"
          onClick={handleSubmit}
          disabled={uploading || !uploadedFile || !name.trim()}
        >
          {uploading ? "提交中..." : "提交资料"}
        </Button>
      </View>
    </View>
  );
}
