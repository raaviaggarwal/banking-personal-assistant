import { Router } from 'express';
import {
  createConversation,
  getConversations,
  getConversation,
  updateConversation,
  deleteConversation,
} from '../services/conversationStore.js';

const router = Router();

router.get('/history', async (_req, res) => {
  try {
    const list = await getConversations();
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/history/:id', async (req, res) => {
  try {
    const convo = await getConversation(req.params.id);
    if (!convo) return res.status(404).json({ error: 'Conversation not found' });
    res.json(convo);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/history', async (req, res) => {
  try {
    const { title = 'New Chat', mode = 'general' } = req.body;
    const convo = await createConversation(title, mode);
    res.status(201).json(convo);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/history/:id', async (req, res) => {
  try {
    const { title, mode, messages } = req.body;
    const updates = {};
    if (title !== undefined) updates.title = title;
    if (mode !== undefined) updates.mode = mode;
    if (messages !== undefined) updates.messages = messages;
    const result = await updateConversation(req.params.id, updates);
    if (!result) return res.status(404).json({ error: 'Conversation not found' });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/history/:id', async (req, res) => {
  try {
    await deleteConversation(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
