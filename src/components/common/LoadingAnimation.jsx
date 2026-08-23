// src/components/common/LoadingAnimation.jsx
import React, { useEffect, useState } from 'react';
import './LoadingAnimation.css';

const LoadingAnimation = ({ 
  message = 'Synchronizing Gateway Telemetry...',
  size = 'medium' // 'small', 'medium', 'large'
}) => {
  const [progress, setProgress] = useState(18);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 98) {
          clearInterval(interval);
          return 98;
        }
        const jump = Math.floor(Math.random() * 8) + 4;
        return Math.min(prev + jump, 98);
      });
    }, 120);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fintech-loading-overlay">
      <div className="fintech-loading-backdrop"></div>
      
      <div className="fintech-loading-box">
        
        {/* Dynamic Theme Glow Radiance */}
        <div className="loading-theme-halo"></div>

        {/* 3D Spinning Fintech Hologram Stage */}
        <div className={`fintech-stage ${size}`}>
          {/* Orbital dynamic rings */}
          <div className="theme-orbit-ring ring-1"></div>
          <div className="theme-orbit-ring ring-2"></div>
          
          {/* 3D Rotating Emblem with dynamic theme glow */}
          <div className="theme-coin-3d-wrapper">
            <div className="theme-coin-face coin-front">
              <img 
                src="/gold-coin.jpg" 
                alt="Fintech Portal Emblem" 
                className="theme-coin-img"
              />
              <div className="theme-coin-shine-sweep"></div>
            </div>
            <div className="theme-coin-face coin-back">
              <img 
                src="/gold-coin.jpg" 
                alt="Fintech Portal Emblem" 
                className="theme-coin-img"
              />
              <div className="theme-coin-shine-sweep"></div>
            </div>
          </div>

          {/* Sparkle Particles matching theme */}
          <div className="theme-sparkle sp-1">✦</div>
          <div className="theme-sparkle sp-2">★</div>
          <div className="theme-sparkle sp-3">✦</div>
        </div>

        {/* Status Messaging */}
        <div className="loading-text-stack">
          <div className="loading-main-message">
            <span className="message-title">{message}</span>
            <span className="live-dots theme-dots">
              <span>.</span>
              <span>.</span>
              <span>.</span>
            </span>
          </div>

          <div className="loading-security-badge">
            <span className="security-dot"></span>
            <span>256-Bit Encrypted Secure Banking Vault</span>
          </div>
        </div>

        {/* Dynamic Theme Progress Bar */}
        <div className="fintech-progress-container">
          <div className="fintech-progress-track">
            <div 
              className="fintech-progress-bar" 
              style={{ width: `${progress}%` }}
            >
              <div className="progress-light-sweep"></div>
            </div>
          </div>
          <div className="progress-status-row font-mono">
            <span className="progress-state">PROCESSING TRANSACTION</span>
            <span className="progress-number">{progress}%</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default LoadingAnimation;