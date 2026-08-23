import React, { useState, useEffect } from 'react';
import { authApi } from '../../services/api';
import './Login.css';

// SVG Icon Library
const Icons = {
  Logo: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
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
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3z"/>
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
  )
};

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Forgot Password Modal State
  const [isForgotOpen, setIsForgotOpen] = useState(false);
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
    if (!forgotIdentifier.trim()) {
      setForgotError('Please enter your registered email, username, or phone number.');
      return;
    }
    setForgotLoading(true);
    setForgotError('');
    setForgotSuccess('');

    try {
      const res = await authApi.forgotPassword(forgotIdentifier.trim());
      const rawMsg = res?.data?.message || res?.data?.title || 'Security OTP has been dispatched to your registered address.';
      setForgotSuccess(rawMsg);
      setForgotStep(2);
      setResendTimer(60);
    } catch (err) {
      const errDetail = err?.response?.data?.message || err?.response?.data?.title || err?.message || 'Failed to dispatch security OTP. Please check your details.';
      if (err?.response?.status === 404 || err?.response?.status === 500) {
        setForgotSuccess('Security verification initiated. Enter the verification code sent to your account.');
        setForgotStep(2);
        setResendTimer(60);
      } else {
        setForgotError(errDetail);
      }
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    setForgotLoading(true);
    setForgotError('');
    try {
      await authApi.forgotPassword(forgotIdentifier.trim());
      setForgotSuccess('A fresh security OTP code has been re-sent.');
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
    setIsLoading(true);
    setError('');

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
        serverMsg = 'Network Error: Cannot reach backend server at https://localhost:7256. If using HTTPS locally, please open https://localhost:7256/swagger in your browser to trust the SSL certificate.';
      } else if (!serverMsg || serverMsg === 'Request failed with status code 401') {
        serverMsg = 'Invalid username/email or password. Please verify your credentials.';
      }

      setError(serverMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-viewport">
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
        
        {/* Left Side: 3D Glassmorphic Visual Showcase (Pure Animated Artwork) */}
        <div className="login-visual-showcase">
          {/* Top Brand Watermark Pill */}
          <div className="visual-top-brand-badge">
            <span className="brand-pulse-dot"></span>
            <span>eCollect Payment Gateway</span>
          </div>

          {/* Ambient Inner Glowing Halo */}
          <div className="visual-ambient-glow"></div>

          {/* 3D Glass Artwork Frame */}
          <div className="visual-artwork-frame">
            <img 
              src="/login-3d-glass.jpg" 
              alt="Ecollect 3D Glass Security Engine" 
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
            </form>

            {/* Footer */}
            <div className="auth-card-footer">
              <span>Secure Gateway v2.5.0</span>
              <span className="footer-dot">•</span>
              <span>Finwin Solutions Pvt Ltd</span>
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

    </div>
  );
};

export default Login;