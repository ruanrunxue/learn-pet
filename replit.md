# 学宠 LearnPet - 教学宠物养成应用

## 项目概述

学宠（LearnPet）是一个跨端教学辅助应用，支持H5和微信小程序。学生通过完成老师布置的任务获得积分，积分用于养成虚拟宠物。

**技术栈：**
- 前端：Taro 4.1.7 + React
- 后端：Node.js v22.20.0 + Express
- 数据库：PostgreSQL (Neon) + Drizzle ORM

## 项目架构

### 目录结构

```
├── config/              # Taro配置文件
├── server/              # 后端API服务器
│   ├── routes/          # API路由
│   ├── middleware/      # 中间件（认证等）
│   ├── db.ts           # 数据库连接
│   └── index.ts        # 服务器入口
├── shared/              # 前后端共享代码
│   └── schema.ts       # 数据库Schema
├── src/                 # 前端源代码
│   ├── pages/          # 页面组件
│   ├── utils/          # 工具函数
│   └── app.config.ts   # 应用配置
└── drizzle.config.ts   # Drizzle ORM配置
```

### 数据库设计

**users表（用户表）**
- 存储教师和学生的账户信息
- 字段：id, phone, name, school, password, role, createdAt

**classes表（班级表）**
- 存储教师创建的班级信息
- 字段：id, teacherId, year, className, subject, createdAt

**class_members表（班级成员表）**
- 学生和班级的多对多关系
- 字段：id, classId, studentId, joinedAt
- 唯一约束：(classId, studentId) 防止重复加入

**learning_materials表（学习资料表）**
- 存储教师上传的学习资料
- 字段：id, teacherId, name, fileType, fileUrl, tags, createdAt

**pets表（宠物表）**
- 存储学生在每个班级领养的宠物
- 字段：id, studentId, classId, name, description, imageUrl, level, experience, createdAt, updatedAt
- 唯一约束：(studentId, classId) 每个学生在每个班级只能领养一只宠物

**tasks表（任务表）**
- 存储教师发布的任务
- 字段：id, teacherId, classId, title, description, points, deadline, attachmentUrl, createdAt

**task_submissions表（任务提交表）**
- 存储学生提交的任务
- 字段：id, taskId, studentId, description, attachmentUrl, submittedAt
- 唯一约束：(taskId, studentId) 每个学生只能提交一次任务

**user_points表（用户积分表）**
- 存储每个学生在每个班级的总积分
- 字段：id, studentId, classId, totalPoints, updatedAt
- 唯一约束：(studentId, classId) 每个学生在每个班级只有一条积分记录

## 已实现功能

### 1. 用户认证系统 ✅

**登录页面** (`/pages/login/index`)
- 支持教师和学生角色选择
- 手机号 + 密码登录
- 自动跳转到班级列表

**注册页面** (`/pages/register/index`)
- 教师注册：手机号、姓名、学校、密码
- 学生注册：手机号、姓名、学校、密码
- 注册成功后自动跳转登录

### 2. 班级管理系统 ✅

**教师功能：**
- 班级列表页 (`/pages/class-list/index`)
  - 查看已创建的班级
  - 显示年份、班级、学科信息
  
- 创建班级页 (`/pages/create-class/index`)
  - 输入年份、班级名称、学科
  - 创建后返回列表
  
- 班级详情页 (`/pages/class-detail/index`)
  - 查看班级成员列表
  - 可删除学生

**学生功能：**
- 班级列表页 (`/pages/class-list/index`)
  - 查看已加入的班级
  - 显示教师姓名、年份、班级、学科
  
- 加入班级页 (`/pages/join-class/index`)
  - 浏览所有可加入的班级
  - 一键加入班级
  
- 班级详情页 (`/pages/class-detail/index`)
  - 积分排名功能预留（待开发）

## API接口

### 认证接口

```
POST /api/auth/register  # 用户注册
POST /api/auth/login     # 用户登录
```

### 班级接口

```
POST   /api/class/create              # 创建班级（教师）
GET    /api/class/teacher             # 获取教师创建的班级
GET    /api/class/available           # 获取可加入的班级（学生）
POST   /api/class/join                # 加入班级（学生）
GET    /api/class/student             # 获取学生已加入的班级
GET    /api/class/:classId            # 获取班级详情
DELETE /api/class/:classId/member/:studentId  # 删除学生（教师）
```

### 对象存储接口

```
POST /api/storage/upload-url          # 获取文件上传URL
POST /api/storage/confirm-upload      # 确认上传并设置ACL
GET  /api/storage/objects/*           # 下载对象文件（需ACL权限）
```

### 宠物管理接口

```
POST /api/pets/adopt                  # 领养宠物（学生，AI生成图片）
GET  /api/pets/class/:classId         # 获取班级宠物
POST /api/pets/:petId/feed            # 喂养宠物（增加经验）
GET  /api/pets/my-pets                # 获取所有宠物
```

