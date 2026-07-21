import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar.jsx';
import ChatInterface from './components/ChatInterface.jsx';
import PolicyManager from './components/PolicyManager.jsx';
import HomePage from './components/HomePage.jsx';
import LoginPage from './components/LoginPage.jsx';
import { api } from './api.js';

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [authenticated, setAuthenticated] = useState(() => !!localStorage.getItem('auth'));
  const [userId, setUserId] = useState(() => localStorage.getItem('userId') || '');
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [policyManagerOpen, setPolicyManagerOpen] = useState(false);
  const messageCache = useRef({});

  useEffect(() => {
    if (authenticated && userId) fetchConversations();
    else setLoaded(true);
  }, [authenticated, userId]);

  function updateConversationInList(id, updates) {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
  }

  async function fetchConversations() {
    if (!userId) { setLoaded(true); return; }
    try {
      const list = await api(`/api/history?userId=${encodeURIComponent(userId)}`);
      setConversations(list);
      if (list.length > 0) {
        setActiveId(list[0].id);
        loadConversation(list[0].id);
      } else {
        createNewChat();
      }
      setLoaded(true);
    } catch {
      const fallback = [{ id: 'local-1', title: 'Welcome to DBomni', mode: 'general' }];
      setConversations(fallback);
      setActiveId('local-1');
      setMessages([]);
      setLoaded(true);
    }
  }

  async function loadConversation(id) {
    if (messageCache.current[id]) {
      setMessages(messageCache.current[id]);
      return;
    }

    try {
      const convo = await api(`/api/history/${id}`);
      const msgs = convo.messages || [];
      messageCache.current[id] = msgs;
      setMessages(msgs);
    } catch {
      setMessages([]);
    }
  }

  async function createNewChat() {
    if (!authenticated) { navigate('/login'); return; }
    const id = 'local-' + Date.now();
    const convo = { id, title: 'New Chat', mode: 'general' };
    setConversations((prev) => [convo, ...prev]);
    setActiveId(id);
    setMessages([]);
    navigate('/chat');
  }

  function handleConversationSaved(localId, realId) {
    setConversations((prev) => prev.map((c) => c.id === localId ? { ...c, id: realId } : c));
    setActiveId(realId);
    if (messageCache.current[localId]) {
      messageCache.current[realId] = messageCache.current[localId];
      delete messageCache.current[localId];
    }
  }

  async function handleTitleChange(id, title) {
    updateConversationInList(id, { title });
    if (id.startsWith('local-')) return;
    try {
      await api(`/api/history/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ title }),
      });
    } catch {}
  }

  async function handleSelect(id) {
    setActiveId(id);
    loadConversation(id);
  }

  async function handleDelete(id) {
    if (!id.startsWith('local-')) {
      try { await api(`/api/history/${id}`, { method: 'DELETE' }); } catch {}
    }
    delete messageCache.current[id];
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeId === id) {
      const remaining = conversations.filter((c) => c.id !== id);
      if (remaining.length > 0) {
        setActiveId(remaining[0].id);
        loadConversation(remaining[0].id);
      } else {
        createNewChat();
      }
    }
  }

  function handleMessagesChange(msgs) {
    setMessages((prev) => {
      const nextMessages = typeof msgs === 'function' ? msgs(prev) : msgs;
      if (activeId) {
        messageCache.current[activeId] = nextMessages;
      }
      return nextMessages;
    });
  }

  function handleLogin(id, username) {
    localStorage.setItem('auth', '1');
    localStorage.setItem('userId', id);
    setAuthenticated(true);
    setUserId(id);
    const next = location.state?.from || '/chat';
    navigate(next, { replace: true });
  }

  function handleLogout() {
    localStorage.removeItem('auth');
    localStorage.removeItem('userId');
    setAuthenticated(false);
    setUserId('');
    navigate('/');
  }

  const activeConversation = conversations.find((c) => c.id === activeId);

  if (location.pathname === '/login') {
    if (authenticated) {
      navigate('/chat', { replace: true });
      return null;
    }
    return <LoginPage onLogin={handleLogin} />;
  }

  if (location.pathname === '/' || location.pathname === '') {
    return (
      <HomePage
        onStartChat={() => {
          if (authenticated) {
            if (!activeId) createNewChat();
            else navigate('/chat');
          } else {
            navigate('/login');
          }
        }}
      />
    );
  }

  if (location.pathname.startsWith('/chat')) {
    if (!authenticated) {
      navigate('/login', { state: { from: location.pathname }, replace: true });
      return null;
    }
    if (!loaded) {
      return (
        <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 14 }}>
          Loading...
        </div>
      );
    }
    return (
      <div style={{ display: 'flex', height: '100vh' }}>
        <Sidebar
          conversations={conversations}
          activeId={activeId}
          onNewChat={() => createNewChat()}
          onSelect={handleSelect}
          onDelete={handleDelete}
          onManagePolicies={() => setPolicyManagerOpen(true)}
          onLogout={handleLogout}
        />
        <PolicyManager open={policyManagerOpen} onClose={() => setPolicyManagerOpen(false)} />
        <ChatInterface
          conversation={activeConversation}
          messages={messages}
          onMessagesChange={handleMessagesChange}
          onTitleChange={handleTitleChange}
          userId={userId}
          onConversationSaved={handleConversationSaved}
        />
      </div>
    );
  }

  return (
    <HomePage
      onStartChat={() => {
        if (authenticated) navigate('/chat');
        else navigate('/login');
      }}
    />
  );
}
