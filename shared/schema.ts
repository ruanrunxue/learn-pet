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

// 类型导出
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Class = typeof classes.$inferSelect;
export type InsertClass = typeof classes.$inferInsert;
export type ClassMember = typeof classMembers.$inferSelect;
export type InsertClassMember = typeof classMembers.$inferInsert;
