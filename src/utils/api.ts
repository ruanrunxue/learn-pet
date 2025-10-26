/**
 * API工具类
 * 封装所有后端API调用
 */
import Taro from '@tarojs/taro';

const API_BASE_URL = '/api';

/**
 * 自定义API错误类
 * 包含HTTP状态码信息
 */
export class ApiError extends Error {
  statusCode: number;
  
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'ApiError';
  }
}

/**
 * 通用请求方法
 * 导出供其他页面使用
 */
export async function request<T>(options: {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: any;
  header?: any;
}): Promise<T> {
  const token = Taro.getStorageSync('token');
  
  const response = await Taro.request({
    url: `${API_BASE_URL}${options.url}`,
    method: options.method || 'GET',
    data: options.data,
    header: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.header,
    },
  });

  if (response.statusCode !== 200 && response.statusCode !== 201) {
    throw new ApiError(
      (response.data as any)?.error || '请求失败',
      response.statusCode
    );
  }

  return response.data as T;
}

/**
 * 认证API
 */
export const authApi = {
  /**
   * 用户注册
   */
  register: (data: { phone: string; name: string; school: string; password: string; role: string }) => {
    return request<{ message: string; user: any }>({
      url: '/auth/register',
      method: 'POST',
      data,
    });
  },

  /**
   * 用户登录
   */
  login: (data: { phone: string; password: string; role: string }) => {
    return request<{ message: string; token: string; user: any }>({
      url: '/auth/login',
      method: 'POST',
      data,
    });
  },
};

/**
 * 班级API
 */
export const classApi = {
  /**
   * 创建班级（教师）
   */
  createClass: (data: { year: string; className: string; subject: string }) => {
    return request<{ message: string; class: any }>({
      url: '/class/create',
      method: 'POST',
      data,
    });
  },

  /**
   * 获取教师创建的班级
   */
  getTeacherClasses: () => {
    return request<{ classes: any[] }>({ url: '/class/teacher' });
  },

  /**
   * 获取可加入的班级（学生）
   */
  getAvailableClasses: () => {
    return request<{ classes: any[] }>({ url: '/class/available' });
  },

  /**
   * 加入班级（学生）
   */
  joinClass: (classId: number) => {
    return request<{ message: string; membership: any }>({
      url: '/class/join',
      method: 'POST',
      data: { classId },
    });
  },

  /**
   * 获取学生已加入的班级
   */
  getStudentClasses: () => {
    return request<{ classes: any[] }>({ url: '/class/student' });
  },

  /**
   * 获取班级详情
   */
  getClassDetail: (classId: number) => {
    return request<{ class: any; members: any[] }>({ url: `/class/${classId}` });
  },

  /**
   * 从班级删除学生（教师）
   */
  removeStudent: (classId: number, studentId: number) => {
    return request<{ message: string }>({
      url: `/class/${classId}/member/${studentId}`,
      method: 'DELETE',
    });
  },
};
