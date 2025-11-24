import React, { useState } from 'react';
import './ExportButton.css';

interface ExportButtonProps {
  onExport: (format: 'csv' | 'json' | 'pdf') => void;
  disabled?: boolean;
}

const ExportButton: React.FC<ExportButtonProps> = ({ onExport, disabled = false }) => {
  const [showMenu, setShowMenu] = useState(false);

  const handleExport = (format: 'csv' | 'json' | 'pdf') => {
    onExport(format);
    setShowMenu(false);
  };

  return (
    <div className="export-button-container">
      <button
        className="export-button"
        onClick={() => setShowMenu(!showMenu)}
        disabled={disabled}
      >
        <span className="export-icon">📥</span>
        <span>导出数据</span>
      </button>

      {showMenu && (
        <>
          <div className="export-backdrop" onClick={() => setShowMenu(false)} />
          <div className="export-menu">
            <button
              className="export-menu-item"
              onClick={() => handleExport('csv')}
            >
              <span className="menu-icon">📊</span>
              <div className="menu-content">
                <div className="menu-title">导出为 CSV</div>
                <div className="menu-desc">适合 Excel 打开</div>
              </div>
            </button>

            <button
              className="export-menu-item"
              onClick={() => handleExport('json')}
            >
              <span className="menu-icon">📄</span>
              <div className="menu-content">
                <div className="menu-title">导出为 JSON</div>
                <div className="menu-desc">完整数据备份</div>
              </div>
            </button>

            <button
              className="export-menu-item"
              onClick={() => handleExport('pdf')}
            >
              <span className="menu-icon">📑</span>
              <div className="menu-content">
                <div className="menu-title">生成报告</div>
                <div className="menu-desc">营养分析报告</div>
              </div>
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ExportButton;
