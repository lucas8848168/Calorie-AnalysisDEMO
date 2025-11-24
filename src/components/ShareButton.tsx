import React, { useState } from 'react';
import { AnalysisResult } from '../types';
import {
  shareViaWebAPI,
  copyShareText,
  generateQRCode,
  generateShareCard,
  downloadShareCard,
  isWebShareSupported,
  shareToPlatform,
  generateShareUrl,
} from '../services/shareService';
import './ShareButton.css';

interface ShareButtonProps {
  result: AnalysisResult;
  disabled?: boolean;
}

const ShareButton: React.FC<ShareButtonProps> = ({ result, disabled = false }) => {
  const [showModal, setShowModal] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [shareCard, setShareCard] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleShare = () => {
    setShowModal(true);
  };

  const handleWebShare = async () => {
    try {
      setLoading(true);
      await shareViaWebAPI(result);
      showMessage('分享成功！');
      setShowModal(false);
    } catch (error) {
      console.error('分享失败:', error);
      showMessage('分享失败，请尝试其他方式');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      setLoading(true);
      await copyShareText(result);
      showMessage('已复制到剪贴板！');
    } catch (error) {
      console.error('复制失败:', error);
      showMessage('复制失败，请手动复制');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateQR = async () => {
    try {
      setLoading(true);
      const url = generateShareUrl();
      const qr = await generateQRCode(url);
      setQrCode(qr);
      showMessage('二维码已生成！');
    } catch (error) {
      console.error('生成二维码失败:', error);
      showMessage('生成二维码失败');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCard = async () => {
    try {
      setLoading(true);
      const card = await generateShareCard(result);
      setShareCard(card);
      showMessage('分享卡片已生成！');
    } catch (error) {
      console.error('生成分享卡片失败:', error);
      showMessage('生成分享卡片失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCard = () => {
    if (shareCard) {
      downloadShareCard(shareCard);
      showMessage('卡片已下载！');
    }
  };

  const handlePlatformShare = (platform: 'wechat' | 'weibo' | 'twitter' | 'facebook') => {
    shareToPlatform(platform, result);
  };

  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 3000);
  };

  const closeModal = () => {
    setShowModal(false);
    setQrCode(null);
    setShareCard(null);
    setMessage(null);
  };

  return (
    <>
      <button
        className="btn-share"
        onClick={handleShare}
        disabled={disabled}
        title="分享结果"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M15 6.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM5 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM15 18.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM7.5 11l5-3M7.5 11l5 3"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span>分享</span>
      </button>

      {showModal && (
        <div className="share-modal-overlay" onClick={closeModal}>
          <div className="share-modal" onClick={(e) => e.stopPropagation()}>
            <div className="share-modal-header">
              <h3>分享分析结果</h3>
              <button className="btn-close" onClick={closeModal}>
                ×
              </button>
            </div>

            <div className="share-modal-content">
              {message && <div className="share-message">{message}</div>}

              {/* Web Share API */}
              {isWebShareSupported() && (
                <div className="share-section">
                  <button
                    className="share-option share-option-primary"
                    onClick={handleWebShare}
                    disabled={loading}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 22a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span>系统分享</span>
                  </button>
                </div>
              )}

              {/* 社交平台 */}
              <div className="share-section">
                <h4>分享到社交平台</h4>
                <div className="share-platforms">
                  <button
                    className="platform-btn platform-weibo"
                    onClick={() => handlePlatformShare('weibo')}
                    title="分享到微博"
                  >
                    微博
                  </button>
                  <button
                    className="platform-btn platform-twitter"
                    onClick={() => handlePlatformShare('twitter')}
                    title="分享到Twitter"
                  >
                    Twitter
                  </button>
                  <button
                    className="platform-btn platform-facebook"
                    onClick={() => handlePlatformShare('facebook')}
                    title="分享到Facebook"
                  >
                    Facebook
                  </button>
                </div>
              </div>

              {/* 复制链接 */}
              <div className="share-section">
                <button
                  className="share-option"
                  onClick={handleCopyLink}
                  disabled={loading}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span>复制链接</span>
                </button>
              </div>

              {/* 二维码 */}
              <div className="share-section">
                <button
                  className="share-option"
                  onClick={handleGenerateQR}
                  disabled={loading}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <rect
                      x="3"
                      y="3"
                      width="8"
                      height="8"
                      rx="1"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                    <rect
                      x="13"
                      y="3"
                      width="8"
                      height="8"
                      rx="1"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                    <rect
                      x="3"
                      y="13"
                      width="8"
                      height="8"
                      rx="1"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                    <rect x="13" y="13" width="3" height="3" fill="currentColor" />
                    <rect x="18" y="13" width="3" height="3" fill="currentColor" />
                    <rect x="13" y="18" width="3" height="3" fill="currentColor" />
                    <rect x="18" y="18" width="3" height="3" fill="currentColor" />
                  </svg>
                  <span>生成二维码</span>
                </button>

                {qrCode && (
                  <div className="qr-code-display">
                    <img src={qrCode} alt="二维码" />
                    <p>扫描二维码访问应用</p>
                  </div>
                )}
              </div>

              {/* 分享卡片 */}
              <div className="share-section">
                <button
                  className="share-option"
                  onClick={handleGenerateCard}
                  disabled={loading}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <rect
                      x="3"
                      y="3"
                      width="18"
                      height="18"
                      rx="2"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                    <path
                      d="M9 9h6M9 13h6M9 17h4"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                  <span>生成分享卡片</span>
                </button>

                {shareCard && (
                  <div className="share-card-display">
                    <img src={shareCard} alt="分享卡片" />
                    <button className="btn-download" onClick={handleDownloadCard}>
                      下载卡片
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ShareButton;
