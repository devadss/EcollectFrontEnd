import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import './Login.css';

// SVG Icon Library
const Icons = {
  Logo: () => (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
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
  Shield: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  ),
  Zap: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  ArrowRight: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  ),
  BankAdmin: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 21h18M3 10h18M5 10v11M9 10v11M15 10v11M19 10v11M12 3L2 8h20L12 3z"/>
    </svg>
  ),
  Merchant: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0"/>
    </svg>
  ),
  Agent: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  Sparkles: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3z"/>
    </svg>
  )
};

const Login = () => {
  const navigate = useNavigate();
  const { theme } = useTheme?.() || { theme: {} };
  
  const [role, setRole] = useState('merchant'); // 'merchant' | 'bankadmin' | 'agent'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
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

    setTimeout(() => {
      setIsLoading(false);
      if (role === 'bankadmin') {
        navigate('/bankadmin/dashboard');
      } else if (role === 'agent') {
        navigate('/agent/dashboard');
      } else {
        navigate('/merchant/dashboard');
      }
    }, 1200);
  };

  return (
    <div className="login-wrapper">
      
      {/* Interactive Cursor Glow */}
      <div 
        className="ec-mouse-glow"
        style={{
          background: `radial-gradient(circle 550px at ${mousePosition.x}px ${mousePosition.y}px, rgba(6, 182, 212, 0.15), transparent 75%)`,
        }}
      />

      {/* LEFT PANEL - Clean, Concise Hero */}
      <div className="login-hero-section">
        <div className="hero-bg-image" />
        <div className="hero-dark-overlay"></div>

        {/* Ambient Glow Orbs */}
        <div className="mesh-orb orb-1"></div>
        <div className="mesh-orb orb-2"></div>

        <div className="login-hero-content">
          
          {/* Header Brand */}
          <div className="brand-header">
            <div className="brand-logo-badge">
              <Icons.Logo />
            </div>
            <span className="brand-title">
              E-<span className="brand-accent">Collect</span>
              <span className="brand-tag">ENTERPRISE</span>
            </span>
          </div>

          {/* Concise Hero Typography */}
          <div className="hero-typography">
            <div className="hero-status-pill">
              <span className="pulse-dot"></span> Real-Time Settlement Engine
            </div>
            <h1>Smart Financial Collections</h1>
            <p className="hero-description">
              Unified payment routing and automated reconciliation for enterprise businesses.
            </p>
          </div>

          {/* Compact Live Metric Card */}
          <div className="glass-preview-card">
            <div className="preview-card-header">
              <div className="preview-icon">
                <Icons.Zap />
              </div>
              <div>
                <span className="preview-label">Live Settlement Stream</span>
                <div className="preview-value">
                  $14,890,520.45 
                  <span className="preview-badge">
                    <Icons.Sparkles /> Live
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Badges */}
          <div className="compact-badges">
            <div className="compact-badge">
              <Icons.Shield /> PCI-DSS Level 1
            </div>
            <div className="compact-badge">
              <Icons.Zap /> 99.999% SLA Uptime
            </div>
          </div>

        </div>
      </div>

      {/* RIGHT PANEL - Authentication Form */}
      <div className="login-form-section">
        <div className="form-container">
          
          <div className="form-header">
            <div className="welcome-badge">👋 Welcome back</div>
            <h2>Sign in to E-Collect</h2>
            <p>Select your access portal to continue</p>
          </div>

          {/* Role Switcher */}
          <div className="role-selector">
            <button
              type="button"
              className={`role-btn ${role === 'merchant' ? 'active' : ''}`}
              onClick={() => setRole('merchant')}
            >
              <Icons.Merchant />
              <span>Merchant</span>
            </button>
            <button
              type="button"
              className={`role-btn ${role === 'bankadmin' ? 'active' : ''}`}
              onClick={() => setRole('bankadmin')}
            >
              <Icons.BankAdmin />
              <span>Bank Admin</span>
            </button>
            <button
              type="button"
              className={`role-btn ${role === 'agent' ? 'active' : ''}`}
              onClick={() => setRole('agent')}
            >
              <Icons.Agent />
              <span>Agent</span>
            </button>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="auth-form">
            
            <div className="input-group">
              <label htmlFor="email">Work Email</label>
              <div className="input-field-wrapper">
                <span className="field-icon"><Icons.Mail /></span>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="input-group">
              <div className="label-row">
                <label htmlFor="password">Password</label>
                <a href="#forgot" className="forgot-link">Forgot?</a>
              </div>
              <div className="input-field-wrapper">
                <span className="field-icon"><Icons.Lock /></span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <Icons.EyeOff /> : <Icons.Eye />}
                </button>
              </div>
            </div>

            <div className="options-row">
              <label className="checkbox-container">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span className="custom-checkbox"></span>
                <span>Keep me signed in</span>
              </label>
            </div>

            <button type="submit" className="submit-btn shimmering-btn" disabled={isLoading}>
              {isLoading ? (
                <div className="btn-spinner-container">
                  <span className="btn-spinner"></span>
                  <span>Verifying...</span>
                </div>
              ) : (
                <>
                  <span>Sign In</span>
                  <Icons.ArrowRight />
                </>
              )}
            </button>
          </form>

          <div className="auth-divider">
            <span>Or continue with SSO</span>
          </div>

          <div className="social-grid">
            <button type="button" className="social-btn">
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span>Google SSO</span>
            </button>
            
            <button type="button" className="social-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.32c.67-.82 1.12-1.96.99-3.1-.97.04-2.15.65-2.84 1.45-.61.71-1.15 1.87-.99 2.99 1.09.08 2.18-.53 2.84-1.34z"/>
              </svg>
              <span>Apple ID</span>
            </button>
          </div>

          <p className="form-footer-text">
            Need access? <a href="#sales">Contact Sales</a>
          </p>

        </div>
      </div>
    </div>
  );
};

export default Login;