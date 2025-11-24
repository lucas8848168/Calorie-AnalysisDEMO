// 营养成分信息
export interface NutritionInfo {
  protein: number; // 蛋白质（克）
  fat: number; // 脂肪（克）
  carbs: number; // 碳水化合物（克）
  fiber: number; // 膳食纤维（克）
}

// 单个食物项
export interface FoodItem {
  name: string;
  portion?: string; // 份量说明
  ingredients?: string; // 材料成分
  calories: number;
  nutrition: NutritionInfo;
  boundingBox?: BoundingBox; // 边界框信息（多食物识别）
  confidence?: number; // 识别置信度
}

// 分析结果
export interface AnalysisResult {
  id: string; // UUID
  timestamp: number; // Unix时间戳
  imageUrl: string; // Base64或ObjectURL
  thumbnailUrl?: string; // 缩略图URL（用于列表显示）
  foods: FoodItem[];
  totalCalories: number;
  confidence?: string;
  notes?: string; // 健康建议或补充说明
}

// 图片元数据
export interface ImageMetadata {
  originalSize: number;
  compressedSize: number;
  dimensions: {
    width: number;
    height: number;
  };
  format: 'jpeg' | 'png' | 'webp';
}

// 处理后的图片
export interface ProcessedImage {
  dataUrl: string;
  originalSize: number;
  compressedSize: number;
  dimensions: { width: number; height: number };
  format: 'jpeg' | 'png' | 'webp';
}

// API请求
export interface AnalyzeRequest {
  image: string; // Base64编码的图片
  format: string; // 图片格式
  regions?: BoundingBox[]; // 可选的边界框数组，用于多食物识别
}

// API响应
export interface AnalyzeResponse {
  success: boolean;
  data?: {
    foods: Array<{
      name: string;
      portion?: string; // 份量信息
      ingredients?: string; // 成分信息
      calories: number;
      nutrition: {
        protein: number;
        fat: number;
        carbs: number;
        fiber: number;
      };
      boundingBox?: BoundingBox; // 边界框信息（多食物识别）
      confidence?: number; // 识别置信度
    }>;
    totalCalories: number;
    confidence?: string;
    notes?: string; // 健康建议
  };
  error?: {
    code: string;
    message: string;
  };
}

// 错误响应
export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: number;
  };
}

// 组件Props类型
export interface ImageUploaderProps {
  onImageProcessed: (result: AnalysisResult) => void;
  onError: (error: Error) => void;
}

export interface AnalysisDisplayProps {
  result: AnalysisResult;
  onNewAnalysis: () => void;
}

export interface HistoryListProps {
  onSelectRecord: (record: AnalysisResult) => void;
}

export interface LoadingIndicatorProps {
  message?: string;
  progress?: number;
}

// 存储接口（支持同步和异步）
export interface HistoryStorage {
  saveRecord(record: AnalysisResult): void | Promise<void>;
  getRecords(): AnalysisResult[] | Promise<AnalysisResult[]>;
  deleteRecord(timestamp: number): void | Promise<void>;
  clearAll(): void | Promise<void>;
}

// ============================================
// P1 增强功能类型定义
// ============================================

// 边界框 - 用于多食物识别
export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

// 餐次类型
export enum MealType {
  BREAKFAST = 'breakfast',
  LUNCH = 'lunch',
  DINNER = 'dinner',
  SNACK = 'snack',
}

// 餐次记录
export interface MealRecord {
  id: string;
  userId: string;
  mealType: MealType;
  mealTime: Date;
  foods: FoodItem[];
  totalNutrition: NutritionInfo;
  notes?: string;
  photos?: string[];
  createdAt: Date;
  updatedAt: Date;
}

// 目标类型
export enum GoalType {
  WEIGHT_LOSS = 'weight_loss',
  MUSCLE_GAIN = 'muscle_gain',
  MAINTAIN = 'maintain',
  HEALTH = 'health',
}

// 用户目标
export interface UserGoal {
  id: string;
  userId: string;
  type: GoalType;
  startDate: Date;
  targetDate: Date;
  currentWeight?: number;
  targetWeight?: number;
  dailyCalorieGoal: number;
  macroGoals: {
    protein: number;
    fat: number;
    carbs: number;
    fiber: number;
  };
  progress: number;
  status: 'active' | 'completed' | 'paused';
}

// 收藏食物
export interface FavoriteFood {
  id: string;
  userId: string;
  foodItem: FoodItem;
  frequency: number;
  lastUsed: Date;
  tags: string[];
  createdAt: Date;
}

// 饮食模板
export interface MealTemplate {
  id: string;
  userId: string;
  name: string;
  mealType: MealType;
  foods: FoodItem[];
  totalCalories: number;
  totalNutrition: NutritionInfo;
  usageCount: number;
  createdAt: Date;
}

