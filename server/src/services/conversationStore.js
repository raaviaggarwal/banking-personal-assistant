import Conversation from '../models/Conversation.js';
import { isConnected } from './database.js';

const memoryStore = new Map();

export async function createConversation(title, mode) {
  if (isConnected()) {
    try {
      const doc = await Conversation.create({ title, mode });
      return mapDoc(doc);
    } catch {
      // fall through to memory
    }
  }

  const id = 'local-' + Date.now();
  const entry = { id, title, mode, messages: [], createdAt: new Date(), updatedAt: new Date() };
  memoryStore.set(id, entry);
  return { ...entry };
}

export async function getConversations() {
  if (isConnected()) {
    try {
      const docs = await Conversation.find({}, { messages: 0 })
        .sort({ updatedAt: -1 })
        .lean();
      return docs.map(mapDoc);
    } catch {
      // fall through to memory
    }
  }

  return [...memoryStore.values()]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .map((e) => ({ id: e.id, title: e.title, mode: e.mode, createdAt: e.createdAt, updatedAt: e.updatedAt }));
}

export async function getConversation(id) {
  if (isConnected() && !id.startsWith('local-')) {
    try {
      const doc = await Conversation.findById(id).lean();
      if (!doc) return null;
      return mapDoc(doc);
    } catch {
      return null;
    }
  }

  const entry = memoryStore.get(id);
  return entry ? { ...entry } : null;
}

export async function updateConversation(id, updates) {
  const { messages, title, mode } = updates;

  if (isConnected() && !id.startsWith('local-')) {
    try {
      const setFields = {};
      if (title !== undefined) setFields.title = title;
      if (mode !== undefined) setFields.mode = mode;
      if (messages !== undefined) setFields.messages = messages;
      setFields.updatedAt = new Date();

      const doc = await Conversation.findByIdAndUpdate(
        id,
        { $set: setFields },
        { new: true }
      ).lean();

      if (!doc) return null;
      return mapDoc(doc);
    } catch {
      return null;
    }
  }

  const existing = memoryStore.get(id);
  if (!existing) return null;
  if (title !== undefined) existing.title = title;
  if (mode !== undefined) existing.mode = mode;
  if (messages !== undefined) existing.messages = messages;
  existing.updatedAt = new Date();
  return { ...existing };
}

export async function deleteConversation(id) {
  if (isConnected() && !id.startsWith('local-')) {
    try {
      await Conversation.findByIdAndDelete(id);
    } catch {
      // ignore
    }
    return;
  }

  memoryStore.delete(id);
}

function mapDoc(doc) {
  return {
    id: doc._id.toString(),
    title: doc.title,
    mode: doc.mode,
    messages: doc.messages || [],
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}
