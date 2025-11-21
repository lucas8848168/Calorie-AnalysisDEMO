import { AnalyzeRequest, AnalyzeResponse, BoundingBox } from '../types';

const API_ENDPOINT = import.meta.env.VITE_API_ENDPOINT || 'http://localhost:8787';
const REQUEST_TIMEOUT = 60000; // 60秒（豆包 API 通常需要 30-60 秒）
const FALLBACK_TIMEOUT = 120000; // 降级策略超时120秒（复杂图片需要更长时间）

/**
 * 分析食物图片（带超时和降级策略）
 * @param imageDataUrl - Base64编码的图片数据
 * @param format - 图片格式
 * @param regions - 可选的边界框数组，用于多食物识别
 */
export async function analyzeFood(
  imageDataUrl: string,
  format: string,
  regions?: BoundingBox[]
): Promise<AnalyzeResponse> {
  // 第一次尝试：正常超时
  try {
    return await analyzeFoodWithTimeout(imageDataUrl, format, REQUEST_TIMEOUT, regions);
  } catch (error: any) {
    // 如果是超时错误，尝试降级策略
    if (error.message.includes('REQUEST_TIMEOUT')) {
      console.warn('First attempt timed out, trying with extended timeout...');
      try {
        return await analyzeFoodWithTimeout(imageDataUrl, format, FALLBACK_TIMEOUT, regions);
      } catch (fallbackError: any) {
        // 降级也失败，返回友好提示
        throw new Error('REQUEST_TIMEOUT: 分析超时（已尝试120秒）。这张图片可能包含太多种类的食物。建议：1) 只拍摄单次用餐的食物 2) 避免拍摄整个餐桌或食材展示图 3) 如需分析多种食物，请分批上传');
      }
    }
    throw error;
  }
}

/**
 * 带超时的分析请求
 */
async function analyzeFoodWithTimeout(
  imageDataUrl: string,
  format: string,
  timeout: number,
  regions?: BoundingBox[]
): Promise<AnalyzeResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const request: AnalyzeRequest & { regions?: BoundingBox[] } = {
      image: imageDataUrl,
      format,
    };

    // 如果提供了区域信息，添加到请求中
    if (regions && regions.length > 0) {
      request.regions = regions;
    }

    const response = await fetch(`${API_ENDPOINT}/api/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorCode = errorData.error?.code || '';
      const errorMessage = errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`;
      
      // 保留错误代码前缀，让 App.tsx 能够识别和美化
      if (errorCode === 'IMAGE_UNCLEAR') {
        throw new Error(`IMAGE_UNCLEAR: ${errorMessage}`);
      } else if (errorCode === 'NOT_FOOD') {
        throw new Error(`NOT_FOOD: ${errorMessage}`);
      } else if (errorCode === 'NO_FOOD_DETECTED') {
        throw new Error(`NO_FOOD_DETECTED: ${errorMessage}`);
      } else {
        throw new Error(errorMessage);
      }
    }

    const data: AnalyzeResponse = await response.json();
    
    // 如果响应中的食物项包含边界框信息，确保它们被正确传递
    if (data.data?.foods && regions && regions.length > 0) {
      data.data.foods = data.data.foods.map((food, index) => ({
        ...food,
        boundingBox: regions[index] || undefined,
      }));
    }
    
    return data;
  } catch (error: any) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      throw new Error('REQUEST_TIMEOUT: 请求超时');
    }

    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      throw new Error('NETWORK_ERROR: 网络连接失败，请检查网络设置');
    }

    throw error;
  }
}

/**
 * 检查API健康状态
 */
export async function checkApiHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_ENDPOINT}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}
