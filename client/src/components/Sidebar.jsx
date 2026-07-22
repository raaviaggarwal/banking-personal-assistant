export default function Sidebar({
  conversations,
  activeId,
  onNewChat,
  onSelect,
  onDelete,
  onManagePolicies,
  onLogout,
}) {

  return (
    <aside
      style={{
        width: 260,
        minWidth: 260,
        background: '#f7f7f8',
        borderRight: '1px solid #e5e7eb',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
      }}
    >
      <div style={{ padding: '12px' }}>
        <button
          onClick={onNewChat}
          style={{
            width: '100%',
            padding: '10px 14px',
            background: 'linear-gradient(135deg, #1a73e8 0%, #4f46e5 100%)',
            color: '#ffffff',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 8px rgba(26,115,232,0.15)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(26,115,232,0.25)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(26,115,232,0.15)';
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Chat
        </button>
      </div>

      <nav style={{ flex: 1, overflowY: 'auto', padding: '0 8px 8px' }}>
        {conversations.length === 0 ? (
          <p
            style={{
              color: '#9ca3af',
              fontSize: 12,
              textAlign: 'center',
              padding: '24px 8px',
            }}
          >
            No conversations yet.
          </p>
        ) : (
          conversations.map((convo) => (
            <div
              key={convo.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '8px 10px',
                borderRadius: 8,
                cursor: 'pointer',
                marginBottom: 2,
                background: convo.id === activeId ? 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)' : 'transparent',
                color: convo.id === activeId ? '#4f46e5' : '#374151',
                borderLeft: convo.id === activeId ? '3px solid #4f46e5' : '3px solid transparent',
                paddingLeft: convo.id === activeId ? '7px' : '10px',
                fontWeight: convo.id === activeId ? 600 : 500,
                transition: 'all 0.15s ease',
              }}
              onClick={() => onSelect(convo.id)}
              onMouseEnter={(e) => {
                if (convo.id !== activeId) {
                  e.currentTarget.style.background = '#eef2ff';
                  e.currentTarget.style.color = '#4f46e5';
                }
              }}
              onMouseLeave={(e) => {
                if (convo.id !== activeId) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#374151';
                }
              }}
            >

              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                style={{ flexShrink: 0, marginRight: 8, opacity: 0.5 }}
              >
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
              <span
                style={{
                  fontSize: 13,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  flex: 1,
                }}
              >
                {convo.title}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(convo.id);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#9ca3af',
                  fontSize: 14,
                  padding: '2px 4px',
                  borderRadius: 4,
                  opacity: convo.id === activeId ? 1 : 0,
                  lineHeight: 1,
                  flexShrink: 0,
                  transition: 'opacity 0.1s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#ef4444';
                  e.currentTarget.style.opacity = '1';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#9ca3af';
                  if (convo.id !== activeId) e.currentTarget.style.opacity = '0';
                }}
                title="Delete"
              >
                ×
              </button>
            </div>
          ))
        )}
      </nav>

      <div
        style={{
          padding: '12px',
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 8px',
            marginBottom: 4,
          }}
        >
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: 6,
              background: 'linear-gradient(135deg, #1a73e8 0%, #4f46e5 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontSize: 13,
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            D
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#1f2937' }}>
            DBomni
          </span>
        </div>
        <button
          onClick={onManagePolicies}
          style={{
            width: '100%',
            padding: '8px 10px',
            background: 'none',
            color: '#374151',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 13,
            textAlign: 'left',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#eef2ff';
            e.currentTarget.style.color = '#4f46e5';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'none';
            e.currentTarget.style.color = '#374151';
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.7 }}>
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
          Manage Policies
        </button>
        <button
          onClick={onLogout}
          style={{
            width: '100%',
            padding: '8px 10px',
            background: 'none',
            color: '#ef4444',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 13,
            textAlign: 'left',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#fef2f2';
            e.currentTarget.style.color = '#ef4444';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'none';
            e.currentTarget.style.color = '#ef4444';
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.8 }}>
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Logout
        </button>
      </div>
    </aside>
  );
}
