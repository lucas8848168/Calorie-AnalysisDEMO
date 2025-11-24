# 豆包模型更新说明

## 🚀 模型升级

已从 `doubao-seed-1-6-vision-250815` 升级到 **`doubao-seed-1-6-251015`**（推理增强版本）

## ✨ 新模型特性

### 1. 推理增强能力
- 支持 `reasoning_effort` 参数（low/medium/high）
- 更强的逻辑推理和分析能力
- 更准确的食物识别和营养估算

### 2. 更大的输出容量
- `max_completion_tokens: 2000`（原来 1200）
- 支持更详细的健康建议和营养分析

### 3. 优化的请求格式
- 图片在前，文本在后（符合新模型最佳实践）
- 使用 `max_completion_tokens` 替代 `max_tokens`

## 📝 API 变化

### 旧模型（doubao-seed-1-6-vision-250815）
```json
{
  "model": "doubao-seed-1-6-vision-250815",
  "max_tokens": 1200,
  "messages": [
    {
      "role": "user",
      "content": [
        {"type": "text", "text": "..."},
        {"type": "image_url", "image_url": {...}}
      ]
    }
  ]
}
```

### 新模型（doubao-seed-1-6-251015）
```json
{
  "model": "doubao-seed-1-6-251015",
  "max_completion_tokens": 2000,
  "reasoning_effort": "medium",
  "messages": [
    {
      "role": "user",
      "content": [
        {"type": "image_url", "image_url": {...}},
        {"type": "text", "text": "..."}
      ]
    }
  ]
}
```

## 🎯 推理强度说明

### `reasoning_effort` 参数

- **low**：快速推理，适合简单场景
  - 响应时间：~5-10 秒
  - 适用：单一食物识别

- **medium**（当前使用）：平衡推理，适合大多数场景
  - 响应时间：~10-30 秒
  - 适用：多食物识别、营养分析

- **high**：深度推理，适合复杂场景
  - 响应时间：~30-60 秒
  - 适用：复杂菜品、精确营养计算

## 🔧 配置文件

### workers/src/doubaoClient.ts
```typescript
const requestBody = {
  model: 'doubao-seed-1-6-251015', // 新模型
  max_completion_tokens: 2000,
  reasoning_effort: 'medium', // 推理强度
  messages: [
    {
      role: 'user',
      content: [
        {
          type: 'image_url',
          image_url: {
            url: `data:image/jpeg;base64,${base64Data}`,
          },
        },
        {
          type: 'text',
          text: PROMPT_TEMPLATE,
        },
      ],
    },
  ],
  temperature: 0.5,
};
```

### workers/.dev.vars
```bash
DOUBAO_API_KEY=4efae4d9-de12-4ec1-b827-928c0d224d20
DOUBAO_API_ENDPOINT=https://ark.cn-beijing.volces.com/api/v3

# Mock 模式已关闭，使用真实 API
USE_MOCK=false
```

## 📊 性能对比

| 指标 | 旧模型 | 新模型 | 改进 |
|------|--------|--------|------|
| 模型版本 | 250815 | 251015 | 最新 |
| 推理能力 | 标准 | 增强 | ✅ |
| 输出长度 | 1200 tokens | 2000 tokens | +67% |
| 推理控制 | 无 | 3 档可调 | ✅ |
| 识别准确率 | 高 | 更高 | ✅ |

## 🧪 测试建议

### 1. 测试简单场景（reasoning_effort: low）
```typescript
reasoning_effort: 'low'
```
- 单一食物（如：一个苹果）
- 预期响应时间：5-10 秒

### 2. 测试标准场景（reasoning_effort: medium）
```typescript
reasoning_effort: 'medium' // 当前配置
```
- 多种食物（如：一顿午餐）
- 预期响应时间：10-30 秒

### 3. 测试复杂场景（reasoning_effort: high）
```typescript
reasoning_effort: 'high'
```
- 复杂菜品（如：满汉全席）
- 预期响应时间：30-60 秒

## ⚠️ 注意事项

### 1. API 限制
新模型可能有不同的限流策略：
- 每日调用次数限制
- 并发请求限制
- Token 消耗计费

### 2. 响应时间
推理增强模型响应时间更长：
- 前端需要显示友好的等待提示
- 建议设置超时时间：60-120 秒

### 3. 成本考虑
新模型可能消耗更多 tokens：
- 输入：图片 + 提示词
- 输出：最多 2000 tokens
- 建议监控 API 使用量

## 🔄 回滚方案

如果新模型出现问题，可以回滚到旧模型：

```typescript
// workers/src/doubaoClient.ts
const requestBody = {
  model: 'doubao-seed-1-6-vision-250815', // 回滚到旧模型
  max_tokens: 1200,
  messages: [
    {
      role: 'user',
      content: [
        {
          type: 'text',
          text: PROMPT_TEMPLATE,
        },
        {
          type: 'image_url',
          image_url: {
            url: `data:image/jpeg;base64,${base64Data}`,
          },
        },
      ],
    },
  ],
  temperature: 0.5,
};
```

## 📚 相关文档

- [豆包 API 文档](https://www.volcengine.com/docs/82379)
- [MOCK_MODE.md](./MOCK_MODE.md) - Mock 模式说明
- [OPTIMIZATION_GUIDE.md](../OPTIMIZATION_GUIDE.md) - 优化指南

## 🎯 下一步

1. ✅ 模型已更新到 `doubao-seed-1-6-251015`
2. ✅ Mock 模式已关闭
3. ✅ Workers 服务已重启
4. 🧪 **现在可以上传真实食物图片测试**

---

**更新时间**：2025-11-24  
**模型版本**：doubao-seed-1-6-251015  
**推理强度**：medium
