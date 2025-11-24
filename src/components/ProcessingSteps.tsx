import React from 'react';
import SkeletonLoader from './SkeletonLoader';
import './ProcessingSteps.css';

interface ProcessingStepsProps {
  currentStage: 'compressing' | 'detecting' | 'checking-cache' | 'analyzing' | 'idle';
  progress: number;
}

interface Step {
  id: string;
  icon: string;
  label: string;
  stage: 'compressing' | 'detecting' | 'checking-cache' | 'analyzing';
}

const steps: Step[] = [
  { id: '1', icon: '🔍', label: '正在分析图片', stage: 'compressing' },
  { id: '2', icon: '🍔', label: '正在识别食物', stage: 'detecting' },
  { id: '3', icon: '⚖️', label: '计算营养成分', stage: 'checking-cache' },
  { id: '4', icon: '🔬', label: '专用模型交叉验证', stage: 'analyzing' },
];

const ProcessingSteps: React.FC<ProcessingStepsProps> = ({ currentStage, progress }) => {
  const getCurrentStepIndex = () => {
    const index = steps.findIndex(step => step.stage === currentStage);
    return index >= 0 ? index : -1;
  };

  const currentStepIndex = getCurrentStepIndex();

  const getStepStatus = (index: number) => {
    if (index < currentStepIndex) return 'completed';
    if (index === currentStepIndex) return 'active';
    return 'pending';
  };

  return (
    <div className="processing-steps">
      <div className="processing-header">
        <h2>AI 食物识别中</h2>
        <p className="processing-subtitle">请稍候，正在分析您的图片...</p>
      </div>

      <div className="progress-bar-container">
        <div className="progress-bar-track">
          <div 
            className="progress-bar-fill" 
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="progress-percentage">{progress}%</div>
      </div>

      <div className="steps-list">
        {steps.map((step, index) => {
          const status = getStepStatus(index);
          return (
            <div key={step.id} className={`step-item ${status}`}>
              <div className="step-icon">{step.icon}</div>
              <div className="step-label">{step.label}</div>
              {status === 'active' && (
                <div className="step-loading">
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                </div>
              )}
              {status === 'completed' && (
                <div className="step-check">✓</div>
              )}
            </div>
          );
        })}
        
        <div className={`step-item ${currentStepIndex >= steps.length - 1 && progress >= 90 ? 'active' : 'pending'}`}>
          <div className="step-icon">☕</div>
          <div className="step-label">即将完成，请勿离开</div>
          {currentStepIndex >= steps.length - 1 && progress >= 90 && (
            <div className="step-loading">
              <span className="dot"></span>
              <span className="dot"></span>
              <span className="dot"></span>
            </div>
          )}
        </div>
      </div>

      {/* 骨架屏预览 - 提升用户感知性能 */}
      {progress > 30 && (
        <div className="skeleton-preview">
          <p className="skeleton-preview-hint">正在生成分析结果...</p>
          <SkeletonLoader type="analysis" />
        </div>
      )}
    </div>
  );
};

export default ProcessingSteps;
