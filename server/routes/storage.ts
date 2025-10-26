/**
 * 对象存储路由
 * 处理文件上传和下载
 */
import { Router } from 'express';
import { ObjectStorageService, ObjectNotFoundError } from '../objectStorage';
import { ObjectPermission } from '../objectAcl';
import { authMiddleware } from '../middleware/auth';

const router = Router();

/**
 * 获取上传URL和对象路径
 * 用于客户端直接上传文件到对象存储
 * 返回：
 * - uploadURL: 预签名URL，客户端用于PUT文件
 * - objectPath: 规范化对象路径，用于后续ACL设置和下载
 */
router.post('/upload-url', authMiddleware, async (req, res) => {
  try {
    const objectStorageService = new ObjectStorageService();
    const { uploadURL, objectPath } = await objectStorageService.getObjectEntityUploadURL();
    res.json({ uploadURL, objectPath });
  } catch (error) {
    console.error('Error getting upload URL:', error);
    res.status(500).json({ error: 'Failed to get upload URL' });
  }
});

/**
 * 确认文件上传并设置ACL策略
 * 客户端上传完成后调用此接口
 * @param objectPath - 从upload-url返回的规范化对象路径
 * @param visibility - 可见性：public 或 private（默认）
 */
router.post('/confirm-upload', authMiddleware, async (req, res) => {
  try {
    const { objectPath, visibility = 'private' } = req.body;
    
    if (!objectPath) {
      return res.status(400).json({ error: 'objectPath is required' });
    }
    
    const userId = req.user!.userId.toString();
    const objectStorageService = new ObjectStorageService();
    
    await objectStorageService.trySetObjectEntityAclPolicy(
      objectPath,
      {
        owner: userId,
        visibility: visibility as 'public' | 'private',
      }
    );
    
    res.json({ success: true, objectPath });
  } catch (error) {
    console.error('Error confirming upload:', error);
    res.status(500).json({ error: 'Failed to confirm upload' });
  }
});

/**
 * 下载/查看对象文件
 * 支持ACL权限检查
 * 使用原始URL路径来提取对象路径
 */
router.get(/^\/objects\/(.+)$/, authMiddleware, async (req, res) => {
  try {
    const userId = req.user!.userId.toString();
    const objectStorageService = new ObjectStorageService();
    
    // 使用正则表达式捕获组获取对象路径
    const capturedPath = req.params[0];
    const objectPath = `/objects/${capturedPath}`;
    
    const objectFile = await objectStorageService.getObjectEntityFile(objectPath);
    
    const canAccess = await objectStorageService.canAccessObjectEntity({
      objectFile,
      userId,
      requestedPermission: ObjectPermission.READ,
    });
    
    if (!canAccess) {
      return res.sendStatus(403);
    }
    
    objectStorageService.downloadObject(objectFile, res);
  } catch (error) {
    console.error('Error downloading object:', error);
    if (error instanceof ObjectNotFoundError) {
      return res.sendStatus(404);
    }
    return res.sendStatus(500);
  }
});

export default router;
