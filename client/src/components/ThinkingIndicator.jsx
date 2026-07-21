import { useState, useEffect } from 'react';

export default function ThinkingIndicator({ message }) {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
    }, 400);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'flex-start',
        marginBottom: 16,
      }}
    >
      <div
        style={{
          maxWidth: '75%',
          padding: '10px 16px',
          borderRadius: '18px 18px 18px 4px',
          background: '#f3f4f6',
          color: '#6b7280',
          fontSize: 13,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: '#9ca3af',
            display: 'inline-block',
            animation: 'pulse 1.2s ease-in-out infinite',
          }}
        />
        {message || 'Thinking'}{dots}
      </div>
    </div>
  );
}
