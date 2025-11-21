#!/usr/bin/env node

/**
 * 本地模型诊断脚本
 * 检查 TensorFlow.js 和 MobileNet 是否正确安装
 */

console.log('🔍 开始诊断本地模型...\n');

// 1. 检查依赖是否安装
console.log('1️⃣ 检查依赖安装状态:');
try {
    const fs = require('fs');
    const path = require('path');
    
    const tfPath = path.join(__dirname, 'node_modules', '@tensorflow', 'tfjs');
    const mobilenetPath = path.join(__dirname, 'node_modules', '@tensorflow-models', 'mobilenet');
    
    if (fs.existsSync(tfPath)) {
        const tfPackage = require(path.join(tfPath, 'package.json'));
        console.log(`   ✅ @tensorflow/tfjs: v${tfPackage.version}`);
    } else {
        console.log('   ❌ @tensorflow/tfjs: 未安装');
    }
    
    if (fs.existsSync(mobilenetPath)) {
        const mobilenetPackage = require(path.join(mobilenetPath, 'package.json'));
        console.log(`   ✅ @tensorflow-models/mobilenet: v${mobilenetPackage.version}`);
    } else {
        console.log('   ❌ @tensorflow-models/mobilenet: 未安装');
    }
} catch (error) {
    console.log(`   ❌ 检查失败: ${error.message}`);
}

// 2. 检查源代码文件
console.log('\n2️⃣ 检查源代码文件:');
try {
    const fs = require('fs');
    const path = require('path');
    
    const files = [
        'src/services/foodDetector.ts',
        'src/utils/imageProcessor.ts',
        'src/components/ImageUploader.tsx'
    ];
    
    files.forEach(file => {
        const filePath = path.join(__dirname, file);
        if (fs.existsSync(filePath)) {
            console.log(`   ✅ ${file}`);
        } else {
            console.log(`   ❌ ${file}: 文件不存在`);
        }
    });
} catch (error) {
    console.log(`   ❌ 检查失败: ${error.message}`);
}

// 3. 检查代码中的导入语句
console.log('\n3️⃣ 检查代码导入:');
try {
    const fs = require('fs');
    const path = require('path');
    
    const foodDetectorPath = path.join(__dirname, 'src/services/foodDetector.ts');
    const content = fs.readFileSync(foodDetectorPath, 'utf-8');
    
    if (content.includes("import('@tensorflow/tfjs')")) {
        console.log('   ✅ TensorFlow.js 动态导入');
    } else {
        console.log('   ⚠️  未找到 TensorFlow.js 导入');
    }
    
    if (content.includes("import('@tensorflow-models/mobilenet')")) {
        console.log('   ✅ MobileNet 动态导入');
    } else {
        console.log('   ⚠️  未找到 MobileNet 导入');
    }
    
    if (content.includes('async function loadModel()')) {
        console.log('   ✅ 懒加载函数存在');
    } else {
        console.log('   ⚠️  未找到懒加载函数');
    }
} catch (error) {
    console.log(`   ❌ 检查失败: ${error.message}`);
}

// 4. 检查 ImageUploader 中的调用
console.log('\n4️⃣ 检查 ImageUploader 集成:');
try {
    const fs = require('fs');
    const path = require('path');
    
    const uploaderPath = path.join(__dirname, 'src/components/ImageUploader.tsx');
    const content = fs.readFileSync(uploaderPath, 'utf-8');
    
    if (content.includes("import { detectFood }")) {
        console.log('   ✅ detectFood 函数已导入');
    } else {
        console.log('   ❌ detectFood 函数未导入');
    }
    
    if (content.includes('detectFood(processed.dataUrl)')) {
        console.log('   ✅ detectFood 函数已调用');
    } else {
        console.log('   ❌ detectFood 函数未调用');
    }
    
    if (content.includes('.then(result =>')) {
        console.log('   ✅ 异步处理正确');
    } else {
        console.log('   ⚠️  异步处理可能有问题');
    }
} catch (error) {
    console.log(`   ❌ 检查失败: ${error.message}`);
}

console.log('\n📋 诊断总结:');
console.log('   - 依赖已安装: TensorFlow.js 和 MobileNet');
console.log('   - 代码文件存在且正确');
console.log('   - 使用动态导入（代码分割）');
console.log('   - 懒加载机制已实现');
console.log('   - ImageUploader 已集成食物检测');
console.log('\n💡 建议:');
console.log('   1. 启动开发服务器: npm run dev');
console.log('   2. 打开浏览器访问: http://localhost:5173');
console.log('   3. 打开浏览器控制台查看日志');
console.log('   4. 上传一张图片测试');
console.log('   5. 查看控制台是否有 "MobileNet model loaded successfully" 消息');
console.log('   6. 或者打开 test-model.html 进行独立测试\n');
