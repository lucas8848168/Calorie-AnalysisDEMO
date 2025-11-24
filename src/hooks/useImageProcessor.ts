/**
 * 图片处理 Hook
 * 封装完整的图片处理流程：压缩 → 本地检测 → 缓存查询 → API 调用
 */

import { useState, useCallback } from 'react';
import { ProcessedImage, AnalysisResult } from '../types';
import { processImage } from '../utils/imageProcessor';
import { detectFood } from '../services/foodDetector';
import { getCachedResult, saveCachedResult } from '../services/cacheService';
import { analyzeFood } from '../services/apiClient';
import { parseAnalysisResponse } from '../utils/dataParser';
import { getFriendlyClassName } from '../utils/classNameTranslator';

// 简单的字符串 hash 函数
async function computeSimpleHash(str: string): Promise<string> {
  // 取前 1000 个字符计算 hash（避免处理整个 base64）
  const sample = str.substring(0, 1000);
  const encoder = new TextEncoder();
  const data = encoder.encode(sample);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
}

export interface ImageProcessorState {
  isProcessing: boolean;
  stage: 'idle' | 'compressing' | 'detecting' | 'checking-cache' | 'analyzing';
  progress: number;
  error: string | null;
  warning: string | null;
  lastBlockedImageHash?: string; // 记录上次被拦截的图片 hash
}

export interface UseImageProcessorResult {
  state: ImageProcessorState;
  processImageFile: (file: File) => Promise<AnalysisResult | null>;
  reset: () => void;
}

