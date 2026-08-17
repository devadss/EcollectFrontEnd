import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { useTheme, themes } from '../../context/ThemeContext';
import { useNotifications } from '../../context/NotificationContext';
import './TopBar.css';

// SVG Icons
const TopIcons = {
  Search: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  Theme: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  ),
  Bell: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  ),
  Menu: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  ),
  Home: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  User: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  Settings: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  Logout: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
  Building: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <line x1="9" y1="6" x2="15" y2="6" />
      <line x1="9" y1="10" x2="15" y2="10" />
      <line x1="9" y1="14" x2="15" y2="14" />
      <line x1="9" y1="18" x2="12" y2="18" />
    </svg>
  ),
  Check: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
};

// Format relative time helper
const formatRelativeTime = (timeInput) => {
  if (!timeInput) return 'Just now';
  const now = new Date();
  const date = new Date(timeInput);
  const diffSec = Math.floor((now - date) / 1000);
  
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

// Category Badge Color & Icon Resolver
const getCategoryMeta = (category = '') => {
  const cat = category.toUpperCase();
  switch (cat) {
    case 'APPROVALS':
    case 'BRANCH':
      return { icon: '🏢', label: 'Approval', color: '#6366f1' };
    case 'SETTLEMENTS':
    case 'FINANCIAL':
      return { icon: '💳', label: 'Settlement', color: '#10b981' };
    case 'AGENTS':
      return { icon: '👤', label: 'Agent', color: '#06b6d4' };
    case 'SECURITY':
      return { icon: '🔒', label: 'Security', color: '#f59e0b' };
    case 'SYSTEM':
    default:
      return { icon: '⚡', label: 'System', color: '#8b5cf6' };
  }
};

const TopBar = ({ 
  collapsed, 
  onToggle, 
  pageTitle = 'Dashboard',
  isMobile = false,
  mobileOpen = false
}) => {
  const navigate = useNavigate();
  
  let theme = 'dark';
  let currentTheme = 'dark';
  let changeTheme = () => {};
  
  try {
    const themeContext = useTheme();
    theme = themeContext.theme || 'dark';
    currentTheme = themeContext.currentTheme || 'dark';
    changeTheme = themeContext.changeTheme || (() => {});
  } catch (error) {
    console.warn('Theme context not available');
  }

  // Reactive notifications from context
  let notifications = [];
  let unreadCount = 0;
  let markAsRead = () => {};
  let markAllAsRead = () => {};

  try {
    const notifContext = useNotifications();
    notifications = notifContext.notifications || [];
    unreadCount = notifContext.unreadCount || 0;
    markAsRead = notifContext.markAsRead || (() => {});
    markAllAsRead = notifContext.markAllAsRead || (() => {});
  } catch (err) {
    console.warn('NotificationContext not mounted yet');
  }
  
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);

  const themeMenuRef = useRef(null);
  const profileMenuRef = useRef(null);
  const notificationMenuRef = useRef(null);

  const getUserData = () => {
    try {
      const userDataStr = localStorage.getItem('auth_user') || localStorage.getItem('user');
      if (userDataStr) {
        return JSON.parse(userDataStr);
      }
    } catch (error) {
      console.error('Error getting user role:', error);
    }
    return { role: 'softwareadmin', username: 'Admin User', fullName: 'Software Administrator' };
  };

  const user = getUserData();
  const role = user?.role?.toLowerCase() || 'softwareadmin';

  const roleDisplayName = {
    softwareadmin: 'Software Admin',
    merchant: 'Merchant',
    branchadmin: 'Branch Admin',
    bankadmin: 'Bank Admin',
    agent: 'Field Agent',
    customer: 'Customer'
  }[role] || 'User';

  const themeLabels = {
    dark: 'Midnight Slate (Dark)',
    light: 'Enterprise Clean (Light)',
    blue: 'Corporate Banking (Blue)',
    charcoal: 'Graphite Slate (Neutral)',
    green: 'Fintech Emerald (Green)',
    gold: 'Wealth Management (Gold)'
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
      if (themeMenuRef.current && !themeMenuRef.current.contains(event.target)) {
        setShowThemeMenu(false);
      }
      if (notificationMenuRef.current && !notificationMenuRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/transactions?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleNotificationClick = (n) => {
    markAsRead(n.id);
    setShowNotifications(false);
    if (n.actionUrl) {
      navigate(n.actionUrl);
    } else {
      navigate('/notifications');
    }
  };

  return (
    <header className="ultra-topbar">
      
      {/* Left: Menu Trigger & Breadcrumbs */}
      <div className="topbar-left-zone">
        <button 
          className="topbar-menu-toggle" 
          onClick={onToggle}
          title="Toggle Navigation"
          aria-label="Toggle Navigation"
        >
          <TopIcons.Menu />
        </button>

        <div className="topbar-breadcrumbs">
          <span className="breadcrumb-home-link" onClick={() => navigate('/dashboard')}>
            <TopIcons.Home />
          </span>
          <span className="breadcrumb-slash">/</span>
          <span className="breadcrumb-active-title">{pageTitle}</span>

          {user?.branchName || user?.branch || (role === 'branchadmin' || role === 'bankadmin' ? 'Mumbai Central Regional Branch' : null) ? (
            <div className="topbar-branch-emblem-badge">
              <TopIcons.Building />
              <span className="branch-emblem-prefix">Branch:</span>
              <strong className="branch-emblem-bold-name">
                {user?.branchName || user?.branch || 'Mumbai Central Regional Branch'}
              </strong>
            </div>
          ) : null}
        </div>
      </div>

      {/* Right: Search & Actions */}
      <div className="topbar-right-zone">
        
        {/* Search Field */}
        <form className="topbar-search-box" onSubmit={handleSearch}>
          <span className="search-symbol">
            <TopIcons.Search />
          </span>
          <input
            type="text"
            placeholder="Search transactions, merchants, settlements..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-field-input"
          />
          <span className="search-key-badge">⌘K</span>
        </form>

        {/* Theme Picker Dropdown */}
        <div className="topbar-action-item" ref={themeMenuRef}>
          <button 
            className="action-icon-trigger"
            onClick={() => { setShowThemeMenu(!showThemeMenu); setShowNotifications(false); setShowProfileMenu(false); }}
            title="Palette Themes"
          >
            <TopIcons.Theme />
          </button>

          {showThemeMenu && (
            <div className="floating-popover theme-popover">
              <div className="popover-heading">
                <span>Color Palettes</span>
              </div>
              <div className="theme-swatch-list">
                {Object.keys(themes).map((key) => (
                  <button
                    key={key}
                    className={`theme-swatch-item ${currentTheme === key ? 'is-selected' : ''}`}
                    onClick={() => { changeTheme(key); setShowThemeMenu(false); }}
                  >
                    <span className="swatch-color-bubble" style={{ background: themes[key]?.accent || '#6366f1' }}></span>
                    <span className="swatch-name-label">{themeLabels[key] || themes[key]?.name || key}</span>
                    {currentTheme === key && <span className="swatch-check">✓</span>}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Dynamic Notifications Dropdown */}
        <div className="topbar-action-item" ref={notificationMenuRef}>
          <button 
            className="action-icon-trigger"
            onClick={() => { setShowNotifications(!showNotifications); setShowThemeMenu(false); setShowProfileMenu(false); }}
            title="System Alerts & Notifications"
            style={{ position: 'relative' }}
          >
            <TopIcons.Bell />
            {unreadCount > 0 && (
              <span className="notification-bubble-dot" style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                color: '#ffffff',
                fontSize: '10.5px',
                fontWeight: '800',
                minWidth: '18px',
                height: '18px',
                borderRadius: '9999px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 4px',
                boxShadow: '0 0 10px rgba(239, 68, 68, 0.6)',
                border: '2px solid #0f172a'
              }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="floating-popover notifications-popover" style={{ width: '360px', maxHeight: '480px', display: 'flex', flexDirection: 'column', background: 'var(--bgCard, #111827)', border: '1px solid var(--borderColor, rgba(255,255,255,0.08))' }}>
              <div className="popover-heading-split" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid var(--borderColor, rgba(255,255,255,0.08))' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="heading-title" style={{ fontWeight: '700', fontSize: '13.5px', color: 'var(--textPrimary, #f8fafc)' }}>System Alerts</span>
                  {unreadCount > 0 && (
                    <span className="unread-counter-tag" style={{
                      fontSize: '11px',
                      background: 'rgba(239, 68, 68, 0.15)',
                      color: '#ef4444',
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      fontWeight: '700',
                      border: '1px solid rgba(239, 68, 68, 0.3)'
                    }}>
                      {unreadCount} New
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllAsRead}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--accent, #6366f1)',
                      fontSize: '11.5px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      padding: '2px 6px',
                      borderRadius: '4px'
                    }}
                    title="Mark all as read"
                  >
                    ✓ Mark all read
                  </button>
                )}
              </div>

              <div className="notifications-stream" style={{ flex: 1, overflowY: 'auto', padding: '8px 0', maxHeight: '320px' }}>
                {notifications.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--textSecondary, #94a3b8)' }}>
                    <div style={{ fontSize: '28px', marginBottom: '8px' }}>✨</div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--textPrimary, #f8fafc)' }}>All Caught Up!</div>
                    <div style={{ fontSize: '12px', marginTop: '2px', color: 'var(--textMuted, #64748b)' }}>No active notifications at this time.</div>
                  </div>
                ) : (
                  notifications.slice(0, 6).map((n) => {
                    const cat = getCategoryMeta(n.category);
                    return (
                      <div 
                        key={n.id} 
                        className={`stream-item-card ${!n.read ? 'is-unread' : ''}`}
                        onClick={() => handleNotificationClick(n)}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '12px',
                          padding: '10px 14px',
                          cursor: 'pointer',
                          background: !n.read ? 'var(--accentLight, rgba(99, 102, 241, 0.08))' : 'transparent',
                          borderLeft: !n.read ? '3px solid var(--accent, #6366f1)' : '3px solid transparent',
                          borderBottom: '1px solid var(--borderLight, rgba(255,255,255,0.04))',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{
                          fontSize: '16px',
                          width: '28px',
                          height: '28px',
                          borderRadius: '8px',
                          background: 'var(--bgHover, rgba(255,255,255,0.05))',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          {cat.icon}
                        </div>
                        
                        <div className="stream-content" style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                            <span style={{ 
                              fontSize: '12.5px', 
                              fontWeight: !n.read ? '700' : '600', 
                              color: !n.read ? 'var(--textPrimary, #f8fafc)' : 'var(--textSecondary, #cbd5e1)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>
                              {n.title}
                            </span>
                            <span style={{ fontSize: '10.5px', color: 'var(--textMuted, #64748b)', whiteSpace: 'nowrap', marginLeft: '6px' }}>
                              {formatRelativeTime(n.time)}
                            </span>
                          </div>
                          
                          <div style={{
                            fontSize: '11.5px',
                            color: 'var(--textSecondary, #94a3b8)',
                            lineHeight: '1.4',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}>
                            {n.message}
                          </div>
                        </div>

                        {!n.read && (
                          <button
                            onClick={(e) => { e.stopPropagation(); markAsRead(n.id); }}
                            title="Mark as read"
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--accent, #6366f1)',
                              padding: '2px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                          >
                            <span style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              background: 'var(--accent, #6366f1)',
                              display: 'inline-block'
                            }}></span>
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              <div className="popover-footer-action" style={{ padding: '10px 14px', borderTop: '1px solid var(--borderColor, rgba(255,255,255,0.08))', textAlign: 'center' }}>
                <button 
                  className="view-all-alerts-btn" 
                  onClick={() => { setShowNotifications(false); navigate('/notifications'); }}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: 'var(--accentLight, rgba(99, 102, 241, 0.12))',
                    border: '1px solid var(--borderGlow, rgba(99, 102, 241, 0.25))',
                    color: 'var(--accent, #6366f1)',
                    fontWeight: '600',
                    fontSize: '12.5px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  View All Notifications Center →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Profile Avatar Pill */}
        <div className="topbar-action-item" ref={profileMenuRef}>
          <button 
            className="profile-pill-trigger" 
            onClick={() => { setShowProfileMenu(!showProfileMenu); setShowThemeMenu(false); setShowNotifications(false); }}
          >
            <div className="avatar-letter-bubble">
              {(user?.firstName || user?.username || 'A').charAt(0).toUpperCase()}
            </div>
            <div className="profile-pill-labels">
              <span className="pill-user-name">{user?.firstName || user?.username || 'Admin'}</span>
              <span className="pill-role-badge">{roleDisplayName}</span>
            </div>
          </button>

          {showProfileMenu && (
            <div className="floating-popover profile-popover">
              <div className="profile-meta-card">
                <div className="profile-meta-avatar">
                  {(user?.firstName || user?.username || 'A').charAt(0).toUpperCase()}
                </div>
                <div className="profile-meta-details">
                  <span className="profile-meta-name">{user?.fullName || user?.firstName || user?.username || 'System User'}</span>
                  <span className="profile-meta-email">{user?.email || 'admin@ecollect.com'}</span>
                </div>
              </div>

              <div className="popover-links-group">
                <NavLink to="/notifications" className="popover-nav-item" onClick={() => setShowProfileMenu(false)}>
                  <TopIcons.Bell />
                  <span>Notification Center</span>
                </NavLink>
                <NavLink to="/settings" className="popover-nav-item" onClick={() => setShowProfileMenu(false)}>
                  <TopIcons.Settings />
                  <span>Platform Settings</span>
                </NavLink>
                <NavLink to="/reports" className="popover-nav-item" onClick={() => setShowProfileMenu(false)}>
                  <TopIcons.User />
                  <span>Audit & Reports</span>
                </NavLink>
                
                <div className="popover-separator"></div>
                
                <NavLink to="/logout" className="popover-nav-item is-logout" onClick={() => setShowProfileMenu(false)}>
                  <TopIcons.Logout />
                  <span>Sign Out</span>
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