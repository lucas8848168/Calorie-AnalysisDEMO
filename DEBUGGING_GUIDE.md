# 调试指南 - 上传电视机照片无提示问题

## 🐛 问题现象

上传电视机照片后：
- Workers 返回 400 Bad Request
- Workers 日志显示：`NOT_FOOD: 这张图片不是食物图片`
- 前端无任何提示
- 页面停留在"云端 AI 分析中... 70%"

## 🔍 调试步骤

### 步骤 1：打开浏览器控制台
按 `F12` 或 `Cmd+Option+I` (Mac)

### 步骤 2：切换到 Console 标签
查看是否有错误日志

### 步骤 3：查看 Network 标签
1. 切换到 Network 标签
2. 上传电视机照片
3. 找到 `/api/analyze` 请求
4. 查看响应内容

**预期响应：**
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOOD",
    "message": "这张图片不是食物图片。请上传包含食物的图片进行分析。",
    "timestamp": 1732454400000
  }
}
```

### 步骤 4：检查控制台日志
应该看到以下日志：

```
📸 步骤 1/4: 图片压缩...
✅ 压缩完成: 1280x960, 280KB

🤖 步骤 2/4: 本地 AI 检测...
⚡ 分类完成，耗时: 245ms
📊 本地检测结果: ...
⚠️ 非食物警告: ...

💾 步骤 3/4: 检查缓存...
📭 缓存未命中

☁️ 步骤 4/4: 云端 AI 分析...
🚫 API 错误: { code: 'NOT_FOOD', message: '...', status: 400 }
❌ 图片处理失败: Error: NOT_FOOD: ...
ImageUploader 错误: Error: NOT_FOOD: ...
```

## 🔧 可能的问题

### 问题 1：错误未被捕获
**症状**：控制台没有任何错误日志

**原因**：`try-catch` 块没有正确捕获错误

**解决**：检查 `ImageUploader.tsx` 的 `handleFileSelect` 函数

### 问题 2：错误被静默忽略
**症状**：有错误日志，但页面无反应

**原因**：`onError` 回调没有被调用

**解决**：检查 `ImageUploader.tsx` 是否正确调用 `onError`

### 问题 3：页面状态未更新
**症状**：错误被捕获，但页面停留在分析中

**原因**：`App.tsx` 的 `handleError` 没有切换到错误页面

**解决**：检查 `handleError` 是否设置 `setCurrentPage('error')`

## 🧪 手动测试

### 测试 1：在控制台手动触发错误
```javascript
// 在浏览器控制台执行
const testError = new Error('NOT_FOOD: 测试错误消息（识别为电视，置信度85%）');
console.error('测试错误:', testError);
```

### 测试 2：检查 App 状态
```javascript
// 在浏览器控制台执行
// 注意：这需要 React DevTools
// 查找 App 组件的状态
```

### 测试 3：模拟 API 错误
```javascript
// 在浏览器控制台执行
fetch('http://localhost:8787/api/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ image: 'test', format: 'jpeg' })
})
.then(r => r.json())
.then(data => console.log('API 响应:', data))
.catch(err => console.error('API 错误:', err));
```

## 📝 添加调试日志

### 在 ImageUploader.tsx 添加日志
```typescript
const handleFileSelect = async (event) => {
  console.log('🎯 handleFileSelect 开始');
  const file = event.target.files?.[0];
  if (!file) {
    console.log('❌ 没有选择文件');
    return;
  }

  try {
    console.log('📤 开始处理文件:', file.name);
    const result = await processImageFile(file);
    console.log('✅ 处理完成，结果:', result);
    
    if (result) {
      console.log('📊 调用 onImageProcessed');
      onImageProcessed(result as any);
    }
  } catch (error: any) {
    console.error('❌ 捕获错误:', error);
    console.error('错误消息:', error.message);
    console.error('错误堆栈:', error.stack);
    onError(new Error(error.message || '图片处理失败'));
    setPreview(null);
  }
};
```

### 在 App.tsx 添加日志
```typescript
const handleError = (err: Error) => {
  console.log('🚨 handleError 被调用');
  console.log('错误消息:', err.message);
  setError(err.message);
  setCurrentPage('error');
  console.log('✅ 已切换到错误页面');
};
```

## 🎯 快速修复

如果问题仍然存在，尝试以下快速修复：

### 修复 1：强制刷新页面
```bash
Ctrl+Shift+R (Windows/Linux)
Cmd+Shift+R (Mac)
```

### 修复 2：清除浏览器缓存
```javascript
// 在浏览器控制台执行
localStorage.clear();
sessionStorage.clear();
location.reload();
```

### 修复 3：重启服务
```bash
# 停止前端服务 (Ctrl+C)
# 停止 Workers 服务 (Ctrl+C)

# 重新启动
npm run dev
cd workers && npm run dev
```

## 📊 预期行为

### 正确的流程
```
1. 用户上传电视机照片
2. 显示预览
3. 显示警告：⚠️ 本地模型检测：这可能不是食物图片
4. 进度条：10% → 30% → 50% → 70%
5. API 返回 400 错误
6. 捕获错误
7. 调用 onError
8. 切换到错误页面
9. 显示：
   ⚠️
   分析失败
   🚫 这张图片不是食物图片（识别为电视，置信度85%）
   [重新上传]
```

## 🔍 检查清单

- [ ] 浏览器控制台是否打开？
- [ ] Console 标签是否有错误日志？
- [ ] Network 标签是否显示 400 响应？
- [ ] 响应内容是否包含 NOT_FOOD 错误？
- [ ] 前端服务是否正常运行？
- [ ] Workers 服务是否正常运行？
- [ ] 是否清除了浏览器缓存？
- [ ] 是否强制刷新了页面？

## 💡 提示

如果以上步骤都无法解决问题，请：

1. 截图浏览器控制台的 Console 标签
2. 截图浏览器控制台的 Network 标签（/api/analyze 请求）
3. 复制完整的错误日志
4. 提供给开发者进行进一步调试

---

**创建时间**：2025-11-24  
**用途**：调试上传非食物图片无提示问题
