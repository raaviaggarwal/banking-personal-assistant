import { Router } from 'express';

const router = Router();

const HARDCODED_USER = { username: 'admin', password: 'admin123' };

router.post('/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    if (username === HARDCODED_USER.username && password === HARDCODED_USER.password) {
      return res.json({ userId: 'admin', username: HARDCODED_USER.username });
    }

    return res.status(401).json({ error: 'Invalid username or password' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
