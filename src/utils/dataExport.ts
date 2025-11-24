import { AnalysisResult, MealRecord } from '../types';

/**
 * 导出历史记录为 CSV 格式
 */
export function exportHistoryToCSV(records: AnalysisResult[]): void {
  if (records.length === 0) {
    alert('没有数据可导出');
    return;
  }

  // CSV 表头
  const headers = [
    '日期时间',
    '食物名称',
    '卡路里(kcal)',
    '蛋白质(g)',
    '脂肪(g)',
    '碳水化合物(g)',
    '膳食纤维(g)',
  ];

  // 构建 CSV 内容
  const rows = records.flatMap((record) => {
    const date = new Date(record.timestamp).toLocaleString('zh-CN');
    
    return record.foods.map((food) => [
      date,
      food.name,
      food.calories,
      food.nutrition.protein,
      food.nutrition.fat,
      food.nutrition.carbs,
      food.nutrition.fiber,
    ]);
  });

  // 组合表头和数据
  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.join(',')),
  ].join('\n');

  // 添加 BOM 以支持中文
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  
  downloadFile(blob, `食物分析历史_${getDateString()}.csv`);
}

/**
 * 导出历史记录为 JSON 格式
 */
export function exportHistoryToJSON(records: AnalysisResult[]): void {
  if (records.length === 0) {
    alert('没有数据可导出');
    return;
  }

  const jsonContent = JSON.stringify(records, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  
  downloadFile(blob, `食物分析历史_${getDateString()}.json`);
}

/**
 * 导出餐次记录为 CSV 格式
 */
export function exportMealsToCSV(meals: MealRecord[]): void {
  if (meals.length === 0) {
    alert('没有数据可导出');
    return;
  }

  // CSV 表头
  const headers = [
    '日期',
    '餐次类型',
    '食物名称',
    '卡路里(kcal)',
    '蛋白质(g)',
    '脂肪(g)',
    '碳水化合物(g)',
    '膳食纤维(g)',
    '备注',
  ];

  // 构建 CSV 内容
  const rows = meals.flatMap((meal) => {
    const date = new Date(meal.mealTime).toLocaleString('zh-CN');
    const mealTypeMap: Record<string, string> = {
      breakfast: '早餐',
      lunch: '午餐',
      dinner: '晚餐',
      snack: '加餐',
    };
    const mealType = mealTypeMap[meal.mealType] || meal.mealType;
    
    return meal.foods.map((food) => [
      date,
      mealType,
      food.name,
      food.calories,
      food.nutrition.protein,
      food.nutrition.fat,
      food.nutrition.carbs,
      food.nutrition.fiber,
      meal.notes || '',
    ]);
  });

  // 组合表头和数据
  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map(escapeCSV).join(',')),
  ].join('\n');

  // 添加 BOM 以支持中文
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  
  downloadFile(blob, `餐次记录_${getDateString()}.csv`);
}

/**
 * 导出图表为图片
 */
export function exportChartAsImage(chartElement: HTMLElement, _filename: string): void {
  // 使用 html2canvas 或类似库将图表转换为图片
  // 这里提供一个简化的实现
  
  // 创建一个 canvas
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    alert('浏览器不支持导出图片');
    return;
  }

  // 获取元素尺寸
  const rect = chartElement.getBoundingClientRect();
  canvas.width = rect.width * 2; // 2x for better quality
  canvas.height = rect.height * 2;
  
  ctx.scale(2, 2);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, rect.width, rect.height);

  // 注意：这是一个简化实现
  // 实际项目中应该使用 html2canvas 或 dom-to-image 库
  alert('图表导出功能需要安装 html2canvas 库。\n请在项目中运行: npm install html2canvas');
  
  // 示例代码（需要安装 html2canvas）:
  // import html2canvas from 'html2canvas';
  // html2canvas(chartElement).then((canvas) => {
  //   canvas.toBlob((blob) => {
  //     if (blob) {
  //       downloadFile(blob, filename);
  //     }
  //   });
  // });
}

/**
 * 生成营养报告 PDF
 */
export function exportNutritionReportPDF(data: {
  period: string;
  totalMeals: number;
  avgCalories: number;
  totalCalories: number;
  nutrition: {
    protein: number;
    fat: number;
    carbs: number;
    fiber: number;
  };
}): void {
  // 生成简单的 HTML 报告
  const reportHTML = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>营养分析报告</title>
  <style>
    body {
      font-family: 'Microsoft YaHei', Arial, sans-serif;
      max-width: 800px;
      margin: 40px auto;
      padding: 20px;
      line-height: 1.6;
    }
    h1 {
      color: #4CAF50;
      border-bottom: 3px solid #4CAF50;
      padding-bottom: 10px;
    }
    .section {
      margin: 30px 0;
      padding: 20px;
      background: #f5f5f5;
      border-radius: 8px;
    }
    .metric {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #ddd;
    }
    .metric:last-child {
      border-bottom: none;
    }
    .label {
      font-weight: bold;
      color: #333;
    }
    .value {
      color: #4CAF50;
      font-size: 1.2em;
    }
    .footer {
      margin-top: 40px;
      text-align: center;
      color: #999;
      font-size: 0.9em;
    }
  </style>
</head>
<body>
  <h1>🍽️ 营养分析报告</h1>
  
  <div class="section">
    <h2>📊 统计周期</h2>
    <p>${data.period}</p>
  </div>

  <div class="section">
    <h2>📈 总体数据</h2>
    <div class="metric">
      <span class="label">总餐次数：</span>
      <span class="value">${data.totalMeals} 次</span>
    </div>
    <div class="metric">
      <span class="label">总卡路里：</span>
      <span class="value">${data.totalCalories.toFixed(0)} kcal</span>
    </div>
    <div class="metric">
      <span class="label">平均每日卡路里：</span>
      <span class="value">${data.avgCalories.toFixed(0)} kcal</span>
    </div>
  </div>

  <div class="section">
    <h2>🥗 营养成分</h2>
    <div class="metric">
      <span class="label">蛋白质：</span>
      <span class="value">${data.nutrition.protein.toFixed(1)} g</span>
    </div>
    <div class="metric">
      <span class="label">脂肪：</span>
      <span class="value">${data.nutrition.fat.toFixed(1)} g</span>
    </div>
    <div class="metric">
      <span class="label">碳水化合物：</span>
      <span class="value">${data.nutrition.carbs.toFixed(1)} g</span>
    </div>
    <div class="metric">
      <span class="label">膳食纤维：</span>
      <span class="value">${data.nutrition.fiber.toFixed(1)} g</span>
    </div>
  </div>

  <div class="footer">
    <p>生成时间：${new Date().toLocaleString('zh-CN')}</p>
    <p>© 2025 食物卡路里分析器 | 数据仅供参考</p>
  </div>
</body>
</html>
  `;

  // 创建 Blob 并下载
  const blob = new Blob([reportHTML], { type: 'text/html' });
  downloadFile(blob, `营养报告_${getDateString()}.html`);
  
  alert('报告已导出为 HTML 格式。\n您可以在浏览器中打开后使用"打印"功能保存为 PDF。');
}

/**
 * 下载文件
 */
function downloadFile(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 获取当前日期字符串
 */
function getDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

/**
 * 转义 CSV 字段
 */
function escapeCSV(value: any): string {
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}
