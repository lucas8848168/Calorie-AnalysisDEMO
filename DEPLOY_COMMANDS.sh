#!/bin/bash

# 食物卡路里分析器 - 自动化部署脚本
# 作者: Lucas
# 日期: 2025-11-25

set -e

echo "🚀 开始自动化部署流程..."
echo ""

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# ==================== 阶段 1: 提交代码到 GitHub ====================
echo -e "${BLUE}📦 阶段 1: 提交代码到 GitHub${NC}"
echo ""

echo "检查 Git 状态..."
git status --short

echo ""
read -p "是否继续提交？(y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo -e "${RED}❌ 部署已取消${NC}"
    exit 1
fi

echo "添加所有更改..."
git add .

echo "提交更改..."
git commit -m "chore: 完成部署准备和安全加固

- 创建专门用于 GitHub 的 README.md
- 添加作者信息和商务合作联系方式
- 保护所有核心代码和内部文档
- 添加 GitHub Issue/PR 模板
- 添加 ISC 许可证
- 配置三种部署方案
- 更新环境变量管理"

echo "推送到 GitHub..."
git push origin main

echo -e "${GREEN}✅ 代码已推送到 GitHub${NC}"
echo ""

# ==================== 阶段 2: 部署 Workers API ====================
echo -e "${BLUE}☁️ 阶段 2: 部署 Cloudflare Workers${NC}"
echo ""

echo -e "${YELLOW}⚠️ 请确保已配置 Workers Secrets:${NC}"
echo "  wrangler secret put DOUBAO_API_KEY"
echo "  wrangler secret put DOUBAO_API_ENDPOINT"
echo ""

read -p "是否已配置 Workers Secrets？(y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo -e "${YELLOW}⏭️ 跳过 Workers 部署${NC}"
    echo -e "${YELLOW}💡 稍后可以手动部署: cd workers && npm run deploy${NC}"
else
    echo "进入 workers 目录..."
    cd workers
    
    echo "部署 Workers..."
    npm run deploy
    
    echo "返回项目根目录..."
    cd ..
    
    echo -e "${GREEN}✅ Workers 部署完成${NC}"
fi

echo ""

# ==================== 阶段 3: 验证部署 ====================
echo -e "${BLUE}🔍 阶段 3: 验证部署${NC}"
echo ""

echo "GitHub Actions 状态:"
echo "  访问: https://github.com/your-username/food-calorie-analyzer/actions"
echo ""

echo "前端部署地址:"
echo "  GitHub Pages: https://your-username.github.io/food-calorie-analyzer/"
echo "  Cloudflare Pages: https://food-calorie-analyzer.pages.dev"
echo ""

echo "后端 API 地址:"
echo "  Workers: https://food-analyzer-api.your-subdomain.workers.dev"
echo ""

echo -e "${GREEN}🎉 部署流程完成！${NC}"
echo ""
echo "下一步:"
echo "  1. 访问 GitHub Actions 查看部署状态"
echo "  2. 访问前端 URL 测试应用"
echo "  3. 测试 API 健康检查: curl <workers-url>/health"
echo ""
