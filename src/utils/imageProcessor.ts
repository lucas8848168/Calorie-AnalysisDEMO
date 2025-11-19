import { ImageMetadata, ProcessedImage } from '../types';

// 支持的图片格式
const SUPPORTED_FORMATS = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_DIMENSION = 2048; // 优化为2048px以提升识别准确度
const MAX_COMPRESSED_SIZE = 1 * 1024 * 1024; // 1MB

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
 * 压缩图片
 */
export async function compressImage(
  file: File,
  maxDimension: number = MAX_DIMENSION,
  maxSize: number = MAX_COMPRESSED_SIZE
): Promise<ProcessedImage> {
  
  // 加载图片并修正EXIF方向
  const img = await loadImage(file);
  const orientedCanvas = await fixImageOrientation(img, file);
  
  // 计算新尺寸
  let newWidth = orientedCanvas.width;
  let newHeight = orientedCanvas.height;
  
  if (newWidth > maxDimension || newHeight > maxDimension) {
    const ratio = Math.min(maxDimension / newWidth, maxDimension / newHeight);
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
  
  // 绘制修正方向后的图片
  ctx.drawImage(orientedCanvas, 0, 0, newWidth, newHeight);
  
  // 渐进式压缩直到满足大小要求
  let quality = 0.92;
  let dataUrl = canvas.toDataURL('image/jpeg', quality);
  
  // 动态调整压缩质量
  while (dataUrl.length > maxSize * 1.37 && quality > 0.5) {
    quality -= 0.08;
    dataUrl = canvas.toDataURL('image/jpeg', quality);
  }
  
  // 计算压缩后的大小（Base64字符串长度约为实际字节数的1.37倍）
  const compressedSize = Math.floor(dataUrl.length * 0.75);
  
  return {
    dataUrl,
    originalSize: file.size,
    compressedSize,
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
  const needsCompression =
    metadata.dimensions.width > MAX_DIMENSION ||
    metadata.dimensions.height > MAX_DIMENSION ||
    file.size > MAX_COMPRESSED_SIZE;
  
  if (needsCompression) {
    return await compressImage(file);
  }
  
  // 不需要压缩，直接转换为DataURL
  const dataUrl = await fileToDataUrl(file);
  return {
    dataUrl,
    originalSize: file.size,
    compressedSize: file.size,
    dimensions: metadata.dimensions,
    format: metadata.format,
  };
}

/**
 * 将File转换为DataURL
 */
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('IMAGE_DECODE_ERROR'));
    reader.readAsDataURL(file);
  });
}
