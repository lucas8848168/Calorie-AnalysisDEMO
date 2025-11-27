# 🎯 GitHub Pages 演示版 - 快速部署指南

## ✅ 已完成的配置

项目已配置为 **GitHub Pages 演示版**，可以直接部署！

### 特点
- ✅ 前端直接调用豆包 API
- ✅ 无需 Cloudflare Pages
- ✅ 完整 AI 识别功能
- ⚠️ API 密钥会暴露（仅用于演示）

---

## 🚀 立即部署（3 步）

### 步骤 1：配置 API 密钥

编辑 `.env.production` 文件，替换你的 API 密钥：

```bash
VITE_DOUBAO_API_KEY=你的真实API密钥
```

### 步骤 2：推送到 GitHub

```bash
git push origin main
```

### 步骤 3：启用 GitHub Pages

1. 访问 https://github.com/lucas8848168/Calorie-AnalysisDEMO/settings/pages
2. Source 选择 **"GitHub Actions"**
3. 等待 2-3 分钟

**完成！** 访问 https://lucas8848168.github.io/Calorie-AnalysisDEMO/

---

## ⚠️ 安全提醒

### 演示前
1. 使用**临时** API 密钥
2. 设置 API 配额限制
3. 记录演示时间

### 演示后（立即执行）
```bash
# 删除密钥文件
git rm .env.production
git commit -m "chore: 移除演示配置"
git push origin main

# 在豆包控制台删除临时 API 密钥
```

---

## 📚 详细文档

- [GitHub Pages 演示指南](GITHUB_PAGES_DEMO_GUIDE.md)
- [Cloudflare Pages 完整版](CLOUDFLARE_ONLY_DEPLOYMENT.md)
- [安全报告](SENSITIVE_FILES_REPORT.md)

---

## 🎉 现在就可以部署了！

所有配置已完成，只需：
1. 编辑 `.env.production` 添加你的 API 密钥
2. 推送到 GitHub
3. 启用 GitHub Pages

**祝演示顺利！** 🚀
