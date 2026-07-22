export default function ThinkingIndicator({ message }) {
  return (
    <div
      style={{
        display: 'flex',
        marginBottom: 16,
        gap: 10,
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 6,
          background: 'linear-gradient(135deg, #1a73e8 0%, #4f46e5 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          fontSize: 13,
          fontWeight: 700,
          flexShrink: 0,
          marginTop: 2,
        }}
      >
        D
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          color: '#6b7280',
          fontSize: 13,
          background: '#ffffff',
          borderRadius: '12px 12px 12px 4px',
          border: '1px solid #eef2f6',
          padding: '10px 16px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.02)',
        }}
      >
        <div className="thinking-dots" style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <span className="thinking-dot" />
          <span className="thinking-dot" style={{ animationDelay: '0.2s' }} />
          <span className="thinking-dot" style={{ animationDelay: '0.4s' }} />
        </div>
        {message || 'Thinking'}
      </div>
    </div>
  );
}
