// src/components/common/LoadingAnimation.jsx
import React, { useEffect, useState } from 'react';
import './LoadingAnimation.css';

const LoadingAnimation = ({ 
  message = 'Loading...',
  type = 'coin', // 'coin', 'ring', 'pulse', 'glow'
  size = 'medium' // 'small', 'medium', 'large'
}) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 1;
      });
    }, 30);

    return () => clearInterval(interval);
  }, []);

  const renderLoader = () => {
    switch(type) {
      case 'ring':
        return (
          <div className="premium-ring-container">
            <div className="premium-ring">
              <div className="ring-segment"></div>
              <div className="ring-segment"></div>
              <div className="ring-segment"></div>
              <div className="ring-segment"></div>
              <div className="ring-segment"></div>
              <div className="ring-segment"></div>
              <div className="ring-segment"></div>
              <div className="ring-segment"></div>
            </div>
            <div className="ring-center">
              <span className="rupee-symbol">₹</span>
            </div>
          </div>
        );
      
      case 'pulse':
        return (
          <div className="premium-pulse-container">
            <div className="pulse-ring pulse-1"></div>
            <div className="pulse-ring pulse-2"></div>
            <div className="pulse-ring pulse-3"></div>
            <div className="pulse-ring pulse-4"></div>
            <div className="pulse-center">
              <span className="rupee-symbol">₹</span>
            </div>
          </div>
        );
      
      case 'glow':
        return (
          <div className="premium-glow-container">
            <div className="glow-core">
              <span className="rupee-symbol">₹</span>
            </div>
            <div className="glow-orb glow-1"></div>
            <div className="glow-orb glow-2"></div>
            <div className="glow-orb glow-3"></div>
            <div className="glow-orb glow-4"></div>
            <div className="glow-orb glow-5"></div>
            <div className="glow-orb glow-6"></div>
          </div>
        );
      
      case 'coin':
      default:
        return (
          <div className={`rupee-coin-container ${size}`}>
            <div className="rupee-coin">
              <div className="coin-inner">
                <span className="rupee-symbol">₹</span>
              </div>
            </div>
            <div className="glow-ring ring-1"></div>
            <div className="glow-ring ring-2"></div>
            <div className="glow-ring ring-3"></div>
          </div>
        );
    }
  };

  return (
    <div className="loading-overlay">
      <div className="loading-backdrop"></div>
      <div className="loading-box">
        {renderLoader()}
        
        {/* Premium Progress Bar */}
        <div className="premium-progress-container">
          <div className="premium-progress-bar">
            <div 
              className="premium-progress-fill" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <span className="premium-progress-text">{progress}%</span>
        </div>
        
        {message && (
          <div className="loading-message">
            <span className="message-text">{message}</span>
            <span className="dots">
              <span>.</span>
              <span>.</span>
              <span>.</span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoadingAnimation;