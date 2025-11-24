import React, { useState } from 'react';
import { login, register } from '../services/userService';
import { LoginCredentials, RegisterInfo, User } from '../types';
import './AuthModal.css';

interface AuthModalProps {
  onClose: () => void;
  onSuccess: (user: User) => void;
}

type AuthMode = 'login' | 'register';

const AuthModal: React.FC<AuthModalProps> = ({ onClose, onSuccess }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        const credentials: LoginCredentials = { username, password };
        const response = login(credentials);
        
        if (response.success && response.user) {
          onSuccess(response.user);
          onClose();
        } else {
          setError(response.error || '登录失败');
        }
      } else {
        const info: RegisterInfo = { username, password, email: email || undefined };
        const response = register(info);
        
        if (response.success && response.user) {
          onSuccess(response.user);
          onClose();
        } else {
          setError(response.error || '注册失败');
        }
      }
    } catch (err) {
      setError('操作失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError('');
  };

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <button className="auth-modal-close" onClick={onClose}>
          ✕
        </button>

        <h2 className="auth-modal-title">
          {mode === 'login' ? '登录' : '注册'}
        </h2>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="username">用户名</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="请输入用户名"
              required
              autoComplete="username"
            />
          </div>

          {mode === 'register' && (
            <div className="form-group">
              <label htmlFor="email">邮箱（可选）</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="请输入邮箱"
                autoComplete="email"
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="password">密码</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              required
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button
            type="submit"
            className="auth-submit-btn"
            disabled={loading}
          >
            {loading ? '处理中...' : mode === 'login' ? '登录' : '注册'}
          </button>
        </form>

        <div className="auth-switch">
          {mode === 'login' ? (
            <>
              还没有账号？
              <button onClick={switchMode} className="auth-switch-btn">
                立即注册
              </button>
            </>
          ) : (
            <>
              已有账号？
              <button onClick={switchMode} className="auth-switch-btn">
                立即登录
              </button>
            </>
          )}
        </div>

        <div className="auth-guest">
          <button onClick={onClose} className="auth-guest-btn">
            以访客身份继续
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
