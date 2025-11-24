import React, { useState, useRef } from 'react';
import { ImageUploaderProps } from '../types';
import { useImageProcessor } from '../hooks/useImageProcessor';
import ProcessingSteps from './ProcessingSteps';
import './ImageUploader.css';

const ImageUploader: React.FC<ImageUploaderProps> = ({
  onImageProcessed,
  onError,
}) => {
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { state, processImageFile } = useImageProcessor();

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      console.log('🎯 ImageUploader: 开始处理文件', file.name);
      
      // 快速显示预览（不等待处理完成）
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);
      
      // 异步处理图片（压缩 → 检测 → 缓存 → API）
      const result = await processImageFile(file);
      
      console.log('✅ ImageUploader: 处理完成，结果:', result ? '成功' : 'null');
      
      // 清理预览 URL
      URL.revokeObjectURL(previewUrl);
      
      if (result) {
        // 使用处理后的图片作为预览
        setPreview(result.imageUrl);
        // 通知父组件（传递完整的分析结果）
        console.log('📊 ImageUploader: 调用 onImageProcessed');
        onImageProcessed(result as any);
      }
      // 如果 result 为 null，说明在 Hook 中已经抛出错误，会被 catch 捕获
    } catch (error: any) {
      // 捕获所有错误（包括 Hook 中抛出的错误）
      console.error('❌ ImageUploader 捕获错误:', error);
      console.error('错误消息:', error.message);
      console.error('错误堆栈:', error.stack);
      console.log('📞 ImageUploader: 调用 onError');
      onError(new Error(error.message || '图片处理失败'));
      setPreview(null);
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
        disabled={state.isProcessing}
      />
      
      {state.isProcessing ? (
        <ProcessingSteps currentStage={state.stage} progress={state.progress} />
      ) : (
        <div
          className="upload-area"
          onClick={handleClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          {preview ? (
            <div className="preview">
              <img src={preview} alt="预览" />
              <p className="hint">点击或拖拽上传新图片</p>
            </div>
          ) : (
            <div className="placeholder">
              <svg
                width="80"
                height="80"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M14.5 4h-5L8 6H5c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-3l-1.5-2z" />
                <circle cx="12" cy="13" r="3" />
              </svg>
              <p>拍照或上传食物图片进行分析</p>
              <p className="formats">支持 JPEG、PNG、WebP 格式，最大 10MB</p>
              <p className="formats" style={{ marginTop: '0.5rem', color: '#ff9800', fontSize: '0.85rem' }}>
                💡 本地 AI 预检测 + 智能缓存，更快更省流量
              </p>
            </div>
          )}
        </div>
      )}
      
      {state.warning && (
        <div className="warning-message">
          <div>
            <span className="warning-icon">⚠️</span>
            <strong>本地模型检测警告</strong>
          </div>
          <div style={{ whiteSpace: 'pre-line' }}>
            {state.warning}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
