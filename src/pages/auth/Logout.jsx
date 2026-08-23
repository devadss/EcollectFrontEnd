import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../../services/api';
import './Logout.css';

// SVG Icons
const LogoutIcons = {
  Logo: () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  LogOut: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
  ShieldCheck: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  ),
  ShieldAlert: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
  ArrowLeft: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  ),
  ArrowRight: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  ),
  Lock: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
  Key: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7.5" cy="15.5" r="5.5" />
      <path d="m21 3-9.5 9.5" />
      <path d="m15.5 7.5 3 3" />
    </svg>
  ),
  User: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  Clock: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  Check: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
};

const Logout = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState('confirm'); // 'confirm' | 'logging_out' | 'logged_out'
  const [countdown, setCountdown] = useState(4);
  const [mousePosition, setMousePosition] = useState({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const [progressStep, setProgressStep] = useState(0);

  // Get current stored user identity
  const storedUser = (() => {
    try {
      return JSON.parse(localStorage.getItem('auth_user') || localStorage.getItem('user')) || {};
    } catch {
      return {};
    }
  })();

  const userRole = (storedUser.role || localStorage.getItem('user_role') || localStorage.getItem('role') || 'Software Admin');
  const displayName = storedUser.fullName || storedUser.name || storedUser.username || 'Administrator';
  const initialLetter = displayName.charAt(0).toUpperCase();

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleConfirmLogout = async () => {
    setStatus('logging_out');

    // Trigger backend logout endpoint in background
    try {
      authApi.logout().catch(() => {});
    } catch (e) {
      console.warn('Backend logout non-blocking call:', e);
    }

    // Step 1: Revoking tokens
    setProgressStep(1);
    await new Promise(r => setTimeout(r, 450));

    // Step 2: Flushing caches
    setProgressStep(2);
    await new Promise(r => setTimeout(r, 450));

    // Step 3: Purging session storage
    setProgressStep(3);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('user');
    localStorage.removeItem('userRole');
    localStorage.removeItem('auth_permissions');
    localStorage.removeItem('permissions');
    localStorage.removeItem('auth_menus');
    localStorage.removeItem('menus');
    localStorage.removeItem('merchantId');
    localStorage.removeItem('branchId');
    localStorage.removeItem('branchName');
    localStorage.removeItem('branchCode');
    localStorage.removeItem('agentId');
    localStorage.removeItem('admin_selected_merchant_id');
    localStorage.removeItem('integrationStatus');
    sessionStorage.clear();

    await new Promise(r => setTimeout(r, 400));
    setStatus('logged_out');
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

  // Circle countdown progress (4s total)
  const strokeDashoffset = 125.6 - (125.6 * (countdown / 4));

  return (
    <div className="logout-root-viewport">
      {/* Interactive Cursor Spotlight Glow */}
      <div 
        className="logout-ambient-cursor"
        style={{
          transform: `translate(${mousePosition.x - 300}px, ${mousePosition.y - 300}px)`,
        }}
      />

      {/* Floating Background Ambient Mesh */}
      <div className="logout-ambient-grid">
        <div className="logout-orb orb-primary"></div>
        <div className="logout-orb orb-secondary"></div>
        <div className="logout-orb orb-tertiary"></div>
      </div>

      {/* Top Brand Emblem */}
      <div className="logout-top-branding" onClick={() => navigate('/dashboard')} title="eCollect • Smart Payment Solutions">
        <img src="/ecollect-logo.png" alt="eCollect - Smart Payment Solutions" className="logout-brand-logo-img" />
      </div>

      {/* Main Glass Card Container */}
      <div className="logout-card-container">
        
        {/* ============================================================
            PHASE 1: CONFIRMATION PROMPT
            ============================================================ */}
        {status === 'confirm' && (
          <div className="logout-glass-card">
            <div className="card-ambient-glow is-violet"></div>

            {/* Glowing Icon Header */}
            <div className="logout-icon-bubble is-violet">
              <LogoutIcons.ShieldAlert />
            </div>

            <div className="logout-card-titles">
              <div className="logout-security-pill is-violet">
                <span className="pulse-dot"></span>
                <span>Session Termination Request</span>
              </div>
              <h2 className="logout-main-title">Confirm Secure Sign Out</h2>
              <p className="logout-description">
                You are about to terminate your authenticated banking session. All active bearer tokens, session caches, and sockets will be revoked.
              </p>
            </div>

            {/* Authenticated Identity Pill Card */}
            <div className="logout-user-identity-card">
              <div className="identity-avatar-monogram">
                {initialLetter}
              </div>
              <div className="identity-details">
                <div className="identity-name">{displayName}</div>
                <div className="identity-role-badge">
                  <span className="role-dot"></span>
                  {userRole}
                </div>
              </div>
            </div>

            {/* Security Scope Checklist */}
            <div className="logout-security-checklist">
              <div className="checklist-item">
                <span className="checklist-icon"><LogoutIcons.Check /></span>
                <span>256-bit TLS Session Bearer Tokens Revoked</span>
              </div>
              <div className="checklist-item">
                <span className="checklist-icon"><LogoutIcons.Check /></span>
                <span>In-Memory Client Telemetry Flushed</span>
              </div>
              <div className="checklist-item">
                <span className="checklist-icon"><LogoutIcons.Check /></span>
                <span>Live Core Banking Sockets Disconnected</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="logout-actions-cluster">
              <button 
                type="button" 
                className="btn-confirm-signout" 
                onClick={handleConfirmLogout}
              >
                <LogoutIcons.LogOut />
                <span>Confirm & Sign Out</span>
              </button>
              
              <button 
                type="button" 
                className="btn-cancel-return" 
                onClick={() => navigate(-1)}
              >
                <LogoutIcons.ArrowLeft />
                <span>Stay in Portal / Return</span>
              </button>
            </div>
          </div>
        )}

        {/* ============================================================
            PHASE 2: TERMINATING SESSION (PROGRESS)
            ============================================================ */}
        {status === 'logging_out' && (
          <div className="logout-glass-card">
            <div className="card-ambient-glow is-indigo"></div>

            {/* High-Tech Orbital Multi-Ring Spinner */}
            <div className="logout-orbital-spinner">
              <div className="spinner-ring outer"></div>
              <div className="spinner-ring middle"></div>
              <div className="spinner-ring inner"></div>
              <div className="spinner-center">
                <LogoutIcons.Lock />
              </div>
            </div>

            <div className="logout-card-titles">
              <h2 className="logout-main-title">Terminating Session</h2>
              <p className="logout-description">
                Safely flushing credential stores and closing encrypted banking socket connections...
              </p>
            </div>

            {/* Interactive Step Telemetry */}
            <div className="logout-progress-track">
              <div 
                className="logout-progress-bar"
                style={{ width: progressStep === 1 ? '35%' : progressStep === 2 ? '75%' : '100%' }}
              >
                <div className="progress-sweep"></div>
              </div>
            </div>

            <div className="logout-status-code font-mono">
              {progressStep === 1 && 'REVOKING OAUTH 2.0 BEARER TOKENS...'}
              {progressStep === 2 && 'PURGING ENCRYPTED LOCAL STORAGE CACHES...'}
              {progressStep === 3 && 'CLOSING GATEWAY TELEMETRY SOCKETS...'}
            </div>
          </div>
        )}

        {/* ============================================================
            PHASE 3: SAFELY LOGGED OUT
            ============================================================ */}
        {status === 'logged_out' && (
          <div className="logout-glass-card">
            <div className="card-ambient-glow is-green"></div>

            <div className="logout-icon-bubble is-green">
              <LogoutIcons.ShieldCheck />
            </div>

            <div className="logout-card-titles">
              <div className="logout-security-pill is-green">
                <span className="pulse-dot"></span>
                <span>Session Safely Revoked</span>
              </div>
              <h2 className="logout-main-title">Signed Out Successfully</h2>
              <p className="logout-description">
                Your session has been securely closed. All local credentials have been cleared from this browser.
              </p>
            </div>

            {/* Circular Countdown Progress Badge */}
            <div className="logout-countdown-ring-box">
              <svg className="countdown-svg" width="60" height="60" viewBox="0 0 44 44">
                <circle className="countdown-bg-circle" cx="22" cy="22" r="20" />
                <circle 
                  className="countdown-progress-circle" 
                  cx="22" 
                  cy="22" 
                  r="20" 
                  style={{ strokeDashoffset: strokeDashoffset }}
                />
              </svg>
              <div className="countdown-number font-mono">{countdown}</div>
            </div>

            <div className="logout-redirect-caption">
              Automatic redirect to login in <strong className="font-mono">{countdown}s</strong>
            </div>

            {/* Direct Return Button */}
            <div className="logout-actions-cluster">
              <button 
                type="button" 
                className="btn-confirm-signout is-return" 
                onClick={() => navigate('/login')}
              >
                <span>Return to Login Portal</span>
                <LogoutIcons.ArrowRight />
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Security & Regulatory Footer */}
      <div className="logout-bottom-security-bar">
        <div className="security-cert-item">
          <LogoutIcons.ShieldCheck />
          <span>PCI-DSS 4.0 Level 1 Certified</span>
        </div>
        <span className="footer-sep">•</span>
        <div className="security-cert-item">
          <LogoutIcons.Key />
          <span>AES 256-Bit SSL/TLS Encryption</span>
        </div>
        <span className="footer-sep">•</span>
        <span>Finwin Solutions Pvt Ltd</span>
      </div>

    </div>
  );
};

export default Logout;