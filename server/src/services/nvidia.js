import OpenAI from 'openai';
import { NVIDIA_API_KEY, NVIDIA_BASE_URL } from '../config.js';

const CHAT_MODEL = 'nvidia/llama-3.3-nemotron-super-49b-v1';
const EMBEDDING_MODEL = 'nvidia/nv-embed-v1';

let client;

function getClient() {
  if (!client) {
    if (!NVIDIA_API_KEY) {
      throw new Error('NVIDIA_API_KEY is not configured. Set it in server/.env');
    }
    client = new OpenAI({
      apiKey: NVIDIA_API_KEY,
      baseURL: NVIDIA_BASE_URL,
    });
  }
  return client;
}

export async function generateEmbedding(text) {
  const c = getClient();
  const response = await c.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text,
  });
  return response.data[0].embedding;
}

export async function* streamChatCompletion(messages, options = {}) {
  const c = getClient();
  const stream = await c.chat.completions.create({
    model: options.model || CHAT_MODEL,
    messages,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.maxTokens ?? 2048,
    stream: true,
  });

  for await (const chunk of stream) {
    const delta = chunk.choices?.[0]?.delta?.content;
    if (delta) {
      yield delta;
    }
  }
}
