/**
 * 班级路由
 * 处理班级创建、查询、加入等操作
 */
import { Router } from 'express';
import { db } from '../db';
import { classes, classMembers, users, userPoints } from '../../shared/schema';
import { eq, and, desc } from 'drizzle-orm';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// 所有班级路由都需要认证
router.use(authMiddleware);

/**
 * 创建班级（仅教师）
 * POST /api/class/create
 * Body: { year, className, subject }
 */
router.post('/create', async (req, res) => {
  try {
    const { year, className, subject } = req.body;
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    // 验证是否是教师
    if (userRole !== 'teacher') {
      return res.status(403).json({ error: '只有教师可以创建班级' });
    }

    // 验证必填字段
    if (!year || !className || !subject) {
      return res.status(400).json({ error: '所有字段都是必填的' });
    }

    // 创建班级
    const [newClass] = await db.insert(classes).values({
      teacherId: userId,
      year,
      className,
      subject,
    }).returning();

    res.status(201).json({
      message: '班级创建成功',
      class: newClass,
    });
  } catch (error) {
    console.error('创建班级错误:', error);
    res.status(500).json({ error: '创建班级失败，请稍后重试' });
  }
});

/**
 * 获取教师创建的所有班级
 * GET /api/class/teacher
 */
router.get('/teacher', async (req, res) => {
  try {
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    // 验证是否是教师
    if (userRole !== 'teacher') {
      return res.status(403).json({ error: '只有教师可以查看创建的班级' });
    }

    // 查询教师创建的所有班级
    const teacherClasses = await db.select().from(classes).where(eq(classes.teacherId, userId));

    res.json({ classes: teacherClasses });
  } catch (error) {
    console.error('获取教师班级错误:', error);
    res.status(500).json({ error: '获取班级失败，请稍后重试' });
  }
});

/**
 * 获取所有可加入的班级（学生用）
 * GET /api/class/available
 */
router.get('/available', async (req, res) => {
  try {
    const userRole = req.user!.role;

    // 验证是否是学生
    if (userRole !== 'student') {
      return res.status(403).json({ error: '只有学生可以查看可加入的班级' });
    }

    // 查询所有班级，并关联教师信息
    const allClasses = await db
      .select({
        id: classes.id,
        year: classes.year,
        className: classes.className,
        subject: classes.subject,
        teacherId: classes.teacherId,
        teacherName: users.name,
        createdAt: classes.createdAt,
      })
      .from(classes)
      .leftJoin(users, eq(classes.teacherId, users.id));

    res.json({ classes: allClasses });
  } catch (error) {
    console.error('获取可用班级错误:', error);
    res.status(500).json({ error: '获取班级失败，请稍后重试' });
  }
});

/**
 * 学生加入班级
 * POST /api/class/join
 * Body: { classId }
 */
router.post('/join', async (req, res) => {
  try {
    const { classId } = req.body;
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    // 验证是否是学生
    if (userRole !== 'student') {
      return res.status(403).json({ error: '只有学生可以加入班级' });
    }

    // 验证必填字段
    if (!classId) {
      return res.status(400).json({ error: '班级ID是必填的' });
    }

    // 检查班级是否存在
    const [classExists] = await db.select().from(classes).where(eq(classes.id, classId));
    if (!classExists) {
      return res.status(404).json({ error: '班级不存在' });
    }

    // 检查是否已经加入
    const [alreadyJoined] = await db
      .select()
      .from(classMembers)
      .where(and(eq(classMembers.classId, classId), eq(classMembers.studentId, userId)));

    if (alreadyJoined) {
      return res.status(400).json({ error: '您已经加入了该班级' });
    }

    // 加入班级
    const [newMember] = await db.insert(classMembers).values({
      classId,
      studentId: userId,
    }).returning();

    res.status(201).json({
      message: '成功加入班级',
      membership: newMember,
    });
  } catch (error) {
    console.error('加入班级错误:', error);
    res.status(500).json({ error: '加入班级失败，请稍后重试' });
  }
});

/**
 * 获取学生已加入的所有班级
 * GET /api/class/student
 */
router.get('/student', async (req, res) => {
  try {
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    // 验证是否是学生
    if (userRole !== 'student') {
      return res.status(403).json({ error: '只有学生可以查看已加入的班级' });
    }

    // 查询学生加入的所有班级
    const studentClasses = await db
      .select({
        id: classes.id,
        year: classes.year,
        className: classes.className,
        subject: classes.subject,
        teacherId: classes.teacherId,
        teacherName: users.name,
        joinedAt: classMembers.joinedAt,
      })
      .from(classMembers)
      .where(eq(classMembers.studentId, userId))
      .leftJoin(classes, eq(classMembers.classId, classes.id))
      .leftJoin(users, eq(classes.teacherId, users.id));

    res.json({ classes: studentClasses });
  } catch (error) {
    console.error('获取学生班级错误:', error);
    res.status(500).json({ error: '获取班级失败，请稍后重试' });
  }
});

