import React, { ReactNode } from 'react';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import './PullToRefresh.css';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
}

const PullToRefresh: React.FC<PullToRefreshProps> = ({ onRefresh, children }) => {
  const { containerRef, isPulling, isRefreshing, pullDistance, shouldTrigger } =
    usePullToRefresh({ onRefresh });

  return (
    <div
      ref={containerRef as React.RefObject<HTMLDivElement>}
      className="pull-to-refresh-container"
    >
      <div
        className={`pull-to-refresh-indicator ${
          isPulling || isRefreshing ? 'visible' : ''
        }`}
        style={{
          transform: `translateY(${Math.min(pullDistance, 80)}px)`,
        }}
      >
        <div className={`refresh-icon ${isRefreshing ? 'spinning' : ''}`}>
          {isRefreshing ? '⟳' : shouldTrigger ? '↓' : '↓'}
        </div>
        <div className="refresh-text">
          {isRefreshing
            ? '刷新中...'
            : shouldTrigger
            ? '松开刷新'
            : '下拉刷新'}
        </div>
      </div>
      
      <div
        className="pull-to-refresh-content"
        style={{
          transform: `translateY(${isPulling || isRefreshing ? pullDistance : 0}px)`,
          transition: isPulling ? 'none' : 'transform 0.3s ease',
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default PullToRefresh;
