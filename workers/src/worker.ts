import { Env, getConfig, validateApiKey } from './config';
import { analyzeImage } from './doubaoClient';

const MAX_REQUEST_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_ORIGINS = ['http://localhost:5173', 'https://your-domain.pages.dev'];

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // CORS预检请求
    if (request.method === 'OPTIONS') {
      return handleCORS();
    }

    try {
      // 验证API密钥
      validateApiKey(env);
      const config = getConfig(env);

      // 路由处理
      const url = new URL(request.url);
      
      if (url.pathname === '/api/analyze' && request.method === 'POST') {
        return await handleAnalyze(request, config);
      }

      if (url.pathname === '/health' && request.method === 'GET') {
        return handleHealth();
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
async function handleAnalyze(request: Request, config: any): Promise<Response> {
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

    // 调用方舟豆包API
    const result = await analyzeImage(
      image,
      config.apiKey,
      config.apiEndpoint
    );

    // 计算总卡路里
    const totalCalories = result.foods.reduce(
      (sum, food) => sum + food.calories,
      0
    );

    // 返回成功响应
    return jsonResponse({
      success: true,
      data: {
        foods: result.foods,
        totalCalories,
        confidence: result.confidence,
      },
    });
  } catch (error: any) {
    console.error('Analyze error:', error);
    
    // 返回友好的错误信息，不暴露敏感细节
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
