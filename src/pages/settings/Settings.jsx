import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import LoadingAnimation from '../../components/common/LoadingAnimation';
import './Settings.css';

// SVG Icons
const Icons = {
  User: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  Lock: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
  Bell: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  ),
  Palette: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="13.5" cy="6.5" r="1.5" />
      <circle cx="17.5" cy="10.5" r="1.5" />
      <circle cx="17.5" cy="14.5" r="1.5" />
      <circle cx="13.5" cy="18.5" r="1.5" />
      <circle cx="6.5" cy="11.5" r="1.5" />
      <circle cx="6.5" cy="17.5" r="1.5" />
      <path d="M12 2C6.48 2 2 6.04 2 10.5c0 2.89 1.68 5.45 4.24 6.97L6 21l3-1.5c1.6.71 3.4.89 5.1.62 1.5-.23 2.9-.8 4.08-1.65C19.52 17.36 22 14.13 22 10.5 22 6.04 17.52 2 12 2z" />
    </svg>
  ),
  Globe: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  ),
  Save: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  ),
  Check: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  ChevronRight: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  ),
  Moon: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  ),
  Sun: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  ),
  Sparkles: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3z" />
    </svg>
  ),
  Refresh: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  ),
};

const Settings = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Profile Form State
  const [profile, setProfile] = useState({
    fullName: 'John Doe',
    email: 'john@ecollect.com',
    phone: '+91 98765 43210',
    company: 'E-Collect Tech Pvt Ltd',
    designation: 'Software Administrator',
  });

  // Security Form State
  const [security, setSecurity] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Notification Settings
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: true,
    settlementAlerts: true,
    merchantUpdates: true,
    agentActivity: false,
  });

  // Theme State
  const [theme, setTheme] = useState('dark');

  const handleProfileChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSecurityChange = (e) => {
    setSecurity({ ...security, [e.target.name]: e.target.value });
  };

  const handleNotificationToggle = (key) => {
    setNotifications({ ...notifications, [key]: !notifications[key] });
  };

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
  };

  const handleSave = (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }, 1500);
  };

  // Simulate page loading
  React.useEffect(() => {
    setPageLoading(true);
    setTimeout(() => setPageLoading(false), 800);
  }, []);

  const tabs = [
    { id: 'profile', label: 'Profile', icon: <Icons.User /> },
    { id: 'security', label: 'Security', icon: <Icons.Lock /> },
    { id: 'notifications', label: 'Notifications', icon: <Icons.Bell /> },
    { id: 'preferences', label: 'Preferences', icon: <Icons.Palette /> },
  ];

  if (pageLoading) {
    return (
      <DashboardLayout pageTitle="Settings">
        <LoadingAnimation 
          message="Loading settings" 
          type="coin" 
          size="medium"
        />
      </DashboardLayout>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="settings-tab-content">
            <div className="settings-section">
              <h3>Personal Information</h3>
              <p className="section-desc">Update your personal details and contact information</p>

              <div className="settings-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Full Name</label>
                    <input
                      type="text"
                      name="fullName"
                      value={profile.fullName}
                      onChange={handleProfileChange}
                      className="settings-input"
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div className="form-group">
                    <label>Email Address</label>
                    <input
                      type="email"
                      name="email"
                      value={profile.email}
                      onChange={handleProfileChange}
                      className="settings-input"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Phone Number</label>
                    <input
                      type="text"
                      name="phone"
                      value={profile.phone}
                      onChange={handleProfileChange}
                      className="settings-input"
                      placeholder="Enter your phone number"
                    />
                  </div>
                  <div className="form-group">
                    <label>Designation</label>
                    <input
                      type="text"
                      name="designation"
                      value={profile.designation}
                      onChange={handleProfileChange}
                      className="settings-input"
                      placeholder="Enter your designation"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group full-width">
                    <label>Company / Organization</label>
                    <input
                      type="text"
                      name="company"
                      value={profile.company}
                      onChange={handleProfileChange}
                      className="settings-input"
                      placeholder="Enter your company name"
                    />
                  </div>
                </div>

                <button className="settings-save-btn" onClick={handleSave} disabled={loading}>
                  {loading ? (
                    <>
                      <span className="spinner-small"></span>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Icons.Save />
                      Save Changes
                    </>
                  )}
                </button>

                {success && (
                  <div className="settings-success">
                    <Icons.Check />
                    <span>Settings saved successfully!</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="settings-tab-content">
            <div className="settings-section">
              <h3>Security Settings</h3>
              <p className="section-desc">Update your password and security preferences</p>

              <div className="settings-form">
                <div className="form-group">
                  <label>Current Password</label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={security.currentPassword}
                    onChange={handleSecurityChange}
                    className="settings-input"
                    placeholder="Enter your current password"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>New Password</label>
                    <input
                      type="password"
                      name="newPassword"
                      value={security.newPassword}
                      onChange={handleSecurityChange}
                      className="settings-input"
                      placeholder="Enter new password"
                    />
                  </div>
                  <div className="form-group">
                    <label>Confirm Password</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={security.confirmPassword}
                      onChange={handleSecurityChange}
                      className="settings-input"
                      placeholder="Confirm new password"
                    />
                  </div>
                </div>

                <div className="security-tips">
                  <div className="tip-item">
                    <Icons.Check />
                    <span>Must be at least 8 characters</span>
                  </div>
                  <div className="tip-item">
                    <Icons.Check />
                    <span>Include uppercase and lowercase letters</span>
                  </div>
                  <div className="tip-item">
                    <Icons.Check />
                    <span>Include numbers and special characters</span>
                  </div>
                </div>

                <button className="settings-save-btn" onClick={handleSave} disabled={loading}>
                  {loading ? (
                    <>
                      <span className="spinner-small"></span>
                      Updating...
                    </>
                  ) : (
                    <>
                      <Icons.Save />
                      Update Password
                    </>
                  )}
                </button>

                {success && (
                  <div className="settings-success">
                    <Icons.Check />
                    <span>Password updated successfully!</span>
                  </div>
                )}
              </div>
            </div>

            <div className="settings-section two-factor">
              <h3>Two-Factor Authentication</h3>
              <p className="section-desc">Add an extra layer of security to your account</p>

              <div className="two-factor-card">
                <div className="tf-status">
                  <span className="tf-badge disabled">Disabled</span>
                  <span className="tf-label">Two-factor authentication is currently turned off</span>
                </div>
                <button className="tf-enable-btn">
                  <Icons.Lock />
                  Enable 2FA
                </button>
              </div>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="settings-tab-content">
            <div className="settings-section">
              <h3>Notification Preferences</h3>
              <p className="section-desc">Manage how you receive notifications and alerts</p>

              <div className="notification-list">
                <div className="notification-item">
                  <div className="notification-info">
                    <Icons.Bell />
                    <div>
                      <span className="notif-label">Email Notifications</span>
                      <span className="notif-desc">Receive notifications via email</span>
                    </div>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={notifications.emailNotifications}
                      onChange={() => handleNotificationToggle('emailNotifications')}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="notification-item">
                  <div className="notification-info">
                    <Icons.Bell />
                    <div>
                      <span className="notif-label">Push Notifications</span>
                      <span className="notif-desc">Receive real-time push notifications</span>
                    </div>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={notifications.pushNotifications}
                      onChange={() => handleNotificationToggle('pushNotifications')}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="notification-item">
                  <div className="notification-info">
                    <Icons.Bell />
                    <div>
                      <span className="notif-label">Settlement Alerts</span>
                      <span className="notif-desc">Get notified about settlement updates</span>
                    </div>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={notifications.settlementAlerts}
                      onChange={() => handleNotificationToggle('settlementAlerts')}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="notification-item">
                  <div className="notification-info">
                    <Icons.Bell />
                    <div>
                      <span className="notif-label">Merchant Updates</span>
                      <span className="notif-desc">Receive merchant activity updates</span>
                    </div>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={notifications.merchantUpdates}
                      onChange={() => handleNotificationToggle('merchantUpdates')}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="notification-item">
                  <div className="notification-info">
                    <Icons.Bell />
                    <div>
                      <span className="notif-label">Agent Activity</span>
                      <span className="notif-desc">Get notified about agent activity</span>
                    </div>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={notifications.agentActivity}
                      onChange={() => handleNotificationToggle('agentActivity')}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>

              <button className="settings-save-btn" onClick={handleSave} disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner-small"></span>
                    Saving...
                  </>
                ) : (
                  <>
                    <Icons.Save />
                    Save Preferences
                  </>
                )}
              </button>

              {success && (
                <div className="settings-success">
                  <Icons.Check />
                  <span>Notification preferences saved!</span>
                </div>
              )}
            </div>
          </div>
        );

      case 'preferences':
        return (
          <div className="settings-tab-content">
            <div className="settings-section">
              <h3>Theme Preferences</h3>
              <p className="section-desc">Customize the look and feel of your dashboard</p>

              <div className="theme-selector">
                <div className={`theme-option ${theme === 'light' ? 'active' : ''}`} onClick={() => handleThemeChange('light')}>
                  <div className="theme-preview light">
                    <Icons.Sun />
                  </div>
                  <span className="theme-name">Light</span>
                  {theme === 'light' && <Icons.Check className="theme-check" />}
                </div>

                <div className={`theme-option ${theme === 'dark' ? 'active' : ''}`} onClick={() => handleThemeChange('dark')}>
                  <div className="theme-preview dark">
                    <Icons.Moon />
                  </div>
                  <span className="theme-name">Dark</span>
                  {theme === 'dark' && <Icons.Check className="theme-check" />}
                </div>

                <div className={`theme-option ${theme === 'system' ? 'active' : ''}`} onClick={() => handleThemeChange('system')}>
                  <div className="theme-preview system">
                    <Icons.Globe />
                  </div>
                  <span className="theme-name">System</span>
                  {theme === 'system' && <Icons.Check className="theme-check" />}
                </div>
              </div>
            </div>

            <div className="settings-section">
              <h3>Language & Region</h3>
              <p className="section-desc">Choose your preferred language and regional settings</p>

              <div className="settings-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Language</label>
                    <select className="settings-select">
                      <option value="en">English (US)</option>
                      <option value="en-IN">English (India)</option>
                      <option value="hi">Hindi</option>
                      <option value="ta">Tamil</option>
                      <option value="te">Telugu</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Time Zone</label>
                    <select className="settings-select">
                      <option value="IST">India Standard Time (GMT+5:30)</option>
                      <option value="UTC">Coordinated Universal Time (UTC)</option>
                      <option value="EST">Eastern Standard Time (GMT-5:00)</option>
                      <option value="PST">Pacific Standard Time (GMT-8:00)</option>
                    </select>
                  </div>
                </div>

                <button className="settings-save-btn" onClick={handleSave} disabled={loading}>
                  {loading ? (
                    <>
                      <span className="spinner-small"></span>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Icons.Save />
                      Save Preferences
                    </>
                  )}
                </button>

                {success && (
                  <div className="settings-success">
                    <Icons.Check />
                    <span>Preferences saved successfully!</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <DashboardLayout pageTitle="Settings">
      <div className="settings-page">
        {/* Header */}
        <div className="settings-header">
          <div>
            <div className="header-badge" style={{ background: 'rgba(139, 92, 246, 0.12)', color: '#8b5cf6' }}>
              <Icons.Sparkles />
              <span>Account & System Settings</span>
            </div>
            <h1 className="settings-title">Settings</h1>
            <p className="settings-subtitle">Manage your account, security, and application preferences</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="settings-main">
          {/* Sidebar Tabs */}
          <div className="settings-sidebar">
            <div className="settings-nav">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  className={`settings-nav-btn ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <span className="nav-icon">{tab.icon}</span>
                  <span className="nav-label">{tab.label}</span>
                  <Icons.ChevronRight className="nav-chevron" />
                </button>
              ))}
            </div>

            <div className="settings-sidebar-footer">
              <div className="user-card">
                <div className="user-avatar">
                  <Icons.User />
                </div>
                <div>
                  <span className="user-name">John Doe</span>
                  <span className="user-role">Software Admin</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Content */}
          <div className="settings-content">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Settings;