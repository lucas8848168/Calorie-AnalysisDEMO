import { ImageMetadata, ProcessedImage } from '../types';

// 支持的图片格式
const SUPPORTED_FORMATS = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// 优化的压缩参数：平衡识别率、速度和 token 消耗
const TARGET_MAX_DIMENSION = 1440; // 目标最长边 1280-1600px 的中间值
const TARGET_MIN_SIZE = 200 * 1024; // 200KB
const TARGET_MAX_SIZE = 600 * 1024; // 600KB
const QUALITY_HIGH = 0.75; // 高质量
const QUALITY_LOW = 0.65; // 低质量

/**
 * 验证文件格式
 */
export function validateFileFormat(file: File): boolean {
  if (!file || !file.type) {
    throw new Error('INVALID_FILE_FORMAT');
  }
  
  if (!SUPPORTED_FORMATS.includes(file.type)) {
    throw new Error('INVALID_FILE_FORMAT');
  }
  
  return true;
}

/**
 * 检查文件大小
 */
export function validateFileSize(file: File): boolean {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('FILE_TOO_LARGE');
  }
  return true;
}

/**
 * 检测图片分辨率
 */
export function detectImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({
        width: img.width,
        height: img.height,
      });
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('IMAGE_DECODE_ERROR'));
    };
    
    img.src = url;
  });
}

/**
 * 提取图片元数据
 */
export async function extractImageMetadata(file: File): Promise<ImageMetadata> {
  const dimensions = await detectImageDimensions(file);
  
  // 从MIME类型提取格式
  let format: 'jpeg' | 'png' | 'webp' = 'jpeg';
  if (file.type === 'image/png') format = 'png';
  else if (file.type === 'image/webp') format = 'webp';
  
  return {
    originalSize: file.size,
    compressedSize: file.size,
    dimensions,
    format,
  };
}

/**
 * 压缩图片（优化版：平衡识别率、速度和 token 消耗）
 */
export async function compressImage(
  file: File
): Promise<ProcessedImage> {
  
  // 加载图片并修正EXIF方向
  const img = await loadImage(file);
  const orientedCanvas = await fixImageOrientation(img, file);
  
  // 计算目标尺寸（1280-1600px）
  let newWidth = orientedCanvas.width;
  let newHeight = orientedCanvas.height;
  const maxDimension = Math.max(newWidth, newHeight);
  
  // 智能缩放：根据原始尺寸选择目标尺寸
  let targetDimension = TARGET_MAX_DIMENSION;
  if (maxDimension < 1280) {
    // 小图片不放大，保持原尺寸
    targetDimension = maxDimension;
  } else if (maxDimension < 2000) {
    // 中等图片压缩到 1280px
    targetDimension = 1280;
  } else if (maxDimension < 3000) {
    // 大图片压缩到 1440px
    targetDimension = 1440;
  } else {
    // 超大图片压缩到 1600px
    targetDimension = 1600;
  }
  
  if (maxDimension > targetDimension) {
    const ratio = targetDimension / maxDimension;
    newWidth = Math.floor(newWidth * ratio);
    newHeight = Math.floor(newHeight * ratio);
  }
  
  // 创建最终canvas进行压缩
  const canvas = document.createElement('canvas');
  canvas.width = newWidth;
  canvas.height = newHeight;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('COMPRESSION_FAILED');
  }
  
  // 绘制修正方向后的图片（使用高质量插值）
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(orientedCanvas, 0, 0, newWidth, newHeight);
  
  // 智能质量控制：目标 200KB-600KB
  let quality = QUALITY_HIGH; // 从 0.75 开始
  let dataUrl = canvas.toDataURL('image/jpeg', quality);
  let estimatedSize = Math.floor(dataUrl.length * 0.75);
  
  // 如果文件太大，降低质量
  if (estimatedSize > TARGET_MAX_SIZE) {
    // 二分查找最佳质量
    let minQuality = QUALITY_LOW;
    let maxQuality = QUALITY_HIGH;
    let attempts = 0;
    
    while (attempts < 5 && Math.abs(estimatedSize - TARGET_MAX_SIZE) > 50 * 1024) {
      quality = (minQuality + maxQuality) / 2;
      dataUrl = canvas.toDataURL('image/jpeg', quality);
      estimatedSize = Math.floor(dataUrl.length * 0.75);
      
      if (estimatedSize > TARGET_MAX_SIZE) {
        maxQuality = quality;
      } else {
        minQuality = quality;
      }
      attempts++;
    }
  }
  
  // 如果文件太小且质量还有提升空间，可以略微提高质量
  if (estimatedSize < TARGET_MIN_SIZE && quality < QUALITY_HIGH) {
    quality = Math.min(quality + 0.05, QUALITY_HIGH);
    dataUrl = canvas.toDataURL('image/jpeg', quality);
    estimatedSize = Math.floor(dataUrl.length * 0.75);
  }
  
  console.log(`📐 图片压缩完成: ${newWidth}x${newHeight}, 质量: ${(quality * 100).toFixed(0)}%, 大小: ${(estimatedSize / 1024).toFixed(0)}KB`);
  
  return {
    dataUrl,
    originalSize: file.size,
    compressedSize: estimatedSize,
    dimensions: { width: newWidth, height: newHeight },
    format: 'jpeg',
  };
}

