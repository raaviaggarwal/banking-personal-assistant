export default function MessageBubble({ role, content }) {
  const isUser = role === 'user';

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        marginBottom: 16,
      }}
    >
      <div
        style={{
          maxWidth: '75%',
          padding: '10px 16px',
          borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
          background: isUser ? '#1a73e8' : '#f3f4f6',
          color: isUser ? '#ffffff' : '#1f2937',
          fontSize: 14,
          lineHeight: 1.6,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {content || (
          <span style={{ color: isUser ? 'rgba(255,255,255,0.6)' : '#9ca3af', fontStyle: 'italic' }}>
            {isUser ? 'Typing...' : ''}
          </span>
        )}
      </div>
    </div>
  );
}
