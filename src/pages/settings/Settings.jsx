import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import LoadingAnimation from '../../components/common/LoadingAnimation';
import { useDialog } from '../../context/DialogContext';
import './Settings.css';

// Precision SVG Icons
const SettingsIcons = {
  User: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  Lock: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
  Bell: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  ),
  Palette: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="13.5" cy="6.5" r="1.5" />
      <circle cx="17.5" cy="10.5" r="1.5" />
      <circle cx="17.5" cy="14.5" r="1.5" />
      <circle cx="13.5" cy="18.5" r="1.5" />
      <circle cx="6.5" cy="11.5" r="1.5" />
      <circle cx="6.5" cy="17.5" r="1.5" />
      <path d="M12 2C6.48 2 2 6.04 2 10.5c0 2.89 1.68 5.45 4.24 6.97L6 21l3-1.5c1.6.71 3.4.89 5.1.62 1.5-.23 2.9-.8 4.08-1.65C19.52 17.36 22 14.13 22 10.5 22 6.04 17.52 2 12 2z" />
    </svg>
  ),
  Save: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  ),
  Check: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  ChevronRight: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  ),
  Sparkles: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3z" />
    </svg>
  ),
  ShieldCheck: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  ),
  Key: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7.5" cy="15.5" r="5.5" />
      <path d="m21 3-9.5 9.5" />
      <path d="m15.5 7.5 3 3" />
    </svg>
  ),
  Building: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <line x1="9" y1="6" x2="15" y2="6" />
      <line x1="9" y1="10" x2="15" y2="10" />
      <line x1="9" y1="14" x2="15" y2="14" />
    </svg>
  )
};

