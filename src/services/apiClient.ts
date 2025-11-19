import { AnalyzeRequest, AnalyzeResponse } from '../types';

const API_ENDPOINT = import.meta.env.VITE_API_ENDPOINT || 'http://localhost:8787';
const REQUEST_TIMEOUT = 30000; // 30秒
const FALLBACK_TIMEOUT = 45000; // 降级策略超时45秒

/**
 * 分析食物图片（带超时和降级策略）
 */
export async function analyzeFood(
  imageDataUrl: string,
  format: string
): Promise<AnalyzeResponse> {
  // 第一次尝试：正常超时
  try {
    return await analyzeFoodWithTimeout(imageDataUrl, format, REQUEST_TIMEOUT);
  } catch (error: any) {
    // 如果是超时错误，尝试降级策略
    if (error.message.includes('REQUEST_TIMEOUT')) {
      console.warn('First attempt timed out, trying with extended timeout...');
      try {
        return await analyzeFoodWithTimeout(imageDataUrl, format, FALLBACK_TIMEOUT);
      } catch (fallbackError: any) {
        // 降级也失败，返回友好提示
        throw new Error('REQUEST_TIMEOUT: 图片分析时间较长，请尝试上传更清晰或更小的图片');
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
  timeout: number
): Promise<AnalyzeResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const request: AnalyzeRequest = {
      image: imageDataUrl,
      format,
    };

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
      throw new Error(
        errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`
      );
    }

    const data: AnalyzeResponse = await response.json();
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
