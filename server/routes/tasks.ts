/**
 * 任务管理路由
 * 处理任务的发布、提交、批改等操作
 */
import { Router } from 'express';
import { eq, and, sql } from 'drizzle-orm';
import { db } from '../db';
import { tasks, taskSubmissions, userPoints, classes, classMembers } from '../../shared/schema';
import { authMiddleware } from '../middleware/auth';

const router = Router();

/**
 * 发布任务
 * 教师向指定班级发布任务
 * POST /api/tasks/publish
 * Body: { classId: number, title: string, description: string, points: number, deadline: Date, attachmentUrl?: string }
 */
router.post('/publish', authMiddleware, async (req, res) => {
  try {
    const { classId, title, description, points, deadline, attachmentUrl } = req.body;
    const userId = req.user!.userId;
    const role = req.user!.role;

    // 验证角色：只有教师可以发布任务
    if (role !== 'teacher') {
      return res.status(403).json({ error: 'Only teachers can publish tasks' });
    }

    // 验证必填字段
    if (!classId || !title || !description || !points || !deadline) {
      return res.status(400).json({ error: 'classId, title, description, points, and deadline are required' });
    }

    // 验证教师是否拥有该班级
    const classInfo = await db
      .select()
      .from(classes)
      .where(and(eq(classes.id, classId), eq(classes.teacherId, userId)))
      .limit(1);

    if (classInfo.length === 0) {
      return res.status(403).json({ error: 'You do not have permission to publish tasks to this class' });
    }

    // 创建任务记录
    const [task] = await db
      .insert(tasks)
      .values({
        teacherId: userId,
        classId,
        title,
        description,
        points,
        deadline: new Date(deadline),
        attachmentUrl: attachmentUrl || null,
      })
      .returning();

    res.status(201).json(task);
  } catch (error) {
    console.error('Error publishing task:', error);
    res.status(500).json({ error: 'Failed to publish task' });
  }
});

/**
 * 获取班级的所有任务
 * GET /api/tasks/class/:classId
 */
