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
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
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

// 健康检查端点（根路径和/api/health都支持）
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'LearnPet API is running' });
});

app.get('/', (req, res) => {
  if (isProduction) {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  } else {
    res.json({ status: 'ok', message: 'LearnPet API is running in development mode' });
  }
});

// 生产环境：提供静态文件（H5前端）
if (isProduction) {
  const distPath = path.join(__dirname, '../dist');
  app.use(express.static(distPath));
  
  // 所有非API路由都返回index.html（支持前端路由）
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(distPath, 'index.html'));
    }
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`LearnPet API server is running on http://0.0.0.0:${PORT}`);
  console.log(`Environment: ${isProduction ? 'production' : 'development'}`);
});
