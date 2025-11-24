import React from 'react';
import './SkeletonLoader.css';

interface SkeletonLoaderProps {
  type?: 'card' | 'list' | 'chart' | 'text' | 'image' | 'analysis';
  count?: number;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ 
  type = 'card', 
  count = 1 
}) => {
  const renderSkeleton = () => {
    switch (type) {
      case 'analysis':
        return <AnalysisSkeleton />;
      case 'card':
        return <CardSkeleton />;
      case 'list':
        return <ListSkeleton count={count} />;
      case 'chart':
        return <ChartSkeleton />;
      case 'text':
        return <TextSkeleton />;
      case 'image':
        return <ImageSkeleton />;
      default:
        return <CardSkeleton />;
    }
  };

  return <div className="skeleton-loader">{renderSkeleton()}</div>;
};

// 分析结果骨架屏
const AnalysisSkeleton: React.FC = () => (
  <div className="skeleton-analysis">
    <div className="skeleton-image-preview"></div>
    <div className="skeleton-food-list">
      <div className="skeleton-food-item">
        <div className="skeleton-food-icon"></div>
        <div className="skeleton-food-info">
          <div className="skeleton-line skeleton-line-title"></div>
          <div className="skeleton-line skeleton-line-subtitle"></div>
        </div>
      </div>
      <div className="skeleton-food-item">
        <div className="skeleton-food-icon"></div>
        <div className="skeleton-food-info">
          <div className="skeleton-line skeleton-line-title"></div>
          <div className="skeleton-line skeleton-line-subtitle"></div>
        </div>
      </div>
    </div>
    <div className="skeleton-nutrition-table">
      <div className="skeleton-line skeleton-line-full"></div>
      <div className="skeleton-line skeleton-line-full"></div>
      <div className="skeleton-line skeleton-line-full"></div>
      <div className="skeleton-line skeleton-line-full"></div>
    </div>
  </div>
);

// 卡片骨架屏
const CardSkeleton: React.FC = () => (
  <div className="skeleton-card">
    <div className="skeleton-card-image"></div>
    <div className="skeleton-card-content">
      <div className="skeleton-line skeleton-line-title"></div>
      <div className="skeleton-line skeleton-line-text"></div>
      <div className="skeleton-line skeleton-line-text"></div>
    </div>
  </div>
);

// 列表骨架屏
const ListSkeleton: React.FC<{ count: number }> = ({ count }) => (
  <div className="skeleton-list">
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} className="skeleton-list-item">
        <div className="skeleton-avatar"></div>
        <div className="skeleton-list-content">
          <div className="skeleton-line skeleton-line-title"></div>
          <div className="skeleton-line skeleton-line-text"></div>
        </div>
      </div>
    ))}
  </div>
);

// 图表骨架屏
const ChartSkeleton: React.FC = () => (
  <div className="skeleton-chart">
    <div className="skeleton-chart-header">
      <div className="skeleton-line skeleton-line-title"></div>
    </div>
    <div className="skeleton-chart-body">
      <div className="skeleton-chart-bars">
        <div className="skeleton-bar" style={{ height: '60%' }}></div>
        <div className="skeleton-bar" style={{ height: '80%' }}></div>
        <div className="skeleton-bar" style={{ height: '45%' }}></div>
        <div className="skeleton-bar" style={{ height: '90%' }}></div>
        <div className="skeleton-bar" style={{ height: '70%' }}></div>
      </div>
    </div>
  </div>
);

// 文本骨架屏
const TextSkeleton: React.FC = () => (
  <div className="skeleton-text">
    <div className="skeleton-line skeleton-line-full"></div>
    <div className="skeleton-line skeleton-line-full"></div>
    <div className="skeleton-line skeleton-line-half"></div>
  </div>
);

// 图片骨架屏
const ImageSkeleton: React.FC = () => (
  <div className="skeleton-image"></div>
);

export default SkeletonLoader;
