import { Router } from 'express';
import { runPipe, createThread, appendMessages } from '../services/langbase.js';
import { search, count, getFiles } from '../services/vectorStore.js';
import { getConversation, createConversation } from '../services/convStore.js';

const router = Router();

function writeEvent(res, data) {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

function parseSSELine(line) {
  if (!line.startsWith('data: ')) return null;
  const payload = line.slice(6).trim();
  if (payload === '[DONE]') return { done: true };
  try {
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

router.post('/chat', async (req, res) => {
  const { message, history = [], conversationId, userId } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'message is required' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  let aborted = false;
  const cleanup = () => { aborted = true; };
  res.on('close', cleanup);

  const timeout = setTimeout(() => {
    if (!aborted) {
      aborted = true;
      writeEvent(res, { error: 'Request timed out. Please try again.' });
      writeEvent(res, { done: true });
      res.end();
    }
  }, 60000);

  try {
    const msgUserId = userId || 'admin';
    const allMessages = [
      ...(history || []),
      { role: 'user', content: message },
    ];

    let context = '';
    if (count() > 0) {
      const listPattern = /\b(list|show|what|which)\b.*\b(source|document|policy|policies|file|all)\b|\b(all|available)\b.*\b(polic|document|source|file)\b/i;
      if (listPattern.test(message)) {
        const allFiles = getFiles();
        const fileList = allFiles.map((f) => `• ${f}`).join('\n');
        context = `Available source documents:\n${fileList}\n\n`;
      } else {
        writeEvent(res, { status: 'searching', message: 'Searching policies...' });
        const results = search(message, 5);
        if (results.length > 0) {
          for (const r of results) {
            context += `[Source: ${r.filename}]\n${r.text}\n\n`;
          }
        }
      }
    }

    if (aborted) { res.end(); return; }

    let threadId = null;
    let convId = conversationId;

    if (convId) {
      const existing = getConversation(convId);
      if (existing) {
        threadId = existing.threadId;
      }
    }

    const response = await runPipe({ messages: allMessages, context });

    if (aborted) { res.end(); return; }

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenRouter error ${response.status}: ${errText}`);
    }

    writeEvent(res, { status: 'streaming' });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let accumulated = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (aborted) break;
        const parsed = parseSSELine(line);
        if (!parsed) continue;
        if (parsed.done) break;
        const content = parsed.choices?.[0]?.delta?.content || '';
        if (content) {
          accumulated += content;
          writeEvent(res, { content });
        }
      }
      if (aborted) break;
    }

    if (aborted) { res.end(); return; }

    if (!accumulated) {
      accumulated = "I wasn't able to generate a response. Please try asking your question again.";
      writeEvent(res, { content: accumulated });
    }

    try {
      if (!threadId) {
        const thread = await createThread({ userId: msgUserId });
        threadId = thread.id;
        const conv = createConversation({ userId: msgUserId, threadId, mode: 'chat' });
        convId = conv.id;
        writeEvent(res, { saved: true, conversationId: convId });
      }
      await appendMessages(threadId, [
        { role: 'user', content: message },
        { role: 'assistant', content: accumulated },
      ]);
    } catch (err) {
      console.error('[chat] failed to save messages:', err.message);
    }

    writeEvent(res, { done: true });
    res.end();
  } catch (err) {
    console.error('[chat] error:', err);
    if (aborted) { res.end(); return; }

    if (err.message?.includes('API key') || err.message?.includes('api_key')) {
      writeEvent(res, { error: 'OpenRouter API key is not configured or invalid.' });
    } else {
      writeEvent(res, { error: 'An error occurred while generating a response.' });
    }
    writeEvent(res, { done: true });
    res.end();
  } finally {
    clearTimeout(timeout);
    res.off('close', cleanup);
  }
});

export default router;
