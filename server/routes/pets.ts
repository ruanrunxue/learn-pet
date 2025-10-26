/**
 * 宠物管理路由
 * 处理宠物的领养、查询、升级等操作
 */
import { Router } from 'express';
import { eq, and } from 'drizzle-orm';
import { db } from '../db';
import { pets } from '../../shared/schema';
import { authMiddleware } from '../middleware/auth';
import { generatePetImage } from '../openai';
import { ObjectStorageService } from '../objectStorage';

const router = Router();

/**
 * 领养宠物
 * 学生在指定班级领养一只虚拟宠物
 * POST /api/pets/adopt
 * Body: { classId: number, name: string, description: string }
 */
router.post('/adopt', authMiddleware, async (req, res) => {
  try {
    const { classId, name, description } = req.body;
    const userId = req.user!.userId;
    const role = req.user!.role;

    // 验证角色：只有学生可以领养宠物
    if (role !== 'student') {
      return res.status(403).json({ error: 'Only students can adopt pets' });
    }

    // 验证必填字段
    if (!classId || !name || !description) {
      return res.status(400).json({ error: 'classId, name, and description are required' });
    }

    // 检查是否已经在该班级领养过宠物
    const existingPet = await db
      .select()
      .from(pets)
      .where(and(eq(pets.studentId, userId), eq(pets.classId, classId)))
      .limit(1);

    if (existingPet.length > 0) {
      return res.status(400).json({ error: 'You already have a pet in this class' });
    }

    // 使用AI生成宠物图片
    console.log(`Generating pet image for: ${name} - ${description}`);
    const imageBase64 = await generatePetImage(name, description);

    // 将base64图片上传到对象存储
    const objectStorageService = new ObjectStorageService();
    const { uploadURL, objectPath } = await objectStorageService.getObjectEntityUploadURL();

    // 将base64转换为Buffer并上传
    const imageBuffer = Buffer.from(imageBase64, 'base64');
    const uploadResponse = await fetch(uploadURL, {
      method: 'PUT',
      body: imageBuffer,
      headers: {
        'Content-Type': 'image/png',
      },
    });

    if (!uploadResponse.ok) {
      throw new Error('Failed to upload pet image to storage');
    }

    // 设置图片ACL为public，便于前端显示
    await objectStorageService.trySetObjectEntityAclPolicy(objectPath, {
      owner: userId.toString(),
      visibility: 'public',
    });

    // 创建宠物记录
    const [newPet] = await db
      .insert(pets)
      .values({
        studentId: userId,
        classId,
        name,
        description,
        imageUrl: objectPath,
        level: 1,
        experience: 0,
      })
      .returning();

    res.status(201).json(newPet);
  } catch (error) {
    console.error('Error adopting pet:', error);
    res.status(500).json({ error: 'Failed to adopt pet' });
  }
});

/**
 * 获取学生在指定班级的宠物
 * GET /api/pets/class/:classId
 */
router.get('/class/:classId', authMiddleware, async (req, res) => {
  try {
    const classId = parseInt(req.params.classId);
    const userId = req.user!.userId;
    const role = req.user!.role;

    // 验证角色：只有学生可以查看自己的宠物
    if (role !== 'student') {
      return res.status(403).json({ error: 'Only students can view pets' });
    }

    const pet = await db
      .select()
      .from(pets)
      .where(and(eq(pets.studentId, userId), eq(pets.classId, classId)))
      .limit(1);

    if (pet.length === 0) {
      return res.status(404).json({ error: 'No pet found in this class' });
    }

    res.json(pet[0]);
  } catch (error) {
    console.error('Error fetching pet:', error);
    res.status(500).json({ error: 'Failed to fetch pet' });
  }
});

/**
 * 喂养宠物（增加经验值）
 * POST /api/pets/:petId/feed
 * Body: { points: number }
 */
router.post('/:petId/feed', authMiddleware, async (req, res) => {
  try {
    const petId = parseInt(req.params.petId);
    const { points } = req.body;
    const userId = req.user!.userId;
    const role = req.user!.role;

    // 验证角色：只有学生可以喂养自己的宠物
    if (role !== 'student') {
      return res.status(403).json({ error: 'Only students can feed pets' });
    }

    if (!points || points <= 0) {
      return res.status(400).json({ error: 'Invalid points value' });
    }

    // 获取宠物信息
    const pet = await db
      .select()
      .from(pets)
      .where(and(eq(pets.id, petId), eq(pets.studentId, userId)))
      .limit(1);

    if (pet.length === 0) {
      return res.status(404).json({ error: 'Pet not found' });
    }

    // 计算新的经验值和等级
    const currentPet = pet[0];
    const newExperience = currentPet.experience + points;
    
    // 等级计算：每100经验值升1级
    const newLevel = Math.floor(newExperience / 100) + 1;

    // 更新宠物
    const [updatedPet] = await db
      .update(pets)
      .set({
        experience: newExperience,
        level: newLevel,
        updatedAt: new Date(),
      })
      .where(eq(pets.id, petId))
      .returning();

    res.json(updatedPet);
  } catch (error) {
    console.error('Error feeding pet:', error);
    res.status(500).json({ error: 'Failed to feed pet' });
  }
});

/**
 * 获取学生的所有宠物
 * GET /api/pets/my-pets
 */
router.get('/my-pets', authMiddleware, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const role = req.user!.role;

    // 验证角色：只有学生可以查看自己的宠物
    if (role !== 'student') {
      return res.status(403).json({ error: 'Only students can view pets' });
    }

    const myPets = await db
      .select()
      .from(pets)
      .where(eq(pets.studentId, userId));

    res.json(myPets);
  } catch (error) {
    console.error('Error fetching pets:', error);
    res.status(500).json({ error: 'Failed to fetch pets' });
  }
});

export default router;
