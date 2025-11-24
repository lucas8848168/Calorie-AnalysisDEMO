# 图片处理优化指南

## 📋 优化概览

本次优化实现了完整的图片处理流程，包括：压缩、本地检测、缓存、API 调用。

## 🎯 优化目标

- ✅ 图片压缩：二分法质量控制 + EXIF 修正 + 长边 1280px + 200-300KB 目标
- ✅ 格式优先：WebP > JPEG（更高压缩率）
- ✅ 本地检测：MobileNet V2 Top3 分类 + 50+ 食物关键词
- ✅ 智能阈值：食物≥0.25 放行，非食物≥0.6 警告
- ✅ 缓存机制：IndexedDB 缓存识别结果（7天有效期）
- ✅ Hook 封装：`useImageProcessor` 异步处理，UI 不阻塞
- ✅ 进度反馈：4 个阶段进度条（压缩 → 检测 → 缓存 → 分析）

## 📁 新增文件

### 1. `src/services/cacheService.ts`
IndexedDB 缓存服务，用于缓存图片识别结果。

**核心功能：**
- `saveCachedResult()` - 保存分析结果到缓存
- `getCachedResult()` - 从缓存获取分析结果
- `cleanExpiredCache()` - 清理过期缓存（7天）
- `getCacheStats()` - 获取缓存统计信息

**缓存策略：**
- 使用 SHA-256 计算图片 Hash 作为缓存 Key
- 缓存有效期 7 天
- 自动清理过期缓存

### 2. `src/hooks/useImageProcessor.ts`
图片处理 Hook，封装完整的处理流程。

**处理流程：**
```
上传图片
  ↓
步骤 1: 图片压缩（二分法 + WebP）
  ↓
步骤 2: 本地 MobileNet 检测（Top3）
  ↓
步骤 3: 检查缓存（置信度≥0.25）
  ↓
步骤 4: 调用豆包 API 分析
  ↓
返回结果 + 保存缓存
```

**状态管理：**
- `isProcessing` - 是否正在处理
- `stage` - 当前阶段（idle | compressing | detecting | checking-cache | analyzing）
- `progress` - 进度百分比（0-100）
- `error` - 错误信息
- `warning` - 警告信息

### 3. `src/utils/imageProcessor.test.ts`
图片处理优化测试用例。

## 🔧 修改文件

### 1. `src/utils/imageProcessor.ts`
**优化点：**
- ✅ 固定长边 1280px（原来是 1280-1600px 动态）
- ✅ 二分法质量控制（最多 8 次迭代）
- ✅ 目标文件大小 200-300KB（原来是 200-600KB）
- ✅ WebP 格式优先（浏览器支持时）
- ✅ 质量范围 0.60-0.92（原来是 0.65-0.75）

**压缩算法：**
```typescript
// 二分法查找最佳质量
for (let i = 0; i < MAX_ITERATIONS; i++) {
  const quality = (minQuality + maxQuality) / 2;
  const dataUrl = canvas.toDataURL(mimeType, quality);
  const size = estimateSize(dataUrl);
  
  if (size >= 200KB && size <= 300KB) {
    // 找到最佳质量点
    if (接近中值 250KB) break;
  }
  
  // 调整搜索范围
  if (size > 300KB) maxQuality = quality;
  else if (size < 200KB) minQuality = quality;
}
```

### 2. `src/services/foodDetector.ts`
**优化点：**
- ✅ 扩展食物关键词至 50+（原来 30+）
- ✅ 返回 Top3 分类（原来 Top5）
- ✅ 智能阈值判断（食物≥0.25，非食物≥0.6）
- ✅ 返回详细的检测结果（isFood, shouldWarn, reason）

**关键词分类：**
- 通用食物词：food, dish, meal, plate, bowl, cup, tray, platter
- 主食类：pizza, burger, sandwich, bread, rice, noodle, pasta
- 肉类：meat, steak, beef, pork, chicken, fish, seafood
- 蔬菜水果：salad, vegetable, fruit, apple, banana, tomato
- 汤类：soup, stew, broth, chowder
- 甜点：cake, cookie, pie, ice cream, dessert, chocolate
- 饮料：drink, coffee, tea, juice, smoothie, latte
- 餐次：breakfast, lunch, dinner, snack, brunch
- 场景：restaurant, dining, cuisine, cooking, kitchen

**智能判断逻辑：**
```typescript
if (maxFoodConfidence >= 0.25) {
  // 食物置信度足够，放行
  isFood = true;
} else if (maxNonFoodConfidence >= 0.6) {
  // 非食物置信度高，警告
  isFood = false;
  shouldWarn = true;
} else {
  // 置信度不足，交给豆包 API 判断
  isFood = true;
  shouldWarn = false;
}
```

### 3. `src/components/ImageUploader.tsx`
**优化点：**
- ✅ 使用 `useImageProcessor` Hook
- ✅ 快速显示预览（不等待处理完成）
- ✅ 4 阶段进度条（压缩 → 检测 → 缓存 → 分析）
- ✅ 警告消息显示
- ✅ 处理过程中禁用上传

**UI 改进：**
- 进度条显示当前阶段
- 百分比进度显示
- 警告消息（黄色背景）
- 处理中禁用交互

### 4. `src/App.tsx`
**简化点：**
- ✅ 移除 `analyzing` 页面状态（Hook 内部处理）
- ✅ 移除 `analysisInProgressRef`（Hook 内部管理）
- ✅ 简化 `handleImageProcessed`（直接接收结果）
- ✅ 移除 API 调用逻辑（Hook 内部处理）

