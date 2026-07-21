import { Router } from 'express';
import { streamChatCompletion, generateEmbedding } from '../services/nvidia.js';
import { search, count } from '../services/vectorStore.js';

const router = Router();

const GENERAL_SYSTEM_PROMPT =
  'You are DBomni, a helpful and knowledgeable banking personal assistant. ' +
  'You help with coding, general knowledge, questions, and everyday tasks. ' +
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

router.post('/chat', async (req, res) => {
  const { message, mode = 'general', history = [] } = req.body;

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

    if (mode === 'policy' && count() > 0) {
      writeEvent(res, { status: 'searching', message: 'Searching policies...' });
      const queryEmbedding = await generateEmbedding(message);
      const results = search(queryEmbedding, 5);
      policyContext = chunksToContext(results);
    }

    if (aborted) { res.end(); return; }

    writeEvent(res, { status: 'streaming' });

    const systemContent = buildSystemPrompt(mode, policyContext);
    const messages = [
      { role: 'system', content: systemContent },
      ...history,
      { role: 'user', content: message },
    ];

    for await (const chunk of streamChatCompletion(messages, { maxTokens: 2048 })) {
      if (aborted) { res.end(); return; }
      writeEvent(res, { content: chunk });
    }
    if (!aborted) {
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
