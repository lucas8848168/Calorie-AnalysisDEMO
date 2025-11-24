import { User, UserRole, LoginCredentials, RegisterInfo, AuthResponse } from '../types';
import { generateDeviceFingerprint, getOrCreateDeviceId, isAdminDevice } from './deviceFingerprint';

const STORAGE_KEY = 'users';
const CURRENT_USER_KEY = 'current_user';

/**
 * 用户服务
 * 提供用户注册、登录、登出等功能
 */

/**
 * 获取所有用户
 */
function getAllUsers(): User[] {
  try {
    const usersJson = localStorage.getItem(STORAGE_KEY);
    return usersJson ? JSON.parse(usersJson) : [];
  } catch (error) {
    console.error('Failed to load users:', error);
    return [];
  }
}

/**
 * 保存用户列表
 */
function saveUsers(users: User[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  } catch (error) {
    console.error('Failed to save users:', error);
  }
}

/**
 * 获取当前登录用户
 */
export function getCurrentUser(): User | null {
  try {
    const userJson = localStorage.getItem(CURRENT_USER_KEY);
    if (!userJson) return null;
    
    const user = JSON.parse(userJson);
    // 转换日期字符串为Date对象
    user.createdAt = new Date(user.createdAt);
    user.lastLoginAt = new Date(user.lastLoginAt);
    return user;
  } catch (error) {
    console.error('Failed to load current user:', error);
    return null;
  }
}

/**
 * 保存当前用户
 */
function setCurrentUser(user: User | null): void {
  try {
    if (user) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(CURRENT_USER_KEY);
    }
  } catch (error) {
    console.error('Failed to save current user:', error);
  }
}

/**
 * 生成用户ID
 */
function generateUserId(): string {
  return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 简单的密码哈希（生产环境应使用更安全的方法）
 */
function hashPassword(password: string): string {
  // 这里使用简单的哈希，生产环境应使用 bcrypt 或类似库
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

/**
 * 用户注册
 */
export function register(info: RegisterInfo): AuthResponse {
  try {
    const users = getAllUsers();
    
    // 检查用户名是否已存在
    if (users.some(u => u.username === info.username)) {
      return {
        success: false,
        error: '用户名已存在',
      };
    }
    
    // 检查邮箱是否已存在
    if (info.email && users.some(u => u.email === info.email)) {
      return {
        success: false,
        error: '邮箱已被注册',
      };
    }
    
    // 获取设备指纹
    const deviceFingerprint = generateDeviceFingerprint();
    const deviceId = getOrCreateDeviceId();
    
    // 检查是否为管理员设备
    const isAdmin = isAdminDevice(deviceId);
    
    // 创建新用户
    const newUser: User = {
      id: generateUserId(),
      username: info.username,
      email: info.email,
      role: isAdmin ? UserRole.ADMIN : UserRole.USER,
      deviceFingerprint: deviceFingerprint.hash,
      createdAt: new Date(),
      lastLoginAt: new Date(),
    };
    
    // 保存密码哈希（实际应用中应该在后端处理）
    const passwordHash = hashPassword(info.password);
    localStorage.setItem(`pwd_${newUser.id}`, passwordHash);
    
    // 保存用户
    users.push(newUser);
    saveUsers(users);
    setCurrentUser(newUser);
    
    return {
      success: true,
      user: newUser,
    };
  } catch (error) {
    console.error('Registration failed:', error);
    return {
      success: false,
      error: '注册失败，请稍后重试',
    };
  }
}

/**
 * 用户登录
 */
export function login(credentials: LoginCredentials): AuthResponse {
  try {
    const users = getAllUsers();
    
    // 查找用户
    const user = users.find(u => u.username === credentials.username);
    
    if (!user) {
      return {
        success: false,
        error: '用户名或密码错误',
      };
    }
    
    // 验证密码
    const passwordHash = hashPassword(credentials.password);
    const storedHash = localStorage.getItem(`pwd_${user.id}`);
    
    if (passwordHash !== storedHash) {
      return {
        success: false,
        error: '用户名或密码错误',
      };
    }
    
    // 更新最后登录时间
    user.lastLoginAt = new Date();
    saveUsers(users);
    setCurrentUser(user);
    
    return {
      success: true,
      user,
    };
  } catch (error) {
    console.error('Login failed:', error);
    return {
      success: false,
      error: '登录失败，请稍后重试',
    };
  }
}

/**
 * 用户登出
 */
export function logout(): void {
  setCurrentUser(null);
}

/**
 * 检查用户是否已登录
 */
export function isLoggedIn(): boolean {
  return getCurrentUser() !== null;
}

/**
 * 检查当前用户是否为管理员
 */
export function isCurrentUserAdmin(): boolean {
  const user = getCurrentUser();
  return user?.role === UserRole.ADMIN;
}

/**
 * 更新用户资料
 */
export function updateUserProfile(updates: Partial<User['profile']>): boolean {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) return false;
    
    currentUser.profile = {
      ...currentUser.profile,
      ...updates,
    };
    
    // 更新存储中的用户信息
    const users = getAllUsers();
    const index = users.findIndex(u => u.id === currentUser.id);
    if (index !== -1) {
      users[index] = currentUser;
      saveUsers(users);
      setCurrentUser(currentUser);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Failed to update user profile:', error);
    return false;
  }
}

/**
 * 获取用户统计信息
 */
export function getUserStats(userId: string): {
  totalMeals: number;
  totalAnalyses: number;
  daysActive: number;
} {
  // 这里可以从其他服务获取统计数据
  // 暂时返回模拟数据
  return {
    totalMeals: 0,
    totalAnalyses: 0,
    daysActive: 0,
  };
}

/**
 * 自动登录（使用设备指纹）
 * 如果设备上只有一个用户，自动登录
 */
export function autoLogin(): AuthResponse {
  try {
    const currentUser = getCurrentUser();
    if (currentUser) {
      return {
        success: true,
        user: currentUser,
      };
    }
    
    const deviceId = getOrCreateDeviceId();
    const users = getAllUsers();
    
    // 查找匹配设备指纹的用户
    const matchingUsers = users.filter(u => u.deviceFingerprint === deviceId);
    
    if (matchingUsers.length === 1) {
      // 只有一个匹配用户，自动登录
      const user = matchingUsers[0];
      user.lastLoginAt = new Date();
      saveUsers(users);
      setCurrentUser(user);
      
      return {
        success: true,
        user,
      };
    }
    
    return {
      success: false,
      error: '需要手动登录',
    };
  } catch (error) {
    console.error('Auto login failed:', error);
    return {
      success: false,
      error: '自动登录失败',
    };
  }
}
