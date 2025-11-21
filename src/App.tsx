import { useState, useRef } from 'react';
import ImageUploader from './components/ImageUploader';
import LoadingIndicator from './components/LoadingIndicator';
import AnalysisDisplay from './components/AnalysisDisplay';
import HistoryList from './components/HistoryList';
import DataAnalysis from './pages/DataAnalysis';
import GoalManagement from './pages/GoalManagement';
import { ProcessedImage, AnalysisResult } from './types';
import { analyzeFood } from './services/apiClient';
import { parseAnalysisResponse } from './utils/dataParser';
import { historyStorage } from './services/historyStorage';
import './App.css';

type AppPage = 'analysis' | 'analyzing' | 'result' | 'history' | 'data' | 'goals';

function App() {
  const [currentPage, setCurrentPage] = useState<AppPage>('analysis');
  const [, setCurrentImage] = useState<ProcessedImage | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const analysisInProgressRef = useRef<boolean>(false);

  const handleImageProcessed = async (image: ProcessedImage) => {
    setCurrentImage(image);
    setError(null);
    setCurrentPage('analyzing');
    analysisInProgressRef.current = true;
    
    // 首次使用提示（模型下载）
    const isFirstTime = !localStorage.getItem('model_loaded_before');
    if (isFirstTime) {
      console.log('💡 首次使用将下载 AI 模型（约 16MB），请稍候...');
      localStorage.setItem('model_loaded_before', 'true');
    }

    try {
      // 调用API分析图片
      const response = await analyzeFood(image.dataUrl, image.format);

      // 检查分析是否被中断（用户切换到其他页面）
      if (!analysisInProgressRef.current) {
        console.log('分析已被中断，不更新状态');
        return;
      }

      // 解析响应
      const result = parseAnalysisResponse(response);

      if (result) {
        // 检查特殊情况
        if (response.data?.confidence === 'unclear') {
          setError('图片不够清晰，无法准确识别食物。请重新上传清晰的图片。');
          setCurrentPage('analysis');
          analysisInProgressRef.current = false;
          return;
        }
        
        if (response.data?.confidence === 'not_food') {
          setError('这张图片不是食物图片。请上传包含食物的图片。');
          setCurrentPage('analysis');
          analysisInProgressRef.current = false;
          return;
        }

        // 设置图片URL
        result.imageUrl = image.dataUrl;

        // 保存到历史记录
        historyStorage.saveRecord(result);

        // 显示结果
        setAnalysisResult(result);
        setCurrentPage('result');
      } else {
        throw new Error('解析响应失败');
      }
    } catch (err: any) {
      // 只有在分析未被中断时才显示错误
      if (analysisInProgressRef.current) {
        let errorMessage = err.message || '分析失败，请稍后重试';
        
        // 解析特殊错误类型
        if (errorMessage.includes('IMAGE_UNCLEAR:')) {
          errorMessage = errorMessage.replace('IMAGE_UNCLEAR:', '📷 ');
        } else if (errorMessage.includes('NOT_FOOD:')) {
          errorMessage = errorMessage.replace('NOT_FOOD:', '🚫 ');
        } else if (errorMessage.includes('NO_FOOD_DETECTED:')) {
          errorMessage = errorMessage.replace('NO_FOOD_DETECTED:', '🔍 ');
        } else if (errorMessage.includes('REQUEST_TIMEOUT:')) {
          errorMessage = errorMessage.replace('REQUEST_TIMEOUT:', '⏱️ ');
        } else if (errorMessage.includes('NETWORK_ERROR:')) {
          errorMessage = errorMessage.replace('NETWORK_ERROR:', '🌐 ');
        }
        
        setError(errorMessage);
        setCurrentPage('analysis');
      }
    } finally {
      analysisInProgressRef.current = false;
    }
  };

  const handleError = (err: Error) => {
    setError(err.message);
  };

  const handleNewAnalysis = () => {
    setCurrentImage(null);
    setAnalysisResult(null);
    setError(null);
    setCurrentPage('analysis');
  };

  const handleSelectRecord = (record: AnalysisResult) => {
    setAnalysisResult(record);
    setCurrentPage('result');
  };

  const handleNavigate = (page: AppPage) => {
    // 如果正在分析，标记为中断
    if (analysisInProgressRef.current) {
      analysisInProgressRef.current = false;
    }
    setCurrentPage(page);
  };

  // 渲染页面内容
  const renderPageContent = () => {
    switch (currentPage) {
      case 'analysis':
        return (
          <>
            {error && (
              <div className="error-message">
                <span className="error-icon">⚠️</span>
                {error}
              </div>
            )}
            <ImageUploader onImageProcessed={handleImageProcessed} onError={handleError} />
          </>
        );

      case 'analyzing':
        return (
          <div>
            <LoadingIndicator message="正在分析食物，请稍候..." />
            <p className="loading-hint">
              💡 提示：豆包 AI 分析通常需要 30-60 秒，复杂图片可能需要 1-2 分钟
            </p>
            <p
              className="loading-hint"
              style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#999' }}
            >
              如果图片包含多种食物（&gt;10种），AI 将只识别主要食物以加快速度
            </p>
          </div>
        );

      case 'result':
        return analysisResult ? (
          <AnalysisDisplay result={analysisResult} onNewAnalysis={handleNewAnalysis} />
        ) : null;

      case 'history':
        return <HistoryList onSelectRecord={handleSelectRecord} />;

      case 'data':
        return <DataAnalysis />;

      case 'goals':
        return <GoalManagement />;

      default:
        return null;
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>🍽️ 食物卡路里分析器</h1>
        <p className="subtitle">上传食物图片，AI 智能识别营养成分</p>
      </header>

      <main className="app-main">{renderPageContent()}</main>

      {/* 底部导航栏 */}
      <nav className="bottom-nav">
        <button
          className={`nav-item ${
            currentPage === 'analysis' || currentPage === 'analyzing' || currentPage === 'result'
              ? 'active'
              : ''
          }`}
          onClick={() => handleNavigate('analysis')}
          disabled={analysisInProgressRef.current}
        >
          <span className="nav-icon">📸</span>
          <span className="nav-label">分析</span>
        </button>

        <button
          className={`nav-item ${currentPage === 'history' ? 'active' : ''}`}
          onClick={() => handleNavigate('history')}
          disabled={analysisInProgressRef.current}
        >
          <span className="nav-icon">📋</span>
          <span className="nav-label">历史</span>
        </button>

        <button
          className={`nav-item ${currentPage === 'data' ? 'active' : ''}`}
          onClick={() => handleNavigate('data')}
          disabled={analysisInProgressRef.current}
        >
          <span className="nav-icon">📊</span>
          <span className="nav-label">数据</span>
        </button>

        <button
          className={`nav-item ${currentPage === 'goals' ? 'active' : ''}`}
          onClick={() => handleNavigate('goals')}
          disabled={analysisInProgressRef.current}
        >
          <span className="nav-icon">🎯</span>
          <span className="nav-label">目标</span>
        </button>
      </nav>

      <footer className="app-footer">
        <p>© 2025 Zhang Qun | 由方舟豆包 1.6 大模型提供支持 | 数据仅供参考</p>
      </footer>
    </div>
  );
}

export default App;
