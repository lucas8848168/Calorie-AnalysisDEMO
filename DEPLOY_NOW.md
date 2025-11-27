# 🚀 立即部署 - GitHub Pages 演示版

## ⚡ 快速步骤

### 1. 配置 API 密钥（必需）

编辑 `.env.production` 文件，替换你的 API 密钥：

```bash
VITE_DOUBAO_API_KEY=你的真实API密钥
```

### 2. 推送到 GitHub

```bash
# 添加所有文件
git add .

# 提交
git commit -m "feat: GitHub Pages 演示版配置"

# 推送
git push origin main
```

### 3. 启用 GitHub Pages

1. 访问 https://github.com/lucas8848168/Calorie-AnalysisDEMO/settings/pages
2. Source 选择 **"GitHub Actions"**
3. 保存

### 4. 等待部署（2-3 分钟）

查看进度：https://github.com/lucas8848168/Calorie-AnalysisDEMO/actions

### 5. 访问网站

https://lucas8848168.github.io/Calorie-AnalysisDEMO/

---

## ⚠️ 重要提醒

**演示后立即执行**：

```bash
# 1. 删除包含密钥的文件
git rm .env.production

# 2. 提交
git commit -m "chore: 移除演示配置"

# 3. 推送
git push origin main

# 4. 在豆包控制台删除临时 API 密钥
```

---

## 📋 当前状态

- ✅ 代码已准备就绪
- ✅ 直接 API 调用已配置
- ✅ GitHub Actions 已配置
- ⏳ 等待你配置 API 密钥并推送

---

**现在就可以部署了！** 🎉
