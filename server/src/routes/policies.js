import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateEmbedding } from '../services/nvidia.js';
import { addChunks, getFiles, deleteFile } from '../services/vectorStore.js';
import { extractArticles, chunkLongContent } from '../services/policyReader.js';

const router = Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const POLICIES_DIR = path.resolve(__dirname, '..', '..', '..', 'data', 'policies');

router.post('/policies/ingest', async (_req, res) => {
  try {
    const existing = getFiles();
    const jsonFiles = fs
      .readdirSync(POLICIES_DIR)
      .filter((f) => f.endsWith('.json'))
      .filter((f) => !existing.includes(f));

    if (jsonFiles.length === 0) {
      return res.json({ message: 'All policy files already ingested', count: 0 });
    }

    const results = [];
    for (const file of jsonFiles) {
      const filePath = path.join(POLICIES_DIR, file);
      try {
        const raw = fs.readFileSync(filePath, 'utf-8');
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
                lastUpdated: article.lastUpdated,
              },
            });
          }
        }

        if (entries.length > 0) {
          addChunks(entries);
          results.push({ filename: file, status: 'ingested', chunks: entries.length });
        } else {
          results.push({ filename: file, status: 'skipped', reason: 'No articles found' });
        }
      } catch (err) {
        results.push({ filename: file, status: 'error', reason: err.message });
      }
    }

    res.json({ message: 'Ingest complete', results });
  } catch (err) {
    console.error('Ingest error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/policies', (_req, res) => {
  const files = getFiles();
  res.json({ files });
});

router.delete('/policies/:filename', (req, res) => {
  const filename = decodeURIComponent(req.params.filename);
  deleteFile(filename);
  res.json({ message: 'Deleted', filename });
});

export default router;
