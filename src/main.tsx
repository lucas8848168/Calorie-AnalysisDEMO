import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import * as serviceWorkerRegistration from './utils/serviceWorkerRegistration';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

// Service Worker temporarily disabled to fix React hook issues
// serviceWorkerRegistration.register({
//   onSuccess: () => {
//     console.log('✅ 应用已缓存，可离线使用');
//   },
//   onUpdate: (registration) => {
//     console.log('🔄 发现新版本，请刷新页面');
//     // Optionally show a notification to the user
//     if (confirm('发现新版本，是否立即更新？')) {
//       if (registration.waiting) {
//         registration.waiting.postMessage({ type: 'SKIP_WAITING' });
//         window.location.reload();
//       }
//     }
//   },
//   onOffline: () => {
//     console.log('📴 离线模式');
//   },
//   onOnline: () => {
//     console.log('📶 已恢复网络连接');
//   },
// });

// Unregister any existing service workers
serviceWorkerRegistration.unregister();
