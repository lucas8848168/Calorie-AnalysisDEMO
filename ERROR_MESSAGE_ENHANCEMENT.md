# 错误消息增强功能

## 🎯 功能说明

在错误消息中显示本地 MobileNet 模型的识别结果和置信度，帮助用户理解为什么图片被拒绝。

## ✨ 新功能

### 1. 分类名称翻译
将英文分类名翻译成中文，更友好易懂。

**示例：**
- `laptop` → `笔记本电脑`
- `lakeside` → `湖边风景`
- `sports car` → `跑车`
- `cellular telephone` → `手机`

### 2. 错误消息增强
在错误消息中包含本地检测信息。

**格式：**
```
🚫 这张图片不是食物图片（识别为XXX，置信度XX%）。请上传包含食物的图片进行分析。
```

## 📊 错误消息对比

### 修改前
```
🚫 这张图片不是食物图片。请上传包含食物的图片进行分析。
```

### 修改后
```
🚫 这张图片不是食物图片（识别为湖边风景，置信度75%）。请上传包含食物的图片进行分析。
```

## 🧪 测试场景

### 场景 1：风景照
```
上传：湖边风景照
本地检测：lakeside (75%)
云端判断：NOT_FOOD
错误消息：🚫 这张图片不是食物图片（识别为湖边风景，置信度75%）。请上传包含食物的图片进行分析。
```

### 场景 2：电子设备
```
上传：笔记本电脑
本地检测：laptop (85%)
云端判断：NOT_FOOD
错误消息：🚫 这张图片不是食物图片（识别为笔记本电脑，置信度85%）。请上传包含食物的图片进行分析。
```

### 场景 3：交通工具
```
上传：汽车
本地检测：sports car (80%)
云端判断：NOT_FOOD
错误消息：🚫 这张图片不是食物图片（识别为跑车，置信度80%）。请上传包含食物的图片进行分析。
```

### 场景 4：动物
```
上传：猫咪
本地检测：cat (90%)
云端判断：NOT_FOOD
错误消息：🚫 这张图片不是食物图片（识别为猫，置信度90%）。请上传包含食物的图片进行分析。
```

### 场景 5：未检测到食物
```
上传：模糊图片
本地检测：无法确定
云端判断：NO_FOOD_DETECTED
错误消息：🔍 未检测到食物。请上传包含清晰食物的图片。
```

## 📝 支持的翻译

### 风景和自然（10+）
- lakeside → 湖边风景
- seashore → 海滨风景
- valley → 山谷
- cliff → 悬崖
- beach → 海滩
- volcano → 火山
- mountain → 山
- coral reef → 珊瑚礁

### 电子设备（15+）
- laptop → 笔记本电脑
- desktop computer → 台式电脑
- monitor → 显示器
- keyboard → 键盘
- mouse → 鼠标
- cellular telephone → 手机
- television → 电视
- projector → 投影仪

### 交通工具（30+）
- car → 汽车
- sports car → 跑车
- convertible → 敞篷车
- limousine → 豪华轿车
- taxi → 出租车
- ambulance → 救护车
- fire engine → 消防车
- truck → 卡车
- bus → 公交车
- bicycle → 自行车
- motorcycle → 摩托车

### 动物（10+）
- dog → 狗
- cat → 猫
- bird → 鸟
- tiger → 老虎
- lion → 狮子
- bear → 熊
- elephant → 大象
- monkey → 猴子

### 家具（10+）
- table → 桌子
- desk → 书桌
- chair → 椅子
- sofa → 沙发
- bed → 床
- wardrobe → 衣柜
- bookcase → 书柜

### 其他（50+）
- book → 书
- bottle → 瓶子
- cup → 杯子
- umbrella → 雨伞
- backpack → 背包
- sunglasses → 太阳镜
- watch → 手表
- ...

**总计：100+ 常见分类翻译**

## 🔧 技术实现

### 1. 翻译函数
```typescript
// src/utils/classNameTranslator.ts
export function getFriendlyClassName(className: string): string {
  const translated = translateClassName(className);
  
  // 如果翻译成功，返回中文
  if (translated !== className) {
    return translated;
  }
  
  // 否则返回格式化的英文
  return formatClassName(className);
}
```

### 2. Hook 中保存检测信息
```typescript
// 保存检测结果供后续使用
const topPrediction = detection.predictions[0];
const detectionInfo = topPrediction ? {
  className: getFriendlyClassName(topPrediction.className),
  confidence: (detection.confidence * 100).toFixed(0)
} : null;
```

### 3. 错误消息中使用
```typescript
if (response.data?.confidence === 'not_food') {
  let errorMessage = '🚫 这张图片不是食物图片';
  if (detectionInfo) {
    errorMessage += `（识别为${detectionInfo.className}，置信度${detectionInfo.confidence}%）`;
  }
  errorMessage += '。请上传包含食物的图片进行分析。';
  // ...
}
```

## 📁 新增文件

1. ✅ `src/utils/classNameTranslator.ts`
   - 分类名称翻译
   - 100+ 常见分类
   - 模糊匹配支持

2. ✅ `ERROR_MESSAGE_ENHANCEMENT.md`
   - 功能说明（本文件）

## 🔄 修改文件

1. ✅ `src/hooks/useImageProcessor.ts`
   - 导入翻译函数
   - 保存检测信息
   - 增强错误消息

## 🎯 用户体验改进

### 修改前
用户不知道为什么图片被拒绝：
```
❌ 这张图片不是食物图片
```

### 修改后
用户清楚地知道原因：
```
✅ 这张图片不是食物图片（识别为湖边风景，置信度75%）
```

**好处：**
- 🎯 **透明**：用户知道为什么被拒绝
- 📊 **数据**：显示具体的识别结果
- 🤖 **信任**：展示 AI 的判断依据
- 💡 **指导**：帮助用户上传正确的图片

## 🔍 未翻译的处理

如果分类名称没有翻译：
- 返回格式化的英文（首字母大写）
- 示例：`golden retriever` → `Golden Retriever`

**未来可以：**
- 添加更多翻译
- 使用在线翻译 API
- 用户贡献翻译

## 📚 扩展翻译

如需添加新的翻译，编辑 `src/utils/classNameTranslator.ts`：

```typescript
const TRANSLATIONS: Record<string, string> = {
  // 添加新的翻译
  'new_class': '新分类',
  // ...
};
```

## 🧪 测试建议

1. **上传风景照**：验证翻译和错误消息
2. **上传电子设备**：验证不同分类的翻译
3. **上传交通工具**：验证置信度显示
4. **上传动物**：验证完整流程
5. **上传模糊图片**：验证无检测信息的情况

---

**功能完成时间**：2025-11-24  
**状态**：✅ 已实现  
**翻译数量**：100+ 常见分类
