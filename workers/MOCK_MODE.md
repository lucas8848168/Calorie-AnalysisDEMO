# Mock 模式说明

## 🎭 什么是 Mock 模式？

Mock 模式是一个测试功能，当豆包 API 达到调用限制时，使用本地模拟数据代替真实 API 响应，让你可以继续测试前端功能。

## 🚨 何时使用 Mock 模式？

当你看到以下错误时：

```
Error: AI_API_ERROR: 429 - SetLimitExceeded
Your account has reached the set inference limit for the doubao-seed-1-6-vision model
```

这表示你的豆包 API 账户已达到调用限制。

## ⚙️ 如何启用 Mock 模式？

### 方法 1：修改 .dev.vars（推荐）

编辑 `workers/.dev.vars` 文件：

```bash
# 启用 Mock 模式
USE_MOCK=true

# 禁用 Mock 模式（使用真实 API）
USE_MOCK=false
# 或者删除这一行
```

### 方法 2：环境变量

```bash
# 临时启用 Mock 模式
USE_MOCK=true npm run dev
```

## 🔄 重启服务

修改 `.dev.vars` 后，需要重启 Workers 服务：

```bash
# 停止当前服务（Ctrl+C）
# 然后重新启动
cd workers
npm run dev
```

## 📊 Mock 数据内容

Mock 模式会随机返回以下食物之一：

1. **披萨**
   - 热量：285 kcal
   - 蛋白质：12.5g
   - 脂肪：10.8g
   - 碳水：35.2g

2. **汉堡**
   - 热量：540 kcal
   - 蛋白质：25.3g
   - 脂肪：28.5g
   - 碳水：45.8g

3. **沙拉**
   - 热量：180 kcal
   - 蛋白质：18.5g
   - 脂肪：8.2g
   - 碳水：12.5g

## ✅ 验证 Mock 模式

启用 Mock 模式后，上传任意图片都会返回模拟数据。你可以：

1. 测试图片压缩功能
2. 测试本地 MobileNet 检测
3. 测试缓存机制
4. 测试 UI 交互

## 🔧 解决 API 限制

### 临时方案（使用 Mock）
```bash
# 在 workers/.dev.vars 中设置
USE_MOCK=true
```

### 永久方案（调整 API 限制）

1. 访问豆包控制台：https://console.volcengine.com/ark
2. 进入"模型激活"页面
3. 找到 `doubao-seed-1-6-vision` 模型
4. 调整或关闭"安全体验模式"
5. 增加推理限制额度

### 等待重置

如果是每日限制，等待第二天自动重置。

## 📝 注意事项

1. **Mock 模式仅用于测试前端功能**，不会调用真实 API
2. **Mock 数据是固定的**，不会根据图片内容变化
3. **生产环境不要使用 Mock 模式**
4. 测试完成后记得关闭 Mock 模式

## 🎯 测试建议

在 Mock 模式下，你可以专注测试：

- ✅ 图片压缩效果（200-300KB）
- ✅ 本地 MobileNet 检测（Top3 分类）
- ✅ 缓存机制（重复上传）
- ✅ UI 进度条显示
- ✅ 错误处理
- ✅ 警告消息

## 🔍 调试

查看 Workers 日志确认 Mock 模式是否生效：

```bash
# 应该看到这条日志
🎭 使用 Mock 模式（API 限制时的测试模式）
```

## 📚 相关文件

- `workers/src/mockData.ts` - Mock 数据定义
- `workers/src/worker.ts` - Mock 模式逻辑
- `workers/.dev.vars` - 环境变量配置

---

**当 API 限制解除后，记得关闭 Mock 模式！**

```bash
# 在 workers/.dev.vars 中
USE_MOCK=false
# 或删除这一行
```