### 学习资料接口

```
POST   /api/materials/upload          # 上传学习资料（教师）
GET    /api/materials                 # 获取资料列表（支持标签筛选）
GET    /api/materials/teacher/my-materials  # 获取教师的资料
GET    /api/materials/:id             # 获取资料详情
DELETE /api/materials/:id             # 删除资料（教师）
```

### 任务管理接口

```
POST /api/tasks/publish                # 发布任务（教师）
GET  /api/tasks/class/:classId         # 获取班级任务
GET  /api/tasks/:id                    # 获取任务详情（权限校验）
POST /api/tasks/:id/submit             # 提交任务（学生，自动获得积分）
GET  /api/tasks/:id/submissions        # 查看任务提交（教师）
GET  /api/tasks/:id/my-submission      # 查看自己的提交（学生）
```

## 开发指南

### 环境变量配置

**重要：** 在生产环境中，必须设置以下环境变量：

```bash
# JWT密钥（生产环境必须设置）
JWT_SECRET=your-super-secret-key-here

# 数据库连接（Replit自动配置）
DATABASE_URL=postgresql://...
```

### 本地开发

1. 启动后端服务器：
```bash
npm run server
```
后端将在 http://0.0.0.0:3001 运行

2. 启动H5前端：
```bash
npm run dev:h5
```
前端将在 http://0.0.0.0:5000 运行

3. 编译微信小程序：
```bash
npm run dev:weapp
```

### 数据库迁移

修改 `shared/schema.ts` 后，运行：
```bash
npm run db:push
```

## 后端完成功能 ✅

### 1. 对象存储集成 ✅
- 集成Replit Object Storage（基于Google Cloud Storage）
- 支持文件上传、下载、ACL权限控制
- 上传流程：获取预签名URL → 客户端上传 → 确认并设置ACL

### 2. AI图片生成集成 ✅
- 集成Replit AI Integrations (OpenAI)
- 宠物领养时自动生成个性化宠物图片
- 使用gpt-image-1模型生成卡通风格宠物
- 图片自动上传到对象存储并设为公开

### 3. 宠物管理系统 ✅
- 学生在每个班级领养一只虚拟宠物
- AI生成个性化宠物图片
- 宠物经验值和等级系统（每100经验升1级）
- 使用积分喂养宠物成长

### 4. 任务管理系统 ✅
- 教师向班级发布任务（标题、描述、积分、截止日期）
- 学生提交任务作业
- 提交任务自动获得积分
- 积分自动累计到user_points表
- 完整的权限验证（教师只能管理自己的班级任务，学生只能查看和提交自己班级的任务）

### 5. 学习资料管理 ✅
- 教师上传学习资料（支持文件附件）
- 资料标签分类
- 按标签筛选资料
- 教师可删除自己上传的资料

### 6. 积分系统 ✅
- 学生完成任务自动获得积分
- 每个学生在每个班级有独立的积分累计
- 积分存储在user_points表

## 待开发功能

1. **前端页面开发**
   - 底部导航组件
   - 学习资料管理页面
   - 宠物管理页面（领养、查看、喂养）
   - 任务管理页面（教师发布、学生提交）
   - 设置页面
   - 积分排行榜页面

2. **功能增强**
   - 宠物AI对话功能
   - 任务批改和评分
   - 文件预览功能
   - 消息通知系统

## 安全注意事项

1. **JWT密钥：** 生产环境必须配置强密钥
2. **密码加密：** 使用bcrypt进行密码哈希
3. **角色验证：** API中进行严格的角色权限检查
4. **数据验证：** 前后端都进行输入验证

## 集成服务

### Replit Object Storage
- 用途：文件上传存储（学习资料、任务附件、宠物图片等）
- 配置：已设置PRIVATE_OBJECT_DIR环境变量
- ACL策略：支持public和private两种可见性
- 流程：upload-url获取预签名URL → 客户端PUT上传 → confirm-upload设置ACL

### Replit AI Integrations (OpenAI)
- 用途：AI生成宠物图片、宠物对话建议
- 配置：AI_INTEGRATIONS_OPENAI_BASE_URL, AI_INTEGRATIONS_OPENAI_API_KEY
- 模型：gpt-image-1（图片生成）、gpt-5（文本生成）
- 费用：使用Replit AI积分，无需自己的OpenAI API密钥

## 技术债务和改进建议

1. 添加单元测试和集成测试
2. 添加API请求速率限制
3. 优化前端状态管理
4. 添加错误日志和监控
5. 实现密码重置功能
6. 添加用户头像上传功能
7. 对象存储路由优化（当前使用正则表达式，可能影响性能）
8. 任务截止时间验证（目前未验证任务是否过期）
9. 添加文件类型和大小限制

## 项目维护者

最后更新：2025-10-26
版本：2.0.0 - 后端API完成
