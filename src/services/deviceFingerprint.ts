import { DeviceFingerprint } from '../types';

/**
 * 生成设备指纹
 * 用于唯一标识用户设备，用于配额管理和用户识别
 */
export function generateDeviceFingerprint(): DeviceFingerprint {
  const userAgent = navigator.userAgent;
  const language = navigator.language;
  const platform = navigator.platform;
  const screenResolution = `${window.screen.width}x${window.screen.height}`;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // 收集更多设备信息
  const colorDepth = window.screen.colorDepth;
  const pixelRatio = window.devicePixelRatio;
  const hardwareConcurrency = navigator.hardwareConcurrency || 0;

  // 组合所有信息生成指纹字符串
  const fingerprintString = [
    userAgent,
    language,
    platform,
    screenResolution,
    timezone,
    colorDepth,
    pixelRatio,
    hardwareConcurrency,
  ].join('|');

  // 生成简单的哈希值
  const hash = simpleHash(fingerprintString);

  return {
    userAgent,
    language,
    platform,
    screenResolution,
    timezone,
    hash,
  };
}

/**
 * 简单的字符串哈希函数
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * 获取或创建设备ID
 * 如果本地存储中已有设备ID，则返回；否则生成新的
 */
export function getOrCreateDeviceId(): string {
  const DEVICE_ID_KEY = 'device_id';
  
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  
  if (!deviceId) {
    const fingerprint = generateDeviceFingerprint();
    deviceId = fingerprint.hash;
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  
  return deviceId;
}

/**
 * 检查是否为管理员设备
 * 管理员列表可以通过环境变量配置
 */
export function isAdminDevice(deviceId: string): boolean {
  // 从环境变量读取管理员设备ID列表
  const adminDevices = import.meta.env.VITE_ADMIN_DEVICES?.split(',') || [];
  
  // 也可以硬编码一些管理员设备ID（开发环境）
  const defaultAdminDevices = ['admin', 'test_admin'];
  
  const allAdminDevices = [...adminDevices, ...defaultAdminDevices];
  
  return allAdminDevices.includes(deviceId);
}

/**
 * 验证管理员密码（可选功能）
 */
export function verifyAdminPassword(password: string): boolean {
  const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123';
  return password === adminPassword;
}