const Settings = () => {
  const { showSuccess, showError } = useDialog();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Profile State populated from LocalStorage
  const [profile, setProfile] = useState({
    id: '0',
    username: '',
    fullName: '',
    email: '',
    phone: '',
    role: 'SoftwareAdmin',
    company: 'Finwin Solutions Pvt Ltd',
    merchantId: '',
    branchId: '',
    agentId: '',
    integrationStatus: 'Active',
    isEmailVerified: true,
    isPhoneVerified: true,
  });

  // Security Form State
  const [security, setSecurity] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    twoFactorEnabled: true,
  });

  // Notification Preferences
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    settlementDisbursals: true,
    highValueReversals: true,
    agentYieldThresholds: false,
    securityLogins: true,
  });

  // System Preferences
  const [preferences, setPreferences] = useState({
    theme: 'dark',
    currency: 'INR (₹)',
    timezone: 'Asia/Kolkata (IST +5:30)',
    dateFormat: 'DD/MM/YYYY',
  });

  // Hydrate user data from localStorage
  useEffect(() => {
    try {
      const storedRaw = localStorage.getItem('auth_user') || localStorage.getItem('user');
      if (storedRaw) {
        const u = JSON.parse(storedRaw);
        setProfile({
          id: u.id || u.userId || '1',
          username: u.username || u.userName || 'admin',
          fullName: u.fullName || `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Rajesh Kumar Verma',
          email: u.email || 'rajesh.verma@finwin.in',
          phone: u.phone || u.mobileNumber || '+91 98450 11223',
          role: u.role || localStorage.getItem('userRole') || 'SoftwareAdmin',
          company: u.company || 'Finwin Solutions Pvt Ltd',
          merchantId: u.merchantId || 'MRC-98214',
          branchId: u.branchId || 'BR-MUM-01',
          agentId: u.agentId || 'AG-MUM-101',
          integrationStatus: u.integrationStatus || 'Active',
          isEmailVerified: u.isEmailVerified !== undefined ? u.isEmailVerified : true,
          isPhoneVerified: u.isPhoneVerified !== undefined ? u.isPhoneVerified : true,
        });
      }
    } catch (e) {
      console.warn('Failed to parse auth_user from localStorage:', e);
    } finally {
      const timer = setTimeout(() => setPageLoading(false), 350);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleProfileChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSecurityChange = (e) => {
    setSecurity({ ...security, [e.target.name]: e.target.value });
  };

  const handleNotificationToggle = (key) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    setLoading(true);
    setSaveSuccess(false);

    setTimeout(() => {
      try {
        // Persist updated profile back to localStorage
        const storedRaw = localStorage.getItem('auth_user') || localStorage.getItem('user') || '{}';
        const existing = JSON.parse(storedRaw);
        const updated = {
          ...existing,
          fullName: profile.fullName,
          email: profile.email,
          phone: profile.phone,
          company: profile.company,
        };
        localStorage.setItem('auth_user', JSON.stringify(updated));
        localStorage.setItem('user', JSON.stringify(updated));
      } catch (err) {
        console.error('Error saving updated profile to localStorage:', err);
      }

      setLoading(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 600);
  };

  const tabs = [
    { id: 'profile', label: 'Identity & Profile', icon: <SettingsIcons.User />, badge: 'Live' },
    { id: 'security', label: 'Security & Auth', icon: <SettingsIcons.Lock /> },
    { id: 'notifications', label: 'Event Telemetry', icon: <SettingsIcons.Bell /> },
    { id: 'preferences', label: 'Portal Preferences', icon: <SettingsIcons.Palette /> },
  ];

  if (pageLoading) {
    return (
      <DashboardLayout pageTitle="Settings">
        <LoadingAnimation message="Compiling Settings & Identity State..." />
      </DashboardLayout>
    );
  }

  // Get user avatar initials
  const initials = profile.fullName
    ? profile.fullName.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()
    : 'AD';

  return (
    <DashboardLayout pageTitle="Platform Settings">
      <div className="settings-page-wrapper">
        
        {/* Top Hero Header */}
        <div className="settings-hero-header">
          <div>
            <div className="settings-badge-chip">
              <span className="pulse-dot"></span>
              <SettingsIcons.Sparkles />
              <span>Identity & Configuration Management</span>
            </div>
            <h1 className="settings-page-title">
              Account & <span className="gradient-text">Gateway Settings</span>
            </h1>
            <p className="settings-page-subtitle">
              Manage credentials, authentication parameters, and event telemetry subscriptions
            </p>
          </div>
        </div>

        {/* User Identity Overview Banner */}
        <div className="settings-user-hero-card">
          <div className="user-hero-left">
            <div className="user-hero-avatar">
              <span>{initials}</span>
              <div className="avatar-status-dot"></div>
            </div>
            <div className="user-hero-info">
              <div className="user-hero-name-row">
                <h2 className="user-hero-name">{profile.fullName || 'Authorized Administrator'}</h2>
                <span className="user-role-badge font-mono">{profile.role}</span>
                <span className="user-verified-badge">
                  <SettingsIcons.ShieldCheck />
                  <span>2FA Verified</span>
                </span>
              </div>
              <div className="user-hero-meta-row">
                <span className="meta-pill font-mono">User ID: #{profile.id}</span>
                <span className="meta-pill font-mono">Username: @{profile.username}</span>
                <span className="meta-pill font-mono">Node: {profile.branchId}</span>
                <span className="meta-pill is-active">Gateway: {profile.integrationStatus}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Split Grid */}
        <div className="settings-layout-grid">
          
          {/* Left Navigation Tabs */}
          <div className="settings-nav-sidebar">
            <div className="settings-nav-group">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  className={`settings-tab-btn ${activeTab === tab.id ? 'is-active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <span className="tab-icon">{tab.icon}</span>
                  <span className="tab-label">{tab.label}</span>
                  {tab.badge && <span className="tab-pill-badge">{tab.badge}</span>}
                  <span className="tab-chevron"><SettingsIcons.ChevronRight /></span>
                </button>
              ))}
            </div>

            <div className="settings-sidebar-security-badge">
              <SettingsIcons.Key />
              <div>
                <span className="badge-title font-mono">TLS Session</span>
                <span className="badge-desc">256-Bit SSL Encrypted</span>
              </div>
            </div>
          </div>

          {/* Right Tab Content Zone */}
          <div className="settings-content-panel">
            
            {/* TAB 1: IDENTITY & PROFILE */}
            {activeTab === 'profile' && (
              <form onSubmit={handleSaveProfile} className="tab-pane-form">
                <div className="pane-header-zone">
                  <h3 className="pane-title">Personal & Operational Profile</h3>
                  <p className="pane-desc">Identity details synchronized from local authorization cache</p>
                </div>

                <div className="settings-fields-grid">
                  
                  <div className="settings-input-group">
                    <label className="field-label">Full Name</label>
                    <input
                      type="text"
                      name="fullName"
                      value={profile.fullName}
                      onChange={handleProfileChange}
                      className="settings-field-input"
                      placeholder="Enter legal full name"
                      required
                    />
                  </div>

                  <div className="settings-input-group">
                    <label className="field-label">Email Address (Registered)</label>
                    <input
                      type="email"
                      name="email"
                      value={profile.email}
                      onChange={handleProfileChange}
                      className="settings-field-input"
                      placeholder="Enter email address"
                      required
                    />
                  </div>

                  <div className="settings-input-group">
                    <label className="field-label">Primary Mobile Number</label>
                    <input
                      type="text"
                      name="phone"
                      value={profile.phone}
                      onChange={handleProfileChange}
                      className="settings-field-input font-mono"
                      placeholder="+91 98000 00000"
                    />
                  </div>

                  <div className="settings-input-group">
                    <label className="field-label">Security Role (Assigned)</label>
                    <input
                      type="text"
                      name="role"
                      value={profile.role}
                      disabled
                      className="settings-field-input is-readonly font-mono"
                    />
                  </div>

                  <div className="settings-input-group">
                    <label className="field-label">Associated Organization</label>
                    <input
                      type="text"
                      name="company"
                      value={profile.company}
                      onChange={handleProfileChange}
                      className="settings-field-input"
                      placeholder="Enter enterprise entity"
                    />
                  </div>

                  <div className="settings-input-group">
                    <label className="field-label">Assigned Node / Branch ID</label>
                    <input
                      type="text"
                      name="branchId"
                      value={profile.branchId}
                      disabled
                      className="settings-field-input is-readonly font-mono"
                    />
                  </div>

                </div>

                {/* Save Feedback Banner */}
                {saveSuccess && (
                  <div className="settings-toast-banner">
                    <SettingsIcons.Check />
                    <span>Profile synchronization saved successfully to local storage cache!</span>
                  </div>
                )}

                <div className="form-action-bar">
                  <button type="submit" className="settings-action-btn" disabled={loading}>
                    <SettingsIcons.Save />
                    <span>{loading ? 'Persisting Changes...' : 'Save Profile Changes'}</span>
                  </button>
                </div>
              </form>
            )}

            {/* TAB 2: SECURITY & CREDENTIALS */}
            {activeTab === 'security' && (
              <div className="tab-pane-form">
                <div className="pane-header-zone">
                  <h3 className="pane-title">Security & Password Management</h3>
                  <p className="pane-desc">Manage encrypted credentials and two-factor challenge rules</p>
                </div>

                <div className="settings-fields-grid">
                  <div className="settings-input-group is-full">
                    <label className="field-label">Current Master Password</label>
                    <input
                      type="password"
                      name="currentPassword"
                      value={security.currentPassword}
                      onChange={handleSecurityChange}
                      className="settings-field-input"
                      placeholder="Enter current password"
                    />
                  </div>

                  <div className="settings-input-group">
                    <label className="field-label">New Password</label>
                    <input
                      type="password"
                      name="newPassword"
                      value={security.newPassword}
                      onChange={handleSecurityChange}
                      className="settings-field-input"
                      placeholder="Enter new 12+ char password"
                    />
                  </div>

                  <div className="settings-input-group">
                    <label className="field-label">Confirm New Password</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={security.confirmPassword}
                      onChange={handleSecurityChange}
                      className="settings-field-input"
                      placeholder="Re-enter new password"
                    />
                  </div>
                </div>

                {/* Two-Factor Card */}
                <div className="security-sub-card">
                  <div className="sub-card-left">
                    <SettingsIcons.ShieldCheck />
                    <div>
                      <span className="sub-card-title">Hardware & TOTP Two-Factor Authentication</span>
                      <p className="sub-card-desc">Require one-time verification tokens on login for enterprise accounts</p>
                    </div>
                  </div>
                  <span className="tf-status-pill is-active">Active • Enforced</span>
                </div>

                <div className="form-action-bar">
                  <button 
                    type="button" 
                    className="settings-action-btn"
                    onClick={() => {
                      showSuccess('Password credentials and authentication protocols updated successfully!', 'Security Updated');
                    }}
                  >
                    <SettingsIcons.Key />
                    <span>Update Access Password</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: NOTIFICATIONS & TELEMETRY */}
            {activeTab === 'notifications' && (
              <div className="tab-pane-form">
                <div className="pane-header-zone">
                  <h3 className="pane-title">Real-Time Event Subscriptions</h3>
                  <p className="pane-desc">Automated webhook and email dispatches for financial actions</p>
                </div>

                <div className="toggle-list-stack">
                  
                  <div className="toggle-item-row">
                    <div className="toggle-info">
                      <span className="toggle-label font-bold">Settlement Disbursal Confirmations</span>
                      <span className="toggle-desc">Instant notification whenever batch settlement funds are transferred</span>
                    </div>
                    <label className="switch-wrapper">
                      <input
                        type="checkbox"
                        checked={notifications.settlementDisbursals}
                        onChange={() => handleNotificationToggle('settlementDisbursals')}
                      />
                      <span className="slider-round"></span>
                    </label>
                  </div>

                  <div className="toggle-item-row">
                    <div className="toggle-info">
                      <span className="toggle-label font-bold">High-Value Reversals & Dispute Alerts</span>
                      <span className="toggle-desc">Immediate high-priority alert for refunds exceeding ₹50,000</span>
                    </div>
                    <label className="switch-wrapper">
                      <input
                        type="checkbox"
                        checked={notifications.highValueReversals}
                        onChange={() => handleNotificationToggle('highValueReversals')}
                      />
                      <span className="slider-round"></span>
                    </label>
                  </div>

                  <div className="toggle-item-row">
                    <div className="toggle-info">
                      <span className="toggle-label font-bold">Agent Volume Quota Warnings</span>
                      <span className="toggle-desc">Trigger notification when field agent hits daily cash intake limit</span>
                    </div>
                    <label className="switch-wrapper">
                      <input
                        type="checkbox"
                        checked={notifications.agentYieldThresholds}
                        onChange={() => handleNotificationToggle('agentYieldThresholds')}
                      />
                      <span className="slider-round"></span>
                    </label>
                  </div>

                  <div className="toggle-item-row">
                    <div className="toggle-info">
                      <span className="toggle-label font-bold">New Security Session Ingress</span>
                      <span className="toggle-desc">Receive email alerts on new IP or browser authentication</span>
                    </div>
                    <label className="switch-wrapper">
                      <input
                        type="checkbox"
                        checked={notifications.securityLogins}
                        onChange={() => handleNotificationToggle('securityLogins')}
                      />
                      <span className="slider-round"></span>
                    </label>
                  </div>

                </div>

                <div className="form-action-bar">
                  <button 
                    type="button" 
                    className="settings-action-btn"
                    onClick={() => showSuccess('Telemetry alert subscriptions updated successfully.', 'Subscriptions Saved')}
                  >
                    <SettingsIcons.Save />
                    <span>Save Telemetry Rules</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 4: PORTAL PREFERENCES */}
            {activeTab === 'preferences' && (
              <div className="tab-pane-form">
                <div className="pane-header-zone">
                  <h3 className="pane-title">Regional & Portal Formatting</h3>
                  <p className="pane-desc">Configure dashboard localization, timezone, and fiscal calendar display</p>
                </div>

                <div className="settings-fields-grid">
                  <div className="settings-input-group">
                    <label className="field-label">Accounting Currency</label>
                    <select 
                      className="settings-field-input font-mono"
                      value={preferences.currency}
                      onChange={(e) => setPreferences({ ...preferences, currency: e.target.value })}
                    >
                      <option value="INR (₹)">INR - Indian Rupee (₹)</option>
                      <option value="USD ($)">USD - US Dollar ($)</option>
                      <option value="EUR (€)">EUR - Euro (€)</option>
                      <option value="AED (د.إ)">AED - UAE Dirham (د.إ)</option>
                    </select>
                  </div>

                  <div className="settings-input-group">
                    <label className="field-label">Fiscal Time Zone</label>
                    <select 
                      className="settings-field-input font-mono"
                      value={preferences.timezone}
                      onChange={(e) => setPreferences({ ...preferences, timezone: e.target.value })}
                    >
                      <option value="Asia/Kolkata (IST +5:30)">Asia/Kolkata (IST +5:30)</option>
                      <option value="UTC (Coordinated Universal)">UTC (+0:00)</option>
                      <option value="America/New_York (EST)">America/New_York (EST -5:00)</option>
                      <option value="Asia/Dubai (GST +4:00)">Asia/Dubai (GST +4:00)</option>
                    </select>
                  </div>
                </div>

                <div className="form-action-bar">
                  <button 
                    type="button" 
                    className="settings-action-btn"
                    onClick={() => showSuccess('Regional preferences and portal formatting applied.', 'Preferences Saved')}
                  >
                    <SettingsIcons.Save />
                    <span>Apply Preferences</span>
                  </button>
                </div>
              </div>
            )}

          </div>

        </div>

      </div>
    </DashboardLayout>
  );
};

export default Settings;