import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PORT, NODE_ENV } from './config.js';
import healthRouter from './routes/health.js';
import { load, count } from './services/vectorStore.js';
import chatRouter from './routes/chat.js';
import policiesRouter from './routes/policies.js';
import historyRouter from './routes/history.js';
import authRouter from './routes/auth.js';

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(cors({
  origin: [
    'https://banking-personal-assistant.vercel.app',
    'http://localhost:5173',
    'http://localhost:3001',
  ],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

app.use('/api', healthRouter);
app.use('/api', chatRouter);
app.use('/api', policiesRouter);
app.use('/api', historyRouter);
app.use('/api', authRouter);

const clientDist = path.resolve(__dirname, '..', '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
} else {
  app.get('/', (_req, res) => {
    res.json({ service: 'DBomni API', status: 'running', docs: '/api/health' });
  });
}

app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

load();
console.log(`Vector store loaded (${count()} chunks)`);

app.listen(PORT, () => {
  const host = NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';
  console.log(`DBomni server running on http://${host}:${PORT} (${NODE_ENV})`);
});
