/**
 * 认证中间件
 * 验证JWT token并提取用户信息
 */
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'learnpet-secret-key-change-in-production';

// 扩展Express Request类型以包含用户信息
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: number;
        role: string;
      };
    }
  }
}

/**
 * JWT认证中间件
 * 从Authorization header中提取token并验证
 */
export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ error: '未提供认证令牌' });
    }

    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : authHeader;

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; role: string };
    req.user = decoded;
    
    next();
  } catch (error) {
    console.error('认证错误:', error);
    return res.status(401).json({ error: '无效的认证令牌' });
  }
};
