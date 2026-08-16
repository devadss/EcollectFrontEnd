import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../../services/api';
import './Login.css';

// SVG Icon Library
const Icons = {
  Logo: () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
    </svg>
  ),
  Mail: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="3" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  ),
  Lock: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
  Eye: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  EyeOff: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" x2="22" y1="2" y2="22" />
    </svg>
  ),
  ArrowRight: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  ),
  Check: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  Sparkles: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3z"/>
    </svg>
  ),
  Star: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  Shield: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  ),
  Users: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  Globe: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  ),
};

const Login = () => {
  const navigate = useNavigate();
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

      const responseData = res?.data || {};
      const token = responseData.token || responseData.Token;
      const backendRole = responseData.role || responseData.Role || responseData.roleName;

      if (!token) {
        throw new Error('No token received');
      }

      if (!backendRole) {
        throw new Error('No role received');
      }

      localStorage.setItem('auth_token', token);
      localStorage.setItem('token', token);
      
      if (responseData.refreshToken) {
        localStorage.setItem('refresh_token', responseData.refreshToken);
      }

      const userData = {
        id: responseData.userId || responseData.id || 0,
        username: responseData.username || responseData.userName || email,
        email: responseData.email || email,
        phone: responseData.phone || responseData.mobileNumber || '',
        firstName: responseData.firstName || responseData.firstname || '',
        lastName: responseData.lastName || responseData.lastname || '',
        role: backendRole,
        merchantId: responseData.merchantId || null,
        branchId: responseData.branchId || null,
        agentId: responseData.agentId || null,
        isActive: responseData.isActive !== undefined ? responseData.isActive : true,
        isEmailVerified: responseData.isEmailVerified || false,
        isPhoneVerified: responseData.isPhoneVerified || false,
        fullName: responseData.fullName || `${responseData.firstName || ''} ${responseData.lastName || ''}`.trim(),
        integrationStatus: responseData.integrationStatus || 'No'
      };

      localStorage.setItem('auth_user', JSON.stringify(userData));
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('userRole', backendRole);
      localStorage.setItem('integrationStatus', responseData.integrationStatus || 'No');

      if (responseData.permissions) {
        localStorage.setItem('auth_permissions', JSON.stringify(responseData.permissions));
        localStorage.setItem('permissions', JSON.stringify(responseData.permissions));
      }
      
      if (responseData.menus && Array.isArray(responseData.menus)) {
        localStorage.setItem('auth_menus', JSON.stringify(responseData.menus));
        localStorage.setItem('menus', JSON.stringify(responseData.menus));
      }

      window.location.href = '/dashboard';

    } catch (err) {
      console.error('Login Error:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Custom Cursor Glow */}
      <div 
        className="cursor-glow"
        style={{
          left: mousePosition.x - 300,
          top: mousePosition.y - 300,
        }}
      />

      {/* Background Layers */}
      <div className="login-bg">
        <div className="bg-image"></div>
        <div className="bg-overlay"></div>
        
        {/* Animated Orbs */}
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
        <div className="orb orb-4"></div>
        
        {/* Floating Particles */}
        <div className="particles">
          <div className="particle" style={{ left: '10%', top: '15%', animationDelay: '0s' }}></div>
          <div className="particle" style={{ left: '25%', top: '75%', animationDelay: '2s' }}></div>
          <div className="particle" style={{ left: '75%', top: '10%', animationDelay: '4s' }}></div>
          <div className="particle" style={{ left: '85%', top: '60%', animationDelay: '1s' }}></div>
          <div className="particle" style={{ left: '45%', top: '85%', animationDelay: '3s' }}></div>
          <div className="particle" style={{ left: '60%', top: '25%', animationDelay: '5s' }}></div>
          <div className="particle" style={{ left: '5%', top: '45%', animationDelay: '2.5s' }}></div>
          <div className="particle" style={{ left: '90%', top: '80%', animationDelay: '4.5s' }}></div>
        </div>
      </div>

      {/* Main Container */}
      <div className="login-container">
        {/* Left Panel - Luxury Brand Experience */}
        <div className="login-left">
          <div className="brand-wrapper">
            <div className="brand-badge">
              <span className="badge-dot"></span>
              <span>Enterprise • PCI-DSS Certified</span>
            </div>

            <h1 className="brand-heading">
              <span className="brand-gradient">E-Collect</span>
              <br />
              <span className="brand-sub">Enterprise Platform</span>
            </h1>

            {/* Animated Stats */}
            <div className="brand-stats">
              <div className="stat-item">
                <span className="stat-number">10L+</span>
                <span className="stat-label">Active Users</span>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <span className="stat-number">99.9%</span>
                <span className="stat-label">Uptime SLA</span>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <span className="stat-number">50+</span>
                <span className="stat-label">Countries</span>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="trust-badges">
              <span><Icons.Shield /> ISO 27001</span>
              <span>✓ PCI-DSS</span>
              <span><Icons.Star /> 4.9/5 Rating</span>
              <span><Icons.Globe /> Global</span>
            </div>
          </div>
        </div>

        {/* Right Panel - Premium Login Card */}
        <div className="login-right">
          <div className="login-card">
            {/* Animated Border Gradient */}
            <div className="card-border-glow"></div>

            <div className="card-header">
              <div className="card-logo">
                <Icons.Logo />
              </div>
              <h2 className="card-title">Welcome Back</h2>
              <p className="card-sub">Sign in to access your dashboard</p>
              <div className="card-divider"></div>
            </div>

            {error && (
              <div className="error-msg">
                <svg className="error-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <div className="input-wrap">
                  <span className="input-icon"><Icons.Mail /></span>
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@ecollect.com"
                    className="form-input"
                    required
                  />
                  <div className="input-focus-ring"></div>
                </div>
              </div>

              <div className="form-group">
                <div className="label-row">
                  <label className="form-label">Password</label>
                  <a href="#forgot" className="forgot-link">Forgot password?</a>
                </div>
                <div className="input-wrap">
                  <span className="input-icon"><Icons.Lock /></span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="form-input"
                    required
                  />
                  <button
                    type="button"
                    className="toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <Icons.EyeOff /> : <Icons.Eye />}
                  </button>
                  <div className="input-focus-ring"></div>
                </div>
              </div>

              <div className="options-row">
                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span className="checkmark">
                    {rememberMe && <Icons.Check />}
                  </span>
                  <span>Keep me signed in</span>
                </label>
              </div>

              <button type="submit" className="submit-btn" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <span className="spinner"></span>
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <Icons.ArrowRight />
                  </>
                )}
              </button>
            </form>

            {/* Luxury Demo Accounts */}
            <div className="demo-box">
              <div className="demo-header">
                <Icons.Sparkles />
                <span>Demo Accounts</span>
              </div>
              <div className="demo-grid">
                <div className="demo-item">
                  <span className="demo-label">Username</span>
                  <span className="demo-value">rajesh123</span>
                  <span className="demo-label">Password</span>
                  <span className="demo-value">rajesh123</span>
                </div>
                <div className="demo-item">
                  <span className="demo-label">Username</span>
                  <span className="demo-value">sunita456</span>
                  <span className="demo-label">Password</span>
                  <span className="demo-value">sunita456</span>
                </div>
              </div>
            </div>

            <div className="card-footer">
              <a href="#">Privacy Policy</a>
              <span className="footer-dot">•</span>
              <a href="#">Terms of Service</a>
              <span className="footer-dot">•</span>
              <a href="#">Need Help?</a>
            </div>
          </div>

          <p className="copyright">© 2026 E-Collect. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;