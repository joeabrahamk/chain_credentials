/**
 * FileList Component
 * 
 * Displays a list of all files for a user.
 * Shows file name, upload date, and action buttons.
 */

import React, { useState, useEffect } from 'react';
import { getFiles } from '../blockchain/contract';
import DownloadFile from './DownloadFile';
import DeleteFile from './DeleteFile';
import AuditFile from './AuditFile';

const FileList = ({ userId, isReadOnly = false, onRefresh, walletAddress }) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchFiles = async () => {
    if (!userId) {
      setFiles([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const userFiles = await getFiles(userId);
      setFiles(userFiles);
    } catch (error) {
      console.error('Error fetching files:', error);
      setError('Failed to load files. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [userId]);

  // Allow parent to trigger refresh
  useEffect(() => {
    if (onRefresh) {
      onRefresh(fetchFiles);
    }
  }, [onRefresh]);

  const handleDeleteComplete = () => {
    fetchFiles();
  };

  if (loading) {
    return (
      <div className="file-list loading">
        <p>Loading files...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="file-list error">
        <p>{error}</p>
        <button onClick={fetchFiles}>Retry</button>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="file-list empty">
        <p>Please register or search for a user to view files.</p>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="file-list empty">
        <h3>My Files</h3>
        <p>No files uploaded yet.</p>
        {!isReadOnly && <p>Use the upload form above to add your first file!</p>}
      </div>
    );
  }

  return (
    <div className="file-list">
      <div className="file-list-header">
        <h3>{isReadOnly ? `Files for User: ${userId}` : 'My Files'}</h3>
        <span className="file-count">{files.length} file(s)</span>
      </div>
      
      <div className="files-table-wrapper">
        <table className="files-table">
          <thead>
            <tr>
              <th className="col-num">#</th>
              <th className="col-name">File Name</th>
              <th className="col-date">Upload Date</th>
              <th className="col-cid">CID</th>
              <th className="col-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {files.map((file, index) => (
              <tr key={`${file.cid}-${index}`}>
                <td className="col-num">{index + 1}</td>
                <td className="col-name" title={file.name}>{file.name}</td>
                <td className="col-date">{file.uploadDate}</td>
                <td className="col-cid">
                  <code title={file.cid}>{file.cid.slice(0, 8)}...{file.cid.slice(-4)}</code>
                </td>
                <td className="col-actions">
                  <DownloadFile cid={file.cid} fileName={file.name} />
                  {!isReadOnly && (
                    <AuditFile
                      cid={file.cid}
                      fileName={file.name}
                      walletAddress={walletAddress}
                    />
                  )}
                  {!isReadOnly && (
                    <DeleteFile
                      userId={userId}
                      fileIndex={file.index}
                      fileName={file.name}
                      onDeleteComplete={handleDeleteComplete}
                    />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button onClick={fetchFiles} className="refresh-button">
        Refresh
      </button>

      <style>{`
        .file-list {
          background: #fff;
          padding: 24px;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
        }

        .file-list-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 1px solid #f3f4f6;
        }

        .file-list h3 {
          margin: 0;
          color: #111827;
          font-size: 1rem;
          font-weight: 600;
        }

        .file-count {
          color: #6b7280;
          font-size: 13px;
        }

        .file-list.loading,
        .file-list.empty,
        .file-list.error {
          text-align: center;
          padding: 48px 24px;
          color: #6b7280;
          font-size: 14px;
        }

        .file-list.loading::after {
          content: '';
          display: block;
          width: 20px;
          height: 20px;
          margin: 12px auto 0;
          border: 2px solid #e5e7eb;
          border-top-color: #111827;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .file-list.error {
          color: #dc2626;
        }

        .file-list.error button {
          margin-top: 12px;
          padding: 10px 20px;
          background: #111827;
          color: #fff;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
        }

        .file-list.error button:hover {
          background: #1f2937;
        }

        .files-table-wrapper {
          overflow-x: auto;
          margin-bottom: 16px;
        }

        .files-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
        }

        .files-table th,
        .files-table td {
          padding: 12px 14px;
          text-align: left;
          border-bottom: 1px solid #f3f4f6;
        }

        .files-table th {
          background: #f9fafb;
          font-weight: 500;
          color: #6b7280;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .files-table tbody tr:hover {
          background: #f9fafb;
        }

        .files-table tbody tr:last-child td {
          border-bottom: none;
        }

        .col-num {
          width: 40px;
          color: #9ca3af;
          text-align: center;
        }

        .col-name {
          font-weight: 500;
          color: #111827;
          max-width: 200px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .col-date {
          color: #6b7280;
          white-space: nowrap;
          font-size: 13px;
        }

        .col-cid code {
          font-family: 'SF Mono', 'Consolas', monospace;
          font-size: 12px;
          color: #6b7280;
          background: #f3f4f6;
          padding: 4px 8px;
          border-radius: 4px;
        }

        .col-actions {
          white-space: nowrap;
        }

        .col-actions > * {
          margin-right: 8px;
        }

        .col-actions > *:last-child {
          margin-right: 0;
        }

        .refresh-button {
          padding: 10px 16px;
          background: #fff;
          color: #374151;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
          transition: all 0.15s ease;
        }

        .refresh-button:hover {
          background: #f9fafb;
          border-color: #9ca3af;
        }

        @media (max-width: 640px) {
          .file-list {
            padding: 16px;
          }

          .files-table th,
          .files-table td {
            padding: 10px 8px;
          }

          .col-cid {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};

export default FileList;