/**
 * 获取班级详情（包括成员列表）
 * GET /api/class/:classId
 */
router.get('/:classId', async (req, res) => {
  try {
    const classId = parseInt(req.params.classId);
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    // 查询班级信息
    const [classInfo] = await db.select().from(classes).where(eq(classes.id, classId));
    if (!classInfo) {
      return res.status(404).json({ error: '班级不存在' });
    }

    // 验证权限：教师只能查看自己创建的班级，学生只能查看已加入的班级
    if (userRole === 'teacher' && classInfo.teacherId !== userId) {
      return res.status(403).json({ error: '您无权查看该班级' });
    }

    if (userRole === 'student') {
      const [isMember] = await db
        .select()
        .from(classMembers)
        .where(and(eq(classMembers.classId, classId), eq(classMembers.studentId, userId)));
      
      if (!isMember) {
        return res.status(403).json({ error: '您未加入该班级' });
      }
    }

    // 查询班级成员
    const members = await db
      .select({
        id: users.id,
        name: users.name,
        phone: users.phone,
        school: users.school,
        joinedAt: classMembers.joinedAt,
      })
      .from(classMembers)
      .where(eq(classMembers.classId, classId))
      .leftJoin(users, eq(classMembers.studentId, users.id));

    res.json({
      class: classInfo,
      members,
    });
  } catch (error) {
    console.error('获取班级详情错误:', error);
    res.status(500).json({ error: '获取班级详情失败，请稍后重试' });
  }
});

/**
 * 从班级中删除学生（仅教师）
 * DELETE /api/class/:classId/member/:studentId
 */
router.delete('/:classId/member/:studentId', async (req, res) => {
  try {
    const classId = parseInt(req.params.classId);
    const studentId = parseInt(req.params.studentId);
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    // 验证是否是教师
    if (userRole !== 'teacher') {
      return res.status(403).json({ error: '只有教师可以删除学生' });
    }

    // 验证班级是否属于该教师
    const [classInfo] = await db.select().from(classes).where(eq(classes.id, classId));
    if (!classInfo) {
      return res.status(404).json({ error: '班级不存在' });
    }
    if (classInfo.teacherId !== userId) {
      return res.status(403).json({ error: '您无权操作该班级' });
    }

    // 删除学生
    await db
      .delete(classMembers)
      .where(and(eq(classMembers.classId, classId), eq(classMembers.studentId, studentId)));

    res.json({ message: '学生已从班级中移除' });
  } catch (error) {
    console.error('删除学生错误:', error);
    res.status(500).json({ error: '删除学生失败，请稍后重试' });
  }
});

/**
 * 获取班级积分排行榜
 * GET /api/class/:classId/rankings
 * 返回班级内所有学生的积分排名
 */
router.get('/:classId/rankings', async (req, res) => {
  try {
    const classId = parseInt(req.params.classId);
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    // 验证班级是否存在
    const [classInfo] = await db.select().from(classes).where(eq(classes.id, classId));
    if (!classInfo) {
      return res.status(404).json({ error: '班级不存在' });
    }

    // 验证权限：教师只能查看自己创建的班级，学生只能查看已加入的班级
    if (userRole === 'teacher' && classInfo.teacherId !== userId) {
      return res.status(403).json({ error: '您无权查看该班级排名' });
    }

    if (userRole === 'student') {
      const [isMember] = await db
        .select()
        .from(classMembers)
        .where(and(eq(classMembers.classId, classId), eq(classMembers.studentId, userId)));
      
      if (!isMember) {
        return res.status(403).json({ error: '您未加入该班级，无法查看排名' });
      }
    }

    // 查询班级内所有学生的积分，并按积分降序排序
    const rankings = await db
      .select({
        studentId: users.id,
        studentName: users.name,
        totalPoints: userPoints.totalPoints,
      })
      .from(classMembers)
      .where(eq(classMembers.classId, classId))
      .leftJoin(users, eq(classMembers.studentId, users.id))
      .leftJoin(
        userPoints,
        and(
          eq(userPoints.studentId, classMembers.studentId),
          eq(userPoints.classId, classId)
        )
      )
      .orderBy(desc(userPoints.totalPoints));

    // 处理没有积分记录的学生（显示0分）
    const processedRankings = rankings.map((rank) => ({
      studentId: rank.studentId,
      studentName: rank.studentName,
      totalPoints: rank.totalPoints || 0,
    }));

    res.json({ rankings: processedRankings });
  } catch (error) {
    console.error('获取班级排名错误:', error);
    res.status(500).json({ error: '获取排名失败，请稍后重试' });
  }
});

export default router;
