import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { useTheme, themes } from '../../context/ThemeContext';
import './TopBar.css';

const TopBar = ({ 
  collapsed, 
  onToggle, 
  pageTitle = 'Dashboard',
  isMobile = false,
  mobileOpen = false
}) => {
  const navigate = useNavigate();
  
  // ✅ Safe theme usage
  let theme = 'dark';
  let currentTheme = 'dark';
  let changeTheme = () => {};
  
  try {
    const themeContext = useTheme();
    theme = themeContext.theme || 'dark';
    currentTheme = themeContext.currentTheme || 'dark';
    changeTheme = themeContext.changeTheme || (() => {});
  } catch (error) {
    console.warn('Theme context not available, using default dark theme');
  }
  
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);

  // ✅ Refs for click outside detection
  const themeMenuRef = useRef(null);
  const profileMenuRef = useRef(null);
  const notificationMenuRef = useRef(null);

  // ✅ Get user role from localStorage
  const getUserRole = () => {
    try {
      const userDataStr = localStorage.getItem('auth_user');
      if (userDataStr) {
        const user = JSON.parse(userDataStr);
        return user?.role?.toLowerCase() || 'softwareadmin';
      }
    } catch (error) {
      console.error('Error getting user role:', error);
    }
    return 'softwareadmin';
  };

  const role = getUserRole();

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

  const getRoleIcon = () => {
    const iconMap = {
      softwareadmin: '👑',
      merchant: '🏪',
      branchadmin: '🏢',
      agent: '👤',
      customer: '👤'
    };
    return iconMap[role] || '👤';
  };

  const themeNames = {
    light: '☀️ Light Mode',
    dark: '🌙 Dark Mode',
    blue: '🔵 Ocean Blue',
    purple: '🟣 Royal Purple',
    pink: '🌸 Sunset Pink',
    green: '🟢 Emerald Green',
    red: '🔴 Crimson Red',
    gold: '🟡 Luxury Gold'
  };

  // ✅ Click outside handler - close all dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close profile menu if clicked outside
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
      // Close theme menu if clicked outside
      if (themeMenuRef.current && !themeMenuRef.current.contains(event.target)) {
        setShowThemeMenu(false);
      }
      // Close notifications if clicked outside
      if (notificationMenuRef.current && !notificationMenuRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    // Add event listener
    document.addEventListener('mousedown', handleClickOutside);
    
    // Cleanup
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // ✅ Close all dropdowns (utility function)
  const closeAllDropdowns = () => {
    setShowProfileMenu(false);
    setShowThemeMenu(false);
    setShowNotifications(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${searchQuery}`);
    }
  };

  const markAllRead = () => {
    console.log('Mark all read');
  };

  const getUserName = () => {
    try {
      const userDataStr = localStorage.getItem('auth_user');
      if (userDataStr) {
        const user = JSON.parse(userDataStr);
        return user?.firstName || user?.username || 'User';
      }
    } catch (error) {
      console.error('Error getting user name:', error);
    }
    return 'User';
  };

  // ✅ Toggle functions with close others
  const toggleProfileMenu = () => {
    setShowProfileMenu(!showProfileMenu);
    setShowThemeMenu(false);
    setShowNotifications(false);
  };

  const toggleThemeMenu = () => {
    setShowThemeMenu(!showThemeMenu);
    setShowNotifications(false);
    setShowProfileMenu(false);
  };

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
    setShowThemeMenu(false);
    setShowProfileMenu(false);
  };

  return (
    <header className="topbar-dark-shell">
      
      {/* Left Section: Sidebar Toggle & Page Title Breadcrumb */}
      <div className="topbar-left">
        <button 
          className="topbar-toggle-btn" 
          onClick={onToggle}
          title="Toggle Navigation Menu"
        >
          {isMobile ? (mobileOpen ? '✕' : '☰') : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          )}
        </button>

        <div className="topbar-breadcrumb">
          <span className="breadcrumb-home-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
            </svg>
          </span>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-current-text">{pageTitle}</span>
        </div>
      </div>

      {/* Right Section: Search & Quick Controls */}
      <div className="topbar-right">
        
        {/* Sleek Glass Search Bar */}
        <form className="topbar-search-form" onSubmit={handleSearch}>
          <span className="search-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search merchants, payments, settlements..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <kbd className="search-shortcut-badge">⌘K</kbd>
        </form>

        {/* Theme Selector */}
        <div className="topbar-dropdown-wrapper" ref={themeMenuRef}>
          <button 
            className="icon-action-btn"
            onClick={toggleThemeMenu}
            title="Choose Theme"
          >
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"></path>
            </svg>
          </button>

          {showThemeMenu && (
            <div className="dropdown-panel theme-dropdown">
              <div className="dropdown-header">
                <span>🎨 Select Color Theme</span>
              </div>
              <div className="theme-options-grid">
                {Object.keys(themes).map((key) => (
                  <button
                    key={key}
                    className={`theme-option-btn ${currentTheme === key ? 'active' : ''}`}
                    onClick={() => { changeTheme(key); setShowThemeMenu(false); }}
                  >
                    <span className="theme-color-dot" style={{ background: themes[key]?.accent || '#666' }}></span>
                    <span className="theme-label">{themeNames[key] || key}</span>
                    {currentTheme === key && <span className="theme-check-icon">✓</span>}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Notifications Dropdown */}
        <div className="topbar-dropdown-wrapper" ref={notificationMenuRef}>
          <button 
            className="icon-action-btn notification-trigger" 
            onClick={toggleNotifications}
            title="Notifications"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 01-3.46 0"></path>
            </svg>
            {unreadCount > 0 && (
              <span className="notification-badge-count">{unreadCount}</span>
            )}
          </button>

          {showNotifications && (
            <div className="dropdown-panel notification-dropdown">
              <div className="notification-header-row">
                <span className="notification-title">
                  Notifications
                  <span className="notification-unread-pill">{unreadCount} new</span>
                </span>
                <button className="mark-read-link" onClick={markAllRead}>
                  Mark all read
                </button>
              </div>

              <div className="notification-items-list">
                {notifications.length === 0 ? (
                  <div className="notification-empty-state">No unread notifications</div>
                ) : (
                  notifications.map((n) => (
                    <div key={n.id} className={`notification-item-card ${!n.read ? 'unread' : ''}`}>
                      <div className="notification-status-dot"></div>
                      <div className="notification-content">
                        <div className="notification-text">{n.text}</div>
                        <div className="notification-time">{n.time}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="notification-footer-bar">
                <button className="view-all-notif-btn" onClick={() => navigate('/notifications')}>
                  View All Activity →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Profile Avatar */}
        <div className="topbar-dropdown-wrapper" ref={profileMenuRef}>
          <button 
            className="profile-avatar-trigger" 
            onClick={toggleProfileMenu}
            title="User Profile"
          >
            <div className="avatar-circle">
              {getRoleIcon()}
            </div>
            <span className="live-status-indicator"></span>
          </button>

          {showProfileMenu && (
            <div className="dropdown-panel profile-dropdown">
              <div className="profile-header-box">
                <div className="avatar-circle-large">
                  {getRoleIcon()}
                </div>
                <div className="profile-user-details">
                  <div className="profile-user-name">{getUserName()}</div>
                  <div className="profile-user-role">{getRoleDisplay()}</div>
                </div>
              </div>

              <div className="profile-links-list">
                <NavLink to="/profile" className="profile-link-item" onClick={() => setShowProfileMenu(false)}>
                  <span className="link-icon">👤</span> My Profile
                </NavLink>
                
                <NavLink to="/settings" className="profile-link-item" onClick={() => setShowProfileMenu(false)}>
                  <span className="link-icon">⚙️</span> Account Settings
                </NavLink>
                
                <NavLink to="/reports" className="profile-link-item" onClick={() => setShowProfileMenu(false)}>
                  <span className="link-icon">📊</span> Reports Telemetry
                </NavLink>
                
                <div className="profile-divider-line"></div>
                
                <NavLink to="/logout" className="profile-link-item logout-link" onClick={() => setShowProfileMenu(false)}>
                  <span className="link-icon">🚪</span> Sign Out
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