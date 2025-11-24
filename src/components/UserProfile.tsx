import React, { useState } from 'react';
import { User } from '../types';
import { logout, isCurrentUserAdmin } from '../services/userService';
import './UserProfile.css';

interface UserProfileProps {
  user: User;
  onLogout: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ user, onLogout }) => {
  const [showMenu, setShowMenu] = useState(false);
  const isAdmin = isCurrentUserAdmin();

  const handleLogout = () => {
    logout();
    onLogout();
    setShowMenu(false);
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="user-profile">
      <button
        className="user-profile-trigger"
        onClick={() => setShowMenu(!showMenu)}
      >
        <div className="user-avatar">
          {user.profile?.avatar ? (
            <img src={user.profile.avatar} alt={user.username} />
          ) : (
            <span>{getInitials(user.profile?.displayName || user.username)}</span>
          )}
        </div>
        <span className="user-name">
          {user.profile?.displayName || user.username}
        </span>
        {isAdmin && <span className="admin-badge">管理员</span>}
      </button>

      {showMenu && (
        <>
          <div
            className="user-profile-overlay"
            onClick={() => setShowMenu(false)}
          />
          <div className="user-profile-menu">
            <div className="user-profile-header">
              <div className="user-avatar-large">
                {user.profile?.avatar ? (
                  <img src={user.profile.avatar} alt={user.username} />
                ) : (
                  <span>{getInitials(user.profile?.displayName || user.username)}</span>
                )}
              </div>
              <div className="user-info">
                <div className="user-display-name">
                  {user.profile?.displayName || user.username}
                </div>
                <div className="user-email">{user.email || '未设置邮箱'}</div>
                {isAdmin && <div className="admin-badge-large">管理员</div>}
              </div>
            </div>

            <div className="user-profile-stats">
              <div className="stat-item">
                <div className="stat-value">0</div>
                <div className="stat-label">分析次数</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">0</div>
                <div className="stat-label">餐次记录</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">0</div>
                <div className="stat-label">活跃天数</div>
              </div>
            </div>

            <div className="user-profile-actions">
              <button className="profile-action-btn" onClick={() => setShowMenu(false)}>
                <span className="action-icon">👤</span>
                个人资料
              </button>
              <button className="profile-action-btn" onClick={() => setShowMenu(false)}>
                <span className="action-icon">⚙️</span>
                设置
              </button>
              <button className="profile-action-btn logout-btn" onClick={handleLogout}>
                <span className="action-icon">🚪</span>
                退出登录
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default UserProfile;
