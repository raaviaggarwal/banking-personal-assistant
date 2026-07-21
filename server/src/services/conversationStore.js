import Conversation from '../models/Conversation.js';
import { isConnected } from './database.js';

export async function createConversation(userId, title, mode) {
  if (isConnected()) {
    try {
      const doc = await Conversation.create({ userId, title, mode });
      return mapDoc(doc);
    } catch {
      // fall through to memory
    }
  }

  const id = 'local-' + Date.now();
  const entry = { id, userId, title, mode, messages: [], createdAt: new Date(), updatedAt: new Date() };
  return { ...entry };
}

export async function getConversations(userId) {
  if (isConnected()) {
    try {
      const docs = await Conversation.find({ userId }, { messages: 0 })
        .sort({ updatedAt: -1 })
        .lean();
      return docs.map(mapDoc);
    } catch {
      // fall through to memory
    }
  }

  return [];
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

  return null;
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

  return null;
}

export async function deleteConversation(id) {
  if (isConnected() && !id.startsWith('local-')) {
    try {
      await Conversation.findByIdAndDelete(id);
    } catch {
      // ignore
    }
  }
}

function mapDoc(doc) {
  return {
    id: doc._id.toString(),
    userId: doc.userId,
    title: doc.title,
    mode: doc.mode,
    messages: doc.messages || [],
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}
