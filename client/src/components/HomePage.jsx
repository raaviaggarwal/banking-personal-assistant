const FEATURES = [
  {
    icon: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
    title: 'Policy Intelligence',
    desc: 'Instant answers from your company policy documents using Retrieval-Augmented Generation. Ask about compliance, HR policies, code of conduct, and more.',
  },
  {
    icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
    title: 'General Assistant',
    desc: 'A versatile AI assistant for coding help, general knowledge, questions, and everyday tasks — always professional and precise.',
  },
  {
    icon: 'M13 10V3L4 14h7v7l9-11h-7z',
    title: 'Lightning Fast',
    desc: 'Optimized with NVIDIA NIM for low-latency responses. General queries use a fast model so you get answers in seconds, not minutes.',
  },
  {
    icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
    title: 'Secure by Design',
    desc: 'Your data stays private. Conversations are encrypted in transit and stored securely in MongoDB. No third-party training on your data.',
  },
  {
    icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
    title: '24/7 Availability',
    desc: 'Deployed on reliable cloud infrastructure with automatic scaling. Available whenever you need it — day or night.',
  },
  {
    icon: 'M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7',
    title: 'Multi-Policy Support',
    desc: 'Ingest and query multiple policy documents simultaneously. Upload new policies and the assistant learns them automatically.',
  },
];

function FeatureCard({ icon, title, desc, index }) {
  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: 16,
        padding: '28px 24px',
        border: '1px solid #eaeef2',
        transition: 'all 0.25s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = '#1a73e8';
        e.currentTarget.style.boxShadow = '0 8px 32px rgba(26,115,232,0.1)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#eaeef2';
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: 'linear-gradient(135deg, #1a73e8 0%, #4f46e5 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16,
        }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d={icon} />
        </svg>
      </div>
      <h3 style={{ fontSize: 16, fontWeight: 600, color: '#0f172a', marginBottom: 8, lineHeight: 1.3 }}>
        {title}
      </h3>
      <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.6 }}>
        {desc}
      </p>
    </div>
  );
}

export default function HomePage({ onStartChat }) {
  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <header
        style={{
          borderBottom: '1px solid #eaeef2',
          background: '#ffffff',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: '0 auto',
            padding: '14px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: 'linear-gradient(135deg, #1a73e8 0%, #4f46e5 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontSize: 16,
                fontWeight: 700,
              }}
            >
              D
            </div>
            <span style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>
              DBomni
            </span>
          </div>
          <button
            onClick={onStartChat}
            style={{
              padding: '8px 20px',
              background: '#1a73e8',
              color: '#ffffff',
              border: 'none',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#1557b0')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#1a73e8')}
          >
            Start your chat
          </button>
        </div>
      </header>

      <main>
        <section
          style={{
            maxWidth: 900,
            margin: '0 auto',
            padding: '72px 24px 56px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              display: 'inline-block',
              padding: '6px 14px',
              borderRadius: 20,
              background: '#eef2ff',
              color: '#4f46e5',
              fontSize: 12,
              fontWeight: 600,
              marginBottom: 20,
            }}
          >
            Your Intelligent Banking Personal Assistant
          </div>
          <h1
            style={{
              fontSize: 42,
              fontWeight: 800,
              color: '#0f172a',
              lineHeight: 1.15,
              marginBottom: 16,
              letterSpacing: '-0.02em',
            }}
          >
            Ask, search, and act — <br />
            <span style={{ color: '#1a73e8' }}>powered by AI</span>
          </h1>
          <p
            style={{
              fontSize: 16,
              color: '#475569',
              lineHeight: 1.7,
              maxWidth: 600,
              margin: '0 auto 32px',
            }}
          >
            DBomni combines NVIDIA NIM AI with your company policies to deliver instant,
            accurate answers. Chat in general mode or switch to policy mode to query your
            documents.
          </p>
          <button
            onClick={onStartChat}
            style={{
              padding: '14px 40px',
              background: 'linear-gradient(135deg, #1a73e8 0%, #4f46e5 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: 12,
              fontSize: 16,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.25s ease',
              boxShadow: '0 4px 20px rgba(26,115,232,0.3)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 8px 32px rgba(26,115,232,0.4)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(26,115,232,0.3)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            Start your chat
          </button>
        </section>

        <section
          style={{
            maxWidth: 1100,
            margin: '0 auto',
            padding: '0 24px 72px',
          }}
        >
          <h2
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: '#0f172a',
              textAlign: 'center',
              marginBottom: 40,
            }}
          >
            Everything you need in one place
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: 20,
            }}
          >
            {FEATURES.map((f, i) => (
              <FeatureCard key={i} {...f} index={i} />
            ))}
          </div>
        </section>
      </main>

      <footer
        style={{
          borderTop: '1px solid #eaeef2',
          padding: '24px',
          textAlign: 'center',
          color: '#94a3b8',
          fontSize: 12,
        }}
      >
        DBomni — Banking Personal Assistant &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
