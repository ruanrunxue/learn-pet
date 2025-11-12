/**
 * 后端API服务器入口文件
 * 使用Express框架提供RESTful API
 */
import express from 'express';
import cors from 'cors';
import path from 'path';
import authRoutes from './routes/auth';
import classRoutes from './routes/class';
import storageRoutes from './routes/storage';
import petsRoutes from './routes/pets';
import materialsRoutes from './routes/materials';
import tasksRoutes from './routes/tasks';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : (process.env.NODE_ENV === 'production' ? 5000 : 3001);
const isProduction = process.env.NODE_ENV === 'production';

app.use(cors());
app.use(express.json());

// API路由配置
app.use('/api/auth', authRoutes);
app.use('/api/class', classRoutes);
app.use('/api/storage', storageRoutes);
app.use('/api/pets', petsRoutes);
app.use('/api/materials', materialsRoutes);
app.use('/api/tasks', tasksRoutes);

// 健康检查端点
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'LearnPet API is running' });
});

// 生产环境：提供静态文件和SPA路由支持
if (isProduction) {
  const distPath = path.join(__dirname, '../dist');
  
  // 提供静态文件
  app.use(express.static(distPath));
  
  // SPA路由支持：所有非API请求返回index.html
  app.use((req, res, next) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(distPath, 'index.html'));
    } else {
      next();
    }
  });
} else {
  // 开发环境：根路径返回状态信息
  app.get('/', (req, res) => {
    res.json({
      status: 'ok',
      message: 'LearnPet API is running in development mode',
    });
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`LearnPet API server is running on http://0.0.0.0:${PORT}`);
  console.log(`Environment: ${isProduction ? 'production' : 'development'}`);
});
