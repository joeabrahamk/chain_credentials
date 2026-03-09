/**
 * ValuatorDashboard Page
 * 
 * Dashboard for valuators.
 * Allows searching and viewing files by user ID (read-only).
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { checkValuatorAuthStatus, logoutValuator } from '../auth/valuatorAuth';
import { getFiles, getFileCount } from '../blockchain/contract';
import FileList from '../components/FileList';

const ValuatorDashboard = () => {
  const navigate = useNavigate();
  
  const [authState, setAuthState] = useState({
    isAuthenticated: false,
    email: null,
    name: null,
    companyName: null
  });
  const [loading, setLoading] = useState(true);
  
  // Search state
  const [searchUserId, setSearchUserId] = useState('');
  const [currentUserId, setCurrentUserId] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [fileCount, setFileCount] = useState(null);

  // Check authentication on mount
  useEffect(() => {
    const auth = checkValuatorAuthStatus();
    
    if (!auth.isAuthenticated) {
      navigate('/');
      return;
    }

    setAuthState(auth);
    setLoading(false);
  }, [navigate]);

  // Handle logout
  const handleLogout = async () => {
    await logoutValuator();
    navigate('/');
  };

  // Handle search
  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!searchUserId.trim()) {
      setSearchError('Please enter a User ID to search.');
      return;
    }

    setSearching(true);
    setSearchError('');
    setFileCount(null);

    try {
      // Check if user has any files
      const count = await getFileCount(searchUserId.trim());
      setFileCount(count);
      setCurrentUserId(searchUserId.trim());
    } catch (error) {
      console.error('Search error:', error);
      setSearchError('Failed to search for user. Please check the User ID and try again.');
    } finally {
      setSearching(false);
    }
  };

  // Clear search
  const handleClearSearch = () => {
    setSearchUserId('');
    setCurrentUserId('');
    setFileCount(null);
    setSearchError('');
  };

  if (loading) {
    return (
      <div className="dashboard loading">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="dashboard valuator">
      <header className="dashboard-header">
        <div className="header-left">
          <img src="/icon.png" alt="Chain-Cred" className="header-logo" />
          <h1>Chain-Cred</h1>
          <span className="user-type valuator-badge">Valuator (Read-Only)</span>
        </div>
        <div className="header-right">
          <div className="user-info">
            <span className="user-label">Logged in as:</span>
            <span className="username">{authState.name}</span>
            {authState.companyName && (
              <span className="company-name">({authState.companyName})</span>
            )}
          </div>
          <button onClick={handleLogout} className="logout-button">
            Logout
          </button>
        </div>
      </header>

      <main className="dashboard-content">
        <div className="search-section">
          <h2>Search User Files</h2>
          <p>Enter a User ID to view their uploaded files.</p>
          
          <form onSubmit={handleSearch} className="search-form">
            <div className="search-input-group">
              <input
                type="text"
                value={searchUserId}
                onChange={(e) => setSearchUserId(e.target.value)}
                placeholder="Enter User ID..."
                disabled={searching}
                className="search-input"
              />
              <button type="submit" disabled={searching} className="search-button">
                {searching ? 'Searching...' : '🔍 Search'}
              </button>
              {currentUserId && (
                <button 
                  type="button" 
                  onClick={handleClearSearch} 
                  className="clear-button"
                >
                  Clear
                </button>
              )}
            </div>
          </form>

          {searchError && (
            <div className="error-message">
              <p>{searchError}</p>
            </div>
          )}

          {currentUserId && fileCount !== null && (
            <div className="search-result-info">
              <p>
                Found <strong>{fileCount}</strong> file(s) for user: <strong>{currentUserId}</strong>
              </p>
            </div>
          )}
        </div>

        {currentUserId && (
          <FileList 
            userId={currentUserId} 
            isReadOnly={true}
          />
        )}

        {!currentUserId && (
          <div className="empty-state">
            <div className="empty-icon">📂</div>
            <h3>No User Selected</h3>
            <p>Search for a User ID above to view their files.</p>
          </div>
        )}

        <div className="valuator-notice">
          <p>
            <strong>⚠️ Read-Only Access:</strong> As a valuator, you can only view files. 
            Uploading and deleting files is not permitted.
          </p>
        </div>
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
          background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
          color: #fff;
          padding: 18px 32px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
          position: sticky;
          top: 0;
          z-index: 100;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
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
          box-shadow: 0 2px 8px rgba(255, 255, 255, 0.1);
          padding: 4px;
          background: transparent;
        }

        .header-left h1 {
          margin: 0;
          font-size: 1.35rem;
          font-weight: 800;
          letter-spacing: -0.5px;
        }

        .user-type {
          padding: 8px 14px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
        }

        .valuator-badge {
          background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
          box-shadow: 0 2px 8px rgba(37, 99, 235, 0.4);
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13px;
        }

        .user-label {
          opacity: 0.6;
        }

        .username {
          background: rgba(255, 255, 255, 0.12);
          padding: 8px 12px;
          border-radius: 8px;
          font-weight: 600;
          backdrop-filter: blur(8px);
        }

        .company-name {
          opacity: 0.6;
          font-size: 12px;
          font-style: italic;
        }

        .logout-button {
          padding: 10px 18px;
          background: rgba(255, 255, 255, 0.08);
          color: #fff;
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 10px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
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
          background: rgba(239, 68, 68, 0.2);
          border-color: rgba(239, 68, 68, 0.4);
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

        .search-section {
          background: #fff;
          padding: 32px;
          border-radius: 20px;
          margin-bottom: 24px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04);
        }

        .search-section h2 {
          margin: 0 0 6px 0;
          color: #1e293b;
          font-size: 1.4rem;
          font-weight: 700;
        }

        .search-section p {
          color: #64748b;
          margin: 0 0 24px 0;
          font-size: 14px;
        }

        .search-form {
          margin-bottom: 0;
        }

        .search-input-group {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .search-input {
          flex: 1;
          min-width: 200px;
          padding: 14px 18px;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          font-size: 15px;
          transition: all 0.2s ease;
          background: #f8fafc;
        }

        .search-input:hover {
          border-color: #cbd5e1;
          background: #fff;
        }

        .search-input:focus {
          outline: none;
          border-color: #2563eb;
          background: #fff;
          box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
        }

        .search-button {
          padding: 14px 24px;
          background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
          color: #fff;
          border: none;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          white-space: nowrap;
          box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);
        }

        .search-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(37, 99, 235, 0.45);
        }

        .search-button:disabled {
          background: #cbd5e1;
          box-shadow: none;
          cursor: not-allowed;
        }

        .clear-button {
          padding: 14px 20px;
          background: #fff;
          color: #64748b;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .clear-button:hover {
          background: #f1f5f9;
          border-color: #cbd5e1;
          color: #475569;
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

        .search-result-info {
          margin-top: 20px;
          padding: 16px 18px;
          background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
          color: #166534;
          border-radius: 12px;
          font-size: 14px;
          border: 1px solid #86efac;
          font-weight: 500;
        }

        .empty-state {
          background: #fff;
          padding: 72px 32px;
          border-radius: 20px;
          text-align: center;
          margin-bottom: 24px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04);
        }

        .empty-icon {
          font-size: 56px;
          margin-bottom: 20px;
          opacity: 0.35;
        }

        .empty-state h3 {
          margin: 0 0 10px 0;
          color: #1e293b;
          font-size: 1.25rem;
          font-weight: 700;
        }

        .empty-state p {
          margin: 0;
          color: #64748b;
          font-size: 15px;
        }

        .valuator-notice {
          background: linear-gradient(135deg, #fefce8 0%, #fef3c7 100%);
          padding: 18px 20px;
          border-radius: 14px;
          border: 1px solid #fde047;
          margin-top: 24px;
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }

        .valuator-notice::before {
          content: '⚠️';
          font-size: 18px;
          flex-shrink: 0;
        }

        .valuator-notice p {
          margin: 0;
          color: #854d0e;
          font-size: 14px;
          line-height: 1.6;
        }

        .valuator-notice strong {
          color: #713f12;
        }

        @media (max-width: 768px) {
          .dashboard-header {
            padding: 14px 16px;
          }

          .dashboard-content {
            margin: 24px auto;
            padding: 0 16px;
          }

          .search-section {
            padding: 24px;
            border-radius: 16px;
          }

          .search-input-group {
            flex-direction: column;
          }

          .search-button,
          .clear-button {
            width: 100%;
          }

          .empty-state {
            padding: 48px 24px;
            border-radius: 16px;
          }
        }
      `}</style>
    </div>
  );
};

export default ValuatorDashboard;
