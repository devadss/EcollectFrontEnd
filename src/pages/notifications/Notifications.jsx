import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { useNotifications } from '../../context/NotificationContext';
import './Notifications.css';

// SVG Icons
const NotifIcons = {
  Search: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  Check: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  Trash: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  ),
  Refresh: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  ),
  ArrowRight: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  )
};

// Format Relative Time Helper
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
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
};

// Category Metadata
const getCategoryMeta = (category = '') => {
  const cat = category.toUpperCase();
  switch (cat) {
    case 'APPROVALS':
    case 'BRANCH':
      return { icon: '🏢', label: 'Approvals & KYC', bg: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' };
    case 'SETTLEMENTS':
    case 'FINANCIAL':
      return { icon: '💳', label: 'Settlements & Disbursals', bg: 'rgba(16, 185, 129, 0.15)', color: '#34d399' };
    case 'AGENTS':
      return { icon: '👤', label: 'Field Agents', bg: 'rgba(6, 182, 212, 0.15)', color: '#38bdf8' };
    case 'SECURITY':
      return { icon: '🔒', label: 'Security & Access', bg: 'rgba(168, 85, 247, 0.15)', color: '#c084fc' };
    case 'SYSTEM':
    default:
      return { icon: '⚡', label: 'System & Core API', bg: 'rgba(139, 92, 246, 0.15)', color: '#a78bfa' };
  }
};

const Notifications = () => {
  const navigate = useNavigate();
  const rawRole = localStorage.getItem('user_role') || localStorage.getItem('role') || 'softwareadmin';

  const {
    notifications,
    unreadCount,
    loading,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllRead
  } = useNotifications();

  const [activeTab, setActiveTab] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshNotifications();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Filter logic
  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      // Tab filter
      if (activeTab === 'UNREAD' && n.read) return false;
      if (activeTab !== 'ALL' && activeTab !== 'UNREAD') {
        const cat = (n.category || '').toUpperCase();
        if (activeTab === 'APPROVALS' && cat !== 'APPROVALS' && cat !== 'BRANCH') return false;
        if (activeTab === 'SETTLEMENTS' && cat !== 'SETTLEMENTS' && cat !== 'FINANCIAL') return false;
        if (activeTab === 'AGENTS' && cat !== 'AGENTS') return false;
        if (activeTab === 'SECURITY' && cat !== 'SECURITY') return false;
        if (activeTab === 'SYSTEM' && cat !== 'SYSTEM') return false;
      }

      // Priority filter
      if (priorityFilter !== 'ALL') {
        const p = (n.priority || '').toUpperCase();
        if (priorityFilter === 'HIGH' && p !== 'HIGH' && p !== 'URGENT') return false;
        if (priorityFilter === 'INFO' && p !== 'INFO') return false;
        if (priorityFilter === 'SUCCESS' && p !== 'SUCCESS') return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch = (n.title || '').toLowerCase().includes(q);
        const msgMatch = (n.message || '').toLowerCase().includes(q);
        const catMatch = (n.category || '').toLowerCase().includes(q);
        if (!titleMatch && !msgMatch && !catMatch) return false;
      }

      return true;
    });
  }, [notifications, activeTab, priorityFilter, searchQuery]);

  // High urgency count
  const highUrgencyCount = useMemo(() => {
    return notifications.filter(n => (n.priority === 'HIGH' || n.priority === 'URGENT') && !n.read).length;
  }, [notifications]);

  return (
    <DashboardLayout role={rawRole}>
      <div className="notifications-page">
        
        {/* Page Header */}
        <div className="notifications-header">
          <div className="notifications-header-left">
            <h1>
              <span className="gradient-text">Event Telemetry & Notifications</span>
            </h1>
            <p>Real-time system telemetry, approval workflows, settlement alerts, and CBS core events</p>
          </div>

          <div className="notifications-header-actions">
            <button 
              className="btn-outline" 
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <NotifIcons.Refresh /> {isRefreshing ? 'Syncing...' : 'Refresh Feed'}
            </button>

            {unreadCount > 0 && (
              <button 
                className="btn-outline" 
                onClick={markAllAsRead}
                style={{ borderColor: 'rgba(99, 102, 241, 0.4)', color: '#818cf8' }}
              >
                <NotifIcons.Check /> Mark All Read ({unreadCount})
              </button>
            )}

            {notifications.some(n => n.read) && (
              <button 
                className="btn-outline" 
                onClick={clearAllRead}
                style={{ borderColor: 'rgba(239, 68, 68, 0.3)', color: '#f87171' }}
              >
                <NotifIcons.Trash /> Clear Read
              </button>
            )}
          </div>
        </div>

        {/* KPI Statistics Row */}
        <div className="notifications-stats-grid">
          <div className="notif-stat-card">
            <div className="notif-stat-icon-wrap" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
              🔔
            </div>
            <div className="notif-stat-info">
              <span className="notif-stat-value">{notifications.length}</span>
              <span className="notif-stat-label">Total Notifications</span>
            </div>
          </div>

          <div className="notif-stat-card">
            <div className="notif-stat-icon-wrap" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171' }}>
              ⚡
            </div>
            <div className="notif-stat-info">
              <span className="notif-stat-value" style={{ color: unreadCount > 0 ? '#f87171' : '#f8fafc' }}>
                {unreadCount}
              </span>
              <span className="notif-stat-label">Unread & Pending</span>
            </div>
          </div>

          <div className="notif-stat-card">
            <div className="notif-stat-icon-wrap" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
              🛡️
            </div>
            <div className="notif-stat-info">
              <span className="notif-stat-value" style={{ color: highUrgencyCount > 0 ? '#fbbf24' : '#f8fafc' }}>
                {highUrgencyCount}
              </span>
              <span className="notif-stat-label">Action Required</span>
            </div>
          </div>

          <div className="notif-stat-card">
            <div className="notif-stat-icon-wrap" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
              🌐
            </div>
            <div className="notif-stat-info">
              <span className="notif-stat-value" style={{ color: '#34d399' }}>100%</span>
              <span className="notif-stat-label">Live Gateway Sync</span>
            </div>
          </div>
        </div>

        {/* Controls & Filter Bar */}
        <div className="notifications-controls-bar">
          <div className="notif-tab-buttons">
            <button 
              className={`notif-tab-btn ${activeTab === 'ALL' ? 'active' : ''}`}
              onClick={() => setActiveTab('ALL')}
            >
              All Alerts <span className="notif-tab-badge">{notifications.length}</span>
            </button>

            <button 
              className={`notif-tab-btn ${activeTab === 'UNREAD' ? 'active' : ''}`}
              onClick={() => setActiveTab('UNREAD')}
            >
              Unread {unreadCount > 0 && <span className="notif-tab-badge" style={{ background: '#ef4444' }}>{unreadCount}</span>}
            </button>

            <button 
              className={`notif-tab-btn ${activeTab === 'APPROVALS' ? 'active' : ''}`}
              onClick={() => setActiveTab('APPROVALS')}
            >
              🏢 Approvals & KYC
            </button>

            <button 
              className={`notif-tab-btn ${activeTab === 'SETTLEMENTS' ? 'active' : ''}`}
              onClick={() => setActiveTab('SETTLEMENTS')}
            >
              💳 Settlements
            </button>

            <button 
              className={`notif-tab-btn ${activeTab === 'AGENTS' ? 'active' : ''}`}
              onClick={() => setActiveTab('AGENTS')}
            >
              👤 Field Agents
            </button>

            <button 
              className={`notif-tab-btn ${activeTab === 'SECURITY' ? 'active' : ''}`}
              onClick={() => setActiveTab('SECURITY')}
            >
              🔒 Security
            </button>

            <button 
              className={`notif-tab-btn ${activeTab === 'SYSTEM' ? 'active' : ''}`}
              onClick={() => setActiveTab('SYSTEM')}
            >
              ⚡ Core API
            </button>
          </div>

          <div className="notif-search-and-extra">
            <div className="notif-search-input-wrap">
              <span className="notif-search-icon">
                <NotifIcons.Search />
              </span>
              <input
                type="text"
                placeholder="Search telemetry events, branch approvals, settlements, agent tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <select 
              className="notif-priority-select"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="ALL">All Severities</option>
              <option value="HIGH">High / Action Required</option>
              <option value="INFO">Informational</option>
              <option value="SUCCESS">Success / Synced</option>
            </select>
          </div>
        </div>

        {/* Notifications Stream */}
        {loading ? (
          <div className="notif-empty-state">
            <div className="spinner-large" style={{ margin: '0 auto 16px auto' }}></div>
            <div className="notif-empty-title">Loading Notification Stream...</div>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="notif-empty-state">
            <div className="notif-empty-icon">✨</div>
            <h3 className="notif-empty-title">No Notifications Found</h3>
            <p className="notif-empty-desc">
              {searchQuery || activeTab !== 'ALL' || priorityFilter !== 'ALL'
                ? 'No alerts match your active filter criteria. Try adjusting the search query or category tabs.'
                : 'You are completely up to date! All system alerts and approval requests have been resolved.'}
            </p>
            {(searchQuery || activeTab !== 'ALL' || priorityFilter !== 'ALL') && (
              <button 
                className="btn-outline" 
                onClick={() => { setActiveTab('ALL'); setPriorityFilter('ALL'); setSearchQuery(''); }}
              >
                Reset All Filters
              </button>
            )}
          </div>
        ) : (
          <div className="notifications-list">
            {filteredNotifications.map((n) => {
              const cat = getCategoryMeta(n.category);
              const priorityClass = (n.priority || 'info').toLowerCase();

              return (
                <div 
                  key={n.id} 
                  className={`notification-card ${!n.read ? 'is-unread' : ''}`}
                >
                  <div 
                    className="notif-card-icon"
                    style={{ background: cat.bg, color: cat.color }}
                  >
                    {cat.icon}
                  </div>

                  <div className="notif-card-body">
                    <div className="notif-card-top-row">
                      <div className="notif-title-group">
                        <h4 className="notif-card-title">{n.title}</h4>
                        <span className={`notif-priority-badge ${priorityClass}`}>
                          {n.priority || 'INFO'}
                        </span>
                        <span 
                          className="notif-meta-pill"
                          style={{ color: cat.color, borderColor: `${cat.color}30` }}
                        >
                          {cat.label}
                        </span>
                      </div>

                      <span className="notif-time-ago">
                        {formatRelativeTime(n.time)}
                      </span>
                    </div>

                    <p className="notif-card-message">{n.message}</p>

                    <div className="notif-card-bottom-row">
                      <div className="notif-meta-tags">
                        {n.meta?.merchantId && (
                          <span className="notif-meta-pill">Merchant #{n.meta.merchantId}</span>
                        )}
                        {n.meta?.branchCode && (
                          <span className="notif-meta-pill font-mono">Branch: {n.meta.branchCode}</span>
                        )}
                        {n.meta?.agentCode && (
                          <span className="notif-meta-pill font-mono">Agent: {n.meta.agentCode}</span>
                        )}
                        {n.meta?.batchId && (
                          <span className="notif-meta-pill font-mono">Batch: {n.meta.batchId}</span>
                        )}
                        {n.meta?.amount && (
                          <span className="notif-meta-pill" style={{ color: '#34d399' }}>{n.meta.amount}</span>
                        )}
                      </div>

                      <div className="notif-card-actions">
                        {n.actionUrl && (
                          <button
                            className="btn-notif-action"
                            onClick={() => {
                              markAsRead(n.id);
                              navigate(n.actionUrl);
                            }}
                          >
                            {n.actionLabel || 'View Details'} <NotifIcons.ArrowRight />
                          </button>
                        )}

                        <button
                          className="btn-notif-icon"
                          onClick={() => markAsRead(n.id)}
                          title={n.read ? 'Already read' : 'Mark as read'}
                          style={!n.read ? { color: '#818cf8', borderColor: '#818cf8' } : {}}
                        >
                          <NotifIcons.Check />
                        </button>

                        <button
                          className="btn-notif-icon delete"
                          onClick={() => deleteNotification(n.id)}
                          title="Delete notification"
                        >
                          <NotifIcons.Trash />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </DashboardLayout>
  );
};

export default Notifications;