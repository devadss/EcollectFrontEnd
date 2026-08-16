// src/components/common/LoadingAnimation.jsx
import React, { useEffect, useState } from 'react';
import './LoadingAnimation.css';

const LoadingAnimation = ({ 
  message = 'Loading...',
  type = 'coin', // 'coin', 'ring', 'pulse', 'glow', 'bounce', 'float'
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
      case 'bounce':
        return (
          <div className="cute-bounce-container">
            <div className="bounce-emoji">🪙</div>
            <div className="bounce-dots">
              <span className="bounce-dot"></span>
              <span className="bounce-dot"></span>
              <span className="bounce-dot"></span>
              <span className="bounce-dot"></span>
              <span className="bounce-dot"></span>
            </div>
          </div>
        );

      case 'float':
        return (
          <div className="cute-float-container">
            <div className="float-emoji">✨</div>
            <div className="float-emoji float-2">⭐</div>
            <div className="float-emoji float-3">💫</div>
            <div className="float-emoji float-4">🌟</div>
            <div className="float-emoji float-5">🌈</div>
            <div className="float-center">₹</div>
          </div>
        );

      case 'ring':
        return (
          <div className="cute-ring-container">
            <div className="cute-ring">
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
              <span className="cute-symbol">₹</span>
            </div>
          </div>
        );
      
      case 'pulse':
        return (
          <div className="cute-pulse-container">
            <div className="pulse-ring pulse-1"></div>
            <div className="pulse-ring pulse-2"></div>
            <div className="pulse-ring pulse-3"></div>
            <div className="pulse-ring pulse-4"></div>
            <div className="pulse-center">
              <span className="cute-symbol">💰</span>
            </div>
          </div>
        );
      
      case 'glow':
        return (
          <div className="cute-glow-container">
            <div className="glow-core">
              <span className="cute-symbol">🪙</span>
            </div>
            <div className="glow-orb glow-1">✨</div>
            <div className="glow-orb glow-2">⭐</div>
            <div className="glow-orb glow-3">💫</div>
            <div className="glow-orb glow-4">🌟</div>
            <div className="glow-orb glow-5">🌈</div>
            <div className="glow-orb glow-6">🎀</div>
          </div>
        );
      
      case 'coin':
      default:
        return (
          <div className={`cute-coin-container ${size}`}>
            <div className="cute-coin">
              <div className="coin-inner">
                <span className="cute-symbol">₹</span>
              </div>
            </div>
            <div className="cute-glow-ring ring-1"></div>
            <div className="cute-glow-ring ring-2"></div>
            <div className="cute-glow-ring ring-3"></div>
            
            {/* Cute sparkles around coin */}
            <span className="cute-sparkle s1">✨</span>
            <span className="cute-sparkle s2">⭐</span>
            <span className="cute-sparkle s3">💫</span>
            <span className="cute-sparkle s4">🌟</span>
            <span className="cute-sparkle s5">🌈</span>
          </div>
        );
    }
  };

  return (
    <div className="loading-overlay">
      <div className="loading-backdrop"></div>
      <div className="loading-box">
        {renderLoader()}
        
        {/* Cute Progress Bar */}
        <div className="cute-progress-container">
          <div className="cute-progress-bar">
            <div 
              className="cute-progress-fill" 
              style={{ width: `${progress}%` }}
            >
              <span className="progress-emoji">🌟</span>
            </div>
          </div>
          <span className="cute-progress-text">{progress}%</span>
        </div>
        
        {message && (
          <div className="loading-message">
            <span className="message-text">{message}</span>
            <span className="cute-dots">
              <span>.</span>
              <span>.</span>
              <span>.</span>
            </span>
          </div>
        )}
        
        {/* Cute loading tips */}
        <div className="cute-tips">
          <span className="tip-emoji">💡</span>
          <span className="tip-text">Almost there!</span>
        </div>
      </div>
    </div>
  );
};

export default LoadingAnimation;