// 提醒设置
export interface ReminderSettings {
  userId: string;
  enabled: boolean;
  mealReminders: {
    breakfast: { enabled: boolean; time: string };
    lunch: { enabled: boolean; time: string };
    dinner: { enabled: boolean; time: string };
  };
  waterReminder: {
    enabled: boolean;
    interval: number;
    startTime: string;
    endTime: string;
  };
  recordReminder: {
    enabled: boolean;
    time: string;
  };
}

// 图表数据点
export interface ChartDataPoint {
  date: Date;
  calories: number;
  meals: MealRecord[];
}

// 宏量营养素
export interface MacroNutrition {
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
}

// ============================================
// P1 组件 Props 类型
// ============================================

// 图片标注组件
export interface ImageAnnotatorProps {
  imageUrl: string;
  onRegionsSelected: (regions: BoundingBox[]) => void;
}

// 餐次管理组件
export interface MealManagerProps {
  date: Date;
  onDateChange: (date: Date) => void;
}

// 快速添加面板
export interface QuickAddPanelProps {
  targetMealType: MealType;
  onFoodAdded: (food: FoodItem) => void;
}

// 卡路里趋势图
export interface CalorieTrendChartProps {
  data: ChartDataPoint[];
  goalLine: number;
  timePeriod: 'day' | 'week' | 'month';
}

// 营养雷达图
export interface NutritionRadarChartProps {
  actual: MacroNutrition;
  target: MacroNutrition;
}

// 餐次分布图
export interface MealDistributionChartProps {
  meals: MealRecord[];
  onSegmentClick: (mealType: MealType) => void;
}

// 目标管理组件
export interface GoalManagerProps {
  onGoalUpdated: (goal: UserGoal) => void;
}

// ============================================
// P1 扩展现有类型
// ============================================

// 扩展 FoodItem 添加边界框支持
export interface FoodItemWithBoundingBox extends FoodItem {
  boundingBox?: BoundingBox;
  confidence?: number;
}

// LocalStorage 扩展结构
export interface LocalStorageSchema {
  // 现有数据
  history: AnalysisResult[];
  
  // P1 新增数据
  meals: MealRecord[];
  goals: UserGoal[];
  favorites: FavoriteFood[];
  templates: MealTemplate[];
  reminders: ReminderSettings;
  userProfile: {
    currentWeight?: number;
    height?: number;
    age?: number;
    gender?: 'male' | 'female';
  };
  
  // P2 配额管理数据
  quota: UserQuota;
  quotaTransactions: QuotaTransaction[];
  
  // 用户管理数据
  currentUser: User | null;
  users: User[];
}

// ============================================
// P2 配额管理类型定义
// ============================================

// 用户配额
export interface UserQuota {
  userId: string;
  baseQuota: number; // 基础配额
  adQuota: number; // 通过广告获得的配额
  totalUsed: number; // 总使用次数
  lastResetDate: Date; // 上次重置日期
  isAdmin: boolean; // 是否管理员
}

// 配额交易记录
export interface QuotaTransaction {
  id: string;
  userId: string;
  type: 'use' | 'earn' | 'reset'; // 使用、获得、重置
  amount: number; // 变化量
  source: 'base' | 'ad' | 'admin'; // 来源
  timestamp: Date;
  notes?: string;
}

// 广告配置
export interface AdConfig {
  provider: string; // 广告提供商
  adUnitId: string; // 广告单元ID
  adType: 'rewarded_video' | 'interstitial'; // 广告类型
  rewardAmount: number; // 奖励配额数量
  duration?: number; // 广告时长（秒）
}

// ============================================
// 用户管理类型定义
// ============================================

// 用户角色
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

// 用户信息
export interface User {
  id: string; // 用户ID
  username: string; // 用户名
  email?: string; // 邮箱（可选）
  role: UserRole; // 角色
  deviceFingerprint: string; // 设备指纹
  createdAt: Date; // 创建时间
  lastLoginAt: Date; // 最后登录时间
  profile?: {
    displayName?: string;
    avatar?: string;
    currentWeight?: number;
    height?: number;
    age?: number;
    gender?: 'male' | 'female';
  };
}

// 登录凭证
export interface LoginCredentials {
  username: string;
  password: string;
}

// 注册信息
export interface RegisterInfo {
  username: string;
  password: string;
  email?: string;
}

// 认证响应
export interface AuthResponse {
  success: boolean;
  user?: User;
  error?: string;
}

// 设备指纹信息
export interface DeviceFingerprint {
  userAgent: string;
  language: string;
  platform: string;
  screenResolution: string;
  timezone: string;
  hash: string; // 指纹哈希值
}
