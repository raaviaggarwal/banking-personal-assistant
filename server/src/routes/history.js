import { Router } from 'express';
import {
  listConversations,
  getConversation,
  createConversation,
  updateConversation,
  deleteConversation,
} from '../services/convStore.js';
import { listMessages, deleteThread } from '../services/langbase.js';

const router = Router();

router.get('/history', async (req, res) => {
  try {
    const userId = req.query.userId || 'admin';
    const list = listConversations(userId);
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/history/:id', async (req, res) => {
  try {
    const conv = getConversation(req.params.id);
    if (!conv) return res.status(404).json({ error: 'Conversation not found' });

    if (conv.threadId) {
      try {
        const msgs = await listMessages(conv.threadId);
        const mapped = msgs.map((m) => ({
          role: m.role,
          content: m.content,
        }));
        return res.json({ ...conv, messages: mapped });
      } catch (err) {
        console.warn('[history] failed to list messages:', err.message);
      }
    }

    res.json({ ...conv, messages: [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/history', async (req, res) => {
  try {
    const { userId = 'admin', title = 'New Chat', mode = 'general' } = req.body;
    const conv = createConversation({ userId, threadId: null, mode, title });
    res.status(201).json(conv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/history/:id', async (req, res) => {
  try {
    const { title, mode } = req.body;
    const updates = {};
    if (title !== undefined) updates.title = title;
    if (mode !== undefined) updates.mode = mode;
    const result = updateConversation(req.params.id, updates);
    if (!result) return res.status(404).json({ error: 'Conversation not found' });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/history/:id', async (req, res) => {
  try {
    const conv = getConversation(req.params.id);
    if (conv?.threadId) {
      try {
        await deleteThread(conv.threadId);
      } catch (err) {
        console.warn('[history] failed to delete thread:', err.message);
      }
    }
    deleteConversation(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
