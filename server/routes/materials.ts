/**
 * 学习资料管理路由
 * 处理学习资料的上传、查询、删除等操作
 */
import { Router } from 'express';
import { eq, and, or, sql } from 'drizzle-orm';
import { db } from '../db';
import { learningMaterials } from '../../shared/schema';
import { authMiddleware } from '../middleware/auth';
import { ObjectStorageService } from '../objectStorage';

const router = Router();

/**
 * 上传学习资料
 * 教师上传学习资料文件
 * POST /api/materials/upload
 * Body: { name: string, fileType: string, fileUrl: string, tags?: string[] }
 */
router.post('/upload', authMiddleware, async (req, res) => {
  try {
    const { name, fileType, fileUrl, tags } = req.body;
    const userId = req.user!.userId;
    const role = req.user!.role;

    // 验证角色：只有教师可以上传学习资料
    if (role !== 'teacher') {
      return res.status(403).json({ error: 'Only teachers can upload materials' });
    }

    // 验证必填字段
    if (!name || !fileType || !fileUrl) {
      return res.status(400).json({ error: 'name, fileType, and fileUrl are required' });
    }

    // 创建学习资料记录
    const [material] = await db
      .insert(learningMaterials)
      .values({
        teacherId: userId,
        name,
        fileType,
        fileUrl,
        tags: tags || [],
      })
      .returning();

    res.status(201).json(material);
  } catch (error) {
    console.error('Error uploading material:', error);
    res.status(500).json({ error: 'Failed to upload material' });
  }
});

/**
 * 获取学习资料列表
 * 支持按标签筛选
 * GET /api/materials?tags=math,physics
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { tags } = req.query;
    const role = req.user!.role;

    // 学生和教师都可以查看学习资料
    let materials;

    // 如果提供了标签筛选
    if (tags && typeof tags === 'string') {
      const tagArray = tags.split(',').map(t => t.trim());
      // 使用数组重叠操作符筛选包含任意标签的资料
      materials = await db
        .select()
        .from(learningMaterials)
        .where(
          sql`${learningMaterials.tags} && ARRAY[${sql.join(tagArray.map(tag => sql`${tag}`), sql`, `)}]::text[]`
        )
        .orderBy(sql`${learningMaterials.createdAt} DESC`);
    } else {
      materials = await db
        .select()
        .from(learningMaterials)
        .orderBy(sql`${learningMaterials.createdAt} DESC`);
    }

    res.json(materials);
  } catch (error) {
    console.error('Error fetching materials:', error);
    res.status(500).json({ error: 'Failed to fetch materials' });
  }
});

/**
 * 获取教师上传的所有学习资料
 * GET /api/materials/teacher/my-materials
 */
router.get('/teacher/my-materials', authMiddleware, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const role = req.user!.role;

    // 验证角色：只有教师可以查看自己的资料
    if (role !== 'teacher') {
      return res.status(403).json({ error: 'Only teachers can view their materials' });
    }

    const materials = await db
      .select()
      .from(learningMaterials)
      .where(eq(learningMaterials.teacherId, userId))
      .orderBy(sql`${learningMaterials.createdAt} DESC`);

    res.json(materials);
  } catch (error) {
    console.error('Error fetching teacher materials:', error);
    res.status(500).json({ error: 'Failed to fetch materials' });
  }
});

/**
 * 获取单个学习资料详情
 * GET /api/materials/:id
 */
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const material = await db
      .select()
      .from(learningMaterials)
      .where(eq(learningMaterials.id, id))
      .limit(1);

    if (material.length === 0) {
      return res.status(404).json({ error: 'Material not found' });
    }

    res.json(material[0]);
  } catch (error) {
    console.error('Error fetching material:', error);
    res.status(500).json({ error: 'Failed to fetch material' });
  }
});

/**
 * 删除学习资料
 * DELETE /api/materials/:id
 * 只有资料的上传者可以删除
 */
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const userId = req.user!.userId;
    const role = req.user!.role;

    // 验证角色：只有教师可以删除学习资料
    if (role !== 'teacher') {
      return res.status(403).json({ error: 'Only teachers can delete materials' });
    }

    // 获取资料信息，验证所有权
    const material = await db
      .select()
      .from(learningMaterials)
      .where(and(eq(learningMaterials.id, id), eq(learningMaterials.teacherId, userId)))
      .limit(1);

    if (material.length === 0) {
      return res.status(404).json({ error: 'Material not found or you do not have permission to delete it' });
    }

    // 删除资料记录
    await db.delete(learningMaterials).where(eq(learningMaterials.id, id));

    res.json({ success: true, message: 'Material deleted successfully' });
  } catch (error) {
    console.error('Error deleting material:', error);
    res.status(500).json({ error: 'Failed to delete material' });
  }
});

export default router;
