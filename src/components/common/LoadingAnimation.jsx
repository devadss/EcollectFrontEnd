// src/components/common/LoadingAnimation.jsx
import React, { useEffect, useState } from 'react';
import './LoadingAnimation.css';

const LoadingAnimation = ({ 
  message = 'Synchronizing Gateway Telemetry...',
  size = 'medium' // 'small', 'medium', 'large'
}) => {
  const [progress, setProgress] = useState(15);

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
      
      <div className="fintech-loading-box gold-theme">
        
        {/* Ambient Warm Gold Radiance */}
        <div className="loading-gold-halo"></div>

        {/* 3D Spinning Gold Coin Stage */}
        <div className={`gold-coin-stage ${size}`}>
          {/* Orbital golden rings */}
          <div className="gold-orbit-ring ring-1"></div>
          <div className="gold-orbit-ring ring-2"></div>
          
          {/* 3D Full-Rotating Gold Coin */}
          <div className="gold-coin-3d-wrapper">
            <div className="gold-coin-face gold-coin-front">
              <img 
                src="/gold-coin.jpg" 
                alt="Gold Coin Front" 
                className="gold-coin-img"
              />
              <div className="gold-coin-shine-sweep"></div>
            </div>
            <div className="gold-coin-face gold-coin-back">
              <img 
                src="/gold-coin.jpg" 
                alt="Gold Coin Back" 
                className="gold-coin-img"
              />
              <div className="gold-coin-shine-sweep"></div>
            </div>
          </div>

          {/* Golden Sparkle Particles */}
          <div className="coin-sparkle sp-1">✦</div>
          <div className="coin-sparkle sp-2">★</div>
          <div className="coin-sparkle sp-3">✦</div>
        </div>

        {/* Status Messaging */}
        <div className="loading-text-stack">
          <div className="loading-main-message">
            <span className="message-title">{message}</span>
            <span className="live-dots gold-dots">
              <span>.</span>
              <span>.</span>
              <span>.</span>
            </span>
          </div>

          <div className="loading-security-badge gold-badge">
            <span className="security-dot gold-dot"></span>
            <span>256-Bit Encrypted Secure Banking Vault</span>
          </div>
        </div>

        {/* Golden Progress Bar */}
        <div className="fintech-progress-container">
          <div className="fintech-progress-track gold-track">
            <div 
              className="fintech-progress-bar gold-bar" 
              style={{ width: `${progress}%` }}
            >
              <div className="progress-light-sweep gold-sweep"></div>
            </div>
          </div>
          <div className="progress-status-row font-mono">
            <span className="progress-state gold-text">PROCESSING TRANSACTION</span>
            <span className="progress-number gold-text">{progress}%</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default LoadingAnimation;