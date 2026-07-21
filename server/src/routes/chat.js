import { Router } from 'express';
import { streamChatCompletion, generateEmbedding } from '../services/nvidia.js';
import { search, count } from '../services/vectorStore.js';
import Conversation from '../models/Conversation.js';
import { isConnected } from '../services/database.js';

const router = Router();

const GENERAL_SYSTEM_PROMPT =
  'You are DBomni, a helpful and knowledgeable banking personal assistant. ' +
  'You help with coding, general knowledge, questions, and everyday tasks. ' +
  'If the user asks about company policies, HR policies, compliance, code of conduct, ' +
  'expenses, benefits, or any policy-related matters, politely explain that you cannot ' +
  'answer policy questions in general mode and suggest they create a new Policy Assistant ' +
  'chat to get accurate policy-based answers. ' +
  'Be concise, accurate, and professional in your responses.';

const POLICY_SYSTEM_PROMPT =
  'You are DBomni, a banking company policy assistant. ' +
  'Answer questions about company policies based only on the provided policy context below. ' +
  'If the policy excerpts do not contain enough information to answer, say so honestly. ' +
  'Cite the source filename when referencing specific policies. ' +
  'Be professional, clear, and concise.';

function chunksToContext(results) {
  if (!results || results.length === 0) return '';
  let context = 'Relevant policy excerpts:\n\n';
  for (const r of results) {
    context += `[Source: ${r.metadata?.articleTitle || r.filename}]\n${r.text}\n\n`;
  }
  return context;
}

function buildSystemPrompt(mode, policyContext) {
  if (mode !== 'policy') return GENERAL_SYSTEM_PROMPT;
  return POLICY_SYSTEM_PROMPT + '\n\n' + policyContext;
}

function writeEvent(res, data) {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

async function findOrCreateConversation(conversationId, userId, mode) {
  if (conversationId && !conversationId.startsWith('local-') && isConnected()) {
    try {
      const existing = await Conversation.findById(conversationId).lean();
      if (existing) return existing._id.toString();
    } catch {}
  }
  if (isConnected()) {
    try {
      const doc = await Conversation.create({ userId, title: 'New Chat', mode, messages: [] });
      return doc._id.toString();
    } catch {}
  }
  return conversationId || 'local-' + Date.now();
}

async function saveUserMessage(conversationId, content) {
  if (isConnected() && conversationId && !conversationId.startsWith('local-')) {
    try {
      await Conversation.findByIdAndUpdate(conversationId, {
        $push: { messages: { role: 'user', content } },
        $set: { updatedAt: new Date() },
      });
    } catch {}
  }
}

async function saveAssistantMessage(conversationId, content) {
  if (isConnected() && conversationId && !conversationId.startsWith('local-')) {
    try {
      await Conversation.findByIdAndUpdate(conversationId, {
        $push: { messages: { role: 'assistant', content } },
        $set: { updatedAt: new Date() },
      });
    } catch {}
  }
}

router.post('/chat', async (req, res) => {
  const { message, mode = 'general', history = [], conversationId, userId } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'message is required' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  let aborted = false;
  const cleanup = () => { aborted = true; };
  req.on('close', cleanup);

  const timeout = setTimeout(() => {
    if (!aborted) {
      aborted = true;
      writeEvent(res, { error: 'Request timed out. Please try again.' });
      writeEvent(res, { done: true });
      res.end();
    }
  }, 60000);

  try {
    let policyContext = '';
    const fast = mode !== 'policy';

    if (mode === 'policy' && count() > 0) {
      writeEvent(res, { status: 'searching', message: 'Searching policies...' });
      const queryEmbedding = await generateEmbedding(message);
      const results = search(queryEmbedding, 5);
      policyContext = chunksToContext(results);
    }

    if (aborted) { res.end(); return; }

    const resolvedId = await findOrCreateConversation(conversationId, userId, mode);
    if (resolvedId !== conversationId) {
      writeEvent(res, { saved: true, conversationId: resolvedId });
    }
    await saveUserMessage(resolvedId, message);
    writeEvent(res, { status: 'streaming' });

    const systemContent = buildSystemPrompt(mode, policyContext);
    const messages = [
      { role: 'system', content: systemContent },
      ...history,
      { role: 'user', content: message },
    ];

    console.log(`[chat] starting stream mode=${mode} fast=${fast} history=${history.length}`);
    let accumulated = '';
    let chunkCount = 0;
    for await (const chunk of streamChatCompletion(messages, { fast, maxTokens: fast ? 2048 : 4096 })) {
      console.log('[chat] chunk:', chunk?.slice ? chunk.slice(0, 120) : chunk);
      if (aborted) { console.log(`[chat] aborted after ${chunkCount} chunks`); res.end(); return; }
      chunkCount++;
      accumulated += chunk;
      writeEvent(res, { content: chunk });
    }
    console.log(`[chat] ${chunkCount} chunks, ${accumulated.length} chars for conv ${resolvedId}`);

    if (!aborted) {
      if (accumulated) {
        await saveAssistantMessage(resolvedId, accumulated);
      } else {
        console.log(`[chat] WARNING: empty response for conv ${resolvedId}`);
        const fallback = mode === 'policy'
          ? "I couldn't find relevant information about that in the policy documents. Please try rephrasing your question with different terms."
          : "I wasn't able to generate a response. Please try asking your question again.";
        accumulated = fallback;
        writeEvent(res, { content: fallback });
      }
      writeEvent(res, { done: true });
      res.end();
    }
  } catch (err) {
    console.error('Chat stream error:', err);
    if (aborted) { res.end(); return; }

    if (err.message?.includes('API key')) {
      writeEvent(res, { error: 'NVIDIA API key is not configured or invalid.' });
    } else if (err.status === 429) {
      writeEvent(res, { error: 'Rate limit reached. Please wait a moment and try again.' });
    } else {
      writeEvent(res, { error: 'An error occurred while generating a response.' });
    }
    writeEvent(res, { done: true });
    res.end();
  } finally {
    clearTimeout(timeout);
    req.off('close', cleanup);
  }
});

export default router;
