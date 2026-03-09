/**
 * UserDashboard Page
 * 
 * Main dashboard for general users.
 * Allows uploading, viewing, downloading, and deleting files.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { checkAuthStatus, logout, formatAddress, registerNewUser } from '../auth/walletAuth';
import { isUserRegistered, getUserId } from '../blockchain/contract';
import UploadFile from '../components/UploadFile';
import FileList from '../components/FileList';

const UserDashboard = () => {
  const navigate = useNavigate();
  
  const [authState, setAuthState] = useState({
    isAuthenticated: false,
    walletAddress: null,
    userId: null
  });
  const [loading, setLoading] = useState(true);
  const [refreshFiles, setRefreshFiles] = useState(null);
  
  // Registration state
  const [showRegister, setShowRegister] = useState(false);
  const [newUserId, setNewUserId] = useState('');
  const [registering, setRegistering] = useState(false);
  const [registerError, setRegisterError] = useState('');

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const auth = await checkAuthStatus();
        
        if (!auth.isAuthenticated) {
          navigate('/');
          return;
        }

        // Check if user is registered on blockchain
        const registered = await isUserRegistered(auth.walletAddress);
        
        if (!registered) {
          setShowRegister(true);
        } else {
          // Get user ID
          const userId = await getUserId(auth.walletAddress);
          auth.userId = userId;
        }

        setAuthState(auth);
      } catch (error) {
        console.error('Auth check error:', error);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Handle registration
  const handleRegister = async (e) => {
    e.preventDefault();
    setRegistering(true);
    setRegisterError('');

    try {
      const auth = await registerNewUser(newUserId);
      setAuthState(auth);
      setShowRegister(false);
    } catch (error) {
      console.error('Registration error:', error);
      setRegisterError(error.message);
    } finally {
      setRegistering(false);
    }
  };

  // Callback to trigger file list refresh
  const handleUploadComplete = useCallback(() => {
    if (refreshFiles) {
      refreshFiles();
    }
  }, [refreshFiles]);

  // Set up refresh function from FileList
  const handleRefreshCallback = useCallback((refreshFn) => {
    setRefreshFiles(() => refreshFn);
  }, []);

  if (loading) {
    return (
      <div className="dashboard loading">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          <img src="/icon.png" alt="Chain-Cred" className="header-logo" />
          <h1>Chain-Cred</h1>
          <span className="user-type">General User</span>
        </div>
        <div className="header-right">
          <div className="wallet-info">
            <span className="wallet-label">Wallet:</span>
            <span className="wallet-address" title={authState.walletAddress}>
              {formatAddress(authState.walletAddress)}
            </span>
          </div>
          {authState.userId && (
            <div className="user-id-info">
              <span className="user-id-label">User ID:</span>
              <span className="user-id">{authState.userId}</span>
            </div>
          )}
          <button onClick={() => navigate('/skills')} className="skills-button">
            Skills
          </button>
          <button onClick={handleLogout} className="logout-button">
            Logout
          </button>
        </div>
      </header>

      <main className="dashboard-content">
        {showRegister ? (
          <div className="register-section">
            <h2>Complete Registration</h2>
            <p>Choose a unique User ID to identify yourself on the network.</p>
            
            <form onSubmit={handleRegister} className="register-form">
              <div className="form-group">
                <label htmlFor="userId">User ID</label>
                <input
                  type="text"
                  id="userId"
                  value={newUserId}
                  onChange={(e) => setNewUserId(e.target.value)}
                  placeholder="e.g., john_doe_123"
                  disabled={registering}
                  required
                  minLength={3}
                  maxLength={50}
                />
                <small>3-50 characters. This cannot be changed later.</small>
              </div>

              <button type="submit" disabled={registering} className="register-button">
                {registering ? 'Registering...' : 'Register'}
              </button>
            </form>

            {registerError && (
              <div className="error-message">
                <p>{registerError}</p>
              </div>
            )}
          </div>
        ) : (
          <>
            <UploadFile 
              userId={authState.userId} 
              onUploadComplete={handleUploadComplete}
            />
            <FileList 
              userId={authState.userId} 
              isReadOnly={false}
              onRefresh={handleRefreshCallback}
              walletAddress={authState.walletAddress}
            />
          </>
        )}
      </main>

      <style>{`
        .dashboard {
          min-height: 100vh;
          background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
        }

        .dashboard.loading {
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 15px;
          color: #64748b;
          gap: 12px;
        }

        .dashboard.loading::after {
          content: '';
          width: 24px;
          height: 24px;
          border: 3px solid #e2e8f0;
          border-top-color: #2563eb;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .dashboard-header {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid #e2e8f0;
          padding: 16px 32px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
          position: sticky;
          top: 0;
          z-index: 100;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .header-logo {
          width: 36px;
          height: 36px;
          object-fit: contain;
          border-radius: 10px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
          padding: 6px;
          background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
        }

        .header-left h1 {
          margin: 0;
          font-size: 1.35rem;
          font-weight: 800;
          background: linear-gradient(135deg, #1e293b 0%, #475569 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: -0.5px;
        }

        .user-type {
          background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          color: #2563eb;
          border: 1px solid #bfdbfe;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }

        .wallet-info,
        .user-id-info {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
        }

        .wallet-label,
        .user-id-label {
          color: #64748b;
          font-weight: 500;
        }

        .wallet-address {
          font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
          background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 12px;
          color: #334155;
          font-weight: 500;
          border: 1px solid #e2e8f0;
        }

        .user-id {
          background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
          padding: 8px 12px;
          border-radius: 8px;
          font-weight: 600;
          color: #334155;
          font-size: 13px;
          border: 1px solid #e2e8f0;
        }

        .skills-button {
          padding: 10px 18px;
          background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
          color: #fff;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .skills-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
        }

        .logout-button {
          padding: 10px 18px;
          background: #fff;
          color: #64748b;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .logout-button::before {
          content: '→';
          font-size: 14px;
          transform: rotate(180deg);
          display: inline-block;
        }

        .logout-button:hover {
          background: #fef2f2;
          border-color: #fecaca;
          color: #dc2626;
        }

        .dashboard-content {
          max-width: 900px;
          margin: 40px auto;
          padding: 0 24px;
          animation: fadeIn 0.4s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .register-section {
          background: #fff;
          padding: 56px 48px;
          border-radius: 20px;
          border: 1px solid #e2e8f0;
          text-align: center;
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04);
        }

        .register-section h2 {
          margin: 0 0 12px 0;
          color: #1e293b;
          font-size: 1.75rem;
          font-weight: 700;
        }

        .register-section p {
          color: #64748b;
          margin-bottom: 36px;
          font-size: 15px;
          line-height: 1.6;
        }

        .register-form {
          max-width: 380px;
          margin: 0 auto;
          text-align: left;
        }

        .form-group {
          margin-bottom: 24px;
        }

        .form-group label {
          display: block;
          margin-bottom: 10px;
          color: #374151;
          font-weight: 600;
          font-size: 14px;
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

        .form-group small {
          display: block;
          margin-top: 8px;
          color: #94a3b8;
          font-size: 12px;
        }

        .register-button {
          width: 100%;
          padding: 16px 24px;
          background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
          color: #fff;
          border: none;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);
        }

        .register-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(37, 99, 235, 0.45);
        }

        .register-button:disabled {
          background: #cbd5e1;
          box-shadow: none;
          cursor: not-allowed;
        }

        .error-message {
          margin-top: 24px;
          padding: 14px 16px;
          background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
          color: #dc2626;
          border-radius: 12px;
          text-align: left;
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

        @media (max-width: 768px) {
          .dashboard-header {
            padding: 12px 16px;
          }

          .dashboard-content {
            margin: 24px auto;
            padding: 0 16px;
          }

          .register-section {
            padding: 36px 24px;
            border-radius: 16px;
          }
        }

      `}</style>
    </div>
  );
};

export default UserDashboard;
