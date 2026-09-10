import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './SessionTimeoutManager.css';

// ⏱️ Financial standard configurations:
// Total idle timeout: 15 minutes
// Warning countdown: 60 seconds before logout
const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes
const WARNING_THRESHOLD_MS = 60 * 1000;       // 1 minute warning
const STORAGE_ACTIVITY_KEY = 'ecollect_last_active_timestamp';
const STORAGE_LOGOUT_REASON = 'ecollect_logout_reason';

const SessionTimeoutManager = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [showWarning, setShowWarning] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(60);

  const timerRef = useRef(null);
  const lastActiveRef = useRef(Date.now());

  // Check if user is currently authenticated
  const isAuthenticated = useCallback(() => {
    const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
    return !!token && location.pathname !== '/login';
  }, [location.pathname]);

  // Clean and complete logout execution
  const performLogout = useCallback((reason = 'inactivity') => {
    console.warn(`🔒 Auto-logging out session due to: ${reason}`);
    
    // Set logout reason for display on login page
    localStorage.setItem(STORAGE_LOGOUT_REASON, reason);

    // Clear all auth storage
    const keysToRemove = [
      'auth_token', 'token', 'accessToken', 'refresh_token',
      'auth_user', 'user', 'user_role', 'role', 'userRole',
      'branchId', 'branchName', 'branchCode', 'merchantId', 'agentId',
      'integrationStatus', 'auth_permissions', 'permissions', 'auth_menus',
      STORAGE_ACTIVITY_KEY
    ];

    keysToRemove.forEach(k => localStorage.removeItem(k));
    sessionStorage.clear();

    setShowWarning(false);
    navigate('/login', { replace: true });
  }, [navigate]);

  // Record user activity
  const handleUserActivity = useCallback(() => {
    if (!isAuthenticated()) return;

    const now = Date.now();
    // Throttle writing to localStorage to once every 5 seconds
    if (now - lastActiveRef.current > 5000) {
      lastActiveRef.current = now;
      try {
        localStorage.setItem(STORAGE_ACTIVITY_KEY, String(now));
      } catch (e) {
        console.warn('Storage error recording activity:', e);
      }
    }

    // If warning was showing, user actively dismissed it by clicking
    if (showWarning) {
      setShowWarning(false);
    }
  }, [isAuthenticated, showWarning]);

  // Extend session manually from button
  const handleStaySignedIn = () => {
    const now = Date.now();
    lastActiveRef.current = now;
    try {
      localStorage.setItem(STORAGE_ACTIVITY_KEY, String(now));
    } catch (e) {
      console.warn('Storage error on stay signed in:', e);
    }
    setShowWarning(false);
    setSecondsRemaining(60);
  };

  // 1. Listen for cross-tab activity updates
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === STORAGE_ACTIVITY_KEY && e.newValue) {
        const remoteTime = Number(e.newValue);
        if (!isNaN(remoteTime)) {
          lastActiveRef.current = remoteTime;
          if (showWarning) {
            setShowWarning(false);
          }
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [showWarning]);

  // 2. Attach global user interaction listeners
  useEffect(() => {
    if (!isAuthenticated()) {
      setShowWarning(false);
      return;
    }

    // Initial activity timestamp
    const now = Date.now();
    lastActiveRef.current = now;
    localStorage.setItem(STORAGE_ACTIVITY_KEY, String(now));

    const events = ['mousedown', 'mousemove', 'keydown', 'touchstart', 'scroll', 'wheel', 'click'];
    
    const throttledHandler = () => {
      handleUserActivity();
    };

    events.forEach(evt => window.addEventListener(evt, throttledHandler, { passive: true }));

    return () => {
      events.forEach(evt => window.removeEventListener(evt, throttledHandler));
    };
  }, [isAuthenticated, handleUserActivity]);

  // 3. Heartbeat Watchdog running every second to check inactivity
  useEffect(() => {
    if (!isAuthenticated()) return;

    timerRef.current = setInterval(() => {
      const now = Date.now();
      
      // Read latest timestamp from localStorage (supports multi-tab)
      const storedTime = Number(localStorage.getItem(STORAGE_ACTIVITY_KEY) || lastActiveRef.current);
      const effectiveLastActive = !isNaN(storedTime) && storedTime > lastActiveRef.current ? storedTime : lastActiveRef.current;
      lastActiveRef.current = effectiveLastActive;

      const idleDuration = now - effectiveLastActive;
      const timeRemaining = INACTIVITY_TIMEOUT_MS - idleDuration;

      // Check if total idle timeout has exceeded
      if (timeRemaining <= 0) {
        clearInterval(timerRef.current);
        performLogout('inactivity');
        return;
      }

      // Check if within warning window (< 60s remaining)
      if (timeRemaining <= WARNING_THRESHOLD_MS) {
        setShowWarning(true);
        setSecondsRemaining(Math.max(1, Math.ceil(timeRemaining / 1000)));
      } else {
        if (showWarning) {
          setShowWarning(false);
        }
      }
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isAuthenticated, performLogout, showWarning]);

  if (!showWarning || !isAuthenticated()) {
    return null;
  }

  return (
    <div className="session-timeout-overlay" role="dialog" aria-modal="true">
      <div className="session-timeout-modal">
        <div className="session-timeout-icon-wrap">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </div>

        <h3 className="session-timeout-title">Session Expiring Soon</h3>
        
        <p className="session-timeout-desc">
          You have been inactive for a while. For banking security reasons, your session will automatically terminate in:
        </p>

        <div className="session-countdown-badge">
          ⏳ {secondsRemaining} seconds remaining
        </div>

        <div className="session-timeout-actions">
          <button 
            type="button" 
            className="session-btn-stay" 
            onClick={handleStaySignedIn}
          >
            Stay Signed In
          </button>
          
          <button 
            type="button" 
            className="session-btn-logout" 
            onClick={() => performLogout('user_choice')}
          >
            Sign Out Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionTimeoutManager;
