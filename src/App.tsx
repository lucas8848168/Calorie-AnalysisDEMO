import { useState, useEffect, lazy, Suspense } from 'react';
import ImageUploader from './components/ImageUploader';
import AnalysisDisplay from './components/AnalysisDisplay';
import OfflineIndicator from './components/OfflineIndicator';
import SkeletonLoader from './components/SkeletonLoader';
import AuthModal from './components/AuthModal';
import UserProfile from './components/UserProfile';
import { AnalysisResult, User } from './types';
import { historyStorageDB } from './services/historyStorageDB';
import { migrateToIndexedDB } from './utils/migrateStorage';
import { getCurrentUser, autoLogin } from './services/userService';
import './App.css';

// Lazy load heavy components for better initial load performance
const HistoryList = lazy(() => import('./components/HistoryList'));
const DataAnalysis = lazy(() => import('./pages/DataAnalysis'));
const GoalManagement = lazy(() => import('./pages/GoalManagement'));

type AppPage = 'analysis' | 'result' | 'error' | 'history' | 'data' | 'goals';

function App() {
  const [currentPage, setCurrentPage] = useState<AppPage>('analysis');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // 自动迁移旧数据到 IndexedDB
  useEffect(() => {
    migrateToIndexedDB();
  }, []);

  // 尝试自动登录
  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setCurrentUser(user);
    } else {
      // 尝试自动登录
      const autoLoginResult = autoLogin();
      if (autoLoginResult.success && autoLoginResult.user) {
        setCurrentUser(autoLoginResult.user);
      }
    }
  }, []);

  // Preload lazy components on idle
  useEffect(() => {
    // Preload components after initial render
    const preloadTimer = setTimeout(() => {
      import('./utils/componentPreloader').then(({ preloadAllComponents }) => {
        preloadAllComponents();
      });
    }, 2000);

    return () => clearTimeout(preloadTimer);
  }, []);

  const handleImageProcessed = async (result: AnalysisResult) => {
    console.log('🎯 handleImageProcessed 被调用（已完成分析）');
    setError(null);
    
    // 保存到历史记录（IndexedDB 异步保存）
    try {
      await historyStorageDB.saveRecord(result);
    } catch (storageError: any) {
      console.error('保存历史记录失败:', storageError);
      // 存储失败不影响显示结果，只给用户提示
      setError('⚠️ 保存历史记录失败，但不影响查看结果。');
    }

    // 显示结果
    setAnalysisResult(result);
    setCurrentPage('result');
  };

  const handleError = (err: Error) => {
    console.log('🚨 App.handleError 被调用');
    console.log('错误消息:', err.message);
    setError(err.message);
    setCurrentPage('error'); // 切换到错误页面
    console.log('✅ 已切换到错误页面');
  };

  const handleNewAnalysis = () => {
    setAnalysisResult(null);
    setError(null);
    setCurrentPage('analysis');
  };

  const handleSelectRecord = (record: AnalysisResult) => {
    setAnalysisResult(record);
    setCurrentPage('result');
  };

  const handleNavigate = (page: AppPage) => {
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

      case 'result':
        return analysisResult ? (
          <AnalysisDisplay result={analysisResult} onNewAnalysis={handleNewAnalysis} />
        ) : null;

      case 'error':
        return (
          <div className="error-page">
            <div className="error-content">
              <div className="error-icon-large">⚠️</div>
              <h2>分析失败</h2>
              <div className="error-message-detail">
                {error}
              </div>
              <button className="retry-button" onClick={handleNewAnalysis}>
                重新上传
              </button>
            </div>
          </div>
        );

      case 'history':
        return (
          <Suspense fallback={<SkeletonLoader type="list" count={5} />}>
            <HistoryList onSelectRecord={handleSelectRecord} />
          </Suspense>
        );

      case 'data':
        return (
          <Suspense fallback={<SkeletonLoader type="chart" count={3} />}>
            <DataAnalysis />
          </Suspense>
        );

      case 'goals':
        return (
          <Suspense fallback={<SkeletonLoader type="card" count={2} />}>
            <GoalManagement />
          </Suspense>
        );

      default:
        return null;
    }
  };

  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
    setShowAuthModal(false);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentPage('analysis');
  };

  return (
    <div className="app">
      <OfflineIndicator />
      
      <header className="app-header">
        <div className="header-content">
          <div className="header-title">
            <h1>🍽️ 食物卡路里分析器</h1>
            <p className="subtitle">上传食物图片，AI 智能识别营养成分</p>
          </div>
          <div className="header-actions">
            {currentUser ? (
              <UserProfile user={currentUser} onLogout={handleLogout} />
            ) : (
              <button
                className="login-btn"
                onClick={() => setShowAuthModal(true)}
              >
                登录 / 注册
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="app-main">{renderPageContent()}</main>

      {/* 底部导航栏 */}
      <nav className="bottom-nav">
        <button
          className={`nav-item ${
            currentPage === 'analysis' || currentPage === 'result' || currentPage === 'error'
              ? 'active'
              : ''
          }`}
          onClick={() => handleNavigate('analysis')}
        >
          <span className="nav-icon">📸</span>
          <span className="nav-label">分析</span>
        </button>

        <button
          className={`nav-item ${currentPage === 'history' ? 'active' : ''}`}
          onClick={() => handleNavigate('history')}
        >
          <span className="nav-icon">📋</span>
          <span className="nav-label">历史</span>
        </button>

        <button
          className={`nav-item ${currentPage === 'data' ? 'active' : ''}`}
          onClick={() => handleNavigate('data')}
        >
          <span className="nav-icon">📊</span>
          <span className="nav-label">数据</span>
        </button>

        <button
          className={`nav-item ${currentPage === 'goals' ? 'active' : ''}`}
          onClick={() => handleNavigate('goals')}
        >
          <span className="nav-icon">🎯</span>
          <span className="nav-label">目标</span>
        </button>
      </nav>

      <footer className="app-footer">
        <p>© 2025 Zhang Qun | 由方舟豆包 1.6 大模型提供支持 | 数据仅供参考</p>
      </footer>

      {/* 登录/注册弹窗 */}
      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onSuccess={handleAuthSuccess}
        />
      )}
    </div>
  );
}

export default App;
