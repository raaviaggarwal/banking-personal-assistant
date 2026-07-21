export default function ThinkingIndicator({ message }) {
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
          gap: 10,
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
