# ⚡ 快速开始 - 5 分钟部署指南

## 🎯 目标

5 分钟内将项目部署到 Cloudflare Pages，获得一个完整可用的 AI 食物识别应用。

---

## 📋 前提条件

- ✅ GitHub 账号
- ✅ Cloudflare 账号（免费注册）
- ✅ 豆包 API 密钥（可选，没有则功能受限）

---

## 🚀 部署步骤

### 1️⃣ 推送代码到 GitHub（1 分钟）

在终端执行：

```bash
git push origin main
```

### 2️⃣ 连接 Cloudflare Pages（2 分钟）

1. 访问 https://dash.cloudflare.com/
2. **Workers & Pages** → **Create application** → **Pages**
3. **Connect to Git** → 选择 `lucas8848168/Calorie-AnalysisDEMO`
4. 构建设置：
   - Build command: `npm run build`
   - Build output: `dist`
5. **Save and Deploy**

### 3️⃣ 配置 API 密钥（1 分钟）

1. **Settings** → **Environment variables**
2. 添加变量：
   - `DOUBAO_API_KEY`: 你的 API 密钥
   - `DOUBAO_API_ENDPOINT`: `https://ark.cn-beijing.volces.com/api/v3`
3. **Deployments** → **Retry deployment**

### 4️⃣ 访问网站（1 分钟）

访问分配的 URL（如 `https://your-project.pages.dev`），测试功能！

---

## 🎉 完成！

现在你有了一个完整的 AI 食物识别应用，支持：

- ✅ AI 食物识别
- ✅ 营养分析
- ✅ 健康目标管理
- ✅ 数据可视化
- ✅ PWA 安装

---

## 📚 详细文档

- [完整部署指南](CLOUDFLARE_ONLY_DEPLOYMENT.md)
- [项目说明](README.md)
- [安全报告](SENSITIVE_FILES_REPORT.md)

---

**需要帮助？** lucas8848168@gmail.com
