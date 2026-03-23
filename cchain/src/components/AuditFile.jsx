/**
 * AuditFile Component
 *
 * Fetches a file from IPFS by CID, sends it to the
 * res_main FastAPI backend for skill analysis, then
 * navigates to the SkillsDashboard with the results.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchFromIpfs } from '../ipfs/ipfsClient';

const AuditFile = ({ cid, fileName, walletAddress }) => {
  const navigate = useNavigate();
  const [auditing, setAuditing] = useState(false);
  const [error, setError] = useState('');

  const handleAudit = async () => {
    setAuditing(true);
    setError('');

    try {
      // 1. Fetch file content from IPFS
      const blob = await fetchFromIpfs(cid);
      const file = new File([blob], fileName || 'resume', { type: blob.type });

      // 2. Build multipart form data
      const githubUsername =
        localStorage.getItem(`github_username_${walletAddress}`) || '';
      const formData = new FormData();
      formData.append('resume', file);
      formData.append('github_username', githubUsername);

      // 3. Post to analysis backend
      const res = await fetch('http://localhost:8000/evaluate', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Server error ${res.status}`);
      }

      const data = await res.json();

      // 4. Persist keyed by wallet and navigate
      localStorage.setItem(`skill_scores_${walletAddress}`, JSON.stringify(data));
      navigate('/skills', { state: { scores: data, walletAddress } });
    } catch (err) {
      console.error('Audit error:', err);
      setError(err.message);
    } finally {
      setAuditing(false);
    }
  };

  return (
    <>
      <button
        onClick={handleAudit}
        disabled={auditing}
        className="audit-button"
        title={error || `Audit skills from ${fileName}`}
      >
        {auditing ? '…' : 'Audit'}
      </button>

      {error && <span className="audit-inline-error" title={error}>⚠️</span>}

      <style>{`
        .audit-button {
          padding: 6px 12px;
          background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
          color: #fff;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 500;
          transition: all 0.15s ease;
          box-shadow: 0 1px 4px rgba(37, 99, 235, 0.25);
        }

        .audit-button:hover:not(:disabled) {
          background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%);
          box-shadow: 0 2px 8px rgba(37, 99, 235, 0.35);
        }

        .audit-button:disabled {
          background: #d1d5db;
          box-shadow: none;
          cursor: wait;
        }

        .audit-inline-error {
          font-size: 14px;
          cursor: help;
          margin-left: 2px;
        }
      `}</style>
    </>
  );
};

export default AuditFile;
