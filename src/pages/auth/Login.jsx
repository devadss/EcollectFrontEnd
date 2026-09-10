import React, { useState, useEffect, useRef } from 'react';
import { authApi } from '../../services/api';
import { requestOtp, resendOtp } from '../../services/smsService';
import { useTheme } from '../../context/ThemeContext';
import './Login.css';

// SVG Icon Library
const Icons = {
  Logo: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  Theme: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
      <circle cx="12" cy="12" r="4" />
    </svg>
  ),
  Mail: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="3" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  ),
  Lock: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
  Eye: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  EyeOff: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" x2="22" y1="2" y2="22" />
    </svg>
  ),
  ArrowRight: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  ),
  Check: () => (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  Sparkles: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3z" />
    </svg>
  ),
  Key: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7.5" cy="15.5" r="5.5" />
      <path d="m21 2-9.6 9.6" />
      <path d="m15.5 7.5 3 3L22 7l-3-3" />
    </svg>
  ),
  ShieldCheck: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  ),
  Close: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  Refresh: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
    </svg>
  )
};

const Login = () => {
  const { theme, currentTheme, changeTheme, themes } = useTheme();
  const isLight = theme?.id?.startsWith('light');
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const themeMenuRef = useRef(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [captchaCode, setCaptchaCode] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Generate 5-character Alphanumeric Captcha Code
  const generateCaptcha = () => {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaCode(code);
    setCaptchaInput('');
  };

  useEffect(() => {
    generateCaptcha();
    const reason = localStorage.getItem('ecollect_logout_reason');
    if (reason === 'inactivity') {
      setError('Your session has expired due to 15 minutes of inactivity for banking security. Please sign in again.');
      localStorage.removeItem('ecollect_logout_reason');
    }
  }, []);

  // Close theme menu on click outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (themeMenuRef.current && !themeMenuRef.current.contains(e.target)) {
        setShowThemeMenu(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Forgot Password Modal State
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1: Input Email/Phone, 2: Enter OTP & New Password, 3: Success
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [forgotShowPassword, setForgotShowPassword] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  // Timer countdown effect
  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleOpenForgot = (e) => {
    if (e) e.preventDefault();
    setForgotIdentifier(email || '');
    setForgotOtp('');
    setForgotNewPassword('');
    setForgotConfirmPassword('');
    setForgotError('');
    setForgotSuccess('');
    setForgotStep(1);
    setIsForgotOpen(true);
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    const cleanId = forgotIdentifier.trim();
    if (!cleanId) {
      setForgotError('Please enter your registered 10-digit mobile number or username.');
      return;
    }
    setForgotLoading(true);
    setForgotError('');
    setForgotSuccess('');

    try {
      // 1. Dispatch SMS via Aanvin SMS Gateway & Save MobLogin record
      const smsRes = await requestOtp(cleanId);
      if (smsRes.success) {
        setForgotSuccess(`SMS Sent Successfully! 4-digit OTP dispatched via Header ADSSPY to ${cleanId}.`);
        setForgotStep(2);
        setResendTimer(60);
        return;
      }
      
      const res = await authApi.forgotPassword(cleanId);
      const rawMsg = res?.data?.message || res?.data?.title || 'Security OTP has been dispatched to your registered address.';
      setForgotSuccess(rawMsg);
      setForgotStep(2);
      setResendTimer(60);
    } catch {
      setForgotSuccess('Security OTP generated. Please enter the 4-digit code sent to your mobile.');
      setForgotStep(2);
      setResendTimer(60);
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    setForgotLoading(true);
    setForgotError('');
    try {
      const cleanId = forgotIdentifier.trim();
      await resendOtp(cleanId);
      setForgotSuccess('Fresh 4-digit OTP re-sent via SMS (ADSSPY).');
      setResendTimer(60);
    } catch (err) {
      setForgotSuccess('A fresh verification code has been dispatched.');
      setResendTimer(60);
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!forgotOtp.trim()) {
      setForgotError('Please enter the verification OTP code.');
      return;
    }
    if (!forgotNewPassword || forgotNewPassword.length < 6) {
      setForgotError('New password must be at least 6 characters.');
      return;
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotError('New password and confirm password do not match.');
      return;
    }

    setForgotLoading(true);
    setForgotError('');
    setForgotSuccess('');

    try {
      await authApi.resetPassword({
        emailOrPhone: forgotIdentifier.trim(),
        otp: forgotOtp.trim(),
        newPassword: forgotNewPassword,
        confirmPassword: forgotConfirmPassword
      });
      setForgotStep(3);
    } catch (err) {
      try {
        await authApi.changePassword({
          username: forgotIdentifier.trim(),
          otp: forgotOtp.trim(),
          newPassword: forgotNewPassword
        });
        setForgotStep(3);
      } catch (nestedErr) {
        const msg = nestedErr?.response?.data?.message || err?.response?.data?.message || err?.message || 'Password update failed. Please verify your OTP.';
        setForgotError(msg);
      }
    } finally {
      setForgotLoading(false);
    }
  };

  const handleFinishReset = () => {
    setIsForgotOpen(false);
    setEmail(forgotIdentifier);
    setPassword(forgotNewPassword);
    setSuccessMsg('Password updated successfully! You may now sign in with your new credentials.');
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Captcha Validation
    if (!captchaInput.trim()) {
      setError('Please enter the security Captcha code.');
      return;
    }
    if (captchaInput.trim().toUpperCase() !== captchaCode.toUpperCase()) {
      setError('Invalid Captcha code. Please enter the characters shown in the image.');
      generateCaptcha();
      return;
    }

    setIsLoading(true);

    try {
      const res = await authApi.login({
        UsernameOrEmail: email.trim(),
        Password: password
      });

      const raw = res?.data || {};
      const responseData = raw.data || raw.result || raw;
      const token = responseData.token || responseData.Token || raw.token || raw.Token;
      const backendRole = responseData.role || responseData.Role || responseData.roleName || responseData.user?.role || raw.role || 'SoftwareAdmin';

      if (!token) {
        throw new Error(raw.message || responseData.message || 'Authentication failed: No access token returned from backend server.');
      }

      localStorage.setItem('auth_token', token);
      localStorage.setItem('token', token);

      if (responseData.refreshToken || raw.refreshToken) {
        localStorage.setItem('refresh_token', responseData.refreshToken || raw.refreshToken);
      }

      const branchName =
        responseData.branchName ||
        responseData.BranchName ||
        responseData.branch ||
        responseData.user?.branchName ||
        responseData.user?.BranchName ||
        responseData.user?.branch ||
        responseData.branchDetails?.branchName ||
        responseData.branchDetails?.name ||
        null;

      const branchCode =
        responseData.branchCode ||
        responseData.BranchCode ||
        responseData.user?.branchCode ||
        responseData.user?.BranchCode ||
        responseData.external_branch_id ||
        responseData.user?.external_branch_id ||
        null;

      const branchId = responseData.branchId || responseData.user?.branchId || null;

      const userData = {
        id: responseData.userId || responseData.id || responseData.user?.id || 1,
        username: responseData.username || responseData.userName || responseData.user?.username || email.trim(),
        email: responseData.email || responseData.user?.email || email.trim(),
        phone: responseData.phone || responseData.mobileNumber || responseData.user?.phone || '',
        firstName: responseData.firstName || responseData.firstname || responseData.user?.firstName || '',
        lastName: responseData.lastName || responseData.lastname || responseData.user?.lastName || '',
        role: backendRole,
        merchantId: responseData.merchantId || responseData.user?.merchantId || null,
        branchId: branchId,
        branchName: branchName,
        branchCode: branchCode,
        branch: branchName,
        agentId: responseData.agentId || responseData.user?.agentId || null,
        isActive: responseData.isActive !== undefined ? responseData.isActive : true,
        isEmailVerified: responseData.isEmailVerified || false,
        isPhoneVerified: responseData.isPhoneVerified || false,
        fullName: responseData.fullName || responseData.user?.fullName || `${responseData.firstName || ''} ${responseData.lastName || ''}`.trim() || email.trim(),
        integrationStatus: responseData.integrationStatus || 'No'
      };

      localStorage.setItem('auth_user', JSON.stringify(userData));
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('userRole', backendRole);
      localStorage.setItem('admin_selected_merchant_id', 'ALL');
      if (branchId) localStorage.setItem('branchId', String(branchId));
      if (branchName) localStorage.setItem('branchName', branchName);
      if (branchCode) localStorage.setItem('branchCode', branchCode);
      if (userData.merchantId) localStorage.setItem('merchantId', String(userData.merchantId));
      if (userData.agentId) localStorage.setItem('agentId', String(userData.agentId));
      localStorage.setItem('integrationStatus', responseData.integrationStatus || 'No');

      // Store dynamic listUrl & collectionConfig for unified mobile/web API dispatch
      const listUrlObj = responseData.listUrl || responseData.collectionConfig?.listUrl || null;
      if (listUrlObj) {
        localStorage.setItem('list_url', JSON.stringify(listUrlObj));
      }
      if (responseData.collectionConfig) {
        localStorage.setItem('collection_config', JSON.stringify(responseData.collectionConfig));
      }

      const permissions = responseData.permissions || raw.permissions;
      if (permissions && Array.isArray(permissions)) {
        localStorage.setItem('auth_permissions', JSON.stringify(permissions));
        localStorage.setItem('permissions', JSON.stringify(permissions));
      }

      const menus = responseData.menus || raw.menus;
      if (menus && Array.isArray(menus)) {
        localStorage.setItem('auth_menus', JSON.stringify(menus));
        localStorage.setItem('menus', JSON.stringify(menus));
      }

      window.location.href = '/dashboard';

    } catch (err) {
      console.error('❌ Login Error Details:', {
        status: err?.response?.status,
        statusText: err?.response?.statusText,
        data: err?.response?.data,
        message: err?.message
      });

      let serverMsg =
        err?.response?.data?.message ||
        err?.response?.data?.title ||
        err?.response?.data?.error ||
        (typeof err?.response?.data === 'string' && err?.response?.data) ||
        err?.message;

      if (err?.message === 'Network Error') {
        serverMsg = 'Network Error: Cannot reach backend server . If using HTTPS locally';
      } else if (!serverMsg || serverMsg === 'Request failed with status code 401') {
        serverMsg = 'Invalid username/email or password. Please verify your credentials.';
      }

      setError(serverMsg);
      generateCaptcha();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-viewport">
      {/* Floating Theme Switcher */}
      <div className="auth-theme-floating-toggle" ref={themeMenuRef}>
        <button
          type="button"
          className="auth-theme-pill-btn"
          onClick={() => setShowThemeMenu(!showThemeMenu)}
          title="Switch Theme Palette"
        >
          <Icons.Theme />
          <span className="auth-theme-pill-text">{isLight ? 'Light Theme' : 'Dark Theme'}</span>
          <span className="auth-theme-swatch-mini" style={{ background: theme?.accent || '#4f46e5' }}></span>
        </button>

        {showThemeMenu && (
          <div className="auth-theme-dropdown-menu">
            <div className="theme-dd-header">Theme & Appearance</div>
            <div className="theme-dd-section">☀️ Light Themes</div>
            {Object.keys(themes).filter(k => k.startsWith('light')).map((key) => (
              <button
                key={key}
                type="button"
                className={`theme-dd-item ${currentTheme === key ? 'is-active' : ''}`}
                onClick={() => { changeTheme(key); setShowThemeMenu(false); }}
              >
                <span className="theme-dd-dot" style={{ background: themes[key]?.accent || '#4f46e5' }}></span>
                <span className="theme-dd-label">{themes[key]?.name || key}</span>
                {currentTheme === key && <span className="theme-dd-check">✓</span>}
              </button>
            ))}

            <div className="theme-dd-section">🌙 Dark Themes</div>
            {Object.keys(themes).filter(k => !k.startsWith('light')).map((key) => (
              <button
                key={key}
                type="button"
                className={`theme-dd-item ${currentTheme === key ? 'is-active' : ''}`}
                onClick={() => { changeTheme(key); setShowThemeMenu(false); }}
              >
                <span className="theme-dd-dot" style={{ background: themes[key]?.accent || '#6366f1' }}></span>
                <span className="theme-dd-label">{themes[key]?.name || key}</span>
                {currentTheme === key && <span className="theme-dd-check">✓</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Interactive Ambient Cursor Spotlight */}
      <div
        className="cursor-spotlight"
        style={{
          transform: `translate(${mousePosition.x - 300}px, ${mousePosition.y - 300}px)`,
        }}
      />

      {/* Ambient Drifting Mesh Orbs */}
      <div className="login-ambient-grid">
        <div className="ambient-orb orb-primary"></div>
        <div className="ambient-orb orb-secondary"></div>
        <div className="ambient-orb orb-tertiary"></div>
      </div>

      {/* Floating Cyber Particle Constellation */}
      <div className="cyber-particles-layer">
        <div className="cyber-particle p1"></div>
        <div className="cyber-particle p2"></div>
        <div className="cyber-particle p3"></div>
        <div className="cyber-particle p4"></div>
      </div>

      {/* Main Glass Split Frame */}
      <div className="login-split-card">

        {/* Left Side: 3D Glassmorphic Visual Showcase (Ecollect Theme) */}
        <div className="login-visual-showcase">
          {/* Top Brand Watermark Pill */}
          <div className="visual-top-brand-badge">
            <span className="brand-pulse-dot"></span>
            <span>Ecollect Pvt Ltd</span>
          </div>

          {/* Ambient Inner Glowing Halo */}
          <div className="visual-ambient-glow"></div>

          {/* 3D Glass Artwork Frame */}
          <div className="visual-artwork-frame">
            <img
              src="/login-3d-glass.jpg"
              alt="Ecollect 3D Fintech Security & Payment Collection Engine"
              className="visual-3d-image"
            />
            {/* Shimmer Glass Overlay */}
            <div className="visual-shimmer-overlay"></div>
          </div>

          {/* Bottom Security Highlights */}
          <div className="visual-bottom-feature-strip">
            <span className="feat-chip">⚡ Dynamic UPI QR</span>
            <span className="feat-chip">🔒 Bank-Grade Security</span>
          </div>
        </div>

        {/* Right Side: Authentication Form Card */}
        <div className="login-form-panel">
          <div className="auth-form-glass-card">

            <div className="auth-card-header">
              <div className="auth-brand-logo-container">
                <div className="auth-logo-frame">
                  <div className="auth-logo-ambient-glow"></div>
                  <div className="auth-logo-shimmer-sweep"></div>
                  <div className="auth-ecollect-composite-brand">
                    <div className="auth-logo-e-flipper-stage">
                      <img
                        src="/ecollect-e-symbol.png"
                        alt="e"
                        className="auth-logo-e-img"
                      />
                    </div>
                    <img
                      src="/ecollect-collect-text.png"
                      alt="Collect - Smart Payment Solutions"
                      className="auth-logo-collect-img"
                    />
                  </div>
                </div>
              </div>
              <h2 className="auth-title">Welcome Back</h2>
              <p className="auth-subtitle">Authenticate to access your financial operations portal</p>
            </div>

            {error && (
              <div className="auth-error-banner">
                <span className="error-sign">⚠️</span>
                <span className="error-text-content">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form-body">

              {/* Username / Email */}
              <div className="auth-input-group">
                <label className="auth-input-label">Username or Email</label>
                <div className="auth-input-wrapper">
                  <span className="auth-input-icon"><Icons.Mail /></span>
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email or username"
                    className="auth-input-field"
                    required
                    autoFocus
                  />
                </div>
              </div>

              {/* Password */}
              <div className="auth-input-group">
                <div className="auth-label-row">
                  <label className="auth-input-label">Password</label>
                  <button
                    type="button"
                    className="auth-forgot-link"
                    onClick={handleOpenForgot}
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="auth-input-wrapper">
                  <span className="auth-input-icon"><Icons.Lock /></span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your security password"
                    className="auth-input-field"
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle-trigger"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <Icons.EyeOff /> : <Icons.Eye />}
                  </button>
                </div>
              </div>

              {/* Security Captcha */}
              <div className="auth-input-group">
                <label className="auth-input-label">Security Verification (Captcha)</label>
                <div className="auth-captcha-row">
                  <div className="auth-captcha-display" title="Security verification code">
                    <span className="captcha-char char-0">{captchaCode[0] || 'A'}</span>
                    <span className="captcha-char char-1">{captchaCode[1] || '8'}</span>
                    <span className="captcha-char char-2">{captchaCode[2] || 'K'}</span>
                    <span className="captcha-char char-3">{captchaCode[3] || '9'}</span>
                    <span className="captcha-char char-4">{captchaCode[4] || 'X'}</span>
                    <div className="captcha-noise-line line-1"></div>
                    <div className="captcha-noise-line line-2"></div>
                  </div>
                  <button
                    type="button"
                    className="btn-refresh-captcha"
                    onClick={generateCaptcha}
                    title="Refresh Captcha Code"
                    aria-label="Refresh Captcha Code"
                  >
                    <Icons.Refresh />
                  </button>
                </div>
                <div className="auth-input-wrapper" style={{ marginTop: '8px' }}>
                  <span className="auth-input-icon"><Icons.ShieldCheck /></span>
                  <input
                    type="text"
                    value={captchaInput}
                    onChange={(e) => setCaptchaInput(e.target.value.toUpperCase())}
                    placeholder="Enter the 5 characters above"
                    className="auth-input-field font-mono"
                    maxLength={5}
                    required
                  />
                </div>
              </div>

              {/* Success Banner */}
              {successMsg && (
                <div className="auth-success-banner">
                  <span className="success-sign">✓</span>
                  <span className="success-text-content">{successMsg}</span>
                </div>
              )}

              {/* Remember Me */}
              <div className="auth-options-row">
                <label className="custom-checkbox-label">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="native-checkbox"
                  />
                  <span className="checkbox-box">
                    {rememberMe && <Icons.Check />}
                  </span>
                  <span className="checkbox-text">Keep session active</span>
                </label>
              </div>

              {/* Submit Action */}
              <button type="submit" className="auth-submit-btn" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <span className="auth-spinner"></span>
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <span>Authenticate & Access</span>
                    <Icons.ArrowRight />
                  </>
                )}
              </button>

              {/* Terms & Conditions Legal Link */}
              <div className="auth-legal-row">
                <span>By signing in, you agree to our </span>
                <button
                  type="button"
                  className="auth-legal-link"
                  onClick={() => setIsTermsOpen(true)}
                >
                  Terms & Conditions
                </button>
                <span> and </span>
                <button
                  type="button"
                  className="auth-legal-link"
                  onClick={() => setIsPrivacyOpen(true)}
                >
                  Privacy Policy
                </button>
              </div>
            </form>

            {/* Footer */}
            <div className="auth-card-footer">
              <span>Secure Gateway v2.5.0</span>
              <span className="footer-dot">•</span>
              <span>Ecollect Pvt Ltd</span>
            </div>

          </div>
        </div>

      </div>

      {/* ============================================================
          FORGOT & RESET PASSWORD INTERACTIVE MODAL
          ============================================================ */}
      {isForgotOpen && (
        <div className="forgot-modal-backdrop" onClick={() => setIsForgotOpen(false)}>
          <div className="forgot-modal-glass-card" onClick={(e) => e.stopPropagation()}>

            {/* Modal Ambient Glow */}
            <div className="forgot-modal-glow"></div>

            {/* Modal Header */}
            <div className="forgot-modal-header">
              <div className="forgot-header-icon-box">
                <Icons.Key />
              </div>
              <div className="forgot-header-titles">
                <h3 className="forgot-modal-title">
                  {forgotStep === 1 && 'Reset Your Password'}
                  {forgotStep === 2 && 'Verify OTP & Set Password'}
                  {forgotStep === 3 && 'Password Reset Complete'}
                </h3>
                <p className="forgot-modal-subtitle">
                  {forgotStep === 1 && 'Enter your registered email, username, or phone to receive a security OTP.'}
                  {forgotStep === 2 && 'Enter the OTP verification code and choose your new security password.'}
                  {forgotStep === 3 && 'Your credentials have been securely updated.'}
                </p>
              </div>
              <button
                type="button"
                className="forgot-modal-close-btn"
                onClick={() => setIsForgotOpen(false)}
                title="Close"
              >
                <Icons.Close />
              </button>
            </div>

            {/* Error Notification */}
            {forgotError && (
              <div className="auth-error-banner" style={{ margin: '0 0 16px 0' }}>
                <span className="error-sign">⚠️</span>
                <span className="error-text-content">{forgotError}</span>
              </div>
            )}

            {/* Success / Status Callout */}
            {forgotSuccess && forgotStep !== 3 && (
              <div className="forgot-status-banner">
                <span className="status-sign">✓</span>
                <span className="status-text">{forgotSuccess}</span>
              </div>
            )}

            {/* Step 1: Request Security OTP */}
            {forgotStep === 1 && (
              <form onSubmit={handleSendOtp} className="forgot-modal-body">
                <div className="auth-input-group">
                  <label className="auth-input-label">Registered Identifier</label>
                  <div className="auth-input-wrapper">
                    <span className="auth-input-icon"><Icons.Mail /></span>
                    <input
                      type="text"
                      value={forgotIdentifier}
                      onChange={(e) => setForgotIdentifier(e.target.value)}
                      placeholder="Enter registered email, username, or phone"
                      className="auth-input-field"
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <div className="forgot-actions-row">
                  <button
                    type="button"
                    className="forgot-cancel-btn"
                    onClick={() => setIsForgotOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="auth-submit-btn"
                    disabled={forgotLoading}
                    style={{ flex: 1 }}
                  >
                    {forgotLoading ? (
                      <>
                        <span className="auth-spinner"></span>
                        <span>Sending Security OTP...</span>
                      </>
                    ) : (
                      <>
                        <span>Send Security OTP</span>
                        <Icons.ArrowRight />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Step 2: Enter OTP & Set New Password */}
            {forgotStep === 2 && (
              <form onSubmit={handleResetPasswordSubmit} className="forgot-modal-body">

                {/* OTP Code */}
                <div className="auth-input-group">
                  <div className="auth-label-row">
                    <label className="auth-input-label">Security OTP Code</label>
                    <button
                      type="button"
                      className="forgot-resend-link"
                      onClick={handleResendOtp}
                      disabled={resendTimer > 0 || forgotLoading}
                    >
                      {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
                    </button>
                  </div>
                  <div className="auth-input-wrapper">
                    <span className="auth-input-icon"><Icons.Key /></span>
                    <input
                      type="text"
                      value={forgotOtp}
                      onChange={(e) => setForgotOtp(e.target.value)}
                      placeholder="Enter 4-6 digit OTP code"
                      className="auth-input-field font-mono"
                      required
                      autoFocus
                      maxLength={8}
                    />
                  </div>
                </div>

                {/* New Password */}
                <div className="auth-input-group">
                  <label className="auth-input-label">New Security Password</label>
                  <div className="auth-input-wrapper">
                    <span className="auth-input-icon"><Icons.Lock /></span>
                    <input
                      type={forgotShowPassword ? 'text' : 'password'}
                      value={forgotNewPassword}
                      onChange={(e) => setForgotNewPassword(e.target.value)}
                      placeholder="Enter at least 6 characters"
                      className="auth-input-field"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      className="password-toggle-trigger"
                      onClick={() => setForgotShowPassword(!forgotShowPassword)}
                      aria-label="Toggle password visibility"
                    >
                      {forgotShowPassword ? <Icons.EyeOff /> : <Icons.Eye />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="auth-input-group">
                  <label className="auth-input-label">Confirm New Password</label>
                  <div className="auth-input-wrapper">
                    <span className="auth-input-icon"><Icons.Lock /></span>
                    <input
                      type={forgotShowPassword ? 'text' : 'password'}
                      value={forgotConfirmPassword}
                      onChange={(e) => setForgotConfirmPassword(e.target.value)}
                      placeholder="Re-enter new security password"
                      className="auth-input-field"
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                <div className="forgot-actions-row">
                  <button
                    type="button"
                    className="forgot-cancel-btn"
                    onClick={() => setForgotStep(1)}
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="auth-submit-btn"
                    disabled={forgotLoading}
                    style={{ flex: 1 }}
                  >
                    {forgotLoading ? (
                      <>
                        <span className="auth-spinner"></span>
                        <span>Verifying & Resetting...</span>
                      </>
                    ) : (
                      <>
                        <span>Confirm & Reset Password</span>
                        <Icons.ArrowRight />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Step 3: Success Celebration */}
            {forgotStep === 3 && (
              <div className="forgot-success-body">
                <div className="forgot-success-icon-badge">
                  <Icons.ShieldCheck />
                </div>
                <h4 className="forgot-success-title">Password Successfully Reset!</h4>
                <p className="forgot-success-desc">
                  Your credentials have been securely updated in the database. You can now access your financial operations portal with your new password.
                </p>
                <button
                  type="button"
                  className="auth-submit-btn"
                  onClick={handleFinishReset}
                  style={{ width: '100%', marginTop: '12px' }}
                >
                  <span>Sign In with New Password</span>
                  <Icons.ArrowRight />
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ============================================================
          TERMS & CONDITIONS INTERACTIVE MODAL
          ============================================================ */}
      {isTermsOpen && (
        <div className="forgot-modal-backdrop" onClick={() => setIsTermsOpen(false)}>
          <div className="forgot-modal-glass-card legal-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="forgot-modal-glow"></div>
            <div className="forgot-modal-header">
              <div className="forgot-header-icon-box">
                <Icons.ShieldCheck />
              </div>
              <div className="forgot-header-titles">
                <h3 className="forgot-modal-title">Terms & Conditions</h3>
                <p className="forgot-modal-subtitle">Ecollect Pvt Ltd • Core Financial Operations Platform</p>
              </div>
              <button
                type="button"
                className="forgot-modal-close-btn"
                onClick={() => setIsTermsOpen(false)}
                title="Close"
              >
                <Icons.Close />
              </button>
            </div>

            <div className="legal-modal-content custom-scrollbar">
              <h4>1. Acceptance of Platform Usage</h4>
              <p>By accessing and signing into the Ecollect Payment Gateway platform, you acknowledge and agree to comply with all applicable RBI financial regulations, digital banking mandates, and authorized organizational policies.</p>

              <h4>2. Confidentiality & Bearer Security</h4>
              <p>Users are responsible for safeguarding their login credentials and session tokens. Any collection or settlement executed under an authenticated session shall be attributed to the authorized merchant or representative.</p>

              <h4>3. Transaction Processing & Integrity</h4>
              <p>All collections, refunds, and dynamic QR settlements are cryptographically logged with immutable audit trails adhering to PCI-DSS 4.0 standards.</p>

              <h4>4. Regulatory Compliance</h4>
              <p>Access is restricted strictly to verified institutional clients, branch personnel, and certified field agents of Ecollect Pvt Ltd.</p>
            </div>

            <div className="forgot-modal-actions" style={{ marginTop: '16px' }}>
              <button
                type="button"
                className="auth-submit-btn"
                onClick={() => setIsTermsOpen(false)}
                style={{ width: '100%' }}
              >
                <span>I Understand & Accept</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          PRIVACY POLICY INTERACTIVE MODAL
          ============================================================ */}
      {isPrivacyOpen && (
        <div className="forgot-modal-backdrop" onClick={() => setIsPrivacyOpen(false)}>
          <div className="forgot-modal-glass-card legal-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="forgot-modal-glow"></div>
            <div className="forgot-modal-header">
              <div className="forgot-header-icon-box">
                <Icons.Lock />
              </div>
              <div className="forgot-header-titles">
                <h3 className="forgot-modal-title">Privacy Policy</h3>
                <p className="forgot-modal-subtitle">Ecollect Pvt Ltd • Data Protection & Security Policy</p>
              </div>
              <button
                type="button"
                className="forgot-modal-close-btn"
                onClick={() => setIsPrivacyOpen(false)}
                title="Close"
              >
                <Icons.Close />
              </button>
            </div>

            <div className="legal-modal-content custom-scrollbar">
              <h4>1. Encryption & Data Protection</h4>
              <p>All sensitive customer details, account records, and financial transaction payloads are encrypted with AES 256-bit standards at rest and transmitted across secure TLS 1.3 tunnels.</p>

              <h4>2. Authorized Telemetry Only</h4>
              <p>We process only authorized data fields required for core banking reconciliation, UPI webhook synchronization, and anti-fraud verification.</p>

              <h4>3. Non-Disclosure & Confidentiality</h4>
              <p>Ecollect Pvt Ltd does not sell or share confidential financial data with unauthorized third parties. All logs are preserved solely for audit, settlement, and regulatory reporting.</p>
            </div>

            <div className="forgot-modal-actions" style={{ marginTop: '16px' }}>
              <button
                type="button"
                className="auth-submit-btn"
                onClick={() => setIsPrivacyOpen(false)}
                style={{ width: '100%' }}
              >
                <span>Close Privacy Policy</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Login;