import { Langbase } from 'langbase';
import { LANGBASE_API_KEY, OPENROUTER_API_KEY, OPENROUTER_MODEL } from '../config.js';

if (!LANGBASE_API_KEY) {
  console.error('LANGBASE_API_KEY is not set');
}
if (!OPENROUTER_API_KEY) {
  console.error('OPENROUTER_API_KEY is not set');
}

const langbase = new Langbase({
  apiKey: LANGBASE_API_KEY || 'missing',
});

const UNIFIED_SYSTEM_PROMPT =
  'You are DBomni, a helpful and knowledgeable banking personal assistant. ' +
  'Answer general questions, coding questions, and everyday tasks. ' +
  'If relevant company policy excerpts are provided below, use them to answer ' +
  'policy-related questions. Cite the source filename when referencing specific policies. ' +
  'If policy excerpts do not contain enough information to answer, say so honestly. ' +
  'Be concise, accurate, and professional.';

export async function runPipe({ messages, context }) {
  const systemContent = context
    ? UNIFIED_SYSTEM_PROMPT + '\n\nRelevant policy excerpts:\n\n' + context
    : UNIFIED_SYSTEM_PROMPT;

  const pipeMessages = [
    { role: 'system', content: systemContent },
    ...messages,
  ];

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'HTTP-Referer': 'https://dbomni.app',
      'X-Title': 'DBomni',
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages: pipeMessages,
      stream: true,
    }),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`OpenRouter error ${response.status}: ${errBody}`);
  }

  return response;
}

export async function createThread({ userId, mode, title }) {
  return langbase.threads.create({
    metadata: { userId, mode, title: title || 'New Chat' },
  });
}

export async function getThread(threadId) {
  return langbase.threads.get({ threadId });
}

export async function updateThread(threadId, metadata) {
  return langbase.threads.update({ threadId, metadata });
}

export async function appendMessages(threadId, messages) {
  return langbase.threads.append({ threadId, messages });
}

export async function listMessages(threadId) {
  return langbase.threads.messages.list({ threadId });
}

export async function deleteThread(threadId) {
  return langbase.threads.delete({ threadId });
}
