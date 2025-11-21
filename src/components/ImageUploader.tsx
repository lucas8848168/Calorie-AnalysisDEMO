import React, { useState, useRef } from 'react';
import { ImageUploaderProps } from '../types';
import { processImage } from '../utils/imageProcessor';
import { detectFood } from '../services/foodDetector';
import './ImageUploader.css';

const ImageUploader: React.FC<ImageUploaderProps> = ({
  onImageProcessed,
  onError,
}) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setProcessing(true);

    try {
      // 处理图片（验证、压缩）
      const processed = await processImage(file);
      
      // 显示预览
      setPreview(processed.dataUrl);
      
      // 本地食物检测（异步，不阻塞预览）
      console.log('🔍 开始本地食物检测...');
      detectFood(processed.dataUrl)
        .then(result => {
          console.log('✅ 本地检测完成:', {
            isFood: result.isFood,
            confidence: `${(result.confidence * 100).toFixed(1)}%`,
            topPrediction: result.predictions[0]?.className
          });
          
          if (!result.isFood && result.confidence > 0) {
            // 检测到非食物，但不强制阻止（给用户提示）
            console.warn('⚠️ 本地模型判断：可能不是食物');
            if (result.confidence > 0.6) {
              const topClass = result.predictions[0]?.className || '未知物体';
              onError(new Error(
                `⚠️ 本地检测：这可能不是食物图片（识别为：${topClass}）。\n` +
                '您仍可继续分析，但建议上传清晰的食物图片以获得更准确的结果。'
              ));
            }
          } else if (result.isFood) {
            const topFood = result.predictions[0]?.className || '';
            console.log(`✅ 本地模型判断：检测到食物（${topFood}，置信度 ${(result.confidence * 100).toFixed(1)}%）`);
          } else {
            console.log('ℹ️ 本地模型：无法确定，将由后端 AI 进行详细分析');
          }
        })
        .catch(err => {
          console.error('❌ 本地检测失败:', err);
          console.log('ℹ️ 本地检测失败不影响主流程，将直接使用后端 AI 分析');
          // 检测失败不影响主流程
        });
      
      // 通知父组件
      onImageProcessed(processed);
    } catch (error: any) {
      // 处理错误
      let errorMessage = '图片处理失败';
      
      if (error.message === 'INVALID_FILE_FORMAT') {
        errorMessage = '不支持的文件格式，请上传 JPEG、PNG 或 WebP 格式的图片';
      } else if (error.message === 'FILE_TOO_LARGE') {
        errorMessage = '文件过大，请上传小于 10MB 的图片';
      } else if (error.message === 'IMAGE_DECODE_ERROR') {
        errorMessage = '图片已损坏或无法读取，请重新选择';
      } else if (error.message === 'COMPRESSION_FAILED') {
        errorMessage = '图片压缩失败，请尝试其他图片';
      }
      
      onError(new Error(errorMessage));
      setPreview(null);
    } finally {
      setProcessing(false);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    
    if (file && fileInputRef.current) {
      // 创建新的FileList并触发change事件
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      fileInputRef.current.files = dataTransfer.files;
      
      // 手动触发处理
      await handleFileSelect({
        target: fileInputRef.current,
      } as React.ChangeEvent<HTMLInputElement>);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  return (
    <div className="image-uploader">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
      
      <div
        className="upload-area"
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        {processing ? (
          <div className="processing">
            <div className="spinner"></div>
            <p>正在处理图片...</p>
          </div>
        ) : preview ? (
          <div className="preview">
            <img src={preview} alt="预览" />
            <p className="hint">点击或拖拽上传新图片</p>
          </div>
        ) : (
          <div className="placeholder">
            <svg
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <p>点击或拖拽上传食物图片</p>
            <p className="formats">支持 JPEG、PNG、WebP 格式，最大 10MB</p>
            <p className="formats" style={{ marginTop: '0.5rem', color: '#ff9800', fontSize: '0.85rem' }}>
              ⚠️ 建议拍摄单次用餐的食物，避免拍摄整个餐桌或食材展示图
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageUploader;
