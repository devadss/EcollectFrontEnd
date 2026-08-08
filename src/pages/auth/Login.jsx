import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      navigate('/dashboard');
    }, 1500);
  };

  const accentColor = theme.accent || '#6C63FF';

  // const handleLogin = async (e) => {
  //   e.preventDefault();

  //   try {
  //     const response = await authApi.login(formData);

  //     const { token, user } = response.data;

  //     localStorage.setItem("token", token);
  //     localStorage.setItem("user", JSON.stringify(user));

  //     if (user.role === "bankadmin") {
  //       navigate("/bankadmin/dashboard");
  //     } else if (user.role === "merchant") {
  //       navigate("/merchant/dashboard");
  //     } else if (user.role === "agent") {
  //       navigate("/agent/dashboard");
  //     }

  //   } catch (error) {
  //     alert(
  //       error.response?.data?.message ||
  //       "Login failed"
  //     );
  //   }
  // };

  return (
    <div className="login-container">
      {/* Left Side - Branding */}
      <div className="login-left">
        <div className="login-left-content">
          <div className="login-brand">
            <div className="login-brand-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="white" strokeWidth="2"/>
                <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2"/>
                <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2"/>
              </svg>
            </div>
            <span className="login-brand-name">Fin<span className="login-brand-highlight">Tech</span></span>
          </div>

          <div className="login-hero">
            <h1>Welcome back</h1>
            <p>Sign in to your account to continue</p>
          </div>

          <div className="login-features">
            <div className="login-feature">
              <span className="login-feature-icon">🔒</span>
              <div>
                <h4>Secure</h4>
                <p>Bank-grade encryption</p>
              </div>
            </div>
            <div className="login-feature">
              <span className="login-feature-icon">⚡</span>
              <div>
                <h4>Fast</h4>
                <p>Real-time processing</p>
              </div>
            </div>
            <div className="login-feature">
              <span className="login-feature-icon">📊</span>
              <div>
                <h4>Analytics</h4>
                <p>Live data insights</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Card */}
      <div className="login-right">
        <div className="login-card">
          <div className="login-card-header">
            <h2>Sign in to your account</h2>
            <p>Enter your credentials to access your dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="login-form-group">
              <label>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
              />
            </div>

            <div className="login-form-group">
              <label>Password</label>
              <div className="login-password-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  className="login-toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <div className="login-options">
              <label className="login-remember">
                <input type="checkbox" defaultChecked />
                <span className="login-checkmark"></span>
                Remember me
              </label>
              <a href="#" className="login-forgot">Forgot password?</a>
            </div>

            <button type="submit" className="login-submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <span className="login-spinner"></span>
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="login-divider">
            <span>or continue with</span>
          </div>

          <div className="login-social">
            <button className="login-social-btn">
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google
            </button>
            <button className="login-social-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Facebook
            </button>
          </div>

          <p className="login-signup">
            Don't have an account? <a href="#">Sign up free</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;