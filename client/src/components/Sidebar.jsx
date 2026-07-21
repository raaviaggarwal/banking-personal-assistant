const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'policy', label: 'Policy' },
  { key: 'general', label: 'General' },
];

export default function Sidebar({
  conversations,
  activeId,
  filter,
  onFilterChange,
  onNewPolicyChat,
  onNewGeneralChat,
  onSelect,
  onDelete,
  onManagePolicies,
}) {
  const filtered = filter === 'all'
    ? conversations
    : conversations.filter((c) => c.mode === filter);

  return (
    <aside
      style={{
        width: 260,
        minWidth: 260,
        background: '#f8f9fa',
        borderRight: '1px solid #e5e7eb',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
      }}
    >
      <div
        style={{
          padding: '16px',
          borderBottom: '1px solid #e5e7eb',
        }}
      >
        <h1
          style={{
            fontSize: 18,
            fontWeight: 600,
            color: '#1f2937',
            marginBottom: 12,
          }}
        >
          DBomni
        </h1>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={onNewPolicyChat}
            style={{
              flex: 1,
              padding: '8px 6px',
              background: '#059669',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 500,
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#047857')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#059669')}
          >
            + Policy
          </button>
          <button
            onClick={onNewGeneralChat}
            style={{
              flex: 1,
              padding: '8px 6px',
              background: '#6366f1',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 500,
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#4f46e5')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#6366f1')}
          >
            + General
          </button>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 2,
          padding: '8px 8px 0',
        }}
      >
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => onFilterChange(f.key)}
            style={{
              flex: 1,
              padding: '6px 0',
              border: 'none',
              borderRadius: '6px 6px 0 0',
              background: filter === f.key ? '#ffffff' : 'transparent',
              color: filter === f.key ? '#1a73e8' : '#6b7280',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: filter === f.key ? 600 : 400,
              borderBottom: filter === f.key ? '2px solid #1a73e8' : '2px solid transparent',
              transition: 'all 0.15s',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      <nav style={{ flex: 1, overflowY: 'auto', padding: '4px 8px 8px' }}>
        {filtered.length === 0 ? (
          <p
            style={{
              color: '#9ca3af',
              fontSize: 12,
              textAlign: 'center',
              padding: '24px 8px',
            }}
          >
            {filter === 'all'
              ? 'No conversations yet.'
              : `No ${filter} conversations yet.`}
          </p>
        ) : (
          filtered.map((convo) => (
            <div
              key={convo.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 10px',
                borderRadius: 6,
                cursor: 'pointer',
                marginBottom: 2,
                background: convo.id === activeId ? '#e8f0fe' : 'transparent',
                color: convo.id === activeId ? '#1a73e8' : '#374151',
                transition: 'background 0.1s',
              }}
              onClick={() => onSelect(convo.id)}
              onMouseEnter={(e) => {
                if (convo.id !== activeId)
                  e.currentTarget.style.background = '#f0f1f3';
              }}
              onMouseLeave={(e) => {
                if (convo.id !== activeId)
                  e.currentTarget.style.background = 'transparent';
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: convo.mode === 'policy' ? '#059669' : '#6366f1',
                  background: convo.mode === 'policy' ? '#d1fae5' : '#e0e7ff',
                  padding: '2px 5px',
                  borderRadius: 4,
                  lineHeight: 1.3,
                  flexShrink: 0,
                }}
              >
                {convo.mode === 'policy' ? 'P' : 'G'}
              </span>
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
                  visibility: convo.id === activeId ? 'visible' : 'hidden',
                  lineHeight: 1,
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#9ca3af')}
                title="Delete conversation"
              >
                ×
              </button>
            </div>
          ))
        )}
      </nav>

      <div style={{ padding: '8px', borderTop: '1px solid #e5e7eb' }}>
        <button
          onClick={onManagePolicies}
          style={{
            width: '100%',
            padding: '8px 14px',
            background: 'none',
            color: '#374151',
            border: '1px solid #d1d5db',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 500,
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#f0f1f3';
            e.currentTarget.style.borderColor = '#9ca3af';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'none';
            e.currentTarget.style.borderColor = '#d1d5db';
          }}
        >
          Manage Policies
        </button>
      </div>
    </aside>
  );
}
