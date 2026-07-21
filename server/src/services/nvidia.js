import axios from 'axios';
import { NVIDIA_API_KEY, NVIDIA_BASE_URL } from '../config.js';

const FAST_CHAT_MODEL = 'google/gemma-4-31b-it';
const FULL_CHAT_MODEL = 'google/gemma-4-31b-it';
const EMBEDDING_MODEL = 'nvidia/nv-embed-v1';

export async function generateEmbedding(text) {
  const response = await axios.post(
    `${NVIDIA_BASE_URL}/embeddings`,
    { model: EMBEDDING_MODEL, input: text },
    {
      headers: {
        Authorization: `Bearer ${NVIDIA_API_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );
  return response.data.data[0].embedding;
}

async function* streamFromAPI(messages, options = {}) {
  const model = options.fast ? FAST_CHAT_MODEL : FULL_CHAT_MODEL;
  const maxTokens = options.maxTokens ?? 4096;

  const payload = {
    model,
    messages,
    temperature: options.temperature ?? 0.7,
    top_p: 0.95,
    max_tokens: maxTokens,
    stream: true,
    chat_template_kwargs: { enable_thinking: true },
  };

  const response = await axios.post(
    `${NVIDIA_BASE_URL}/chat/completions`,
    payload,
    {
      headers: {
        Authorization: `Bearer ${NVIDIA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      responseType: 'stream',
      timeout: 120000,
    }
  );

  const stream = response.data;
  let buffer = '';

  for await (const chunk of stream) {
    buffer += chunk.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const payload = line.slice(6).trim();
      if (!payload || payload === '[DONE]') continue;

      try {
        const data = JSON.parse(payload);
        const delta = data.choices?.[0]?.delta;
        if (delta?.content) {
          yield delta.content;
        } else if (delta?.thinking) {
          yield delta.thinking;
        }
      } catch {
        // skip malformed JSON
      }
    }
  }
}

async function* nonStreamFromAPI(messages, options = {}) {
  const model = options.fast ? FAST_CHAT_MODEL : FULL_CHAT_MODEL;
  const maxTokens = options.maxTokens ?? 4096;

  const payload = {
    model,
    messages,
    temperature: options.temperature ?? 0.7,
    top_p: 0.95,
    max_tokens: maxTokens,
    stream: false,
    chat_template_kwargs: { enable_thinking: true },
  };

  const response = await axios.post(
    `${NVIDIA_BASE_URL}/chat/completions`,
    payload,
    {
      headers: {
        Authorization: `Bearer ${NVIDIA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: 120000,
    }
  );

  const text = response.data?.choices?.[0]?.message?.content || '';
  if (text) {
    yield text;
  }
}

export async function* streamChatCompletion(messages, options = {}) {
  try {
    yield* streamFromAPI(messages, options);
  } catch (err) {
    console.warn('[nvidia] streaming failed, falling back to non-streaming:', err.message);
    yield* nonStreamFromAPI(messages, options);
  }
}
