import { View, Text, Input, Button, Picker } from '@tarojs/components';
import Taro, { useLoad } from '@tarojs/taro';
import { useState } from 'react';
import { request } from '../../utils/api';
import './index.scss';

/**
 * 学习资料上传页面
 * 教师上传学习资料，支持文件附件和标签
 */
export default function MaterialUpload() {
  const [name, setName] = useState('');
  const [tags, setTags] = useState('');
  const [fileType, setFileType] = useState('document');
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ url: string; name: string } | null>(null);

  // 检查用户角色，非教师跳转回列表
  useLoad(() => {
    const role = Taro.getStorageSync('userRole');
    if (role !== 'teacher') {
      Taro.showToast({ title: '只有教师可以上传资料', icon: 'none' });
      setTimeout(() => Taro.navigateBack(), 1500);
    }
  });

  const fileTypeOptions = ['文档', '视频', '音频', '图片', '其他'];
  const fileTypeMap = ['document', 'video', 'audio', 'image', 'other'];

  /**
   * 处理文件类型选择
   */
  const handleFileTypeChange = (e) => {
    const index = e.detail.value;
    setFileType(fileTypeMap[index]);
  };

  /**
   * 选择并上传文件
   * 流程：获取上传URL → 上传文件 → 确认上传
   */
  const handleChooseFile = async () => {
    try {
      // H5环境使用input文件选择
      if (process.env.TARO_ENV === 'h5') {
        const input = document.createElement('input');
        input.type = 'file';
        input.onchange = async (e: any) => {
          const file = e.target.files[0];
          if (!file) return;

          await uploadFile(file);
        };
        input.click();
      } else {
        // 小程序环境使用chooseMessageFile
        Taro.chooseMessageFile({
          count: 1,
          type: 'file',
          success: async (res) => {
            const tempFilePath = res.tempFiles[0].path;
            await uploadFileFromPath(tempFilePath, res.tempFiles[0].name);
          },
        });
      }
    } catch (error: any) {
      Taro.showToast({
        title: error.message || '文件选择失败',
        icon: 'none',
      });
    }
  };

  /**
   * 上传文件（H5环境）
   * 使用新的multipart上传接口
   */
  const uploadFile = async (file: File) => {
    try {
      setUploading(true);

      // 构建FormData
      const formData = new FormData();
      formData.append('file', file);
      formData.append('visibility', 'public'); // 学习资料设为公开

      // 使用multipart上传
      const token = Taro.getStorageSync('token');
      const uploadResponse = await fetch('/api/storage/upload', {
        method: 'POST',
        body: formData,
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || '文件上传失败');
      }

      const { objectPath } = await uploadResponse.json();
      
      // 构建下载URL
      const downloadUrl = objectPath;

      setUploadedFile({ url: downloadUrl, name: file.name });
      Taro.showToast({ title: '文件上传成功', icon: 'success' });
    } catch (error: any) {
      console.error('Upload error:', error);
      Taro.showToast({
        title: error.message || '上传失败',
        icon: 'none',
      });
    } finally {
      setUploading(false);
    }
  };

  /**
   * 上传文件（小程序环境）
   * 注意：由于小程序二进制处理的复杂性，暂时提示用户使用H5版本
   * TODO: 实现base64代理上传或multipart上传
   */
  const uploadFileFromPath = async (_filePath: string, _fileName: string) => {
    try {
      setUploading(true);

      // 暂时提示用户小程序上传功能开发中
      Taro.showModal({
        title: '提示',
        content: '小程序文件上传功能正在完善中，请暂时使用H5版本上传资料',
        showCancel: false,
      });
    } catch (error: any) {
      Taro.showToast({
        title: error.message || '上传失败',
        icon: 'none',
      });
    } finally {
      setUploading(false);
    }
  };

  /**
   * 提交资料信息
   */
  const handleSubmit = async () => {
    if (!name) {
      Taro.showToast({ title: '请输入资料名称', icon: 'none' });
      return;
    }

    if (!uploadedFile) {
      Taro.showToast({ title: '请上传文件', icon: 'none' });
      return;
    }

    try {
      setUploading(true);

      // 解析标签（逗号或空格分隔）
      const tagList = tags
        .split(/[,，\s]+/)
        .map((t) => t.trim())
        .filter((t) => t);

      await request({
        url: '/materials/upload',
        method: 'POST',
        data: {
          name,
          fileType,
          fileUrl: uploadedFile.url,
          tags: tagList,
        },
      });

      Taro.showToast({ title: '资料上传成功', icon: 'success' });

      setTimeout(() => {
        Taro.navigateBack();
      }, 1500);
    } catch (error: any) {
      Taro.showToast({
        title: error.message || '提交失败',
        icon: 'none',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <View className="material-upload-container">
      <View className="form-section">
        <View className="form-item">
          <Text className="label">资料名称</Text>
          <Input
            className="input"
            placeholder="请输入资料名称"
            value={name}
            onInput={(e) => setName(e.detail.value)}
          />
        </View>

        <View className="form-item">
          <Text className="label">文件类型</Text>
          <Picker mode="selector" range={fileTypeOptions} onChange={handleFileTypeChange}>
            <View className="picker">
              {fileTypeOptions[fileTypeMap.indexOf(fileType)]}
            </View>
          </Picker>
        </View>

        <View className="form-item">
          <Text className="label">标签（可选）</Text>
          <Input
            className="input"
            placeholder="多个标签用逗号分隔，如：数学,练习题"
            value={tags}
            onInput={(e) => setTags(e.detail.value)}
          />
        </View>

        <View className="form-item">
          <Text className="label">文件附件</Text>
          <Button className="upload-btn" onClick={handleChooseFile} disabled={uploading}>
            {uploading ? '上传中...' : uploadedFile ? '重新选择文件' : '选择文件'}
          </Button>
          {uploadedFile && (
            <View className="file-info">
              <Text className="file-name">✓ {uploadedFile.name}</Text>
            </View>
          )}
        </View>
      </View>

      <View className="submit-section">
        <Button className="submit-btn" type="primary" onClick={handleSubmit} disabled={uploading}>
          {uploading ? '提交中...' : '提交资料'}
        </Button>
      </View>
    </View>
  );
}
