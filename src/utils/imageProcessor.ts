import { ImageMetadata, ProcessedImage } from '../types';

// 支持的图片格式
const SUPPORTED_FORMATS = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// 优化的压缩参数：二分法质量控制
const TARGET_MAX_DIMENSION = 1280; // 目标最长边 1280px
const TARGET_MIN_SIZE = 200 * 1024; // 200KB
const TARGET_MAX_SIZE = 300 * 1024; // 300KB
const QUALITY_HIGH = 0.92; // 高质量起点
const QUALITY_LOW = 0.60; // 低质量下限
const MAX_BINARY_SEARCH_ITERATIONS = 8; // 二分法最大迭代次数

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
 * 压缩图片（优化版：二分法质量控制 + WebP 优先 + 200-300KB 目标）
 */
export async function compressImage(
  file: File
): Promise<ProcessedImage> {
  
  // 加载图片并修正EXIF方向
  const img = await loadImage(file);
  const orientedCanvas = await fixImageOrientation(img, file);
  
  // 计算目标尺寸（固定 1280px 长边）
  let newWidth = orientedCanvas.width;
  let newHeight = orientedCanvas.height;
  const maxDimension = Math.max(newWidth, newHeight);
  
  // 固定缩放到 1280px（除非原图更小）
  if (maxDimension > TARGET_MAX_DIMENSION) {
    const ratio = TARGET_MAX_DIMENSION / maxDimension;
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
  
  // 尝试 WebP 格式（更高压缩率）
  const supportsWebP = canvas.toDataURL('image/webp').startsWith('data:image/webp');
  const format = supportsWebP ? 'webp' : 'jpeg';
  const mimeType = supportsWebP ? 'image/webp' : 'image/jpeg';
  
  console.log(`🎨 使用格式: ${format.toUpperCase()}`);
  
  // 二分法查找最佳质量（目标 200-300KB）
  let minQuality = QUALITY_LOW;
  let maxQuality = QUALITY_HIGH;
  let bestQuality = QUALITY_HIGH;
  let bestDataUrl = '';
  let bestSize = 0;
  
  for (let i = 0; i < MAX_BINARY_SEARCH_ITERATIONS; i++) {
    const quality = (minQuality + maxQuality) / 2;
    const dataUrl = canvas.toDataURL(mimeType, quality);
    const estimatedSize = Math.floor(dataUrl.length * 0.75);
    
    console.log(`🔍 迭代 ${i + 1}: 质量=${(quality * 100).toFixed(1)}%, 大小=${(estimatedSize / 1024).toFixed(0)}KB`);
    
    // 保存当前最佳结果
    if (estimatedSize >= TARGET_MIN_SIZE && estimatedSize <= TARGET_MAX_SIZE) {
      bestQuality = quality;
      bestDataUrl = dataUrl;
      bestSize = estimatedSize;
      
      // 如果已经很接近目标中值 (250KB)，提前退出
      const targetMid = (TARGET_MIN_SIZE + TARGET_MAX_SIZE) / 2;
      if (Math.abs(estimatedSize - targetMid) < 20 * 1024) {
        console.log(`✅ 找到最佳质量点，提前退出`);
        break;
      }
    }
    
    // 调整搜索范围
    if (estimatedSize > TARGET_MAX_SIZE) {
      maxQuality = quality;
    } else if (estimatedSize < TARGET_MIN_SIZE) {
      minQuality = quality;
    } else {
      // 在目标范围内，尝试向中值靠近
      const targetMid = (TARGET_MIN_SIZE + TARGET_MAX_SIZE) / 2;
      if (estimatedSize < targetMid) {
        minQuality = quality;
      } else {
        maxQuality = quality;
      }
    }
    
    // 如果没有找到更好的结果，保存当前结果
    if (!bestDataUrl || Math.abs(estimatedSize - (TARGET_MIN_SIZE + TARGET_MAX_SIZE) / 2) < Math.abs(bestSize - (TARGET_MIN_SIZE + TARGET_MAX_SIZE) / 2)) {
      bestQuality = quality;
      bestDataUrl = dataUrl;
      bestSize = estimatedSize;
    }
  }
  
  // 如果二分法没有找到合适的结果，使用最后一次的结果
  if (!bestDataUrl) {
    bestQuality = (minQuality + maxQuality) / 2;
    bestDataUrl = canvas.toDataURL(mimeType, bestQuality);
    bestSize = Math.floor(bestDataUrl.length * 0.75);
  }
  
  console.log(`📐 图片压缩完成: ${newWidth}x${newHeight}, 格式=${format.toUpperCase()}, 质量=${(bestQuality * 100).toFixed(0)}%, 大小=${(bestSize / 1024).toFixed(0)}KB`);
  
  return {
    dataUrl: bestDataUrl,
    originalSize: file.size,
    compressedSize: bestSize,
    dimensions: { width: newWidth, height: newHeight },
    format: format as 'jpeg' | 'webp',
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
 * 生成缩略图（用于列表显示）
 */
export async function generateThumbnail(
  dataUrl: string,
  maxSize: number = 150
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('COMPRESSION_FAILED'));
        return;
      }
      
      // 计算缩略图尺寸（保持宽高比）
      let width = img.width;
      let height = img.height;
      
      if (width > height) {
        if (width > maxSize) {
          height = (height * maxSize) / width;
          width = maxSize;
        }
      } else {
        if (height > maxSize) {
          width = (width * maxSize) / height;
          height = maxSize;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // 绘制缩略图
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);
      
      // 使用较低质量以减小文件大小
      const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.7);
      resolve(thumbnailUrl);
    };
    
    img.onerror = () => {
      reject(new Error('IMAGE_DECODE_ERROR'));
    };
    
    img.src = dataUrl;
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


