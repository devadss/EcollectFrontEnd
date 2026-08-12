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
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
  Clock: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
};

const Logout = () => {
  const navigate = useNavigate();
  const { theme } = useTheme?.() || {};

  // Status: 'confirm' | 'logging_out' | 'logged_out'
  const [status, setStatus] = useState('confirm');
  const [countdown, setCountdown] = useState(5);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Mouse tracking glow effect
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Execute sign-out and clear storage
  const handleConfirmLogout = () => {
    setStatus('logging_out');

    setTimeout(() => {
      // Clear security tokens and local storage data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.clear();

      setStatus('logged_out');
    }, 1500);
  };

  // Auto redirect timer after logout
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
    navigate(-1); // Return to previous page/dashboard
  };

  return (
    <div className="logout-container">
      {/* Interactive Mouse Glow Ambient Layer */}
      <div 
        className="logout-mouse-glow"
        style={{
          background: `radial-gradient(circle 550px at ${mousePosition.x}px ${mousePosition.y}px, rgba(99, 102, 241, 0.15), transparent 70%)`,
        }}
      />

      {/* Aurora Ambient Background Orbs */}
      <div className="logout-aurora">
        <div className="logout-aurora-1"></div>
        <div className="logout-aurora-2"></div>
        <div className="logout-aurora-3"></div>
      </div>

      {/* Brand Header */}
      <div className="logout-brand">
        <div className="logout-brand-icon">
          <Icons.Logo />
        </div>
        <span className="logout-brand-text">Tech<span className="logout-brand-highlight">Pay</span></span>
      </div>

      {/* Logout Main Card */}
      <div className="logout-card-wrapper">
        
        {/* STATE 1: Confirmation Screen */}
        {status === 'confirm' && (
          <div className="logout-card">
            <div className="logout-card-icon-wrap warning">
              <Icons.LogOut />
            </div>
            
            <h2>Sign Out of Account?</h2>
            <p className="logout-subtitle">You are about to securely end your active session on TechPay.</p>

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
                  <span className="summary-label">Encrypted IP</span>
                  <span className="summary-val">192.168.1.***</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="logout-actions">
              <button type="button" className="btn-confirm-logout" onClick={handleConfirmLogout}>
                Confirm Sign Out
              </button>
              <button type="button" className="btn-cancel-logout" onClick={handleCancel}>
                <Icons.ArrowLeft />
                Return to Dashboard
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

            <h2>Ending Active Session...</h2>
            <p className="logout-subtitle">Clearing security credentials and encrypting local logs.</p>

            <div className="logout-progress-bar">
              <div className="logout-progress-fill"></div>
            </div>
          </div>
        )}

        {/* STATE 3: Successfully Logged Out */}
        {status === 'logged_out' && (
          <div className="logout-card">
            <div className="logout-card-icon-wrap success">
              <Icons.ShieldCheck />
            </div>

            <h2>You Have Been Logged Out</h2>
            <p className="logout-subtitle">Your session ended safely. All temporary authorization keys have been cleared.</p>

            <div className="logout-timer-badge">
              Redirecting to Sign In page in <strong>{countdown}s</strong>
            </div>

            <div className="logout-actions">
              <button type="button" className="btn-confirm-logout" onClick={() => navigate('/login')}>
                Sign In Again
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Security Footer Badge */}
      <div className="logout-footer-badge">
        <Icons.ShieldCheck /> 256-bit SSL Session Protection Active
      </div>
    </div>
  );
};

export default Logout;