### 5. `src/types/index.ts`
**修改点：**
- ✅ 更新 `ImageUploaderProps.onImageProcessed` 类型
  - 原来：`(processedImage: ProcessedImage) => void`
  - 现在：`(result: AnalysisResult) => void`

## 📊 性能对比

### 压缩效果
| 指标 | 优化前 | 优化后 | 改进 |
|------|--------|--------|------|
| 目标文件大小 | 200-600KB | 200-300KB | ✅ 减少 50% |
| 长边尺寸 | 1280-1600px | 1280px | ✅ 固定尺寸 |
| 压缩算法 | 固定质量 | 二分法 | ✅ 精确控制 |
| 格式支持 | JPEG | WebP/JPEG | ✅ 更高压缩率 |

### 检测效果
| 指标 | 优化前 | 优化后 | 改进 |
|------|--------|--------|------|
| 关键词数量 | 30+ | 50+ | ✅ 提升 67% |
| 分类数量 | Top5 | Top3 | ✅ 减少计算 |
| 阈值策略 | 无 | 智能阈值 | ✅ 精准过滤 |
| 错误提示 | 通用 | 详细原因 | ✅ 用户友好 |

### 缓存效果
| 指标 | 优化前 | 优化后 | 改进 |
|------|--------|--------|------|
| 缓存机制 | 无 | IndexedDB | ✅ 节省 API 调用 |
| 缓存策略 | 无 | SHA-256 Hash | ✅ 精确匹配 |
| 有效期 | 无 | 7 天 | ✅ 自动清理 |
| 命中率 | 0% | 预计 20-30% | ✅ 减少重复分析 |

### 用户体验
| 指标 | 优化前 | 优化后 | 改进 |
|------|--------|--------|------|
| 进度反馈 | 简单 Spinner | 4 阶段进度条 | ✅ 清晰可见 |
| 预览速度 | 等待处理完成 | 立即显示 | ✅ 秒开预览 |
| 错误提示 | 通用错误 | 详细原因 | ✅ 易于理解 |
| UI 阻塞 | 阻塞 | 异步处理 | ✅ 流畅体验 |

## 🚀 使用方法

### 开发环境测试
```bash
# 启动开发服务器
npm run dev

# 运行测试
npm test

# 运行测试 UI
npm run test:ui
```

### 测试流程
1. 上传食物图片
2. 观察 4 阶段进度条
3. 查看控制台日志（详细的处理信息）
4. 再次上传相同图片（测试缓存命中）

### 控制台日志示例
```
📸 步骤 1/4: 图片压缩...
🎨 使用格式: WEBP
🔍 迭代 1: 质量=76.0%, 大小=350KB
🔍 迭代 2: 质量=68.0%, 大小=280KB
✅ 找到最佳质量点，提前退出
📐 图片压缩完成: 1280x960, 格式=WEBP, 质量=68%, 大小=280KB

🤖 步骤 2/4: 本地 AI 检测...
⚡ 分类完成，耗时: 245ms
📊 本地检测结果: {
  isFood: true,
  shouldWarn: false,
  reason: "检测到食物（置信度 78.5%）",
  foodConfidence: "78.5%",
  nonFoodConfidence: "12.3%",
  top3: ["pizza (78.5%)", "cheese (15.2%)", "food (6.3%)"]
}

💾 步骤 3/4: 检查缓存...
📭 缓存未命中

☁️ 步骤 4/4: 云端 AI 分析...
✅ 分析完成
💾 分析结果已缓存
```

## 🔍 调试技巧

### 查看缓存内容
```javascript
// 在浏览器控制台执行
const request = indexedDB.open('FoodAnalyzerCache', 1);
request.onsuccess = () => {
  const db = request.result;
  const tx = db.transaction('analysisResults', 'readonly');
  const store = tx.objectStore('analysisResults');
  const getAll = store.getAll();
  getAll.onsuccess = () => {
    console.log('缓存内容:', getAll.result);
  };
};
```

### 清空缓存
```javascript
// 在浏览器控制台执行
indexedDB.deleteDatabase('FoodAnalyzerCache');
```

### 测试不同阈值
修改 `src/services/foodDetector.ts` 中的阈值：
```typescript
const FOOD_CONFIDENCE_THRESHOLD = 0.25; // 调整此值
const NON_FOOD_CONFIDENCE_THRESHOLD = 0.6; // 调整此值
```

## 📝 注意事项

1. **首次使用**：MobileNet 模型需要下载（约 16MB），首次加载需要 20-30 秒
2. **浏览器兼容性**：WebP 格式需要现代浏览器支持（Chrome 23+, Firefox 65+, Safari 14+）
3. **缓存大小**：IndexedDB 通常有 50MB+ 的存储空间，足够缓存数百条记录
4. **网络环境**：本地检测不依赖网络，即使离线也能快速预检测

## 🎯 后续优化方向

1. **微信小程序适配**：抽象 adapter 层，适配小程序 API
2. **ONNX Runtime**：替换 TensorFlow.js，减少模型体积
3. **WebWorker**：将图片处理移到 Worker 线程，避免阻塞主线程
4. **渐进式加载**：首屏不加载 MobileNet，按需加载
5. **缓存预热**：预加载常见食物的识别结果
6. **离线模式**：完全离线的食物识别（基于本地数据库）

## 📚 相关文档

- [TensorFlow.js 文档](https://www.tensorflow.org/js)
- [MobileNet 模型](https://github.com/tensorflow/tfjs-models/tree/master/mobilenet)
- [IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
