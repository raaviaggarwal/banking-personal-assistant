import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';

export default function LoginPage({ onLogin }) {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await api('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
      onLogin(data.userId, data.username);
    } catch (err) {
      setError(err.message || 'Invalid username or password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8fafc',
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: 16,
          padding: '40px 36px',
          width: 380,
          maxWidth: '90vw',
          boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
          border: '1px solid #eaeef2',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 16 }}>
          <button
            onClick={() => navigate('/')}
            style={{
              background: 'none',
              border: 'none',
              color: '#64748b',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'color 0.15s',
              padding: 0,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#1a73e8')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#64748b')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Back to Home
          </button>
        </div>

        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #1a73e8 0%, #4f46e5 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontSize: 20,
              fontWeight: 700,
              margin: '0 auto 12px',
            }}
          >
            D
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
            Welcome to DBomni
          </h1>
          <p style={{ fontSize: 13, color: '#64748b' }}>
            Sign in to your banking assistant
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div
              style={{
                padding: '10px 14px',
                background: '#fef2f2',
                color: '#dc2626',
                borderRadius: 8,
                fontSize: 13,
                marginBottom: 16,
                border: '1px solid #fecaca',
              }}
            >
              {error}
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                display: 'block',
                fontSize: 12,
                fontWeight: 600,
                color: '#374151',
                marginBottom: 6,
              }}
            >
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              style={{
                width: '100%',
                padding: '10px 14px',
                border: '1px solid #d1d5db',
                borderRadius: 8,
                fontSize: 14,
                outline: 'none',
                color: '#1f2937',
                background: '#ffffff',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#1a73e8')}
              onBlur={(e) => (e.target.style.borderColor = '#d1d5db')}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label
              style={{
                display: 'block',
                fontSize: 12,
                fontWeight: 600,
                color: '#374151',
                marginBottom: 6,
              }}
            >
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              style={{
                width: '100%',
                padding: '10px 14px',
                border: '1px solid #d1d5db',
                borderRadius: 8,
                fontSize: 14,
                outline: 'none',
                color: '#1f2937',
                background: '#ffffff',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#1a73e8')}
              onBlur={(e) => (e.target.style.borderColor = '#d1d5db')}
            />
          </div>

          <button
            type="submit"
            disabled={!username || !password || loading}
            style={{
              width: '100%',
              padding: '12px',
              background: !username || !password || loading ? '#e5e7eb' : 'linear-gradient(135deg, #1a73e8 0%, #4f46e5 100%)',
              color: !username || !password || loading ? '#9ca3af' : '#ffffff',
              border: 'none',
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 600,
              cursor: !username || !password || loading ? 'default' : 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              if (username && password && !loading) {
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(26,115,232,0.3)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p
          style={{
            marginTop: 20,
            fontSize: 11,
            color: '#94a3b8',
            textAlign: 'center',
          }}
        >
          Demo: admin / admin123
        </p>
      </div>
    </div>
  );
}
