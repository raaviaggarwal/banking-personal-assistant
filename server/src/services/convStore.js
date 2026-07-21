import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STORE_PATH = path.resolve(__dirname, '..', '..', '..', 'data', 'conversations.json');

let conversations = [];
let nextId = 1;

function load() {
  if (fs.existsSync(STORE_PATH)) {
    try {
      const raw = fs.readFileSync(STORE_PATH, 'utf-8');
      const data = JSON.parse(raw);
      conversations = data.list || [];
      nextId = data.nextId || conversations.length + 1;
    } catch {
      conversations = [];
      nextId = 1;
    }
  }
}

function save() {
  try {
    const dir = path.dirname(STORE_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(STORE_PATH, JSON.stringify({ list: conversations, nextId }, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to persist conversations:', err.message);
  }
}

load();

export function createConversation({ userId, threadId, mode, title }) {
  const id = 'conv_' + (nextId++);
  const now = new Date().toISOString();
  const entry = { id, threadId, userId, title: title || 'New Chat', mode, createdAt: now, updatedAt: now };
  conversations.unshift(entry);
  save();
  return { ...entry };
}

export function listConversations(userId) {
  return conversations
    .filter((c) => c.userId === userId)
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
}

export function getConversation(id) {
  return conversations.find((c) => c.id === id) || null;
}

export function updateConversation(id, updates) {
  const entry = conversations.find((c) => c.id === id);
  if (!entry) return null;
  if (updates.title !== undefined) entry.title = updates.title;
  if (updates.mode !== undefined) entry.mode = updates.mode;
  if (updates.threadId !== undefined) entry.threadId = updates.threadId;
  entry.updatedAt = new Date().toISOString();
  save();
  return { ...entry };
}

export function deleteConversation(id) {
  const idx = conversations.findIndex((c) => c.id === id);
  if (idx === -1) return false;
  const [entry] = conversations.splice(idx, 1);
  save();
  return entry;
}
