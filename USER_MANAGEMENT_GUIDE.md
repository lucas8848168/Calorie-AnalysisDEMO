# 用户管理功能说明

## 功能概述

本系统已集成用户管理功能，包括：

1. **用户注册/登录系统**
2. **设备指纹识别**
3. **管理员权限管理**
4. **自动登录功能**

## 功能特性

### 1. 用户注册
- 用户名（必填）
- 密码（必填）
- 邮箱（可选）
- 自动生成设备指纹
- 自动检测管理员设备

### 2. 用户登录
- 用户名/密码登录
- 自动登录（基于设备指纹）
- 记住登录状态

### 3. 设备指纹
系统会自动收集以下信息生成唯一设备指纹：
- User Agent
- 语言设置
- 平台信息
- 屏幕分辨率
- 时区
- 颜色深度
- 像素比
- CPU核心数

### 4. 管理员功能
- 管理员拥有无限识别配额
- 通过设备ID或密码验证
- 在用户界面显示管理员标识

## 配置说明

### 环境变量配置

在 `.env` 文件中配置：

```bash
# 管理员设备ID列表（逗号分隔）
VITE_ADMIN_DEVICES=admin,test_admin,your_device_id

# 管理员密码（可选）
VITE_ADMIN_PASSWORD=your_secure_password
```

### 获取设备ID

1. 打开浏览器控制台
2. 输入：`localStorage.getItem('device_id')`
3. 复制返回的设备ID
4. 将其添加到 `VITE_ADMIN_DEVICES` 环境变量中

## 使用指南

### 首次使用

1. 访问应用首页
2. 点击右上角"登录/注册"按钮
3. 选择"注册"标签
4. 填写用户名和密码
5. 点击"注册"按钮

### 登录

1. 点击右上角"登录/注册"按钮
2. 输入用户名和密码
3. 点击"登录"按钮

### 访客模式

- 点击"以访客身份继续"可以不登录直接使用
- 访客模式下数据仅保存在本地浏览器

### 查看个人信息

1. 登录后，点击右上角的用户头像
2. 查看个人资料、统计信息
3. 可以退出登录

## 数据存储

### 本地存储
- 用户信息存储在 `localStorage`
- 密码经过简单哈希处理（生产环境应使用更安全的方法）
- 设备指纹存储在 `localStorage`

### 数据结构

```typescript
// 用户信息
interface User {
  id: string;
  username: string;
  email?: string;
  role: 'user' | 'admin';
  deviceFingerprint: string;
  createdAt: Date;
  lastLoginAt: Date;
  profile?: {
    displayName?: string;
    avatar?: string;
    currentWeight?: number;
    height?: number;
    age?: number;
    gender?: 'male' | 'female';
  };
}
```

## 安全注意事项

⚠️ **重要提示**：

1. 当前实现使用简单的密码哈希，**不适合生产环境**
2. 生产环境应该：
   - 使用后端API进行用户认证
   - 使用 bcrypt 或类似库进行密码加密
   - 实现 JWT 或 Session 管理
   - 添加 HTTPS 强制
   - 实现速率限制防止暴力破解

3. 设备指纹仅用于便利性，不应作为唯一的安全验证手段

## 开发测试

### 测试管理员功能

1. 方法一：使用默认管理员设备ID
   - 在浏览器控制台执行：`localStorage.setItem('device_id', 'admin')`
   - 刷新页面
   - 注册新用户，系统会自动识别为管理员

2. 方法二：配置环境变量
   - 获取当前设备ID
   - 添加到 `.env` 文件的 `VITE_ADMIN_DEVICES`
   - 重启开发服务器

### 清除测试数据

```javascript
// 在浏览器控制台执行
localStorage.clear();
location.reload();
```

## API 接口

### 用户服务 API

```typescript
// 注册
register(info: RegisterInfo): AuthResponse

// 登录
login(credentials: LoginCredentials): AuthResponse

// 登出
logout(): void

// 获取当前用户
getCurrentUser(): User | null

// 检查是否已登录
isLoggedIn(): boolean

// 检查是否为管理员
isCurrentUserAdmin(): boolean

// 更新用户资料
updateUserProfile(updates: Partial<User['profile']>): boolean

// 自动登录
autoLogin(): AuthResponse
```

### 设备指纹 API

```typescript
// 生成设备指纹
generateDeviceFingerprint(): DeviceFingerprint

// 获取或创建设备ID
getOrCreateDeviceId(): string

// 检查是否为管理员设备
isAdminDevice(deviceId: string): boolean

// 验证管理员密码
verifyAdminPassword(password: string): boolean
```

## 后续开发计划

- [ ] 集成配额管理系统（Task 28.2）
- [ ] 实现配额历史记录（Task 28.5）
- [ ] 添加用户资料编辑功能
- [ ] 实现密码重置功能
- [ ] 添加邮箱验证
- [ ] 实现社交登录（Google、微信等）
- [ ] 云端数据同步（可选）

## 故障排除

### 无法登录
1. 检查用户名和密码是否正确
2. 清除浏览器缓存和 localStorage
3. 检查浏览器控制台是否有错误信息

### 管理员权限未生效
1. 确认设备ID已添加到环境变量
2. 重启开发服务器
3. 清除浏览器缓存后重新注册

### 自动登录失败
1. 检查 localStorage 中是否有用户数据
2. 确认设备指纹未改变
3. 尝试手动登录

## 联系支持

如有问题，请联系开发团队或提交 Issue。
