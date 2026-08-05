import React, { useState } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { useTheme, themes } from '../../context/ThemeContext';
import './TopBar.css';

const TopBar = ({ 
  collapsed, 
  onToggle, 
  pageTitle = 'Dashboard',
  role = 'softwareadmin'
}) => {
  const navigate = useNavigate();
  const { theme, currentTheme, changeTheme } = useTheme();
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);

  const notifications = [
    { id: 1, text: 'New merchant registered', time: '5 min ago', read: false },
    { id: 2, text: 'Payment of ₹12,500 received', time: '1 hour ago', read: false },
    { id: 3, text: 'Settlement completed', time: '3 hours ago', read: true },
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  const getRoleDisplay = () => {
    const roleMap = {
      softwareadmin: 'Software Admin',
      merchant: 'Merchant',
      branchadmin: 'Branch Admin',
      agent: 'Agent',
      customer: 'Customer'
    };
    return roleMap[role] || 'User';
  };

  const themeNames = {
    light: '☀️ Light',
    dark: '🌙 Dark',
    blue: '🔵 Blue',
    purple: '🟣 Purple',
    pink: '🌸 Pink',
    green: '🟢 Green',
    red: '🔴 Red',
    gold: '🟡 Gold'
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${searchQuery}`);
    }
  };

  const markAllRead = () => {
    // Mark all as read logic
  };

  return (
    <header className="topbar" style={{ 
      background: theme.bgCard || '#ffffff',
      borderColor: theme.border || '#e5e5e5'
    }}>
      <div className="topbar-left">
        <button className="topbar-toggle" onClick={onToggle} style={{ color: theme.textSecondary || '#666666' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
        <div className="topbar-breadcrumb">
          <span className="breadcrumb-home">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
            </svg>
          </span>
          <span className="breadcrumb-separator" style={{ color: theme.textMuted || '#cccccc' }}>/</span>
          <span className="breadcrumb-current" style={{ color: theme.textPrimary || '#1a1a2e' }}>{pageTitle}</span>
        </div>
      </div>

      <div className="topbar-right">
        {/* Search - ULTRA PREMIUM & BIG */}
        <form className="topbar-search" onSubmit={handleSearch} style={{ 
          background: theme.bgPrimary || '#f5f5f5',
          borderColor: theme.border || '#e5e5e5'
        }}>
          <span className="search-icon" style={{ color: theme.textMuted || '#999999' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </span>
          <input
            type="text"
            placeholder="🔍 Search merchants, agents, payments, transactions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
            style={{ color: theme.textPrimary || '#1a1a2e' }}
          />
          <kbd className="search-shortcut">⌘K</kbd>
        </form>

        {/* Theme Switcher - Premium */}
        <div className="topbar-theme">
          <button 
            className="theme-btn"
            onClick={() => setShowThemeMenu(!showThemeMenu)}
            style={{ color: theme.textSecondary || '#666666' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"></path>
            </svg>
          </button>
          {showThemeMenu && (
            <div className="theme-dropdown" style={{ 
              background: theme.bgCard || '#ffffff',
              borderColor: theme.border || '#e5e5e5',
              boxShadow: `0 20px 60px ${theme.textPrimary || '#1a1a2e'}30`
            }}>
              <div className="dropdown-header" style={{ color: theme.textMuted || '#888888' }}>
                <span>🎨 Choose Theme</span>
              </div>
              {Object.keys(themes).map((key) => (
                <button
                  key={key}
                  className={`theme-option ${currentTheme === key ? 'active' : ''}`}
                  onClick={() => { changeTheme(key); setShowThemeMenu(false); }}
                  style={{
                    background: currentTheme === key ? theme.accent : 'transparent',
                    color: currentTheme === key ? '#ffffff' : theme.textSecondary || '#666666',
                  }}
                >
                  <span className="theme-dot" style={{ background: themes[key].accent }}></span>
                  {themeNames[key]}
                  {currentTheme === key && (
                    <span className="theme-check">✓</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notifications - Premium */}
        <div className="topbar-notifications">
          <button 
            className="notification-btn" 
            onClick={() => setShowNotifications(!showNotifications)}
            style={{ color: theme.textSecondary || '#666666' }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 01-3.46 0"></path>
            </svg>
            {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
          </button>
          {showNotifications && (
            <div className="notification-dropdown" style={{ 
              background: theme.bgCard || '#ffffff',
              borderColor: theme.border || '#e5e5e5',
              boxShadow: `0 20px 60px ${theme.textPrimary || '#1a1a2e'}30`
            }}>
              <div className="notification-header">
                <span style={{ color: theme.textPrimary || '#1a1a2e' }}>
                  🔔 Notifications
                  <span className="notification-count" style={{ background: theme.accent + '20', color: theme.accent }}>
                    {unreadCount} new
                  </span>
                </span>
                <button className="mark-all-read" onClick={markAllRead} style={{ color: theme.accent || '#000000' }}>
                  Mark all read
                </button>
              </div>
              <div className="notification-list">
                {notifications.length === 0 ? (
                  <div className="notification-empty" style={{ color: theme.textMuted || '#888888' }}>
                    No notifications
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div 
                      key={n.id}
                      className={`notification-item ${!n.read ? 'unread' : ''}`}
                      style={{ 
                        borderColor: theme.border || '#e5e5e5',
                        background: !n.read ? `${theme.accent}08` : 'transparent'
                      }}
                    >
                      <div className="notification-dot" style={{ background: !n.read ? theme.accent : 'transparent' }}></div>
                      <div>
                        <div className="notification-text" style={{ color: theme.textPrimary || '#1a1a2e' }}>
                          {n.text}
                        </div>
                        <div className="notification-time" style={{ color: theme.textMuted || '#888888' }}>
                          {n.time}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="notification-footer">
                <button className="view-all-btn" onClick={() => navigate('/notifications')} style={{ color: theme.accent || '#000000' }}>
                  View all notifications →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Profile - Premium */}
        <div className="topbar-profile">
          <button className="profile-btn" onClick={() => setShowProfileMenu(!showProfileMenu)}>
            <div className="profile-avatar" style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent}CC)` }}>
              {getRoleDisplay().charAt(0)}
            </div>
            <div className="profile-status" style={{ background: '#22c55e' }}></div>
          </button>
          {showProfileMenu && (
            <div className="profile-dropdown" style={{ 
              background: theme.bgCard || '#ffffff',
              borderColor: theme.border || '#e5e5e5',
              boxShadow: `0 20px 60px ${theme.textPrimary || '#1a1a2e'}30`
            }}>
              <div className="profile-header" style={{ borderColor: theme.border || '#e5e5e5' }}>
                <div className="profile-avatar-large" style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent}CC)` }}>
                  {getRoleDisplay().charAt(0)}
                </div>
                <div className="profile-info">
                  <div className="profile-name" style={{ color: theme.textPrimary || '#1a1a2e' }}>
                    {getRoleDisplay()}
                  </div>
                  <div className="profile-role" style={{ color: theme.textMuted || '#888888' }}>
                    {getRoleDisplay()}
                  </div>
                </div>
              </div>
              <div className="profile-menu">
                <NavLink to="/profile" className="profile-menu-item" style={{ color: theme.textSecondary || '#666666' }}>
                  <span className="profile-menu-icon">👤</span> My Profile
                </NavLink>
                <NavLink to="/settings" className="profile-menu-item" style={{ color: theme.textSecondary || '#666666' }}>
                  <span className="profile-menu-icon">⚙️</span> Settings
                </NavLink>
                <NavLink to="/reports" className="profile-menu-item" style={{ color: theme.textSecondary || '#666666' }}>
                  <span className="profile-menu-icon">📊</span> Reports
                </NavLink>
                <div className="profile-divider" style={{ borderColor: theme.border || '#e5e5e5' }}></div>
                <NavLink to="/logout" className="profile-menu-item logout" style={{ color: '#ef4444' }}>
                  <span className="profile-menu-icon">🚪</span> Logout
                </NavLink>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopBar;