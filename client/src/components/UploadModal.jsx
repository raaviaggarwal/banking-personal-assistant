import { useState, useEffect } from 'react';
import { api } from '../api.js';

export default function UploadModal({ open, onClose }) {
  const [files, setFiles] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) fetchFiles();
  }, [open]);

  async function fetchFiles() {
    try {
      const data = await api('/api/policies');
      setFiles(data.files || []);
    } catch {
      setFiles([]);
    }
  }

  async function handleDelete(filename) {
    try {
      await api(`/api/policies/${encodeURIComponent(filename)}`, { method: 'DELETE' });
      await fetchFiles();
    } catch (err) {
      setError(err.message);
    }
  }

  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: 12,
          padding: 24,
          width: 480,
          maxWidth: '90vw',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20,
          }}
        >
          <h2 style={{ fontSize: 16, fontWeight: 600, color: '#1f2937' }}>
            Policy Documents
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 20,
              color: '#6b7280',
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {error && (
          <div
            style={{
              padding: '8px 12px',
              background: '#fef2f2',
              color: '#dc2626',
              borderRadius: 6,
              fontSize: 13,
              marginBottom: 12,
            }}
          >
            {error}
          </div>
        )}

        <div style={{ flex: 1, overflowY: 'auto', minHeight: 120 }}>
          {files.length === 0 ? (
            <p
              style={{
                color: '#9ca3af',
                fontSize: 13,
                textAlign: 'center',
                padding: '32px 0',
              }}
            >
              No policy files ingested yet.
            </p>
          ) : (
            files.map((f) => (
              <div
                key={f}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  borderRadius: 6,
                  background: '#f9fafb',
                  marginBottom: 4,
                }}
              >
                <span
                  style={{
                    fontSize: 13,
                    color: '#374151',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    flex: 1,
                  }}
                >
                  {f}
                </span>
                <button
                  onClick={() => handleDelete(f)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#9ca3af',
                    fontSize: 16,
                    padding: '2px 6px',
                    borderRadius: 4,
                    lineHeight: 1,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#dc2626')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#9ca3af')}
                  title="Remove"
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
