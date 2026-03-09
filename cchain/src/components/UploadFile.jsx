/**
 * UploadFile Component
 * 
 * Allows users to select and upload files to IPFS,
 * then stores the metadata on the blockchain.
 */

import React, { useState, useRef } from 'react';
import { uploadToIpfs } from '../ipfs/ipfsClient';
import { uploadFileMetadata } from '../blockchain/contract';
import config from '../config/appConfig';

const UploadFile = ({ userId, onUploadComplete }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    setError('');
    
    if (file) {
      // Validate file size
      if (config.maxFileSize && file.size > config.maxFileSize) {
        setError(`File size exceeds maximum allowed size of ${config.maxFileSize / (1024 * 1024)}MB`);
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
    } else {
      setSelectedFile(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file first.');
      return;
    }

    if (!userId) {
      setError('User not registered. Please register first.');
      return;
    }

    setUploading(true);
    setError('');

    try {
      // Step 1: Upload to IPFS
      setUploadProgress('Uploading to IPFS...');
      const cid = await uploadToIpfs(selectedFile);
      console.log('File uploaded to IPFS with CID:', cid);

      // Step 2: Store metadata on blockchain
      setUploadProgress('Storing metadata on blockchain...');
      await uploadFileMetadata(userId, cid, selectedFile.name);
      console.log('Metadata stored on blockchain');

      // Success!
      setUploadProgress('Upload complete!');
      setSelectedFile(null);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Notify parent component
      if (onUploadComplete) {
        onUploadComplete();
      }

      // Clear progress after a delay
      setTimeout(() => {
        setUploadProgress('');
      }, 2000);

    } catch (error) {
      console.error('Upload error:', error);
      setError(error.message || 'Failed to upload file. Please try again.');
      setUploadProgress('');
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="upload-file">
      <h3>Upload File</h3>
      
      <div className="upload-area">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          disabled={uploading}
          className="file-input"
        />
        
        {selectedFile && (
          <div className="selected-file-info">
            <p><strong>Selected:</strong> {selectedFile.name}</p>
            <p><strong>Size:</strong> {formatFileSize(selectedFile.size)}</p>
            <p><strong>Type:</strong> {selectedFile.type || 'Unknown'}</p>
          </div>
        )}
      </div>

      <button
        onClick={handleUpload}
        disabled={!selectedFile || uploading}
        className="upload-button"
      >
        {uploading ? 'Uploading...' : 'Upload to IPFS'}
      </button>

      {uploadProgress && (
        <div className="upload-progress">
          <p>{uploadProgress}</p>
        </div>
      )}

      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}

      <style>{`
        .upload-file {
          background: #fff;
          padding: 32px;
          border-radius: 20px;
          margin-bottom: 24px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04);
        }

        .upload-file h3 {
          margin: 0 0 20px 0;
          color: #1e293b;
          font-size: 1.15rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .upload-file h3::before {
          content: '📤';
          font-size: 1.1rem;
        }

        .upload-area {
          margin-bottom: 20px;
        }

        .file-input {
          width: 100%;
          padding: 28px 20px;
          border: 2px dashed #cbd5e1;
          border-radius: 14px;
          cursor: pointer;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          font-size: 14px;
          color: #64748b;
        }

        .file-input:hover {
          border-color: #2563eb;
          background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
        }

        .file-input:focus {
          outline: none;
          border-color: #2563eb;
          box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
        }

        .selected-file-info {
          margin-top: 16px;
          padding: 18px 20px;
          background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
          border-radius: 12px;
          border: 1px solid #e2e8f0;
        }

        .selected-file-info p {
          margin: 6px 0;
          font-size: 13px;
          color: #64748b;
          display: flex;
          gap: 8px;
        }

        .selected-file-info strong {
          color: #334155;
          font-weight: 600;
          min-width: 60px;
        }

        .upload-button {
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
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }

        .upload-button::before {
          content: '⬆';
          font-size: 14px;
        }

        .upload-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(37, 99, 235, 0.45);
        }

        .upload-button:disabled {
          background: #cbd5e1;
          box-shadow: none;
          cursor: not-allowed;
        }

        .upload-button:disabled::before {
          content: '';
        }

        .upload-progress {
          margin-top: 16px;
          padding: 16px 18px;
          background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
          color: #166534;
          border-radius: 12px;
          text-align: center;
          font-size: 14px;
          font-weight: 500;
          border: 1px solid #86efac;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }

        .upload-progress::before {
          content: '';
          width: 18px;
          height: 18px;
          border: 2px solid #86efac;
          border-top-color: #16a34a;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .upload-progress p {
          margin: 0;
        }

        .error-message {
          margin-top: 16px;
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
      `}</style>
    </div>
  );
};

export default UploadFile;