/**
 * 修正图片EXIF方向
 */
async function fixImageOrientation(img: HTMLImageElement, file: File): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('COMPRESSION_FAILED');
  }

  // 读取EXIF方向信息
  let orientation = 1;
  try {
    const arrayBuffer = await file.arrayBuffer();
    const view = new DataView(arrayBuffer);
    
    // 检查JPEG标记
    if (view.getUint16(0, false) === 0xFFD8) {
      const length = view.byteLength;
      let offset = 2;
      
      while (offset < length) {
        if (view.getUint16(offset + 2, false) <= 8) break;
        const marker = view.getUint16(offset, false);
        offset += 2;
        
        if (marker === 0xFFE1) {
          // EXIF标记
          if (view.getUint32(offset += 2, false) !== 0x45786966) break;
          
          const little = view.getUint16(offset += 6, false) === 0x4949;
          offset += view.getUint32(offset + 4, little);
          const tags = view.getUint16(offset, little);
          offset += 2;
          
          for (let i = 0; i < tags; i++) {
            if (view.getUint16(offset + (i * 12), little) === 0x0112) {
              orientation = view.getUint16(offset + (i * 12) + 8, little);
              break;
            }
          }
          break;
        } else if ((marker & 0xFF00) !== 0xFF00) {
          break;
        } else {
          offset += view.getUint16(offset, false);
        }
      }
    }
  } catch (e) {
    // 如果读取EXIF失败，使用默认方向
    console.warn('Failed to read EXIF orientation:', e);
  }

  // 根据方向设置canvas尺寸和变换
  const { width, height } = img;
  
  if (orientation > 4) {
    canvas.width = height;
    canvas.height = width;
  } else {
    canvas.width = width;
    canvas.height = height;
  }

  // 应用变换
  switch (orientation) {
    case 2:
      ctx.transform(-1, 0, 0, 1, width, 0);
      break;
    case 3:
      ctx.transform(-1, 0, 0, -1, width, height);
      break;
    case 4:
      ctx.transform(1, 0, 0, -1, 0, height);
      break;
    case 5:
      ctx.transform(0, 1, 1, 0, 0, 0);
      break;
    case 6:
      ctx.transform(0, 1, -1, 0, height, 0);
      break;
    case 7:
      ctx.transform(0, -1, -1, 0, height, width);
      break;
    case 8:
      ctx.transform(0, -1, 1, 0, 0, width);
      break;
  }

  ctx.drawImage(img, 0, 0);
  return canvas;
}

/**
 * 加载图片为Image对象
 */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('IMAGE_DECODE_ERROR'));
    };
    
    img.src = url;
  });
}

/**
 * 处理图片（验证、检测、压缩）
 */
export async function processImage(file: File): Promise<ProcessedImage> {
  // 验证文件
  validateFileFormat(file);
  validateFileSize(file);
  
  // 检测元数据
  const metadata = await extractImageMetadata(file);
  
  // 判断是否需要压缩
  const maxDim = Math.max(metadata.dimensions.width, metadata.dimensions.height);
  const needsCompression =
    maxDim > 1280 || // 超过 1280px 需要压缩
    file.size > TARGET_MAX_SIZE; // 超过 600KB 需要压缩
  
  if (needsCompression) {
    return await compressImage(file);
  }
  
  // 小图片也需要转换为 JPEG 格式以统一处理
  const img = await loadImage(file);
  const orientedCanvas = await fixImageOrientation(img, file);
  
  const canvas = document.createElement('canvas');
  canvas.width = orientedCanvas.width;
  canvas.height = orientedCanvas.height;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('COMPRESSION_FAILED');
  }
  
  ctx.drawImage(orientedCanvas, 0, 0);
  const dataUrl = canvas.toDataURL('image/jpeg', QUALITY_HIGH);
  const compressedSize = Math.floor(dataUrl.length * 0.75);
  
  return {
    dataUrl,
    originalSize: file.size,
    compressedSize,
    dimensions: metadata.dimensions,
    format: 'jpeg',
  };
}


