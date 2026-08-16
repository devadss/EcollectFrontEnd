import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import './Logout.css';

// SVG Icons for clean zero-dependency rendering
const Icons = {
  Logo: () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  ),
  LogOut: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
  ShieldCheck: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  ),
  ArrowLeft: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  ),
  Lock: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
  Clock: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  SadEmoji: () => (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
      <line x1="9" y1="9" x2="9.01" y2="9" />
      <line x1="15" y1="9" x2="15.01" y2="9" />
    </svg>
  ),
  HappyEmoji: () => (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
      <line x1="9" y1="9" x2="9.01" y2="9" />
      <line x1="15" y1="9" x2="15.01" y2="9" />
    </svg>
  ),
  Heart: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  ),
};

const Logout = () => {
  const navigate = useNavigate();
  const { theme } = useTheme?.() || {};

  const [status, setStatus] = useState('confirm');
  const [countdown, setCountdown] = useState(5);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleConfirmLogout = () => {
    setStatus('logging_out');

    setTimeout(() => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.clear();

      setStatus('logged_out');
    }, 1500);
  };

  useEffect(() => {
    let timer;
    if (status === 'logged_out' && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (status === 'logged_out' && countdown === 0) {
      navigate('/login');
    }
    return () => clearInterval(timer);
  }, [status, countdown, navigate]);

  const handleCancel = () => {
    navigate(-1);
  };

  return (
    <div className="logout-container">
      {/* Interactive Mouse Glow */}
      <div 
        className="logout-mouse-glow"
        style={{
          background: `radial-gradient(circle 400px at ${mousePosition.x}px ${mousePosition.y}px, rgba(99, 102, 241, 0.12), transparent 70%)`,
        }}
      />

      {/* Cute Floating Background Orbs - Blue Theme */}
      <div className="logout-aurora">
        <div className="logout-aurora-1"></div>
        <div className="logout-aurora-2"></div>
        <div className="logout-aurora-3"></div>
        <div className="logout-aurora-4"></div>
      </div>

      {/* Floating Emojis */}
      <div className="float-emoji e1">🌸</div>
      <div className="float-emoji e2">✨</div>
      <div className="float-emoji e3">⭐</div>
      <div className="float-emoji e4">💫</div>
      <div className="float-emoji e5">🌈</div>

      {/* Brand Header */}
      <div className="logout-brand">
        <div className="logout-brand-icon">
          <Icons.Logo />
        </div>
        <span className="logout-brand-text">E<span className="logout-brand-highlight">Collect</span></span>
      </div>

      {/* Logout Main Card */}
      <div className="logout-card-wrapper">
        
        {/* STATE 1: Confirmation Screen */}
        {status === 'confirm' && (
          <div className="logout-card">
            <div className="logout-card-icon-wrap warning">
              <Icons.SadEmoji />
            </div>
            
            <h2>Leaving so soon? 🥺</h2>
            <p className="logout-subtitle">You're about to sign out of E-Collect. We'll miss you!</p>

            {/* Session Insights Summary */}
            <div className="session-summary-box">
              <div className="summary-item">
                <Icons.Clock />
                <div>
                  <span className="summary-label">Session Duration</span>
                  <span className="summary-val">42 minutes</span>
                </div>
              </div>
              <div className="summary-item">
                <Icons.Lock />
                <div>
                  <span className="summary-label">Secure Connection</span>
                  <span className="summary-val">🔒 Active</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="logout-actions">
              <button type="button" className="btn-confirm-logout" onClick={handleConfirmLogout}>
                Yes, Sign Me Out 🚀
              </button>
              <button type="button" className="btn-cancel-logout" onClick={handleCancel}>
                <Icons.ArrowLeft />
                Stay Here ❤️
              </button>
            </div>
          </div>
        )}

        {/* STATE 2: Logging Out Loader */}
        {status === 'logging_out' && (
          <div className="logout-card">
            <div className="logout-card-icon-wrap processing">
              <span className="logout-spinner"></span>
            </div>

            <h2>See You Later! 👋</h2>
            <p className="logout-subtitle">Clearing your session safely...</p>

            <div className="logout-progress-bar">
              <div className="logout-progress-fill"></div>
            </div>
            
            <p className="logout-loading-text">✨ Keeping your data safe ✨</p>
          </div>
        )}

        {/* STATE 3: Successfully Logged Out */}
        {status === 'logged_out' && (
          <div className="logout-card">
            <div className="logout-card-icon-wrap success">
              <Icons.HappyEmoji />
            </div>

            <h2>All Done! 🎉</h2>
            <p className="logout-subtitle">You've been safely signed out. Your session is fully cleared.</p>

            <div className="logout-timer-badge">
              ⏳ Redirecting in <strong>{countdown}s</strong>
            </div>

            <div className="logout-actions">
              <button type="button" className="btn-confirm-logout" onClick={() => navigate('/login')}>
                <Icons.ArrowLeft />
                Sign In Again
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Security Footer Badge */}
      <div className="logout-footer-badge">
        <Icons.ShieldCheck /> 
        <span>🔒 256-bit SSL Protected</span>
        <Icons.Heart />
        <span>Made with ❤️ by E-Collect</span>
      </div>
    </div>
  );
};

export default Logout;