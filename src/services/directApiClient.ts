/**
 * 直接调用豆包 API 的客户端（前端版本）
 * ⚠️ 警告：此方式会暴露 API 密钥，仅用于演示！
 */

import { AnalyzeResponse } from '../types';

// ⚠️ 演示模式：API 密钥直接在前端（不安全，仅用于演示）
const DEMO_API_KEY = import.meta.env.VITE_DOUBAO_API_KEY || '';
const API_ENDPOINT = import.meta.env.VITE_DOUBAO_API_ENDPOINT || 'https://ark.cn-beijing.volces.com/api/v3';

const PROMPT_TEMPLATE = `分析图片中的食物，返回JSON。

规则：
- 图片模糊 → {"foods":[],"confidence":"unclear"}
- 非食物 → {"foods":[],"confidence":"not_food"}
- 食物>8种 → 只识别主要5-8种

格式：
{"foods":[{"name":"食物名","portion":"数量+重量(如1碗约200克)","ingredients":"成分","calories":数字,"nutrition":{"protein":数字,"fat":数字,"carbs":数字,"fiber":数字}}],"confidence":"high/medium/low","notes":"健康建议"}

要求：
- portion必填，含数量和重量
- 营养基于实际分量，非100克标准
- 数值保留1位小数
- notes必须包含：
  1. 这餐食物的健康优点和缺点
  2. 适合人群（老年人/高血压/糖尿病/青春期青少年/儿童/孕妇/减肥人群等）
  3. 不适合人群和禁忌
  4. 具体的饮食建议
- notes字数控制在150-200字，简洁实用`;

/**
 * 直接从前端调用豆包 API
 */
export async function analyzeFood(
  imageDataUrl: string,
  format: string
): Promise<AnalyzeResponse> {
  if (!DEMO_API_KEY) {
    throw new Error('API_KEY_MISSING: 请在 .env 文件中配置 VITE_DOUBAO_API_KEY');
  }

  try {
    // 移除 Base64 前缀
    const base64Data = imageDataUrl.replace(/^data:image\/\w+;base64,/, '');

    const requestBody = {
      model: 'doubao-seed-1-6-251015',
      max_completion_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${base64Data}`,
              },
            },
            {
              type: 'text',
              text: PROMPT_TEMPLATE,
            },
          ],
        },
      ],
      reasoning_effort: 'medium',
      temperature: 0.5,
    };

    console.log('🚀 直接调用豆包 API...');

    const response = await fetch(`${API_ENDPOINT}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEMO_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API 错误:', errorText);
      
      if (response.status === 429) {
        throw new Error('RATE_LIMIT_EXCEEDED: API 调用次数已达上限，请稍后重试');
      }
      
      throw new Error(`AI_API_ERROR: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ API 响应成功');

    // 解析响应
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('NO_CONTENT: API 返回内容为空');
    }

    // 提取 JSON
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('NO_JSON: 无法从响应中提取 JSON');
    }

    const result = JSON.parse(jsonMatch[0]);

    if (!result.foods || !Array.isArray(result.foods)) {
      throw new Error('INVALID_FORMAT: 响应格式无效');
    }

    // 检查特殊情况
    if (result.foods.length === 0) {
      if (result.confidence === 'unclear') {
        throw new Error('IMAGE_UNCLEAR: 图片模糊或不清晰，无法准确识别。请上传更清晰的食物图片。');
      } else if (result.confidence === 'not_food') {
        throw new Error('NOT_FOOD: 这张图片不是食物图片。请上传包含食物的图片进行分析。');
      } else {
        throw new Error('NO_FOOD_DETECTED: 未能识别到食物。请确保图片中包含清晰可见的食物。');
      }
    }

    // 计算总卡路里
    const totalCalories = result.foods.reduce((sum: number, food: any) => sum + food.calories, 0);

    return {
      success: true,
      data: {
        foods: result.foods,
        totalCalories,
        confidence: result.confidence,
        notes: result.notes,
      },
    };
  } catch (error: any) {
    console.error('❌ 分析失败:', error);

    // 保留错误代码前缀
    if (error.message.startsWith('IMAGE_UNCLEAR:') ||
        error.message.startsWith('NOT_FOOD:') ||
        error.message.startsWith('NO_FOOD_DETECTED:') ||
        error.message.startsWith('RATE_LIMIT_EXCEEDED:')) {
      throw error;
    }

    throw new Error(`ANALYSIS_FAILED: ${error.message}`);
  }
}

/**
 * 检查 API 健康状态
 */
export async function checkApiHealth(): Promise<boolean> {
  return !!DEMO_API_KEY;
}
