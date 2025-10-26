/**
 * 后端API服务器入口文件
 * 使用Express框架提供RESTful API
 */
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import classRoutes from './routes/class';
import storageRoutes from './routes/storage';
import petsRoutes from './routes/pets';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// 路由配置
app.use('/api/auth', authRoutes);
app.use('/api/class', classRoutes);
app.use('/api/storage', storageRoutes);
app.use('/api/pets', petsRoutes);

// 健康检查端点
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'LearnPet API is running' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`LearnPet API server is running on http://0.0.0.0:${PORT}`);
});