router.get('/class/:classId', authMiddleware, async (req, res) => {
  try {
    const classId = parseInt(req.params.classId);
    const userId = req.user!.userId;
    const role = req.user!.role;

    // 验证用户是否有权查看该班级的任务
    if (role === 'teacher') {
      // 教师只能查看自己班级的任务
      const classInfo = await db
        .select()
        .from(classes)
        .where(and(eq(classes.id, classId), eq(classes.teacherId, userId)))
        .limit(1);

      if (classInfo.length === 0) {
        return res.status(403).json({ error: 'You do not have permission to view this class' });
      }
    } else if (role === 'student') {
      // 学生只能查看自己加入的班级的任务
      const membership = await db
        .select()
        .from(classMembers)
        .where(and(eq(classMembers.classId, classId), eq(classMembers.studentId, userId)))
        .limit(1);

      if (membership.length === 0) {
        return res.status(403).json({ error: 'You are not a member of this class' });
      }
    }

    // 获取任务列表
    const tasksList = await db
      .select()
      .from(tasks)
      .where(eq(tasks.classId, classId))
      .orderBy(sql`${tasks.createdAt} DESC`);

    res.json(tasksList);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

/**
 * 获取任务详情
 * GET /api/tasks/:id
 * 验证用户权限：教师只能查看自己班级的任务，学生只能查看已加入班级的任务
 */
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const userId = req.user!.userId;
    const role = req.user!.role;

    const task = await db
      .select()
      .from(tasks)
      .where(eq(tasks.id, id))
      .limit(1);

    if (task.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const taskData = task[0];

    // 验证用户是否有权查看该任务
    if (role === 'teacher') {
      // 教师只能查看自己班级的任务
      if (taskData.teacherId !== userId) {
        return res.status(403).json({ error: 'You do not have permission to view this task' });
      }
    } else if (role === 'student') {
      // 学生只能查看自己加入的班级的任务
      const membership = await db
        .select()
        .from(classMembers)
        .where(and(eq(classMembers.classId, taskData.classId), eq(classMembers.studentId, userId)))
        .limit(1);

      if (membership.length === 0) {
        return res.status(403).json({ error: 'You are not a member of this class' });
      }
    }

    res.json(taskData);
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

/**
 * 提交任务
 * 学生提交任务作业
 * POST /api/tasks/:id/submit
 * Body: { description: string, attachmentUrl?: string }
 */
router.post('/:id/submit', authMiddleware, async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    const { description, attachmentUrl } = req.body;
    const userId = req.user!.userId;
    const role = req.user!.role;

    // 验证角色：只有学生可以提交任务
    if (role !== 'student') {
      return res.status(403).json({ error: 'Only students can submit tasks' });
    }

    // 验证必填字段
    if (!description) {
      return res.status(400).json({ error: 'description is required' });
    }

    // 检查任务是否存在
    const task = await db
      .select()
      .from(tasks)
      .where(eq(tasks.id, taskId))
      .limit(1);

    if (task.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // 检查学生是否在该班级中
    const membership = await db
      .select()
      .from(classMembers)
      .where(and(eq(classMembers.classId, task[0].classId), eq(classMembers.studentId, userId)))
      .limit(1);

    if (membership.length === 0) {
      return res.status(403).json({ error: 'You are not a member of this class' });
    }

    // 检查是否已经提交过
    const existingSubmission = await db
      .select()
      .from(taskSubmissions)
      .where(and(eq(taskSubmissions.taskId, taskId), eq(taskSubmissions.studentId, userId)))
      .limit(1);

    if (existingSubmission.length > 0) {
      return res.status(400).json({ error: 'You have already submitted this task' });
    }

    // 创建提交记录
    const [submission] = await db
      .insert(taskSubmissions)
      .values({
        taskId,
        studentId: userId,
        description,
        attachmentUrl: attachmentUrl || null,
      })
      .returning();

    // 自动给予积分（任务提交即获得积分）
    await updateStudentPoints(userId, task[0].classId, task[0].points);

    res.status(201).json(submission);
  } catch (error) {
    console.error('Error submitting task:', error);
    res.status(500).json({ error: 'Failed to submit task' });
  }
});

/**
 * 获取任务的所有提交
 * 教师查看任务的所有学生提交
 * GET /api/tasks/:id/submissions
 */
router.get('/:id/submissions', authMiddleware, async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    const userId = req.user!.userId;
    const role = req.user!.role;

    // 验证角色：只有教师可以查看所有提交
    if (role !== 'teacher') {
      return res.status(403).json({ error: 'Only teachers can view all submissions' });
    }

    // 验证教师是否拥有该任务
    const task = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.teacherId, userId)))
      .limit(1);

    if (task.length === 0) {
      return res.status(404).json({ error: 'Task not found or you do not have permission' });
    }

    // 获取所有提交
    const submissions = await db
      .select()
      .from(taskSubmissions)
      .where(eq(taskSubmissions.taskId, taskId))
      .orderBy(sql`${taskSubmissions.submittedAt} DESC`);

    res.json(submissions);
  } catch (error) {
    console.error('Error fetching submissions:', error);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

/**
 * 获取学生的任务提交状态
 * GET /api/tasks/:id/my-submission
 */
router.get('/:id/my-submission', authMiddleware, async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    const userId = req.user!.userId;
    const role = req.user!.role;

    // 验证角色：只有学生可以查看自己的提交
    if (role !== 'student') {
      return res.status(403).json({ error: 'Only students can view their submissions' });
    }

    const submission = await db
      .select()
      .from(taskSubmissions)
      .where(and(eq(taskSubmissions.taskId, taskId), eq(taskSubmissions.studentId, userId)))
      .limit(1);

    if (submission.length === 0) {
      return res.status(404).json({ error: 'No submission found' });
    }

    res.json(submission[0]);
  } catch (error) {
    console.error('Error fetching submission:', error);
    res.status(500).json({ error: 'Failed to fetch submission' });
  }
});

/**
 * 辅助函数：更新学生积分
 * @param studentId - 学生ID
 * @param classId - 班级ID
 * @param points - 积分增量
 */
async function updateStudentPoints(studentId: number, classId: number, points: number) {
  // 检查是否已有积分记录
  const existingPoints = await db
    .select()
    .from(userPoints)
    .where(and(eq(userPoints.studentId, studentId), eq(userPoints.classId, classId)))
    .limit(1);

  if (existingPoints.length === 0) {
    // 创建新的积分记录
    await db.insert(userPoints).values({
      studentId,
      classId,
      totalPoints: points,
    });
  } else {
    // 更新现有积分记录
    await db
      .update(userPoints)
      .set({
        totalPoints: existingPoints[0].totalPoints + points,
        updatedAt: new Date(),
      })
      .where(eq(userPoints.id, existingPoints[0].id));
  }
}

export default router;
