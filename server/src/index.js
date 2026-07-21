import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PORT, NODE_ENV } from './config.js';
import healthRouter from './routes/health.js';
import chatRouter from './routes/chat.js';
import policiesRouter from './routes/policies.js';
import historyRouter from './routes/history.js';
import authRouter from './routes/auth.js';
import { load, count, getFiles, addChunks } from './services/vectorStore.js';
import { generateEmbedding } from './services/nvidia.js';
import { extractArticles, chunkLongContent } from './services/policyReader.js';
import { initDatabase } from './services/database.js';

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const POLICIES_DIR = path.resolve(__dirname, '..', '..', 'data', 'policies');

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3001',
  'https://banking-personal-assistant.onrender.com',
  'https://banking-personal-assistant.vercel.app',
];

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) cb(null, true);
    else cb(null, false);
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

app.use('/api', healthRouter);
app.use('/api', chatRouter);
app.use('/api', policiesRouter);
app.use('/api', historyRouter);
app.use('/api', authRouter);

const clientDist = path.resolve(__dirname, '..', '..', 'client', 'dist');
app.use(express.static(clientDist));
app.get('*', (_req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

load();
console.log(`Vector store loaded (${count()} chunks)`);

async function autoIngest() {
  const existing = getFiles();
  if (!fs.existsSync(POLICIES_DIR)) return;

  const jsonFiles = fs
    .readdirSync(POLICIES_DIR)
    .filter((f) => f.endsWith('.json'))
    .filter((f) => !existing.includes(f));

  if (jsonFiles.length === 0) {
    console.log('All policy files already ingested');
    return;
  }

  console.log(`Ingesting ${jsonFiles.length} new policy file(s)...`);
  for (const file of jsonFiles) {
    try {
      const raw = fs.readFileSync(path.join(POLICIES_DIR, file), 'utf-8');
      const data = JSON.parse(raw);
      const articles = extractArticles(data);
      const entries = [];

      for (const article of articles) {
        const contentChunks = chunkLongContent(article.content);
        for (const chunk of contentChunks) {
          const embedding = await generateEmbedding(chunk);
          entries.push({
            filename: file,
            text: chunk,
            embedding,
            metadata: {
              sectionTitle: article.sectionTitle,
              articleTitle: article.articleTitle,
              keywords: article.keywords,
              documentRef: article.documentRef,
            },
          });
        }
      }

      if (entries.length > 0) {
        addChunks(entries);
        console.log(`  ✓ ${file} (${entries.length} chunks)`);
      }
    } catch (err) {
      console.error(`  ✗ ${file}: ${err.message}`);
    }
  }
  console.log(`Vector store now has ${count()} chunks`);
}

app.listen(PORT, async () => {
  const host = NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';
  console.log(`DBomni server running on http://${host}:${PORT} (${NODE_ENV})`);
  await initDatabase();
  await autoIngest();
});
