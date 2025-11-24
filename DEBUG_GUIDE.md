# 🔧 STORAGE_ERROR 调试指南

## 问题描述
几乎所有图片上传后都显示 `STORAGE_ERROR`

## 可能的原因

### 1. 后端 API 返回格式问题
- API 返回的 `foods` 不是数组
- API 返回的食物项缺少必需字段（name, calories, nutrition）
- API 返回 `success: false` 但前端没有正确处理

### 2. LocalStorage 损坏
- 历史记录中有无效数据
- LocalStorage 配额已满
- 浏览器隐私模式限制

### 3. 数据解析失败
- `parseAnalysisResponse` 返回 null
- 食物数据验证失败

## 调试步骤

### 步骤 1: 清空历史记录
```javascript
// 在浏览器控制台运行
localStorage.removeItem('food_analyzer_history');
console.log('✅ 历史记录已清空');
```

### 步骤 2: 检查 API 响应
1. 打开浏览器开发者工具（F12）
2. 切换到 **Network** 标签
3. 上传一张食物图片
4. 找到 `/api/analyze` 请求
5. 查看 **Response** 标签的内容

**正常响应示例：**
```json
{
  "success": true,
  "data": {
    "foods": [
      {
        "name": "米饭",
        "calories": 200,
        "nutrition": {
          "protein": 4,
          "fat": 0.5,
          "carbs": 44,
          "fiber": 0.5
        }
      }
    ],
    "totalCalories": 200,
    "confidence": "high"
  }
}
```

**错误响应示例：**
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOOD",
    "message": "这张图片不是食物",
    "timestamp": 1234567890
  }
}
```

### 步骤 3: 查看控制台日志
在 **Console** 标签查找以下日志：

- `📥 API 响应:` - 查看完整的 API 响应
- `🔄 开始解析响应...` - 确认开始解析
- `✅ 解析结果:` - 查看解析后的结果
- `✅ 记录已保存到历史` - 确认保存成功
- `❌ 分析失败:` - 查看错误详情

### 步骤 4: 使用诊断工具

#### 方法 A: 使用 HTML 诊断工具
打开 `debug-storage-issue.html` 文件：
1. 检查 LocalStorage 状态
2. 查看历史记录
3. 测试保存功能

#### 方法 B: 运行快速诊断脚本
在浏览器控制台粘贴并运行 `quick-debug.js` 的内容

### 步骤 5: 测试 API 解析
1. 打开 `debug-storage-issue.html`
2. 复制 Network 标签中的 API 响应 JSON
3. 粘贴到"测试 API 响应解析"区域
4. 点击"测试解析"按钮
5. 查看解析结果

## 常见问题和解决方案

### 问题 1: API 返回 `success: false`
**症状：** 所有图片都提示错误
**原因：** 后端 API 配置问题或 API 密钥无效
**解决：**
```bash
# 检查 Workers 环境变量
cd workers
wrangler secret list

# 重新设置 API 密钥
wrangler secret put DOUBAO_API_KEY
```

### 问题 2: foods 不是数组
**症状：** 控制台显示 "foods must be an array"
**原因：** 后端返回格式错误
**解决：** 检查 `workers/src/doubaoClient.ts` 的返回格式

### 问题 3: LocalStorage 配额已满
**症状：** 错误信息包含 "QuotaExceededError"
**解决：**
```javascript
// 清空历史记录
localStorage.removeItem('food_analyzer_history');

// 或者在应用中点击"历史" -> "清空所有记录"
```

### 问题 4: 图片太大导致超时
**症状：** 错误信息包含 "REQUEST_TIMEOUT"
**解决：** 上传更小的图片（< 2MB）或单个食物的图片

## 修复验证

修复后，测试以下场景：

### ✅ 测试 1: 上传有效食物图片
- 应该成功分析并保存到历史
- 控制台应该显示 `✅ 记录已保存到历史`

### ✅ 测试 2: 上传非食物图片（如小狗）
- 应该显示 "这张图片不是食物图片"
- **不应该** 显示 STORAGE_ERROR
- **不应该** 保存到历史

### ✅ 测试 3: 上传模糊图片
- 应该显示 "图片不够清晰"
- **不应该** 显示 STORAGE_ERROR

### ✅ 测试 4: 查看历史记录
- 点击"历史"标签
- 应该只看到有效的食物分析记录
- 每条记录都应该有图片和食物列表

## 需要提供的信息

如果问题仍然存在，请提供：

1. **API 响应** (从 Network 标签复制)
2. **控制台日志** (包含所有 emoji 标记的日志)
3. **错误截图**
4. **浏览器和版本** (如 Chrome 120)
5. **是否使用隐私模式**

## 临时解决方案

如果需要立即使用应用，可以：

1. 清空历史记录：
```javascript
localStorage.clear();
```

2. 禁用历史保存功能（临时）：
在 `src/App.tsx` 中注释掉保存代码：
```typescript
// historyStorage.saveRecord(result);
```

3. 使用无痕模式测试（排除缓存问题）

## 联系支持

如果以上步骤都无法解决问题，请：
1. 运行 `debug-storage-issue.html` 并截图所有结果
2. 导出浏览器控制台日志
3. 提供 API 响应示例
