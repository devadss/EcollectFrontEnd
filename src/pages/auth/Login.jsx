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
  )
};

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

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
        UsernameOrEmail: email,
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

      const userData = {
        id: responseData.userId || responseData.id || responseData.user?.id || 1,
        username: responseData.username || responseData.userName || responseData.user?.username || email,
        email: responseData.email || responseData.user?.email || email,
        phone: responseData.phone || responseData.mobileNumber || responseData.user?.phone || '',
        firstName: responseData.firstName || responseData.firstname || responseData.user?.firstName || '',
        lastName: responseData.lastName || responseData.lastname || responseData.user?.lastName || '',
        role: backendRole,
        merchantId: responseData.merchantId || responseData.user?.merchantId || null,
        branchId: responseData.branchId || responseData.user?.branchId || null,
        agentId: responseData.agentId || responseData.user?.agentId || null,
        isActive: responseData.isActive !== undefined ? responseData.isActive : true,
        isEmailVerified: responseData.isEmailVerified || false,
        isPhoneVerified: responseData.isPhoneVerified || false,
        fullName: responseData.fullName || responseData.user?.fullName || `${responseData.firstName || ''} ${responseData.lastName || ''}`.trim() || email,
        integrationStatus: responseData.integrationStatus || 'No'
      };

      localStorage.setItem('auth_user', JSON.stringify(userData));
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('userRole', backendRole);
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
      const serverMsg = 
        err?.response?.data?.message || 
        err?.response?.data?.title || 
        err?.response?.data?.error || 
        (typeof err?.response?.data === 'string' && err?.response?.data) ||
        err?.message || 
        'Login failed. Please verify credentials and database table records.';
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
        </div>

        {/* Right Side: Authentication Form Card */}
        <div className="login-form-panel">
          <div className="auth-form-glass-card">
            
            <div className="auth-card-header">
              <div className="auth-brand-chip">
                <Icons.Logo />
                <span>ECOLLECT PG AUTH</span>
              </div>
              <h2 className="auth-title">Welcome Back</h2>
              <p className="auth-subtitle">Authenticate to access your financial portal</p>
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
                  <a href="#forgot" className="auth-forgot-link" onClick={(e) => { e.preventDefault(); alert('Please contact your administrator to reset your credentials.'); }}>
                    Forgot password?
                  </a>
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
    </div>
  );
};

export default Login;