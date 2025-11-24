import { AnalysisResult } from '../types';
import QRCode from 'qrcode';

/**
 * 分享服务 - 提供社交分享和分享卡片生成功能
 */

/**
 * 生成分享文本
 */
export function generateShareText(result: AnalysisResult): string {
  const foodNames = result.foods.map((f) => f.name).join('、');
  const calories = result.totalCalories;
  
  return `我刚用食物卡路里分析器分析了${foodNames}，总共${calories}千卡！快来试试吧！`;
}

/**
 * 生成分享URL（如果应用有公开URL）
 */
export function generateShareUrl(): string {
  // 如果应用部署到公开URL，返回该URL
  // 否则返回GitHub仓库或项目页面
  return window.location.origin || 'https://github.com/your-repo/food-calorie-analyzer';
}

/**
 * 使用Web Share API分享
 */
export async function shareViaWebAPI(result: AnalysisResult): Promise<boolean> {
  if (!navigator.share) {
    throw new Error('Web Share API not supported');
  }

  try {
    const text = generateShareText(result);
    const url = generateShareUrl();

    await navigator.share({
      title: '食物卡路里分析',
      text: text,
      url: url,
    });

    return true;
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      // 用户取消分享
      return false;
    }
    throw error;
  }
}

/**
 * 复制分享文本到剪贴板
 */
export async function copyShareText(result: AnalysisResult): Promise<void> {
  const text = generateShareText(result);
  const url = generateShareUrl();
  const fullText = `${text}\n${url}`;

  if (navigator.clipboard && navigator.clipboard.writeText) {
    await navigator.clipboard.writeText(fullText);
  } else {
    // 降级方案
    const textArea = document.createElement('textarea');
    textArea.value = fullText;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
  }
}

/**
 * 生成二维码
 */
export async function generateQRCode(url: string): Promise<string> {
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(url, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });
    return qrCodeDataUrl;
  } catch (error) {
    console.error('生成二维码失败:', error);
    throw error;
  }
}

/**
 * 生成分享卡片（Canvas）
 */
export async function generateShareCard(result: AnalysisResult): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    // 设置画布尺寸
    canvas.width = 800;
    canvas.height = 600;

    // 背景渐变
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#4CAF50');
    gradient.addColorStop(1, '#45a049');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 白色卡片背景
    ctx.fillStyle = '#FFFFFF';
    ctx.roundRect(40, 40, canvas.width - 80, canvas.height - 80, 20);
    ctx.fill();

    // 标题
    ctx.fillStyle = '#333333';
    ctx.font = 'bold 36px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('食物卡路里分析', canvas.width / 2, 120);

    // 食物列表
    ctx.font = '24px Arial, sans-serif';
    ctx.fillStyle = '#666666';
    const foodNames = result.foods.map((f) => f.name).join('、');
    const maxWidth = canvas.width - 120;
    
    // 文本换行
    const words = foodNames.split('');
    let line = '';
    let y = 200;
    
    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i];
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width > maxWidth && i > 0) {
        ctx.fillText(line, canvas.width / 2, y);
        line = words[i];
        y += 35;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, canvas.width / 2, y);

    // 卡路里信息
    ctx.font = 'bold 48px Arial, sans-serif';
    ctx.fillStyle = '#4CAF50';
    ctx.fillText(`${result.totalCalories} 千卡`, canvas.width / 2, y + 100);

    // 营养信息
    if (result.foods.length > 0) {
      const nutrition = result.foods[0].nutrition;
      ctx.font = '20px Arial, sans-serif';
      ctx.fillStyle = '#999999';
      const nutritionText = `蛋白质 ${nutrition.protein}g | 脂肪 ${nutrition.fat}g | 碳水 ${nutrition.carbs}g`;
      ctx.fillText(nutritionText, canvas.width / 2, y + 150);
    }

    // 底部文字
    ctx.font = '18px Arial, sans-serif';
    ctx.fillStyle = '#CCCCCC';
    ctx.fillText('扫码体验食物卡路里分析器', canvas.width / 2, canvas.height - 80);

    // 转换为DataURL
    try {
      const dataUrl = canvas.toDataURL('image/png');
      resolve(dataUrl);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * 下载分享卡片
 */
export function downloadShareCard(dataUrl: string, filename: string = 'food-analysis.png'): void {
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * 检查是否支持Web Share API
 */
export function isWebShareSupported(): boolean {
  return typeof navigator.share !== 'undefined';
}

/**
 * 分享到特定平台（通过URL scheme）
 */
export function shareToPlatform(platform: 'wechat' | 'weibo' | 'twitter' | 'facebook', result: AnalysisResult): void {
  const text = encodeURIComponent(generateShareText(result));
  const url = encodeURIComponent(generateShareUrl());

  let shareUrl = '';

  switch (platform) {
    case 'weibo':
      shareUrl = `https://service.weibo.com/share/share.php?title=${text}&url=${url}`;
      break;
    case 'twitter':
      shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
      break;
    case 'facebook':
      shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`;
      break;
    case 'wechat':
      // 微信分享需要通过二维码或SDK
      alert('请使用"生成二维码"功能分享到微信');
      return;
  }

  if (shareUrl) {
    window.open(shareUrl, '_blank', 'width=600,height=400');
  }
}
