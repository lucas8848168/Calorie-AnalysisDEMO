import React from 'react';
import './OfflineIndicator.css';

/**
 * 简化的离线状态指示器
 * 暂时移除了 hooks 以避免 React 冲突问题
 */
const OfflineIndicator: React.FC = () => {
  // 简化版本：只显示静态状态
  const isOnline = navigator.onLine;

  if (isOnline) {
    return null; // 在线时不显示任何内容
  }

  return (
    <div className="offline-indicator offline">
      <span className="offline-icon">📴</span>
      <span className="offline-text">离线模式</span>
    </div>
  );
};

export default OfflineIndicator;
