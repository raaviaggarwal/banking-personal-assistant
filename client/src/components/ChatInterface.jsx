import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import MessageBubble from './MessageBubble.jsx';
import ThinkingIndicator from './ThinkingIndicator.jsx';
import { apiStream } from '../api.js';

const WELCOME_MESSAGE =
  "Hello! I'm DBomni, your banking personal assistant. How can I help you today?";

export default function ChatInterface({ conversation, messages, onMessagesChange, onTitleChange, userId, onConversationSaved }) {
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchMessage, setSearchMessage] = useState('');
  const bottomRef = useRef(null);
  const sentTitleRef = useRef(false);
  const abortRef = useRef(null);
  const prevConversationIdRef = useRef(conversation?.id);
  const onMessagesChangeRef = useRef(onMessagesChange);
  onMessagesChangeRef.current = onMessagesChange;

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, searching, scrollToBottom]);

  useEffect(() => {
    const prevId = prevConversationIdRef.current;
    prevConversationIdRef.current = conversation?.id;

    const isLocalToRealSwap = prevId?.startsWith('local-') && conversation?.id && !conversation?.id.startsWith('local-');
    if (isLocalToRealSwap) return;

    if (abortRef.current) abortRef.current.abort();
    setInput('');
    setStreaming(false);
    setSearching(false);
    setSearchMessage('');
    sentTitleRef.current = false;
  }, [conversation?.id]);

  async function handleSend() {
    const text = input.trim();
    if (!text || streaming) return;

    if (!sentTitleRef.current && onTitleChange && conversation?.id) {
      const title = text.length > 40 ? text.slice(0, 40) + '...' : text;
      onTitleChange(conversation.id, title);
      sentTitleRef.current = true;
    }

    const userMessage = { role: 'user', content: text };
    const assistantMessage = { role: 'assistant', content: 'Thinking...' };
    const updatedMessages = [...messages, userMessage, assistantMessage];
    onMessagesChange(updatedMessages);
    setInput('');
    setStreaming(true);
    setSearching(false);

    const history = messages
      .filter((m) => m.role !== 'assistant' || Boolean(m.content))
      .map((m) => ({ role: m.role, content: m.content }));

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    let currentConversationId = conversation?.id;
    let streamingDone = false;
    let accumulated = '';

    const upsertAssistantMessage = (content) => {
      onMessagesChangeRef.current((prev) => {
        const updated = [...prev];
        if (updated.length === 0 || updated[updated.length - 1].role !== 'assistant') {
          updated.push({ role: 'assistant', content });
        } else {
          updated[updated.length - 1] = { role: 'assistant', content };
        }
        return updated;
      });
    };

    try {
      const response = await apiStream('/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: text,
          history,
          conversationId: currentConversationId,
          userId,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6).trim();
          if (!payload) continue;

          try {
            const data = JSON.parse(payload);

            if (data.error) {
              accumulated = `Error: ${data.error}`;
              upsertAssistantMessage(accumulated);
              streamingDone = true;
              break;
            }

            if (data.status === 'searching') {
              setSearching(true);
              setSearchMessage(data.message || 'Searching...');
              continue;
            }

            if (data.status === 'streaming') {
              setSearching(false);
              setSearchMessage('');
              continue;
            }

            if (data.saved && data.conversationId) {
              currentConversationId = data.conversationId;
              if (onConversationSaved) {
                onConversationSaved(conversation?.id, data.conversationId);
              }
              continue;
            }

            if (data.done) {
              if (!accumulated) {
                accumulated = "I wasn't able to generate a response. Please try asking your question again.";
                upsertAssistantMessage(accumulated);
              }
              streamingDone = true;
              break;
            }

            if (data.content) {
              accumulated += data.content;
              upsertAssistantMessage(accumulated);
            }
          } catch {
            // skip malformed JSON
          }
        }
        if (streamingDone) break;
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      accumulated = `Error: ${err.message}`;
      upsertAssistantMessage(accumulated);
    } finally {
      setStreaming(false);
      setSearching(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const isNewChat = messages.length === 0;

  return (
    <main
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        minWidth: 0,
      }}
    >
      <header
        style={{
          padding: '10px 20px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: '#ffffff',
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
        <span style={{ fontSize: 16, fontWeight: 600, color: '#1f2937' }}>
          DBomni
        </span>
        {conversation?.title && conversation.title !== 'New Chat' && (
          <>
            <span style={{ color: '#d1d5db', fontSize: 16 }}>/</span>
            <span
              style={{
                fontSize: 15,
                fontWeight: 500,
                color: '#6b7280',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: 300,
              }}
            >
              {conversation.title}
            </span>
          </>
        )}
        <button
          onClick={() => navigate('/')}
          style={{
            marginLeft: 'auto',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#6b7280',
            padding: '4px 8px',
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            fontSize: 13,
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#f3f4f6';
            e.currentTarget.style.color = '#1f2937';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'none';
            e.currentTarget.style.color = '#6b7280';
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          Home
        </button>
      </header>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {!isNewChat ? (
          messages.map((msg, i) => (
            <MessageBubble key={i} role={msg.role} content={msg.content} />
          ))
        ) : (
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: 12,
              color: '#6b7280',
              textAlign: 'center',
              padding: '40px 20px',
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                background: 'linear-gradient(135deg, #1a73e8 0%, #4f46e5 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontSize: 24,
                fontWeight: 700,
                marginBottom: 8,
                boxShadow: '0 4px 16px rgba(26,115,232,0.2)',
              }}
            >
              D
            </div>
            <p style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
              How can I help you today?
            </p>
            <p style={{ fontSize: 14, color: '#64748b', maxWidth: 440, lineHeight: 1.6 }}>
              Ask about company policies, request coding assistance, or chat about general knowledge. I'm here to assist.
            </p>
          </div>
        )}
        {(searching || (streaming && messages[messages.length - 1]?.content === '')) && (
          <ThinkingIndicator message={searching ? searchMessage : 'Thinking'} />
        )}
        <div ref={bottomRef} />
      </div>

      <div
        style={{
          padding: '16px 24px',
          borderTop: '1px solid #e5e7eb',
          background: '#ffffff',
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: 8,
            maxWidth: 768,
            margin: '0 auto',
            width: '100%',
          }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={streaming}
            placeholder={
              streaming
                ? 'Waiting for response...'
                : 'Ask me anything...'
            }
            style={{
              flex: 1,
              padding: '10px 16px',
              border: '1px solid #d1d5db',
              borderRadius: 8,
              fontSize: 14,
              outline: 'none',
              background: streaming ? '#f9fafb' : '#ffffff',
              color: '#1f2937',
            }}
            onFocus={(e) => !streaming && (e.target.style.borderColor = '#1a73e8')}
            onBlur={(e) => (e.target.style.borderColor = '#d1d5db')}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || streaming}
            style={{
              padding: '10px 20px',
              background: !input.trim() || streaming ? '#e5e7eb' : '#1a73e8',
              color: !input.trim() || streaming ? '#9ca3af' : '#ffffff',
              border: 'none',
              borderRadius: 8,
              cursor: !input.trim() || streaming ? 'default' : 'pointer',
              fontSize: 14,
              fontWeight: 500,
              transition: 'background 0.15s',
            }}
          >
            Send
          </button>
        </div>
      </div>
    </main>
  );
}
