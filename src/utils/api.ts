/**
 * API工具类
 * 封装所有后端API调用
 */
import Taro from '@tarojs/taro';

const API_BASE_URL = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:3001/api' 
  : '/api';

/**
 * 通用请求方法
 */
async function request<T>(url: string, options: any = {}): Promise<T> {
  const token = Taro.getStorageSync('token');
  
  const response = await Taro.request({
    url: `${API_BASE_URL}${url}`,
    method: options.method || 'GET',
    data: options.data,
    header: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.header,
    },
  });

  if (response.statusCode !== 200 && response.statusCode !== 201) {
    throw new Error((response.data as any)?.error || '请求失败');
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
    return request<{ message: string; user: any }>('/auth/register', {
      method: 'POST',
      data,
    });
  },

  /**
   * 用户登录
   */
  login: (data: { phone: string; password: string; role: string }) => {
    return request<{ message: string; token: string; user: any }>('/auth/login', {
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
    return request<{ message: string; class: any }>('/class/create', {
      method: 'POST',
      data,
    });
  },

  /**
   * 获取教师创建的班级
   */
  getTeacherClasses: () => {
    return request<{ classes: any[] }>('/class/teacher');
  },

  /**
   * 获取可加入的班级（学生）
   */
  getAvailableClasses: () => {
    return request<{ classes: any[] }>('/class/available');
  },

  /**
   * 加入班级（学生）
   */
  joinClass: (classId: number) => {
    return request<{ message: string; membership: any }>('/class/join', {
      method: 'POST',
      data: { classId },
    });
  },

  /**
   * 获取学生已加入的班级
   */
  getStudentClasses: () => {
    return request<{ classes: any[] }>('/class/student');
  },

  /**
   * 获取班级详情
   */
  getClassDetail: (classId: number) => {
    return request<{ class: any; members: any[] }>(`/class/${classId}`);
  },

  /**
   * 从班级删除学生（教师）
   */
  removeStudent: (classId: number, studentId: number) => {
    return request<{ message: string }>(`/class/${classId}/member/${studentId}`, {
      method: 'DELETE',
    });
  },
};
