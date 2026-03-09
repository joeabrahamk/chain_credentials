/**
 * DeleteFile Component
 * 
 * A button component that deletes a file from the blockchain.
 * Requires confirmation before deletion.
 */

import React, { useState } from 'react';
import { deleteFile } from '../blockchain/contract';

const DeleteFile = ({ userId, fileIndex, fileName, onDeleteComplete }) => {
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState('');

  const handleDeleteClick = () => {
    setConfirmDelete(true);
    setError('');
  };

  const handleConfirmDelete = async () => {
    setDeleting(true);
    setError('');

    try {
      await deleteFile(userId, fileIndex);
      setConfirmDelete(false);
      
      if (onDeleteComplete) {
        onDeleteComplete();
      }
    } catch (error) {
      console.error('Delete error:', error);
      setError(error.message || 'Failed to delete file');
    } finally {
      setDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setConfirmDelete(false);
    setError('');
  };

  if (confirmDelete) {
    return (
      <span className="delete-confirm">
        <span className="confirm-text">Delete "{fileName}"?</span>
        <button
          onClick={handleConfirmDelete}
          disabled={deleting}
          className="confirm-yes"
        >
          {deleting ? '...' : 'Yes'}
        </button>
        <button
          onClick={handleCancelDelete}
          disabled={deleting}
          className="confirm-no"
        >
          No
        </button>
        {error && <span className="delete-error">{error}</span>}

        <style>{`
          .delete-confirm {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 6px 10px;
            background: #f9fafb;
            border-radius: 4px;
            border: 1px solid #e5e7eb;
          }

          .confirm-text {
            font-size: 12px;
            color: #374151;
            font-weight: 500;
          }

          .confirm-yes {
            padding: 4px 10px;
            background: #dc2626;
            color: #fff;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            font-weight: 500;
          }

          .confirm-yes:hover:not(:disabled) {
            background: #b91c1c;
          }

          .confirm-no {
            padding: 4px 10px;
            background: #fff;
            color: #374151;
            border: 1px solid #d1d5db;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            font-weight: 500;
          }

          .confirm-no:hover:not(:disabled) {
            background: #f3f4f6;
          }

          .delete-error {
            font-size: 11px;
            color: #dc2626;
          }
        `}</style>
      </span>
    );
  }

  return (
    <>
      <button
        onClick={handleDeleteClick}
        className="delete-button"
        title={`Delete ${fileName}`}
      >
        Delete
      </button>

      <style>{`
        .delete-button {
          padding: 6px 12px;
          background: #fff;
          color: #6b7280;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 500;
          transition: all 0.15s ease;
        }

        .delete-button:hover {
          background: #fef2f2;
          border-color: #fca5a5;
          color: #dc2626;
        }
      `}</style>
    </>
  );
};

export default DeleteFile;
