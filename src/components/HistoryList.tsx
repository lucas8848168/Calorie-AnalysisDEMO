import React, { useState, useEffect, useMemo } from 'react';
import { HistoryListProps, AnalysisResult } from '../types';
import { historyStorageDB } from '../services/historyStorageDB';
import { formatCalories, formatTimestamp } from '../utils/dataParser';
import SkeletonLoader from './SkeletonLoader';
import ExportButton from './ExportButton';
import PullToRefresh from './PullToRefresh';
import SearchBar from './SearchBar';
import { exportHistoryToCSV, exportHistoryToJSON } from '../utils/dataExport';
import { isMobileDevice } from '../utils/touchGestures';
import { useVirtualScroll } from '../hooks/useVirtualScroll';
import { searchRecords, generateSearchSuggestions } from '../services/searchService';
import './HistoryList.css';

const ITEM_HEIGHT = 100; // Height of each history item in pixels
const CONTAINER_HEIGHT = 600; // Max height of the scrollable container
const VIRTUAL_SCROLL_THRESHOLD = 20; // Enable virtual scrolling when records exceed this number

const HistoryList: React.FC<HistoryListProps> = ({ onSelectRecord }) => {
  const [allRecords, setAllRecords] = useState<AnalysisResult[]>([]);
  const [records, setRecords] = useState<AnalysisResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Generate search suggestions based on current query
  const suggestions = useMemo(() => {
    return generateSearchSuggestions(allRecords, searchQuery, 5);
  }, [allRecords, searchQuery]);
  
  // Determine if we should use virtual scrolling
  const useVirtual = useMemo(() => records.length > VIRTUAL_SCROLL_THRESHOLD, [records.length]);
  
  // Virtual scroll hook
  const { virtualItems, totalHeight, containerRef } = useVirtualScroll(records, {
    itemHeight: ITEM_HEIGHT,
    containerHeight: CONTAINER_HEIGHT,
    overscan: 5,
  });

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    setLoading(true);
    try {
      const loadedRecords = await historyStorageDB.getRecords();
      setAllRecords(loadedRecords);
      setRecords(loadedRecords);
    } catch (error) {
      console.error('加载历史记录失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query || query.trim() === '') {
      setRecords(allRecords);
    } else {
      const filtered = searchRecords(allRecords, query);
      setRecords(filtered);
    }
  };

  const handleDelete = async (timestamp: number, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (confirm('确定要删除这条记录吗？')) {
      try {
        await historyStorageDB.deleteRecord(timestamp);
        await loadRecords();
      } catch (error) {
        console.error('删除记录失败:', error);
        alert('删除失败，请重试');
      }
    }
  };

  const handleClearAll = async () => {
    if (confirm('确定要清空所有历史记录吗？')) {
      try {
        await historyStorageDB.clearAll();
        setSearchQuery('');
        await loadRecords();
      } catch (error) {
        console.error('清空记录失败:', error);
        alert('清空失败，请重试');
      }
    }
  };

  if (loading) {
    return (
      <div className="history-list">
        <div className="history-header">
          <h3>历史记录</h3>
        </div>
        <SkeletonLoader type="list" count={5} />
      </div>
    );
  }

  if (allRecords.length === 0) {
    return (
      <div className="history-list empty">
        <p>暂无历史记录</p>
      </div>
    );
  }

  const handleExport = (format: 'csv' | 'json' | 'pdf') => {
    if (format === 'csv') {
      exportHistoryToCSV(records);
    } else if (format === 'json') {
      exportHistoryToJSON(records);
    }
  };

  const handleRefresh = async () => {
    await loadRecords();
  };

  // Render a single history item
  const renderHistoryItem = (record: AnalysisResult, style?: React.CSSProperties) => (
    <div
      key={record.id}
      className="history-item"
      onClick={() => onSelectRecord(record)}
      style={style}
    >
      <div className="history-thumbnail">
        {record.thumbnailUrl || record.imageUrl ? (
          <img 
            src={record.thumbnailUrl || record.imageUrl} 
            alt="食物" 
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="no-image">无图片</div>
        )}
      </div>

      <div className="history-info">
        <div className="history-foods">
          {record.foods.length > 0 ? (
            record.foods.map((food, index) => (
              <span key={index} className="food-name">
                {food.name}
                {index < record.foods.length - 1 && ', '}
              </span>
            ))
          ) : (
            <span className="no-food">未检测到食物</span>
          )}
        </div>

        <div className="history-meta">
          <span className="history-calories">
            {formatCalories(record.totalCalories)}
          </span>
          <span className="history-time">
            {formatTimestamp(record.timestamp)}
          </span>
        </div>
      </div>

      <button
        className="btn-delete"
        onClick={(e) => handleDelete(record.timestamp, e)}
        title="删除"
      >
        ×
      </button>
    </div>
  );

  const content = (
    <div className="history-list">
      <div className="history-header">
        <h3>历史记录</h3>
        <div className="history-actions">
          <ExportButton onExport={handleExport} disabled={allRecords.length === 0} />
          <button onClick={handleClearAll} className="btn-clear">
            清空全部
          </button>
        </div>
      </div>

      <SearchBar
        onSearch={handleSearch}
        suggestions={suggestions}
        placeholder="搜索食物名称..."
      />

      {records.length === 0 && searchQuery && (
        <div className="search-no-results">
          <p>未找到包含 "{searchQuery}" 的记录</p>
          <button onClick={() => handleSearch('')} className="btn-clear-search">
            清除搜索
          </button>
        </div>
      )}

      {useVirtual ? (
        // Virtual scrolling for large lists
        <div 
          ref={containerRef}
          className="history-items history-items-virtual"
          style={{ 
            height: `${CONTAINER_HEIGHT}px`,
            overflow: 'auto',
            position: 'relative'
          }}
        >
          <div style={{ height: `${totalHeight}px`, position: 'relative' }}>
            {virtualItems.map(({ item, offsetTop }) =>
              renderHistoryItem(item, {
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                transform: `translateY(${offsetTop}px)`,
              })
            )}
          </div>
        </div>
      ) : (
        // Regular rendering for small lists
        <div className="history-items">
          {records.map((record) => renderHistoryItem(record))}
        </div>
      )}
    </div>
  );

  // Wrap with PullToRefresh on mobile devices
  if (isMobileDevice()) {
    return <PullToRefresh onRefresh={handleRefresh}>{content}</PullToRefresh>;
  }

  return content;
};

export default HistoryList;
