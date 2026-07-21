import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function MessageBubble({ role, content }) {
  const isUser = role === 'user';

  if (isUser) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          marginBottom: 16,
          paddingLeft: 48,
        }}
      >
        <div
          style={{
            maxWidth: '70%',
            padding: '10px 16px',
            borderRadius: '12px 12px 4px 12px',
            background: '#1a73e8',
            color: '#ffffff',
            fontSize: 14,
            lineHeight: 1.6,
            wordBreak: 'break-word',
          }}
        >
          {content || (
            <span style={{ color: 'rgba(255,255,255,0.6)', fontStyle: 'italic' }}>
              Sending...
            </span>
          )}
        </div>
      </div>
    );
  }

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
          flex: 1,
          fontSize: 14,
          lineHeight: 1.6,
          color: '#1f2937',
          wordBreak: 'break-word',
          minWidth: 0,
          background: '#f8f9fa',
          borderRadius: 8,
          padding: '10px 16px',
        }}
      >
        {content ? (
          <div className="markdown-content">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {content}
            </ReactMarkdown>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 4, alignItems: 'center', padding: '4px 0' }}>
            <span className="thinking-dot" />
            <span className="thinking-dot" style={{ animationDelay: '0.2s' }} />
            <span className="thinking-dot" style={{ animationDelay: '0.4s' }} />
          </div>
        )}
      </div>
    </div>
  );
}
