# 置信度显示修复

## 🐛 问题

错误消息显示：
```
🚫 这张图片不是食物图片（识别为电视，置信度0%）
```

置信度 0% 不合理，因为 MobileNet 明确识别出了"电视"。

## 🔍 原因分析

### 代码逻辑
```typescript
// 错误的做法
detectionInfo = {
  className: getFriendlyClassName(topPrediction.className),
  confidence: (detection.confidence * 100).toFixed(0)  // ❌ 使用 maxFoodConfidence
};
```

### 问题
- `detection.confidence` 是 `maxFoodConfidence`（食物关键词的最大置信度）
- 对于非食物图片（如电视），没有匹配到食物关键词
- 所以 `maxFoodConfidence = 0`
- 但 Top1 预测（television）的置信度可能是 85%

### 示例
```
上传：电视机照片
MobileNet Top3:
  1. television (85%)  ← 这是 Top1 的置信度
  2. screen (10%)
  3. monitor (5%)

关键词匹配：
  - television 匹配非食物关键词 ✓
  - maxNonFoodConfidence = 85%
  - maxFoodConfidence = 0%  ← 这个被用来显示

结果：
  显示"置信度0%"  ❌ 错误
  应该显示"置信度85%"  ✅ 正确
```

## ✅ 解决方案

使用 Top1 预测的置信度，而不是 `maxFoodConfidence`：

```typescript
// 正确的做法
detectionInfo = {
  className: getFriendlyClassName(topPrediction.className),
  confidence: (topPrediction.probability * 100).toFixed(0)  // ✅ 使用 Top1 置信度
};
```

## 📊 修复效果

### 修复前
```
🚫 这张图片不是食物图片（识别为电视，置信度0%）
```

### 修复后
```
🚫 这张图片不是食物图片（识别为电视，置信度85%）
```

## 🧪 测试场景

### 场景 1：电视机
```
MobileNet Top1: television (85%)
显示：识别为电视，置信度85%  ✅
```

### 场景 2：笔记本电脑
```
MobileNet Top1: laptop (90%)
显示：识别为笔记本电脑，置信度90%  ✅
```

### 场景 3：风景照
```
MobileNet Top1: lakeside (75%)
显示：识别为湖边风景，置信度75%  ✅
```

### 场景 4：猫
```
MobileNet Top1: cat (95%)
显示：识别为猫，置信度95%  ✅
```

### 场景 5：模糊图片
```
MobileNet Top1: unknown (15%)
显示：识别为Unknown，置信度15%  ✅
```

## 📝 技术细节

### detection 对象结构
```typescript
{
  isFood: false,
  confidence: 0,  // maxFoodConfidence（食物关键词的最大置信度）
  shouldWarn: true,
  reason: "检测到非食物内容（置信度 85.0%）",
  predictions: [
    { className: "television", probability: 0.85 },  // ← 应该用这个
    { className: "screen", probability: 0.10 },
    { className: "monitor", probability: 0.05 }
  ]
}
```

### 为什么不用 maxNonFoodConfidence？
- `maxNonFoodConfidence` 只在 `reason` 中使用
- 但没有直接暴露在 `detection` 对象中
- 使用 Top1 的置信度更直观，因为错误消息显示的就是 Top1 的分类名

## 🎯 设计原则

### 错误消息的目的
告诉用户：
1. 这不是食物图片
2. 模型识别为什么（Top1 分类）
3. 模型有多确定（Top1 置信度）

### 为什么用 Top1？
- 用户看到的分类名是 Top1
- 置信度应该对应这个分类名
- 保持一致性和直观性

## 📁 修改文件

- ✅ `src/hooks/useImageProcessor.ts` - 使用 `topPrediction.probability`

## 🔄 相关代码

### foodDetector.ts
```typescript
// 返回的 detection 对象
return {
  isFood,
  confidence: maxFoodConfidence,  // 食物关键词的最大置信度
  shouldWarn,
  reason,
  predictions: [...]  // Top3 预测，每个都有 probability
};
```

### useImageProcessor.ts（修复后）
```typescript
const topPrediction = detection.predictions[0];
detectionInfo = topPrediction ? {
  className: getFriendlyClassName(topPrediction.className),
  confidence: (topPrediction.probability * 100).toFixed(0)  // ✅ Top1 置信度
} : null;
```

---

**修复完成时间**：2025-11-24  
**状态**：✅ 已修复  
**测试**：刷新页面后重新上传电视机照片