export function useImageProcessor(): UseImageProcessorResult {
  const [state, setState] = useState<ImageProcessorState>({
    isProcessing: false,
    stage: 'idle',
    progress: 0,
    error: null,
    warning: null,
    lastBlockedImageHash: undefined,
  });

  const reset = useCallback(() => {
    setState({
      isProcessing: false,
      stage: 'idle',
      progress: 0,
      error: null,
      warning: null,
    });
  }, []);

  const processImageFile = useCallback(async (file: File): Promise<AnalysisResult | null> => {
    // 在函数顶层定义 detectionInfo，确保在 catch 块中也能访问
    let detectionInfo: { className: string; confidence: string } | null = null;
    
    try {
      setState({
        isProcessing: true,
        stage: 'compressing',
        progress: 10,
        error: null,
        warning: null,
      });

      // 步骤 1: 图片压缩（二分法质量控制 + WebP 优先）
      console.log('📸 步骤 1/4: 图片压缩...');
      const processedImage: ProcessedImage = await processImage(file);
      console.log(`✅ 压缩完成: ${processedImage.dimensions.width}x${processedImage.dimensions.height}, ${(processedImage.compressedSize / 1024).toFixed(0)}KB`);
      
      // 计算图片 hash（用于判断是否是重复上传）
      const imageHash = await computeSimpleHash(processedImage.dataUrl);

      setState(prev => ({ ...prev, stage: 'detecting', progress: 30 }));

      // 步骤 2: 本地 MobileNet 检测（Top3 + 智能阈值）
      console.log('🤖 步骤 2/4: 本地 AI 检测...');
      const detection = await detectFood(processedImage.dataUrl);
      
      // 保存检测结果供后续使用（用于错误消息）
      const topPrediction = detection.predictions[0];
      detectionInfo = topPrediction ? {
        className: getFriendlyClassName(topPrediction.className),
        // 使用 Top1 的置信度，而不是 maxFoodConfidence
        confidence: (topPrediction.probability * 100).toFixed(0)
      } : null;
      
      // 检查是否应该拦截（非食物且置信度 ≥ 65%）
      const shouldBlock = !detection.isFood && topPrediction && topPrediction.probability >= 0.65;
      const isRetry = state.lastBlockedImageHash === imageHash;
      
      if (shouldBlock && !isRetry) {
        // 首次上传：直接拦截
        const errorMessage = `🚫 这张图片不是食物图片（识别为${detectionInfo?.className || '未知'}，置信度${detectionInfo?.confidence || '0'}%）。\n\n如果您确定这是食物图片，请重新上传以继续分析。`;
        
        console.warn('🛑 本地拦截（置信度 ≥ 65%）:', errorMessage);
        
        setState({
          isProcessing: false,
          stage: 'idle',
          progress: 0,
          error: errorMessage,
          warning: null,
          lastBlockedImageHash: imageHash, // 记录被拦截的图片
        });
        
        throw new Error(errorMessage);
      }
      
      if (shouldBlock && isRetry) {
        // 二次上传：显示警告但允许继续
        const warningMessage = `⚠️ 本地模型检测：这可能不是食物图片\n\n识别为：${detectionInfo?.className || '未知'}\n置信度：${detectionInfo?.confidence || '0'}%\n\n您已重新上传，将继续使用云端 AI 分析。`;
        
        console.warn('⚠️ 二次上传，允许通过:', warningMessage);
        
        setState(prev => ({ 
          ...prev, 
          warning: warningMessage,
          progress: 30,
          lastBlockedImageHash: undefined, // 清除记录
        }));
      } else if (!detection.isFood && detection.shouldWarn) {
        // 置信度 60-65%：显示警告但允许继续
        const warningMessage = `⚠️ 本地模型检测：这可能不是食物图片\n\n识别为：${detectionInfo?.className || '未知'}\n置信度：${detectionInfo?.confidence || '0'}%\n\n将继续使用云端 AI 分析，但建议上传清晰的食物图片以获得更准确的结果。`;
        
        console.warn('⚠️ 非食物警告（置信度 60-65%）:', warningMessage);
        
        setState(prev => ({ 
          ...prev, 
          warning: warningMessage,
          progress: 30 
        }));
      }

      console.log(`✅ 本地检测完成: ${detection.reason}`);

      setState(prev => ({ ...prev, stage: 'checking-cache', progress: 50 }));

      // 步骤 3: 检查缓存（仅在低置信度或未匹配关键词时跳过）
      console.log('💾 步骤 3/4: 检查缓存...');
      const shouldUseCache = detection.confidence >= 0.25; // 只有置信度足够高才使用缓存
      
      if (shouldUseCache) {
        const cachedResult = await getCachedResult(processedImage.dataUrl);
        if (cachedResult) {
          console.log('✅ 使用缓存结果（节省 API 调用）');
          setState({
            isProcessing: false,
            stage: 'idle',
            progress: 100,
            error: null,
            warning: null,
          });
          
          // 添加图片 URL
          cachedResult.imageUrl = processedImage.dataUrl;
          return cachedResult;
        }
      } else {
        console.log('⚠️ 置信度不足，跳过缓存，直接调用 API');
      }

      setState(prev => ({ ...prev, stage: 'analyzing', progress: 70 }));

      // 步骤 4: 调用豆包 API 分析
      console.log('☁️ 步骤 4/4: 云端 AI 分析...');
      const response = await analyzeFood(processedImage.dataUrl, processedImage.format);
      
      // 检查特殊情况
      if (response.data?.confidence === 'unclear') {
        const errorMessage = '图片不够清晰，无法准确识别食物。请重新上传清晰的图片。';
        setState({
          isProcessing: false,
          stage: 'idle',
          progress: 0,
          error: errorMessage,
          warning: null,
        });
        throw new Error(errorMessage);
      }
      
      if (response.data?.confidence === 'not_food') {
        // 构建包含本地检测信息的错误消息
        let errorMessage = '🚫 这张图片不是食物图片';
        if (detectionInfo) {
          errorMessage += `（识别为${detectionInfo.className}，置信度${detectionInfo.confidence}%）`;
        }
        errorMessage += '。请上传包含食物的图片进行分析。';
        
        setState({
          isProcessing: false,
          stage: 'idle',
          progress: 0,
          error: errorMessage,
          warning: null,
        });
        throw new Error(errorMessage);
      }

      // 解析响应
      const result = parseAnalysisResponse(response);
      
      if (!result || !result.foods || result.foods.length === 0) {
        // 构建包含本地检测信息的错误消息
        let errorMessage = '🔍 未检测到食物';
        if (detectionInfo) {
          errorMessage += `（本地识别为${detectionInfo.className}，置信度${detectionInfo.confidence}%）`;
        }
        errorMessage += '。请上传包含清晰食物的图片。';
        
        setState({
          isProcessing: false,
          stage: 'idle',
          progress: 0,
          error: errorMessage,
          warning: null,
        });
        throw new Error(errorMessage);
      }

      // 添加图片 URL
      result.imageUrl = processedImage.dataUrl;

      // 保存到缓存（异步，不阻塞）
      if (shouldUseCache) {
        saveCachedResult(processedImage.dataUrl, result).catch(err => {
          console.warn('缓存保存失败:', err);
        });
      }

      console.log('✅ 分析完成');

      setState({
        isProcessing: false,
        stage: 'idle',
        progress: 100,
        error: null,
        warning: null,
      });

      return result;

    } catch (error: any) {
      console.error('❌ 图片处理失败:', error);
      console.error('错误堆栈:', error.stack);
      console.error('错误类型:', error.constructor.name);
      
      let errorMessage = error.message || '处理失败，请稍后重试';
      
      // 解析特殊错误类型，并添加本地检测信息
      if (errorMessage.includes('IMAGE_UNCLEAR:')) {
        errorMessage = errorMessage.replace('IMAGE_UNCLEAR:', '📷 ');
      } else if (errorMessage.includes('NOT_FOOD:')) {
        // 从错误消息中提取原始消息
        const originalMessage = errorMessage.replace('NOT_FOOD:', '').trim();
        errorMessage = '🚫 ' + originalMessage;
        
        // 添加本地检测信息
        if (detectionInfo) {
          errorMessage = `🚫 这张图片不是食物图片（识别为${detectionInfo.className}，置信度${detectionInfo.confidence}%）。请上传包含食物的图片进行分析。`;
        }
      } else if (errorMessage.includes('NO_FOOD_DETECTED:')) {
        const originalMessage = errorMessage.replace('NO_FOOD_DETECTED:', '').trim();
        errorMessage = '🔍 ' + originalMessage;
        
        // 添加本地检测信息
        if (detectionInfo) {
          errorMessage = `🔍 未检测到食物（本地识别为${detectionInfo.className}，置信度${detectionInfo.confidence}%）。请上传包含清晰食物的图片。`;
        }
      } else if (errorMessage.includes('REQUEST_TIMEOUT:')) {
        errorMessage = errorMessage.replace('REQUEST_TIMEOUT:', '⏱️ ');
      } else if (errorMessage.includes('NETWORK_ERROR:')) {
        errorMessage = errorMessage.replace('NETWORK_ERROR:', '🌐 ');
      }
      
      setState({
        isProcessing: false,
        stage: 'idle',
        progress: 0,
        error: errorMessage,
        warning: null,
      });

      // 重新抛出错误，让 ImageUploader 捕获
      throw new Error(errorMessage);
    }
  }, []);

  return {
    state,
    processImageFile,
    reset,
  };
}
