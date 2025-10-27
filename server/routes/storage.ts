/**
 * 对象存储路由
 * 处理文件上传和下载（使用@replit/object-storage）
 */
import { Router } from 'express';
import multer from 'multer';
import { ObjectStorageService, ObjectNotFoundError, ObjectPermission } from '../objectStorage';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// 配置multer使用内存存储
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB限制
  }
});

/**
 * 上传文件到对象存储
 * 使用multipart/form-data上传
 * @body file - 文件
 * @body visibility - 可见性：public 或 private（默认）
 * @returns objectPath - 对象路径
 */
router.post('/upload', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const userId = req.user!.userId.toString();
    const visibility = (req.body.visibility || 'private') as 'public' | 'private';
    const objectStorageService = new ObjectStorageService();

    // 上传文件
    const objectPath = await objectStorageService.uploadFile(
      req.file.buffer,
      req.file.mimetype
    );

    // 设置ACL策略
    await objectStorageService.setObjectAclPolicy(objectPath, {
      owner: userId,
      visibility,
    });

    res.json({ 
      success: true, 
      objectPath,
      fileName: req.file.originalname 
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

/**
 * 下载/查看对象文件
 * 支持ACL权限检查
 */
router.get(/^\/objects\/(.+)$/, authMiddleware, async (req, res) => {
  try {
    const userId = req.user!.userId.toString();
    const objectStorageService = new ObjectStorageService();
    
    // 使用正则表达式捕获组获取对象路径
    const capturedPath = req.params[0];
    const objectPath = `/objects/${capturedPath}`;
    
    // 检查访问权限
    const canAccess = await objectStorageService.canAccessObject({
      objectPath,
      userId,
      requestedPermission: ObjectPermission.READ,
    });
    
    if (!canAccess) {
      return res.sendStatus(403);
    }
    
    // 下载并stream文件
    await objectStorageService.downloadObject(objectPath, res);
  } catch (error) {
    console.error('Error downloading object:', error);
    if (error instanceof ObjectNotFoundError) {
      return res.sendStatus(404);
    }
    return res.sendStatus(500);
  }
});

export default router;
