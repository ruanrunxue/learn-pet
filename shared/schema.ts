/**
 * 数据库Schema定义
 * 使用Drizzle ORM定义用户、班级和班级成员表
 */
import { pgTable, serial, text, timestamp, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

/**
 * 用户表
 * 存储教师和学生的账户信息
 */
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  phone: text('phone').notNull().unique(), // 手机号，唯一
  name: text('name').notNull(), // 姓名
  school: text('school').notNull(), // 学校
  password: text('password').notNull(), // 密码（加密后）
  role: text('role').notNull(), // 角色：teacher 或 student
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/**
 * 班级表
 * 存储教师创建的班级信息
 */
export const classes = pgTable('classes', {
  id: serial('id').primaryKey(),
  teacherId: integer('teacher_id').notNull().references(() => users.id), // 创建班级的教师ID
  year: text('year').notNull(), // 年份，如"2025"
  className: text('class_name').notNull(), // 班级名称，如"初二（1）班"
  subject: text('subject').notNull(), // 学科，如"语文"
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/**
 * 班级成员表
 * 学生和班级的多对多关系表
 */
export const classMembers = pgTable('class_members', {
  id: serial('id').primaryKey(),
  classId: integer('class_id').notNull().references(() => classes.id), // 班级ID
  studentId: integer('student_id').notNull().references(() => users.id), // 学生ID
  joinedAt: timestamp('joined_at').defaultNow().notNull(), // 加入时间
}, (table) => ({
  // 复合唯一索引：确保同一学生不能重复加入同一班级
  uniqueClassStudent: {
    columns: [table.classId, table.studentId],
    name: 'unique_class_student',
  },
}));

/**
 * 用户关系定义
 */
export const usersRelations = relations(users, ({ many }) => ({
  createdClasses: many(classes), // 教师创建的班级
  classMembers: many(classMembers), // 学生加入的班级成员记录
}));

/**
 * 班级关系定义
 */
export const classesRelations = relations(classes, ({ one, many }) => ({
  teacher: one(users, {
    fields: [classes.teacherId],
    references: [users.id],
  }), // 班级的创建教师
  members: many(classMembers), // 班级的成员
}));

/**
 * 班级成员关系定义
 */
export const classMembersRelations = relations(classMembers, ({ one }) => ({
  class: one(classes, {
    fields: [classMembers.classId],
    references: [classes.id],
  }), // 所属班级
  student: one(users, {
    fields: [classMembers.studentId],
    references: [users.id],
  }), // 学生用户
}));

/**
 * 学习资料表
 * 存储教师上传的学习资料信息
 */
export const learningMaterials = pgTable('learning_materials', {
  id: serial('id').primaryKey(),
  teacherId: integer('teacher_id').notNull().references(() => users.id),
  name: text('name').notNull(),
  fileType: text('file_type').notNull(),
  fileExtension: text('file_extension').notNull().default(''),
  fileUrl: text('file_url').notNull(),
  tags: text('tags').notNull().default('[]'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/**
 * 宠物表
 * 存储学生在每个班级领养的宠物信息
 */
export const pets = pgTable('pets', {
  id: serial('id').primaryKey(),
  studentId: integer('student_id').notNull().references(() => users.id),
  classId: integer('class_id').notNull().references(() => classes.id),
  name: text('name').notNull(),
  description: text('description').notNull(),
  imageUrl: text('image_url').notNull(),
  level: integer('level').notNull().default(1),
  experience: integer('experience').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  uniqueStudentClass: {
    columns: [table.studentId, table.classId],
    name: 'unique_student_class_pet',
  },
}));

/**
 * 任务表
 * 存储教师发布的任务信息
 */
export const tasks = pgTable('tasks', {
  id: serial('id').primaryKey(),
  teacherId: integer('teacher_id').notNull().references(() => users.id),
  classId: integer('class_id').notNull().references(() => classes.id),
  title: text('title').notNull(),
  description: text('description').notNull(),
  points: integer('points').notNull(),
  deadline: timestamp('deadline').notNull(),
  attachmentUrl: text('attachment_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/**
 * 任务提交表
 * 存储学生提交的任务信息
 */
export const taskSubmissions = pgTable('task_submissions', {
  id: serial('id').primaryKey(),
  taskId: integer('task_id').notNull().references(() => tasks.id),
  studentId: integer('student_id').notNull().references(() => users.id),
  description: text('description').notNull(),
  attachmentUrl: text('attachment_url'),
  submittedAt: timestamp('submitted_at').defaultNow().notNull(),
}, (table) => ({
  uniqueTaskStudent: {
    columns: [table.taskId, table.studentId],
    name: 'unique_task_student_submission',
  },
}));

/**
 * 用户积分表
 * 存储每个学生在每个班级的总积分
 */
export const userPoints = pgTable('user_points', {
  id: serial('id').primaryKey(),
  studentId: integer('student_id').notNull().references(() => users.id),
  classId: integer('class_id').notNull().references(() => classes.id),
  totalPoints: integer('total_points').notNull().default(0),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  uniqueStudentClassPoints: {
    columns: [table.studentId, table.classId],
    name: 'unique_student_class_points',
  },
}));

/**
 * 对象ACL策略表
 * 存储对象存储文件的访问控制策略
 */
export const objectAclPolicies = pgTable('object_acl_policies', {
  id: serial('id').primaryKey(),
  objectPath: text('object_path').notNull().unique(), // 对象路径，如 /objects/uploads/xxx
  owner: text('owner').notNull(), // 所有者用户ID
  visibility: text('visibility').notNull(), // 可见性：public 或 private
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * 学习资料关系定义
 */
export const learningMaterialsRelations = relations(learningMaterials, ({ one }) => ({
  teacher: one(users, {
    fields: [learningMaterials.teacherId],
    references: [users.id],
  }),
}));

/**
 * 宠物关系定义
 */
export const petsRelations = relations(pets, ({ one }) => ({
  student: one(users, {
    fields: [pets.studentId],
    references: [users.id],
  }),
  class: one(classes, {
    fields: [pets.classId],
    references: [classes.id],
  }),
}));

/**
 * 任务关系定义
 */
export const tasksRelations = relations(tasks, ({ one, many }) => ({
  teacher: one(users, {
    fields: [tasks.teacherId],
    references: [users.id],
  }),
  class: one(classes, {
    fields: [tasks.classId],
    references: [classes.id],
  }),
  submissions: many(taskSubmissions),
}));

/**
 * 任务提交关系定义
 */
export const taskSubmissionsRelations = relations(taskSubmissions, ({ one }) => ({
  task: one(tasks, {
    fields: [taskSubmissions.taskId],
    references: [tasks.id],
  }),
  student: one(users, {
    fields: [taskSubmissions.studentId],
    references: [users.id],
  }),
}));

/**
 * 用户积分关系定义
 */
export const userPointsRelations = relations(userPoints, ({ one }) => ({
  student: one(users, {
    fields: [userPoints.studentId],
    references: [users.id],
  }),
  class: one(classes, {
    fields: [userPoints.classId],
    references: [classes.id],
  }),
}));

// 类型导出
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Class = typeof classes.$inferSelect;
export type InsertClass = typeof classes.$inferInsert;
export type ClassMember = typeof classMembers.$inferSelect;
export type InsertClassMember = typeof classMembers.$inferInsert;
export type LearningMaterial = typeof learningMaterials.$inferSelect;
export type InsertLearningMaterial = typeof learningMaterials.$inferInsert;
export type Pet = typeof pets.$inferSelect;
export type InsertPet = typeof pets.$inferInsert;
export type Task = typeof tasks.$inferSelect;
export type InsertTask = typeof tasks.$inferInsert;
export type TaskSubmission = typeof taskSubmissions.$inferSelect;
export type InsertTaskSubmission = typeof taskSubmissions.$inferInsert;
export type UserPoint = typeof userPoints.$inferSelect;
export type InsertUserPoint = typeof userPoints.$inferInsert;
export type ObjectAclPolicy = typeof objectAclPolicies.$inferSelect;
export type InsertObjectAclPolicy = typeof objectAclPolicies.$inferInsert;
