/**
 * 认证路由
 * 处理用户注册、登录和用户信息管理
 */
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db';
import { users } from '../../shared/schema';
import { eq } from 'drizzle-orm';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'learnpet-secret-key-change-in-production';

/**
 * 用户注册
 * POST /api/auth/register
 * Body: { phone, name, school, password, role }
 */
router.post('/register', async (req, res) => {
  try {
    const { phone, name, school, password, role } = req.body;

    // 验证必填字段
    if (!phone || !name || !school || !password || !role) {
      return res.status(400).json({ error: '所有字段都是必填的' });
    }

    // 验证角色
    if (role !== 'teacher' && role !== 'student') {
      return res.status(400).json({ error: '角色必须是teacher或student' });
    }

    // 检查手机号是否已存在
    const existingUser = await db.select().from(users).where(eq(users.phone, phone));
    if (existingUser.length > 0) {
      return res.status(400).json({ error: '该手机号已被注册' });
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建用户
    const [newUser] = await db.insert(users).values({
      phone,
      name,
      school,
      password: hashedPassword,
      role,
    }).returning();

    res.status(201).json({
      message: '注册成功',
      user: {
        id: newUser.id,
        phone: newUser.phone,
        name: newUser.name,
        school: newUser.school,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({ error: '注册失败，请稍后重试' });
  }
});

/**
 * 用户登录
 * POST /api/auth/login
 * Body: { phone, password, role }
 */
router.post('/login', async (req, res) => {
  try {
    const { phone, password, role } = req.body;

    // 验证必填字段
    if (!phone || !password || !role) {
      return res.status(400).json({ error: '所有字段都是必填的' });
    }

    // 查找用户
    const [user] = await db.select().from(users).where(eq(users.phone, phone));
    if (!user) {
      return res.status(401).json({ error: '手机号或密码错误' });
    }

    // 验证角色
    if (user.role !== role) {
      return res.status(401).json({ error: '角色选择错误' });
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: '手机号或密码错误' });
    }

    // 生成JWT token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: '登录成功',
      token,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        school: user.school,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ error: '登录失败，请稍后重试' });
  }
});

/**
 * 获取当前用户信息
 * GET /api/auth/me
 * 需要认证
 */
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const userId = req.user!.userId;

    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    res.json({
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        school: user.school,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({ error: '获取用户信息失败' });
  }
});

/**
 * 更新用户信息
 * PUT /api/auth/update-profile
 * Body: { name, school }
 * 需要认证
 */
router.put('/update-profile', authMiddleware, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const { name, school } = req.body;

    // 验证必填字段
    if (!name || !school) {
      return res.status(400).json({ error: '姓名和学校是必填的' });
    }

    // 更新用户信息
    const [updatedUser] = await db
      .update(users)
      .set({ name, school })
      .where(eq(users.id, userId))
      .returning();

    if (!updatedUser) {
      return res.status(404).json({ error: '用户不存在' });
    }

    res.json({
      message: '更新成功',
      user: {
        id: updatedUser.id,
        phone: updatedUser.phone,
        name: updatedUser.name,
        school: updatedUser.school,
        role: updatedUser.role,
      },
    });
  } catch (error) {
    console.error('更新用户信息错误:', error);
    res.status(500).json({ error: '更新失败，请稍后重试' });
  }
});

export default router;
