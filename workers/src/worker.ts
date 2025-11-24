import { Env, getConfig, validateApiKey } from './config';
import { analyzeImage } from './doubaoClient';

const MAX_REQUEST_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'https://lucas8848168.github.io',
  'https://your-domain.pages.dev'
];

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // CORS预检请求
    if (request.method === 'OPTIONS') {
      return handleCORS();
    }

    try {
      // 路由处理
      const url = new URL(request.url);
      
      // 健康检查不需要验证 API 密钥
      if (url.pathname === '/health' && request.method === 'GET') {
        return handleHealth();
      }

      // 其他请求需要验证 API 密钥
      validateApiKey(env);
      const config = getConfig(env);
      
      if (url.pathname === '/api/analyze' && request.method === 'POST') {
        return await handleAnalyze(request, config, env);
      }

      return jsonResponse({ error: 'Not Found' }, 404);
    } catch (error: any) {
      console.error('Worker error:', error);
      return handleError(error);
    }
  },
};

/**
 * 处理图片分析请求
 */
async function handleAnalyze(request: Request, config: any, env: any): Promise<Response> {
  try {
    // 验证请求大小
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > MAX_REQUEST_SIZE) {
      return jsonResponse(
        {
          success: false,
          error: {
            code: 'REQUEST_TOO_LARGE',
            message: '请求体积过大',
            timestamp: Date.now(),
          },
        },
        413
      );
    }

    // 解析请求体
    const body = await request.json();
    const { image, format } = body;

    // 验证请求数据
    if (!image || typeof image !== 'string') {
      return jsonResponse(
        {
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: '缺少图片数据',
            timestamp: Date.now(),
          },
        },
        400
      );
    }

    // 检查是否启用 Mock 模式（用于 API 限制时测试）
    const useMock = env.USE_MOCK === 'true' || false;
    
    let result;
    let totalCalories;
    
    if (useMock) {
      // Mock 模式：使用模拟数据
      console.log('🎭 使用 Mock 模式（API 限制时的测试模式）');
      const { getRandomMockResponse } = await import('./mockData');
      const mockResponse = getRandomMockResponse();
      result = mockResponse.data;
      totalCalories = result.totalCalories;
    } else {
      // 正常模式：调用方舟豆包API
      try {
        result = await analyzeImage(
          image,
          config.apiKey,
          config.apiEndpoint
        );
        
        // 计算总卡路里
        totalCalories = result.foods.reduce(
          (sum, food) => sum + food.calories,
          0
        );
      } catch (error: any) {
        // 如果是 429 限流错误，提示用户
        if (error.message.includes('429') || error.message.includes('SetLimitExceeded')) {
          return jsonResponse(
            {
              success: false,
              error: {
                code: 'RATE_LIMIT_EXCEEDED',
                message: '⚠️ API 调用次数已达上限。请稍后重试，或联系管理员调整限制。\n\n💡 提示：你可以在 .dev.vars 中设置 USE_MOCK=true 使用模拟数据测试前端功能。',
                timestamp: Date.now(),
              },
            },
            429
          );
        }
        throw error;
      }
    }

    // 返回成功响应
    return jsonResponse({
      success: true,
      data: {
        foods: result.foods,
        totalCalories,
        confidence: result.confidence,
        notes: result.notes,
      },
    });
  } catch (error: any) {
    console.error('Analyze error:', error);
    
    // 检查是否是特殊错误（图片问题）
    const errorMessage = error.message || '';
    
    if (errorMessage.includes('IMAGE_UNCLEAR:')) {
      return jsonResponse(
        {
          success: false,
          error: {
            code: 'IMAGE_UNCLEAR',
            message: errorMessage.replace('IMAGE_UNCLEAR:', '').trim(),
            timestamp: Date.now(),
          },
        },
        400
      );
    }
    
    if (errorMessage.includes('NOT_FOOD:')) {
      return jsonResponse(
        {
          success: false,
          error: {
            code: 'NOT_FOOD',
            message: errorMessage.replace('NOT_FOOD:', '').trim(),
            timestamp: Date.now(),
          },
        },
        400
      );
    }
    
    if (errorMessage.includes('NO_FOOD_DETECTED:')) {
      return jsonResponse(
        {
          success: false,
          error: {
            code: 'NO_FOOD_DETECTED',
            message: errorMessage.replace('NO_FOOD_DETECTED:', '').trim(),
            timestamp: Date.now(),
          },
        },
        400
      );
    }
    
    // 其他错误返回通用错误信息
    return jsonResponse(
      {
        success: false,
        error: {
          code: 'ANALYSIS_FAILED',
          message: '分析失败，请稍后重试',
          timestamp: Date.now(),
        },
      },
      500
    );
  }
}

/**
 * 处理健康检查
 */
function handleHealth(): Response {
  return jsonResponse({
    status: 'healthy',
    timestamp: Date.now(),
    version: '1.0.0',
  });
}

/**
 * 处理CORS
 */
function handleCORS(): Response {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}

/**
 * 处理错误
 */
function handleError(error: any): Response {
  let statusCode = 500;
  let errorCode = 'INTERNAL_ERROR';
  let message = '服务器内部错误';

  if (error.message?.includes('API_KEY_MISSING')) {
    statusCode = 500;
    errorCode = 'API_KEY_MISSING';
    message = 'API密钥未配置';
  } else if (error.message?.includes('API_KEY_INVALID')) {
    statusCode = 500;
    errorCode = 'API_KEY_INVALID';
    message = 'API密钥无效';
  } else if (error.message?.includes('RATE_LIMIT')) {
    statusCode = 429;
    errorCode = 'RATE_LIMIT_EXCEEDED';
    message = '请求过于频繁，请稍后重试';
  }

  return jsonResponse(
    {
      success: false,
      error: {
        code: errorCode,
        message,
        timestamp: Date.now(),
      },
    },
    statusCode
  );
}

/**
 * 创建JSON响应
 */
function jsonResponse(data: any, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
