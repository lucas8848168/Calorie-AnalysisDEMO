# 🚀 GitHub Pages 演示版部署指南

## ⚠️ 重要说明

此版本将 API 密钥直接嵌入前端代码，**仅用于演示**！

**风险**：
- ❌ API 密钥会暴露在前端代码中
- ❌ 任何人都可以查看和使用你的 API 密钥
- ❌ 可能导致 API 配额被滥用

**适用场景**：
- ✅ 快速演示给客户看
- ✅ 临时测试
- ✅ 使用临时 API 密钥

**不适用场景**：
- ❌ 生产环境
- ❌ 长期使用
- ❌ 公开项目

---

## 📋 部署步骤

### 1. 配置 API 密钥

创建 `.env.production` 文件：

```bash
# 演示模式配置
VITE_USE_DIRECT_API=true

# 豆包 API 配置（⚠️ 会暴露在前端）
VITE_DOUBAO_API_KEY=你的豆包API密钥
VITE_DOUBAO_API_ENDPOINT=https://ark.cn-beijing.volces.com/api/v3
```

### 2. 本地测试

```bash
# 安装依赖
npm install

# 构建
npm run build

# 预览
npm run preview
```

访问 http://localhost:4173 测试功能

### 3. 推送到 GitHub

```bash
# 添加 .env.production 到 Git（⚠️ 包含密钥）
git add .env.production

# 提交
git commit -m "feat: 添加演示版配置"

# 推送
git push origin main
```

### 4. 启用 GitHub Pages

1. 访问 https://github.com/lucas8848168/Calorie-AnalysisDEMO
2. **Settings** → **Pages**
3. Source 选择 **"GitHub Actions"**
4. 等待部署完成（2-3 分钟）

### 5. 访问网站

https://lucas8848168.github.io/Calorie-AnalysisDEMO/

---

## 🔐 安全建议

### 使用临时 API 密钥

1. 在豆包控制台创建一个**临时** API 密钥
2. 设置较低的配额限制
3. 演示后立即删除该密钥

### 限制 API 配额

在豆包控制台设置：
- 每日调用次数限制
- 每月费用上限
- IP 白名单（如果支持）

### 演示后清理

演示完成后：
1. 删除 `.env.production` 文件
2. 在豆包控制台删除临时 API 密钥
3. 推送更新到 GitHub

```bash
git rm .env.production
git commit -m "chore: 移除演示配置"
git push origin main
```

---

## 🎯 工作原理

### 正常模式（Cloudflare Pages）

```
浏览器 → Cloudflare Functions → 豆包 API
         (API 密钥在后端)
```

### 演示模式（GitHub Pages）

```
浏览器 → 豆包 API
(API 密钥在前端 ⚠️)
```

---

## 📊 功能对比

| 功能 | GitHub Pages 演示版 | Cloudflare Pages 完整版 |
|------|---------------------|------------------------|
| 部署难度 | ⭐ 简单 | ⭐⭐ 中等 |
| 安全性 | ❌ 低（密钥暴露） | ✅ 高（密钥在后端） |
| 成本 | 免费 | 免费 |
| AI 识别 | ✅ 支持 | ✅ 支持 |
| 适用场景 | 演示 | 生产环境 |

---

## 🐛 常见问题

### Q: API 调用失败？

A: 检查：
1. `.env.production` 文件是否存在
2. `VITE_DOUBAO_API_KEY` 是否正确
3. API 密钥是否有效
4. 是否达到配额限制

### Q: 如何查看 API 密钥是否暴露？

A: 
1. 打开浏览器开发者工具
2. 查看 Network 标签
3. 找到 API 请求
4. 查看 Request Headers 中的 Authorization

### Q: 如何切换回安全模式？

A:
1. 删除 `.env.production` 或设置 `VITE_USE_DIRECT_API=false`
2. 重新构建并部署到 Cloudflare Pages

---

## ✅ 检查清单

部署前：
- [ ] 创建临时 API 密钥
- [ ] 设置 API 配额限制
- [ ] 创建 `.env.production` 文件
- [ ] 本地测试成功

部署后：
- [ ] GitHub Actions 构建成功
- [ ] 网站可以访问
- [ ] AI 识别功能正常
- [ ] 记录演示时间

演示后：
- [ ] 删除 `.env.production`
- [ ] 删除临时 API 密钥
- [ ] 推送清理更新

---

## 📞 需要帮助？

- Email: lucas8848168@gmail.com
- GitHub Issues: https://github.com/lucas8848168/Calorie-AnalysisDEMO/issues

---

**记住：演示后立即删除 API 密钥！** 🔐
