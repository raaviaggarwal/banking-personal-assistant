import { useState, useEffect, useRef } from 'react';
import { api } from '../api.js';

export default function PolicyManager({ open, onClose }) {
  const [files, setFiles] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [ingesting, setIngesting] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadName, setUploadName] = useState('');
  const [uploadContent, setUploadContent] = useState('');
  const fileInputRef = useRef(null);

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
    setError('');
    setSuccess('');
    try {
      await api(`/api/policies/${encodeURIComponent(filename)}`, { method: 'DELETE' });
      setSuccess(`Removed ${filename}`);
      await fetchFiles();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleIngest() {
    setError('');
    setSuccess('');
    setIngesting(true);
    try {
      const data = await api('/api/policies/ingest', { method: 'POST' });
      const ingested = data.results?.filter((r) => r.status === 'ingested') || [];
      if (ingested.length > 0) {
        setSuccess(`Ingested ${ingested.map((r) => r.filename).join(', ')}`);
      } else {
        setSuccess(data.message || 'No new files found');
      }
      await fetchFiles();
    } catch (err) {
      setError(err.message);
    } finally {
      setIngesting(false);
    }
  }

  function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.json')) {
      setError('Only .json files are supported');
      return;
    }
    setUploadName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        setUploadContent(JSON.stringify(parsed, null, 2));
      } catch {
        setError('Invalid JSON file');
      }
    };
    reader.readAsText(file);
    setUploadOpen(true);
  }

  async function handleUpload() {
    setError('');
    setSuccess('');
    if (!uploadName || !uploadContent) return;
    try {
      const content = JSON.parse(uploadContent);
      const data = await api('/api/policies/upload', {
        method: 'POST',
        body: JSON.stringify({ filename: uploadName, content }),
      });
      setSuccess(`Saved ${data.filename}`);
      setUploadOpen(false);
      setUploadName('');
      setUploadContent('');
      await handleIngest();
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
          width: 520,
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

        {success && (
          <div
            style={{
              padding: '8px 12px',
              background: '#f0fdf4',
              color: '#16a34a',
              borderRadius: 6,
              fontSize: 13,
              marginBottom: 12,
            }}
          >
            {success}
          </div>
        )}

        {uploadOpen ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input
              value={uploadName}
              onChange={(e) => setUploadName(e.target.value)}
              placeholder="filename.json"
              style={{
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: 6,
                fontSize: 13,
                outline: 'none',
              }}
            />
            <textarea
              value={uploadContent}
              onChange={(e) => setUploadContent(e.target.value)}
              placeholder="Paste JSON content here..."
              style={{
                flex: 1,
                minHeight: 200,
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: 6,
                fontSize: 12,
                fontFamily: 'monospace',
                outline: 'none',
                resize: 'vertical',
              }}
            />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setUploadOpen(false);
                  setUploadName('');
                  setUploadContent('');
                }}
                style={{
                  padding: '8px 16px',
                  background: 'none',
                  border: '1px solid #d1d5db',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 13,
                  color: '#374151',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={!uploadName || !uploadContent}
                style={{
                  padding: '8px 16px',
                  background: !uploadName || !uploadContent ? '#e5e7eb' : '#059669',
                  color: !uploadName || !uploadContent ? '#9ca3af' : '#ffffff',
                  border: 'none',
                  borderRadius: 6,
                  cursor: !uploadName || !uploadContent ? 'default' : 'pointer',
                  fontSize: 13,
                  fontWeight: 500,
                }}
              >
                Save & Ingest
              </button>
            </div>
          </div>
        ) : (
          <>
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

            <div
              style={{
                display: 'flex',
                gap: 8,
                marginTop: 16,
                paddingTop: 16,
                borderTop: '1px solid #e5e7eb',
              }}
            >
              <button
                onClick={handleIngest}
                disabled={ingesting}
                style={{
                  flex: 1,
                  padding: '9px 14px',
                  background: ingesting ? '#e5e7eb' : 'linear-gradient(135deg, #1a73e8 0%, #4f46e5 100%)',
                  color: ingesting ? '#9ca3af' : '#ffffff',
                  border: 'none',
                  borderRadius: 6,
                  cursor: ingesting ? 'default' : 'pointer',
                  fontSize: 13,
                  fontWeight: 600,
                  transition: 'all 0.2s',
                  boxShadow: ingesting ? 'none' : '0 2px 6px rgba(26,115,232,0.15)',
                }}
                onMouseEnter={(e) => {
                  if (!ingesting) {
                    e.currentTarget.style.boxShadow = '0 4px 10px rgba(26,115,232,0.25)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!ingesting) {
                    e.currentTarget.style.boxShadow = '0 2px 6px rgba(26,115,232,0.15)';
                  }
                }}
              >
                {ingesting ? 'Scanning...' : 'Re-scan for new files'}
              </button>
              <button
                onClick={() => {
                  setError('');
                  setSuccess('');
                  setUploadOpen(true);
                }}
                style={{
                  flex: 1,
                  padding: '9px 14px',
                  background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 600,
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 6px rgba(5,150,105,0.15)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 10px rgba(5,150,105,0.25)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 2px 6px rgba(5,150,105,0.15)';
                }}
              >
                + Add Policy
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
