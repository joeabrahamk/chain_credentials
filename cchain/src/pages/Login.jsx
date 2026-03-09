/**
 * Login Page
 * 
 * Entry point for the application.
 * Users can either connect with MetaMask or login as a Valuator.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginWithWallet, checkAuthStatus, formatAddress, wasLoggedOut } from '../auth/walletAuth';
import { loginAsValuator, signupValuator, checkValuatorAuthStatus } from '../auth/valuatorAuth';
import { isMetaMaskInstalled } from '../blockchain/web3';

const Login = () => {
  const navigate = useNavigate();
  
  // Tab state
  const [activeTab, setActiveTab] = useState('user'); // 'user' or 'valuator'
  
  // Valuator sub-tab state
  const [valuatorMode, setValuatorMode] = useState('login'); // 'login' or 'signup'
  
  // User login state
  const [connecting, setConnecting] = useState(false);
  const [walletError, setWalletError] = useState('');
  const [githubUsername, setGithubUsername] = useState('');
  
  // Valuator login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [valuatorError, setValuatorError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
  
  // Valuator signup state
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupCompanyName, setSignupCompanyName] = useState('');
  const [signingUp, setSigningUp] = useState(false);
  const [signupError, setSignupError] = useState('');
  const [signupSuccess, setSignupSuccess] = useState(false);

  // Check if already logged in
  useEffect(() => {
    const checkExistingAuth = async () => {
      // Check valuator first (from session)
      const valuatorAuth = checkValuatorAuthStatus();
      if (valuatorAuth.isAuthenticated) {
        navigate('/valuator');
        return;
      }

      // Don't auto-reconnect if user explicitly logged out
      if (wasLoggedOut()) {
        return;
      }

      // Check wallet connection
      const walletAuth = await checkAuthStatus();
      if (walletAuth.isAuthenticated) {
        // Pre-fill GitHub username if previously saved for this wallet
        const saved = localStorage.getItem(`github_username_${walletAuth.walletAddress}`);
        if (saved) {
          setGithubUsername(saved);
          // Only auto-skip to dashboard if GitHub username was already set
          navigate('/dashboard');
        }
        // No saved username → stay on login so user fills it in first
      }
    };

    checkExistingAuth();
  }, [navigate]);

  // Handle MetaMask connection
  const handleConnectWallet = async () => {
    if (!githubUsername.trim()) {
      setWalletError('GitHub username is required before connecting.');
      return;
    }
    setConnecting(true);
    setWalletError('');

    try {
      const auth = await loginWithWallet(true); // autoRegister = true
      console.log('Wallet connected:', formatAddress(auth.walletAddress));
      // Persist GitHub username keyed by wallet address
      if (githubUsername.trim()) {
        localStorage.setItem(`github_username_${auth.walletAddress}`, githubUsername.trim());
      }
      navigate('/dashboard');
    } catch (error) {
      console.error('Wallet connection error:', error);
      setWalletError(error.message);
    } finally {
      setConnecting(false);
    }
  };

  // Handle Valuator login
  const handleValuatorLogin = async (e) => {
    e.preventDefault();
    setLoggingIn(true);
    setValuatorError('');

    try {
      const auth = await loginAsValuator(email, password);
      console.log('Valuator logged in:', auth.name);
      navigate('/valuator');
    } catch (error) {
      console.error('Valuator login error:', error);
      setValuatorError(error.message);
    } finally {
      setLoggingIn(false);
    }
  };

  // Handle Valuator signup
  const handleValuatorSignup = async (e) => {
    e.preventDefault();
    setSigningUp(true);
    setSignupError('');
    setSignupSuccess(false);

    // Validate passwords match
    if (signupPassword !== signupConfirmPassword) {
      setSignupError('Passwords do not match.');
      setSigningUp(false);
      return;
    }

    try {
      const auth = await signupValuator({
        email: signupEmail,
        password: signupPassword,
        name: signupName,
        companyName: signupCompanyName
      });
      console.log('Valuator signed up:', auth.name);
      setSignupSuccess(true);
      
      // Navigate after short delay
      setTimeout(() => {
        navigate('/valuator');
      }, 1500);
    } catch (error) {
      console.error('Valuator signup error:', error);
      setSignupError(error.message);
    } finally {
      setSigningUp(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="logo-container">
          <img src="/icon.png" alt="Chain-Cred Logo" className="logo" />
        </div>
        <h1>Chain-Cred</h1>
        <p className="subtitle">Decentralized File Storage</p>

        <div className="tabs">
          <button
            className={`tab ${activeTab === 'user' ? 'active' : ''}`}
            onClick={() => setActiveTab('user')}
          >
            General User
          </button>
          <button
            className={`tab ${activeTab === 'valuator' ? 'active' : ''}`}
            onClick={() => setActiveTab('valuator')}
          >
            Valuator
          </button>
        </div>

        {activeTab === 'user' ? (
          <div className="user-login">
            <h2>Connect Your Wallet</h2>
            <p className="description">
              Use MetaMask to connect your Ethereum wallet. 
              Your wallet address will be your identity.
            </p>

            <div className="form-group">
              <label htmlFor="githubUsername">
                GitHub Username <span className="required-star">*</span>
              </label>
              <input
                type="text"
                id="githubUsername"
                value={githubUsername}
                onChange={(e) => {
                  setGithubUsername(e.target.value);
                  if (walletError === 'GitHub username is required before connecting.') setWalletError('');
                }}
                placeholder="e.g., joeabrahamk"
                disabled={connecting}
                autoComplete="off"
                spellCheck="false"
                required
                className={!githubUsername.trim() && walletError ? 'input-error' : ''}
              />
              <small>Required for skill analysis</small>
            </div>

            {!isMetaMaskInstalled() ? (
              <div className="metamask-warning">
                <p>⚠️ MetaMask is not installed</p>
                <a 
                  href="https://metamask.io/download/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="install-link"
                >
                  Install MetaMask →
                </a>
              </div>
            ) : (
              <button
                onClick={handleConnectWallet}
                disabled={connecting || !githubUsername.trim()}
                className="connect-button"
                title={!githubUsername.trim() ? 'Enter your GitHub username first' : ''}
              >
                {connecting ? 'Connecting...' : '🦊 Connect with MetaMask'}
              </button>
            )}

            {walletError && (
              <div className="error-message">
                <p>{walletError}</p>
              </div>
            )}

            <div className="info-box">
              <h4>First time?</h4>
              <ol>
                <li>Install MetaMask browser extension</li>
                <li>Create or import a wallet</li>
                <li>Switch to Ganache network (localhost:7545)</li>
                <li>Import a Ganache test account</li>
              </ol>
            </div>
          </div>
        ) : (
          <div className="valuator-login">
            <div className="valuator-tabs">
              <button
                className={`valuator-tab ${valuatorMode === 'login' ? 'active' : ''}`}
                onClick={() => { setValuatorMode('login'); setSignupError(''); setValuatorError(''); }}
              >
                Login
              </button>
              <button
                className={`valuator-tab ${valuatorMode === 'signup' ? 'active' : ''}`}
                onClick={() => { setValuatorMode('signup'); setSignupError(''); setValuatorError(''); }}
              >
                Sign Up
              </button>
            </div>

            {valuatorMode === 'login' ? (
              <>
                <p className="description">
                  Login with your valuator credentials to view user files.
                </p>

                <form onSubmit={handleValuatorLogin}>
                  <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      disabled={loggingIn}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <input
                      type="password"
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      disabled={loggingIn}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loggingIn}
                    className="login-button"
                  >
                    {loggingIn ? 'Logging in...' : 'Login'}
                  </button>
                </form>

                {valuatorError && (
                  <div className="error-message">
                    <p>{valuatorError}</p>
                  </div>
                )}

                <p className="switch-mode">
                  Don't have an account?{' '}
                  <button onClick={() => setValuatorMode('signup')} className="link-button">
                    Sign up
                  </button>
                </p>
              </>
            ) : (
              <>
                <p className="description">
                  Create a valuator account to access file viewing features.
                </p>

                {signupSuccess ? (
                  <div className="success-message">
                    <p>✓ Account created successfully! Redirecting...</p>
                  </div>
                ) : (
                  <form onSubmit={handleValuatorSignup}>
                    <div className="form-group">
                      <label htmlFor="signupName">Full Name</label>
                      <input
                        type="text"
                        id="signupName"
                        value={signupName}
                        onChange={(e) => setSignupName(e.target.value)}
                        placeholder="Enter your full name"
                        disabled={signingUp}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="signupEmail">Email</label>
                      <input
                        type="email"
                        id="signupEmail"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        placeholder="Enter your email"
                        disabled={signingUp}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="signupCompanyName">Company Name</label>
                      <input
                        type="text"
                        id="signupCompanyName"
                        value={signupCompanyName}
                        onChange={(e) => setSignupCompanyName(e.target.value)}
                        placeholder="Enter your company name"
                        disabled={signingUp}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="signupPassword">Password</label>
                      <input
                        type="password"
                        id="signupPassword"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        placeholder="Min 6 characters"
                        disabled={signingUp}
                        required
                        minLength={6}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="signupConfirmPassword">Confirm Password</label>
                      <input
                        type="password"
                        id="signupConfirmPassword"
                        value={signupConfirmPassword}
                        onChange={(e) => setSignupConfirmPassword(e.target.value)}
                        placeholder="Confirm your password"
                        disabled={signingUp}
                        required
                        minLength={6}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={signingUp}
                      className="login-button"
                    >
                      {signingUp ? 'Creating Account...' : 'Create Account'}
                    </button>
                  </form>
                )}

                {signupError && (
                  <div className="error-message">
                    <p>{signupError}</p>
                  </div>
                )}

                <p className="switch-mode">
                  Already have an account?{' '}
                  <button onClick={() => setValuatorMode('login')} className="link-button">
                    Login
                  </button>
                </p>
              </>
            )}

            <div className="info-box">
              <p>Valuators have read-only access to view files.</p>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
          padding: 24px;
          position: relative;
          overflow: hidden;
        }

        .login-page::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle at 30% 20%, rgba(37, 99, 235, 0.15) 0%, transparent 50%),
                      radial-gradient(circle at 70% 80%, rgba(99, 102, 241, 0.1) 0%, transparent 50%);
          z-index: 0;
          animation: float 20s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          50% { transform: translate(-2%, 2%) rotate(1deg); }
        }

        .login-page::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.02'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
          z-index: 0;
        }

        .login-container {
          background: rgba(255, 255, 255, 0.98);
          backdrop-filter: blur(20px);
          padding: 48px 40px;
          border-radius: 24px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.4),
                      0 0 0 1px rgba(255, 255, 255, 0.1);
          max-width: 440px;
          width: 100%;
          position: relative;
          z-index: 10;
          animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .logo-container {
          text-align: center;
          margin-bottom: 20px;
        }

        .logo {
          width: 72px;
          height: 72px;
          object-fit: contain;
          border-radius: 16px;
          box-shadow: 0 8px 24px rgba(37, 99, 235, 0.3);
          padding: 12px;
          background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
        }

        h1 {
          text-align: center;
          margin: 0 0 4px 0;
          font-size: 2rem;
          font-weight: 800;
          background: linear-gradient(135deg, #1e293b 0%, #475569 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: -0.5px;
        }

        .subtitle {
          text-align: center;
          color: #64748b;
          margin: 0 0 32px 0;
          font-size: 14px;
          font-weight: 500;
          letter-spacing: 0.5px;
        }

        .tabs {
          display: flex;
          margin-bottom: 32px;
          background: #f1f5f9;
          border-radius: 14px;
          padding: 5px;
          gap: 4px;
        }

        .tab {
          flex: 1;
          padding: 12px 16px;
          border: none;
          background: transparent;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          color: #64748b;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          border-radius: 10px;
          position: relative;
        }

        .tab:hover {
          color: #334155;
        }

        .tab.active {
          color: #fff;
          background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.35);
        }

        h2 {
          margin: 0 0 8px 0;
          color: #1e293b;
          font-size: 1.15rem;
          font-weight: 700;
        }

        .description {
          color: #64748b;
          font-size: 14px;
          margin-bottom: 28px;
          line-height: 1.7;
        }

        .connect-button {
          width: 100%;
          padding: 16px 24px;
          background: linear-gradient(135deg, #f6851b 0%, #e2761b 100%);
          color: #fff;
          border: none;
          border-radius: 14px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          box-shadow: 0 4px 14px rgba(246, 133, 27, 0.35);
        }

        .connect-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(246, 133, 27, 0.45);
        }

        .connect-button:active:not(:disabled) {
          transform: translateY(0);
        }

        .connect-button:disabled {
          background: #cbd5e1;
          box-shadow: none;
          cursor: not-allowed;
        }

        .metamask-warning {
          text-align: center;
          padding: 20px 24px;
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          border-radius: 14px;
          margin-bottom: 20px;
          border: 1px solid #fcd34d;
        }

        .metamask-warning p {
          margin: 0 0 12px 0;
          font-weight: 600;
          color: #92400e;
          font-size: 14px;
        }

        .install-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #78350f;
          font-weight: 700;
          font-size: 14px;
          text-decoration: none;
          padding: 8px 16px;
          background: rgba(255, 255, 255, 0.7);
          border-radius: 8px;
          transition: all 0.2s ease;
        }

        .install-link:hover {
          background: #fff;
          transform: translateX(2px);
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          color: #374151;
          font-weight: 600;
          font-size: 13px;
          letter-spacing: 0.3px;
        }

        .form-group input {
          width: 100%;
          padding: 14px 16px;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          font-size: 15px;
          box-sizing: border-box;
          transition: all 0.2s ease;
          background: #f8fafc;
        }

        .form-group input:hover {
          border-color: #cbd5e1;
          background: #fff;
        }

        .form-group input:focus {
          outline: none;
          border-color: #2563eb;
          background: #fff;
          box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
        }

        .form-group input::placeholder {
          color: #94a3b8;
        }

        .form-group input.input-error {
          border-color: #ef4444;
          background: #fff5f5;
          box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.1);
        }

        .required-star {
          color: #ef4444;
          margin-left: 2px;
        }

        .form-group small {
          display: block;
          margin-top: 6px;
          font-size: 12px;
          color: #94a3b8;
        }

        .connect-button:disabled {
          opacity: 0.55;
          cursor: not-allowed;
          transform: none !important;
          box-shadow: none !important;
        }

        .login-button {
          width: 100%;
          padding: 16px 24px;
          background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
          color: #fff;
          border: none;
          border-radius: 14px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);
        }

        .login-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(37, 99, 235, 0.45);
        }

        .login-button:disabled {
          background: #cbd5e1;
          box-shadow: none;
          cursor: not-allowed;
        }

        .error-message {
          margin-top: 20px;
          padding: 14px 16px;
          background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
          color: #dc2626;
          border-radius: 12px;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 12px;
          border: 1px solid #fecaca;
        }

        .error-message::before {
          content: '!';
          width: 22px;
          height: 22px;
          background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
          color: #fff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 800;
          flex-shrink: 0;
        }

        .error-message p {
          margin: 0;
          font-weight: 500;
        }

        .info-box {
          margin-top: 28px;
          padding: 20px;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border-radius: 14px;
          font-size: 13px;
          border: 1px solid #e2e8f0;
        }

        .info-box h4 {
          margin: 0 0 12px 0;
          color: #1e293b;
          font-size: 13px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .info-box h4::before {
          content: '💡';
        }

        .info-box ol {
          margin: 0;
          padding-left: 20px;
          color: #64748b;
        }

        .info-box li {
          margin-bottom: 6px;
          line-height: 1.6;
        }

        .info-box li::marker {
          color: #2563eb;
          font-weight: 700;
        }

        .info-box p {
          margin: 0;
          color: #64748b;
          line-height: 1.6;
        }

        .valuator-tabs {
          display: flex;
          background: #f1f5f9;
          border-radius: 12px;
          padding: 4px;
          margin-bottom: 24px;
          gap: 4px;
        }

        .valuator-tab {
          flex: 1;
          padding: 12px 16px;
          border: none;
          background: transparent;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          color: #64748b;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          border-radius: 9px;
        }

        .valuator-tab:hover {
          color: #334155;
        }

        .valuator-tab.active {
          background: #fff;
          color: #1e293b;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }

        .switch-mode {
          text-align: center;
          margin-top: 24px;
          font-size: 14px;
          color: #64748b;
        }

        .link-button {
          background: none;
          border: none;
          color: #2563eb;
          font-weight: 700;
          cursor: pointer;
          padding: 0;
          font-size: 14px;
          text-decoration: none;
          transition: all 0.2s ease;
        }

        .link-button:hover {
          color: #1d4ed8;
          text-decoration: underline;
        }

        .success-message {
          padding: 20px;
          background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
          color: #16a34a;
          border-radius: 14px;
          font-size: 15px;
          font-weight: 600;
          text-align: center;
          border: 1px solid #86efac;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }

        .success-message::before {
          content: '✓';
          width: 24px;
          height: 24px;
          background: linear-gradient(135deg, #16a34a 0%, #22c55e 100%);
          color: #fff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 800;
        }

        .success-message p {
          margin: 0;
        }

        @media (max-width: 480px) {
          .login-container {
            padding: 32px 24px;
            border-radius: 20px;
          }

          h1 {
            font-size: 1.6rem;
          }

          .logo {
            width: 60px;
            height: 60px;
          }
        }
      `}</style>
    </div>
  );
};

export default Login;
