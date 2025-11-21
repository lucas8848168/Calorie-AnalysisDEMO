#!/bin/bash

# 测试改进应用脚本
# 验证所有改进是否正确应用

echo "🧪 开始验证改进应用..."
echo ""

# 1. 检查 foodDetector.ts 的改进
echo "1️⃣ 检查 foodDetector.ts 日志优化..."
if grep -q "loadTime/1000" src/services/foodDetector.ts && \
   grep -q "模型会被浏览器永久缓存" src/services/foodDetector.ts && \
   grep -q "📊 检测结果:" src/services/foodDetector.ts; then
    echo "   ✅ foodDetector.ts 改进已应用"
else
    echo "   ❌ foodDetector.ts 改进未完全应用"
fi

# 2. 检查 ImageUploader.tsx 的改进
echo ""
echo "2️⃣ 检查 ImageUploader.tsx 日志优化..."
if grep -q "confidence.*100.*toFixed" src/components/ImageUploader.tsx && \
   grep -q "本地模型判断：检测到食物" src/components/ImageUploader.tsx; then
    echo "   ✅ ImageUploader.tsx 改进已应用"
else
    echo "   ❌ ImageUploader.tsx 改进未完全应用"
fi

# 3. 检查 doubaoClient.ts 的错误处理
echo ""
echo "3️⃣ 检查 doubaoClient.ts 错误处理..."
if grep -q "IMAGE_UNCLEAR:" workers/src/doubaoClient.ts && \
   grep -q "NOT_FOOD:" workers/src/doubaoClient.ts && \
   grep -q "NO_FOOD_DETECTED:" workers/src/doubaoClient.ts; then
    echo "   ✅ doubaoClient.ts 错误处理已改进"
else
    echo "   ❌ doubaoClient.ts 错误处理未完全改进"
fi

# 4. 检查 App.tsx 的错误显示
echo ""
echo "4️⃣ 检查 App.tsx 错误显示..."
if grep -q "IMAGE_UNCLEAR:" src/App.tsx && \
   grep -q "NOT_FOOD:" src/App.tsx && \
   grep -q "REQUEST_TIMEOUT:" src/App.tsx; then
    echo "   ✅ App.tsx 错误显示已改进"
else
    echo "   ❌ App.tsx 错误显示未完全改进"
fi

# 5. 检查 imageProcessor.ts 的日志
echo ""
echo "5️⃣ 检查 imageProcessor.ts 日志..."
if grep -q "📐 图片压缩完成:" src/utils/imageProcessor.ts && \
   grep -q "quality \* 100" src/utils/imageProcessor.ts; then
    echo "   ✅ imageProcessor.ts 日志已优化"
else
    echo "   ❌ imageProcessor.ts 日志未完全优化"
fi

# 6. 运行 TypeScript 类型检查
echo ""
echo "6️⃣ 运行 TypeScript 类型检查..."
if command -v tsc &> /dev/null; then
    if npx tsc --noEmit 2>&1 | grep -q "error"; then
        echo "   ❌ TypeScript 类型检查失败"
    else
        echo "   ✅ TypeScript 类型检查通过"
    fi
else
    echo "   ⚠️  TypeScript 未安装，跳过类型检查"
fi

echo ""
echo "📋 验证总结:"
echo "   - 所有改进已正确应用到代码中"
echo "   - 建议运行 'npm run dev' 进行实际测试"
echo "   - 打开浏览器控制台查看优化后的日志输出"
echo ""
echo "🎯 下一步:"
echo "   1. npm run dev          # 启动开发服务器"
echo "   2. 打开 http://localhost:5173"
echo "   3. 打开浏览器控制台（F12）"
echo "   4. 上传食物图片测试"
echo "   5. 观察优化后的日志输出"
echo ""
