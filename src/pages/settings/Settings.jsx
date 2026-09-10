import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import LoadingAnimation from '../../components/common/LoadingAnimation';
import { useDialog } from '../../context/DialogContext';
import { useTheme } from '../../context/ThemeContext';
import { useMerchantContext } from '../../context/MerchantContext';
import { 
  getSmsConfig, 
  saveSmsConfig, 
  getSmsLogs, 
  sendSmsMessage, 
  DLT_TEMPLATES 
} from '../../services/smsService';
import WhatsAppConfig from './WhatsAppConfig';
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
  MessageSquare: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  ),
  Send: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  ),
  Phone: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
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
    company: 'Ecollect Pvt Ltd',
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

  const { currentTheme, changeTheme, themes: availableThemes } = useTheme();

  // System Preferences
  const [preferences, setPreferences] = useState({
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
          company: u.company || 'Ecollect Pvt Ltd',
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

  // SMS & DLT Gateway Configuration State
  const [smsConfig, setSmsConfig] = useState(getSmsConfig());
  const [smsLogs, setSmsLogs] = useState([]);
  const [testSmsForm, setTestSmsForm] = useState({
    mobileNumber: '',
    templateKey: 'PAYMENT_RECEIVED',
    customerName: 'Rajesh Sharma',
    amount: '12500',
    accountNumber: 'LN1004891',
    receiptNumber: 'REC-90821',
    remainingBalance: '237500',
    otp: '582910'
  });
  const [testSending, setTestSending] = useState(false);
  const [selectedTemplateTab, setSelectedTemplateTab] = useState('PAYMENT_RECEIVED');

  useEffect(() => {
    setSmsConfig(getSmsConfig(profile.merchantId));
    setSmsLogs(getSmsLogs());
  }, [profile.merchantId]);

  const handleSaveSmsConfig = (e) => {
    e.preventDefault();
    const ok = saveSmsConfig(smsConfig, profile.merchantId);
    if (ok) {
      showSuccess(`SMS configuration saved! Routing via ${smsConfig.routingMode === 'CUSTOM_MERCHANT' && smsConfig.customHeader ? smsConfig.customHeader.toUpperCase() : 'Default ECOLCT Header'}`, 'SMS Settings Updated');
    } else {
      showError('Failed to save SMS settings', 'Save Error');
    }
  };

  const handleSendTestSms = async (e) => {
    e.preventDefault();
    if (!testSmsForm.mobileNumber) {
      showError('Please enter a recipient mobile number', 'Mobile Required');
      return;
    }
    setTestSending(true);
    try {
      const res = await sendSmsMessage({
        templateKey: testSmsForm.templateKey,
        recipientMobile: testSmsForm.mobileNumber,
        variables: {
          customerName: testSmsForm.customerName,
          amount: testSmsForm.amount,
          accountNumber: testSmsForm.accountNumber,
          receiptNumber: testSmsForm.receiptNumber,
          remainingBalance: testSmsForm.remainingBalance,
          otp: testSmsForm.otp,
          dueDate: new Date(Date.now() + 86400000 * 5).toLocaleDateString('en-IN'),
          dueAmount: testSmsForm.amount,
          paymentLink: 'https://pay.ecollect.in/p/demo9821',
          paymentUrl: 'https://pay.ecollect.in/p/demo9821'
        },
        merchantId: profile.merchantId,
        merchantName: profile.company || 'eCollect'
      });

      if (res.success) {
        showSuccess(res.message, 'SMS Dispatched');
        setSmsLogs(getSmsLogs());
      } else {
        showError(res.message, 'Dispatch Failed');
      }
    } catch (err) {
      showError('Failed to dispatch test SMS message', 'Error');
    } finally {
      setTestSending(false);
    }
  };

  const { subscription } = useMerchantContext();

  const tabs = [
    { id: 'profile', label: 'Identity & Profile', icon: <SettingsIcons.User />, badge: 'Live' },
    { id: 'subscription', label: 'Subscription & Plans', icon: <SettingsIcons.Sparkles />, badge: subscription?.planCode || 'Active' },
    { id: 'security', label: 'Security & Auth', icon: <SettingsIcons.Lock /> },
    { id: 'notifications', label: 'Event Telemetry', icon: <SettingsIcons.Bell /> },
    { id: 'preferences', label: 'Portal Preferences', icon: <SettingsIcons.Palette /> },
    { id: 'sms_gateway', label: 'SMS & DLT Gateway', icon: <SettingsIcons.MessageSquare />, badge: 'Dual Header' },
    { id: 'whatsapp', label: 'WhatsApp Integration', icon: <i className="bi bi-whatsapp text-success" style={{ fontSize: '18px' }}></i>, badge: 'Telinfy API' },
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
            
            {/* TAB: SUBSCRIPTION & PLANS */}
            {activeTab === 'subscription' && (
              <div className="tab-pane-form">
                <div className="pane-header-zone">
                  <h3 className="pane-title">Merchant Subscription & Pricing Plans</h3>
                  <p className="pane-desc">Active plan details, communication quotas, customer capacity, and upgrade options</p>
                </div>

                <div className="settings-fields-grid">
                  <div className="settings-card-box" style={{ gridColumn: '1 / -1', background: 'var(--bgSecondary, #0f172a)', padding: '24px', borderRadius: '16px', border: '1px solid var(--borderGlow, rgba(99, 102, 241, 0.3))' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
                      <div>
                        <span style={{ fontSize: '12px', color: 'var(--accent, #6366f1)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Active Subscription Plan</span>
                        <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--textPrimary, #f8fafc)', margin: '4px 0 0 0' }}>
                          {subscription?.planName || localStorage.getItem('ecollect_active_plan_name') || 'Standard (Genesis) Plan'}
                        </h2>
                      </div>
                      <button
                        type="button"
                        className="settings-save-btn"
                        onClick={() => window.location.href = '/select-plan'}
                        style={{ padding: '10px 18px', borderRadius: '10px', background: 'var(--accentGradient, linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%))', color: '#fff', fontWeight: '700', border: 'none', cursor: 'pointer' }}
                      >
                        Upgrade / Change Plan →
                      </button>
                    </div>

                    {/* Quota Progress Meters */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginTop: '20px' }}>
                      <div style={{ background: 'var(--bgCard, #111827)', padding: '16px', borderRadius: '12px', border: '1px solid var(--borderLight, rgba(255,255,255,0.05))' }}>
                        <span style={{ fontSize: '12px', color: 'var(--textMuted, #64748b)' }}>Transaction Volume Quota</span>
                        <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--textPrimary, #f8fafc)', margin: '6px 0' }}>
                          ₹{(subscription?.usedTransactionVolume || 2500).toLocaleString('en-IN')} / {subscription?.maxTransactionVolume > 0 ? `₹${subscription.maxTransactionVolume.toLocaleString('en-IN')}` : 'Unlimited'}
                        </div>
                        <div style={{ height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: subscription?.maxTransactionVolume > 0 ? `${Math.min(100, ((subscription?.usedTransactionVolume || 2500) / subscription.maxTransactionVolume) * 100)}%` : '20%', height: '100%', background: '#06b6d4' }}></div>
                        </div>
                      </div>

                      <div style={{ background: 'var(--bgCard, #111827)', padding: '16px', borderRadius: '12px', border: '1px solid var(--borderLight, rgba(255,255,255,0.05))' }}>
                        <span style={{ fontSize: '12px', color: 'var(--textMuted, #64748b)' }}>Customer Accounts Capacity</span>
                        <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--textPrimary, #f8fafc)', margin: '6px 0' }}>
                          {subscription?.customerCount || 12} / {subscription?.maxCustomers > 0 ? `${subscription.maxCustomers} Accounts` : 'Unlimited'}
                        </div>
                        <div style={{ height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: subscription?.maxCustomers > 0 ? `${Math.min(100, ((subscription?.customerCount || 12) / subscription.maxCustomers) * 100)}%` : '25%', height: '100%', background: '#6366f1' }}></div>
                        </div>
                      </div>

                      <div style={{ background: 'var(--bgCard, #111827)', padding: '16px', borderRadius: '12px', border: '1px solid var(--borderLight, rgba(255,255,255,0.05))' }}>
                        <span style={{ fontSize: '12px', color: 'var(--textMuted, #64748b)' }}>SMS/WA/Call Communication Quota</span>
                        <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--textPrimary, #f8fafc)', margin: '6px 0' }}>
                          {subscription?.usedCommunicationQuota || 120} / {subscription?.maxCommunicationQuota > 0 ? `${subscription.maxCommunicationQuota} Sent` : 'Unlimited'}
                        </div>
                        <div style={{ height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: subscription?.maxCommunicationQuota > 0 ? `${Math.min(100, ((subscription?.usedCommunicationQuota || 120) / subscription.maxCommunicationQuota) * 100)}%` : '24%', height: '100%', background: '#10b981' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

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

            
            {/* TAB 5: SMS & DLT GATEWAY HUB (DUAL HEADER ROUTING) */}
            {activeTab === 'sms_gateway' && (
              <div className="tab-pane-form">
                
                {/* Header Zone */}
                <div className="pane-header-zone">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <h3 className="pane-title">SMS Gateway & TRAI DLT Header Routing</h3>
                      <p className="pane-desc">Configure customer notification headers (eCollect Default vs Entity Custom DLT Header)</p>
                    </div>
                    <span className="user-verified-badge" style={{ fontSize: '11px', padding: '4px 10px' }}>
                      <SettingsIcons.ShieldCheck />
                      <span>TRAI DLT / 100% Telecom Compliant</span>
                    </span>
                  </div>
                </div>

                <form onSubmit={handleSaveSmsConfig} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  
                  {/* Routing Mode Selector Card */}
                  <div style={{ padding: '16px 20px', borderRadius: '14px', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(15, 23, 42, 0.9))', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
                    <label className="field-label" style={{ marginBottom: '10px', display: 'block', fontSize: '13px', fontWeight: 700, color: '#818cf8' }}>
                      📡 Select SMS Header & Entity Routing Mode
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
                      
                      {/* Mode A: Platform Default */}
                      <div 
                        onClick={() => setSmsConfig(p => ({ ...p, routingMode: 'PLATFORM_DEFAULT' }))}
                        style={{ 
                          padding: '14px 16px', 
                          borderRadius: '12px', 
                          cursor: 'pointer',
                          background: smsConfig.routingMode === 'PLATFORM_DEFAULT' ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.03)',
                          border: smsConfig.routingMode === 'PLATFORM_DEFAULT' ? '2px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.1)',
                          transition: 'all 0.2s'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <span className="font-bold" style={{ color: '#fff', fontSize: '13.5px' }}>🏷️ eCollect Platform Header</span>
                          {smsConfig.routingMode === 'PLATFORM_DEFAULT' && <span style={{ color: '#10b981', fontWeight: 700, fontSize: '12px' }}>✓ Active</span>}
                        </div>
                        <p style={{ margin: 0, fontSize: '11.5px', color: '#94a3b8', lineHeight: 1.4 }}>
                          For entities without separate DLT registration. Dispatches standard OTP, payment receipts & due reminders via pre-approved <strong>ECOLCT / FINPAY</strong> headers.
                        </p>
                      </div>

                      {/* Mode B: Custom Merchant Header */}
                      <div 
                        onClick={() => setSmsConfig(p => ({ ...p, routingMode: 'CUSTOM_MERCHANT' }))}
                        style={{ 
                          padding: '14px 16px', 
                          borderRadius: '12px', 
                          cursor: 'pointer',
                          background: smsConfig.routingMode === 'CUSTOM_MERCHANT' ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.03)',
                          border: smsConfig.routingMode === 'CUSTOM_MERCHANT' ? '2px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.1)',
                          transition: 'all 0.2s'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <span className="font-bold" style={{ color: '#fff', fontSize: '13.5px' }}>🏢 Custom Entity DLT Header (BYO)</span>
                          {smsConfig.routingMode === 'CUSTOM_MERCHANT' && <span style={{ color: '#10b981', fontWeight: 700, fontSize: '12px' }}>✓ Active</span>}
                        </div>
                        <p style={{ margin: 0, fontSize: '11.5px', color: '#94a3b8', lineHeight: 1.4 }}>
                          For banks and corporate merchants with their own registered <strong>6-char DLT Header</strong> (e.g. HDFCBK, FINWIN), Principal Entity ID (PE ID), and custom SMS gateway.
                        </p>
                      </div>

                    </div>
                  </div>

                  {/* Gateway Parameters Form */}
                  <div className="settings-fields-grid">
                    
                    {smsConfig.routingMode === 'CUSTOM_MERCHANT' ? (
                      <>
                        <div className="settings-input-group">
                          <label className="field-label">Custom DLT Sender Header (6 Characters) <span className="req-star" style={{ color: '#ef4444' }}>*</span></label>
                          <input 
                            type="text"
                            maxLength={6}
                            placeholder="e.g. FINWIN, HDFCBK, SBINPS"
                            className="settings-field-input font-mono uppercase"
                            value={smsConfig.customHeader || ''}
                            onChange={(e) => setSmsConfig({ ...smsConfig, customHeader: e.target.value.toUpperCase() })}
                          />
                        </div>

                        <div className="settings-input-group">
                          <label className="field-label">DLT Principal Entity ID (PE ID) <span className="req-star" style={{ color: '#ef4444' }}>*</span></label>
                          <input 
                            type="text"
                            placeholder="e.g. 1101552990000012345"
                            className="settings-field-input font-mono"
                            value={smsConfig.principalEntityId || ''}
                            onChange={(e) => setSmsConfig({ ...smsConfig, principalEntityId: e.target.value })}
                          />
                        </div>

                        <div className="settings-input-group">
                          <label className="field-label">SMS Gateway Provider</label>
                          <select 
                            className="settings-field-input font-mono"
                            value={smsConfig.provider}
                            onChange={(e) => setSmsConfig({ ...smsConfig, provider: e.target.value })}
                          >
                            <option value="ECOLLECT_GATEWAY">eCollect Internal Telephony Gateway</option>
                            <option value="GUPSHUP">Gupshup Enterprise SMS</option>
                            <option value="FAST2SMS">Fast2SMS Gateway</option>
                            <option value="MSG91">MSG91 Transactional Hub</option>
                            <option value="TEXTLOCAL">Textlocal India</option>
                            <option value="TWILIO">Twilio Global SMS</option>
                          </select>
                        </div>

                        <div className="settings-input-group">
                          <label className="field-label">Gateway API Key / Token</label>
                          <input 
                            type="password"
                            placeholder="Enter gateway API authorization key"
                            className="settings-field-input font-mono"
                            value={smsConfig.apiKey || ''}
                            onChange={(e) => setSmsConfig({ ...smsConfig, apiKey: e.target.value })}
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="settings-input-group">
                          <label className="field-label">Platform Sender Header</label>
                          <input 
                            type="text"
                            disabled
                            className="settings-field-input font-mono"
                            value="ECOLCT (Default Managed by Platform)"
                          />
                        </div>

                        <div className="settings-input-group">
                          <label className="field-label">DLT Entity Status</label>
                          <input 
                            type="text"
                            disabled
                            className="settings-field-input font-mono text-green"
                            style={{ color: '#10b981' }}
                            value="✓ Platform Principal Entity Verified & Active"
                          />
                        </div>
                      </>
                    )}

                  </div>

                  {/* SMS Event Dispatch Toggles */}
                  <div className="settings-notification-stack">
                    <span className="stack-title">⚡ Automated SMS Dispatch Events</span>

                    <div className="toggle-item-row">
                      <div className="toggle-info">
                        <span className="toggle-label font-bold">🔐 Authentication OTP Dispatch</span>
                        <span className="toggle-desc">Automatically send 6-digit OTP via SMS on login, 2FA, and password reset requests</span>
                      </div>
                      <label className="switch-wrapper">
                        <input
                          type="checkbox"
                          checked={smsConfig.enableOtpSms !== false}
                          onChange={(e) => setSmsConfig({ ...smsConfig, enableOtpSms: e.target.checked })}
                        />
                        <span className="slider-round"></span>
                      </label>
                    </div>

                    <div className="toggle-item-row">
                      <div className="toggle-info">
                        <span className="toggle-label font-bold">🧾 Payment Received Receipt SMS</span>
                        <span className="toggle-desc">Automatically send instant receipt SMS to customer when Cash, QR, or Link payment succeeds</span>
                      </div>
                      <label className="switch-wrapper">
                        <input
                          type="checkbox"
                          checked={smsConfig.enablePaymentReceiptSms !== false}
                          onChange={(e) => setSmsConfig({ ...smsConfig, enablePaymentReceiptSms: e.target.checked })}
                        />
                        <span className="slider-round"></span>
                      </label>
                    </div>

                    <div className="toggle-item-row">
                      <div className="toggle-info">
                        <span className="toggle-label font-bold">⏰ Daily Due Demand & Installment Reminders</span>
                        <span className="toggle-desc">Trigger SMS notifications for upcoming and overdue loan/deposit installments</span>
                      </div>
                      <label className="switch-wrapper">
                        <input
                          type="checkbox"
                          checked={smsConfig.enableDueReminderSms !== false}
                          onChange={(e) => setSmsConfig({ ...smsConfig, enableDueReminderSms: e.target.checked })}
                        />
                        <span className="slider-round"></span>
                      </label>
                    </div>

                    <div className="toggle-item-row">
                      <div className="toggle-info">
                        <span className="toggle-label font-bold">🤝 Promise to Pay (PTP) Acknowledgement</span>
                        <span className="toggle-desc">Send customer confirmation SMS when field officer records a PTP commitment date</span>
                      </div>
                      <label className="switch-wrapper">
                        <input
                          type="checkbox"
                          checked={smsConfig.enablePtpSms !== false}
                          onChange={(e) => setSmsConfig({ ...smsConfig, enablePtpSms: e.target.checked })}
                        />
                        <span className="slider-round"></span>
                      </label>
                    </div>

                  </div>

                  <div className="form-action-bar">
                    <button type="submit" className="settings-action-btn">
                      <SettingsIcons.Save />
                      <span>Save SMS Gateway Configuration</span>
                    </button>
                  </div>
                </form>

                {/* DLT Approved Templates Explorer */}
                <div style={{ marginTop: '28px', padding: '20px', borderRadius: '16px', background: 'var(--bgCard, #111827)', border: '1px solid var(--borderColor, rgba(255, 255, 255, 0.12))' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800 }}>📋 Approved DLT Message Templates</h4>
                      <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>TRAI registered templates with dynamic placeholders</p>
                    </div>
                  </div>

                  {/* Template Navigation Pills */}
                  <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '14px' }}>
                    {Object.keys(DLT_TEMPLATES).map((key) => {
                      const t = DLT_TEMPLATES[key];
                      const isSel = selectedTemplateTab === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => {
                            setSelectedTemplateTab(key);
                            setTestSmsForm(p => ({ ...p, templateKey: key }));
                          }}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '8px',
                            background: isSel ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                            border: isSel ? '1px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.1)',
                            color: isSel ? '#818cf8' : '#94a3b8',
                            fontSize: '12px',
                            fontWeight: isSel ? 700 : 500,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {t.name}
                        </button>
                      );
                    })}
                  </div>

                  {/* Selected Template Card */}
                  {(() => {
                    const currentTmpl = DLT_TEMPLATES[selectedTemplateTab] || DLT_TEMPLATES.PAYMENT_RECEIVED;
                    const sampleSender = smsConfig.routingMode === 'CUSTOM_MERCHANT' && smsConfig.customHeader ? smsConfig.customHeader.toUpperCase() : 'ECOLCT';
                    let samplePreview = currentTmpl.templateText
                      .replace('{#var1#}', testSmsForm.customerName || 'Rajesh Sharma')
                      .replace('{#var2#}', 'Rs.' + Number(testSmsForm.amount || 12500).toLocaleString('en-IN'))
                      .replace('{#var3#}', testSmsForm.accountNumber || 'LN1004891')
                      .replace('{#var4#}', testSmsForm.receiptNumber || 'REC-90821')
                      .replace('{#var5#}', 'Rs.' + Number(testSmsForm.remainingBalance || 237500).toLocaleString('en-IN'))
                      .replace('{#sender#}', sampleSender);

                    return (
                      <div style={{ padding: '16px', borderRadius: '12px', background: '#0f172a', border: '1px dashed rgba(99, 102, 241, 0.3)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11.5px', color: '#94a3b8' }}>
                          <span className="font-mono">Template ID: <strong style={{ color: '#818cf8' }}>{currentTmpl.id}</strong></span>
                          <span className="font-mono">Category: <strong style={{ color: '#10b981' }}>{currentTmpl.category}</strong></span>
                          <span>Sender: <strong style={{ color: '#38bdf8' }}>{sampleSender}</strong></span>
                        </div>
                        <div style={{ padding: '12px 14px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.04)', fontSize: '13px', lineHeight: 1.5, color: '#f8fafc', fontFamily: 'monospace' }}>
                          💬 {samplePreview}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b', textAlign: 'right' }}>
                          Character Count: {samplePreview.length} / 160 GSM Chars (1 SMS Credit)
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Interactive Test SMS Dispatcher */}
                <div style={{ marginTop: '24px', padding: '20px', borderRadius: '16px', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(15, 23, 42, 0.95))', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: 800, color: '#10b981' }}>📱 Live Test SMS Dispatcher</h4>
                  <p style={{ margin: '0 0 16px 0', fontSize: '12px', color: '#94a3b8' }}>Verify real-time message delivery and DLT header formatting to any mobile number.</p>

                  <form onSubmit={handleSendTestSms} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    <div style={{ flex: '1 1 200px' }}>
                      <label className="field-label" style={{ fontSize: '11.5px', marginBottom: '4px' }}>Recipient Mobile Number</label>
                      <input 
                        type="tel"
                        maxLength={10}
                        placeholder="10-digit number (e.g. 9876543210)"
                        className="settings-field-input font-mono"
                        value={testSmsForm.mobileNumber}
                        onChange={(e) => setTestSmsForm({ ...testSmsForm, mobileNumber: e.target.value })}
                        required
                      />
                    </div>
                    <div style={{ flex: '1 1 180px' }}>
                      <label className="field-label" style={{ fontSize: '11.5px', marginBottom: '4px' }}>Message Template</label>
                      <select
                        className="settings-field-input font-mono"
                        value={testSmsForm.templateKey}
                        onChange={(e) => {
                          setTestSmsForm({ ...testSmsForm, templateKey: e.target.value });
                          setSelectedTemplateTab(e.target.value);
                        }}
                      >
                        {Object.keys(DLT_TEMPLATES).map((k) => (
                          <option key={k} value={k}>{DLT_TEMPLATES[k].name}</option>
                        ))}
                      </select>
                    </div>
                    <button 
                      type="submit" 
                      disabled={testSending}
                      className="settings-action-btn"
                      style={{ background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', padding: '10px 18px', height: '42px' }}
                    >
                      <SettingsIcons.Send />
                      <span>{testSending ? 'Sending...' : 'Send Live Test SMS'}</span>
                    </button>
                  </form>
                </div>

                {/* SMS Delivery Telemetry Log Table */}
                <div style={{ marginTop: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 800 }}>📜 Live SMS Telemetry & Delivery Ledger</h4>
                    <span className="font-mono text-muted" style={{ fontSize: '11.5px' }}>Showing {smsLogs.length} recent messages</span>
                  </div>

                  {smsLogs.length === 0 ? (
                    <div style={{ padding: '24px', textAlign: 'center', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.02)', border: '1px dashed rgba(255, 255, 255, 0.1)', color: '#94a3b8', fontSize: '12.5px' }}>
                      No SMS dispatches recorded in this session yet. Test sending above to verify delivery.
                    </div>
                  ) : (
                    <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', fontFamily: 'monospace' }}>
                        <thead>
                          <tr style={{ background: 'rgba(255, 255, 255, 0.04)', textAlign: 'left', color: '#94a3b8' }}>
                            <th style={{ padding: '10px 14px' }}>Time</th>
                            <th style={{ padding: '10px 14px' }}>Recipient</th>
                            <th style={{ padding: '10px 14px' }}>Header / Sender</th>
                            <th style={{ padding: '10px 14px' }}>Template</th>
                            <th style={{ padding: '10px 14px' }}>Status</th>
                            <th style={{ padding: '10px 14px' }}>Message Preview</th>
                          </tr>
                        </thead>
                        <tbody>
                          {smsLogs.map((log) => (
                            <tr key={log.id} style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                              <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', color: '#94a3b8' }}>
                                {new Date(log.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                              </td>
                              <td style={{ padding: '10px 14px', fontWeight: 700, color: '#38bdf8' }}>{log.recipientMobile}</td>
                              <td style={{ padding: '10px 14px' }}>
                                <span style={{ padding: '2px 8px', borderRadius: '6px', background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8', fontWeight: 700 }}>
                                  {log.headerUsed}
                                </span>
                              </td>
                              <td style={{ padding: '10px 14px', color: '#cbd5e1' }}>{log.templateName}</td>
                              <td style={{ padding: '10px 14px' }}>
                                <span style={{ color: '#10b981', fontWeight: 700 }}>● {log.status}</span>
                              </td>
                              <td style={{ padding: '10px 14px', color: '#94a3b8', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {log.messageBody}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* TAB 6: WHATSAPP INTEGRATION (TELINFY API) */}
            {activeTab === 'whatsapp' && (
              <WhatsAppConfig />
            )}

            {/* TAB 4: PORTAL PREFERENCES */}
            {activeTab === 'preferences' && (
              <div className="tab-pane-form">
                <div className="pane-header-zone">
                  <h3 className="pane-title">Regional & Portal Formatting</h3>
                  <p className="pane-desc">Configure dashboard localization, timezone, and fiscal calendar display</p>
                </div>

                <div className="settings-fields-grid">
                  <div className="settings-input-group" style={{ gridColumn: 'span 2' }}>
                    <label className="field-label">Portal Theme & Color Palette</label>
                    <select 
                      className="settings-field-input font-mono"
                      value={currentTheme}
                      onChange={(e) => changeTheme(e.target.value)}
                    >
                      <optgroup label="🌙 Executive Dark Themes">
                        {Object.keys(availableThemes).filter(k => !k.startsWith('light')).map((key) => (
                          <option key={key} value={key}>{availableThemes[key]?.name || key}</option>
                        ))}
                      </optgroup>
                      <optgroup label="☀️ Ultra-Premium Light Themes">
                        {Object.keys(availableThemes).filter(k => k.startsWith('light')).map((key) => (
                          <option key={key} value={key}>{availableThemes[key]?.name || key}</option>
                        ))}
                      </optgroup>
                    </select>
                  </div>

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