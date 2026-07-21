import { useState, useEffect, useCallback, useRef } from 'react';
import Sidebar from './components/Sidebar.jsx';
import ChatInterface from './components/ChatInterface.jsx';
import UploadModal from './components/UploadModal.jsx';

export default function App() {
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [filter, setFilter] = useState('all');
  const messageCache = useRef({});

  useEffect(() => {
    fetchConversations();
  }, []);

  function updateConversationInList(id, updates) {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
  }

  async function fetchConversations() {
    try {
      const res = await fetch('/api/history');
      const list = await res.json();
      setConversations(list);
      if (list.length > 0) {
        setActiveId(list[0].id);
        loadConversation(list[0].id);
      } else {
        createNewChat('general');
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

  function loadConversation(id) {
    if (messageCache.current[id]) {
      setMessages(messageCache.current[id]);
      return;
    }

    fetch(`/api/history/${id}`)
      .then((res) => res.json())
      .then((convo) => {
        const msgs = convo.messages || [];
        messageCache.current[id] = msgs;
        setMessages(msgs);
      })
      .catch(() => setMessages([]));
  }

  async function createNewChat(mode) {
    try {
      const res = await fetch('/api/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New Chat', mode }),
      });
      const convo = await res.json();
      setConversations((prev) => [convo, ...prev]);
      setActiveId(convo.id);
      setMessages([]);
    } catch {
      const id = 'local-' + Date.now();
      const convo = { id, title: 'New Chat', mode };
      setConversations((prev) => [convo, ...prev]);
      setActiveId(id);
      setMessages([]);
    }
  }

  const saveMessages = useCallback(async (id, msgs) => {
    try {
      await fetch(`/api/history/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: msgs }),
      });
    } catch {
      // silent fallback
    }
  }, []);

  async function handleTitleChange(id, title) {
    updateConversationInList(id, { title });
    try {
      await fetch(`/api/history/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });
    } catch {}
  }

  async function handleSelect(id) {
    setActiveId(id);
    loadConversation(id);
  }

  async function handleDelete(id) {
    try {
      await fetch(`/api/history/${id}`, { method: 'DELETE' });
    } catch {}
    delete messageCache.current[id];
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeId === id) {
      const remaining = conversations.filter((c) => c.id !== id);
      if (remaining.length > 0) {
        setActiveId(remaining[0].id);
        loadConversation(remaining[0].id);
      } else {
        createNewChat('general');
      }
    }
  }

  function handleMessagesChange(msgs) {
    if (typeof msgs === 'function') {
      setMessages(msgs);
      return;
    }
    setMessages(msgs);
    if (activeId) {
      messageCache.current[activeId] = msgs;
      if (!activeId.startsWith('local-')) {
        saveMessages(activeId, msgs);
      }
    }
  }

  const activeConversation = conversations.find((c) => c.id === activeId);

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
        filter={filter}
        onFilterChange={setFilter}
        onNewPolicyChat={() => createNewChat('policy')}
        onNewGeneralChat={() => createNewChat('general')}
        onSelect={handleSelect}
        onDelete={handleDelete}
        onManagePolicies={() => setUploadOpen(true)}
      />
      <ChatInterface
        conversation={activeConversation}
        messages={messages}
        onMessagesChange={handleMessagesChange}
        onTitleChange={handleTitleChange}
      />
      <UploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} />
    </div>
  );
}
