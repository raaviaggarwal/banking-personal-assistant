import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { addChunks, getFiles, deleteFile, flattenPolicyJSON, chunkContent } from '../services/vectorStore.js';

const router = Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const POLICIES_DIR = path.resolve(__dirname, '..', '..', '..', 'data', 'policies');

function ingestFromDirectory() {
  if (!fs.existsSync(POLICIES_DIR)) return [];

  const existing = getFiles();
  const jsonFiles = fs
    .readdirSync(POLICIES_DIR)
    .filter((f) => f.endsWith('.json'))
    .filter((f) => !existing.includes(f));

  const results = [];
  for (const file of jsonFiles) {
    try {
      const raw = fs.readFileSync(path.join(POLICIES_DIR, file), 'utf-8');
      const data = JSON.parse(raw);
      const text = flattenPolicyJSON(data, file);
      const textChunks = chunkContent(text);
      const entries = textChunks.map((chunk) => ({
        filename: file,
        text: chunk,
        metadata: { documentRef: file },
      }));

      addChunks(entries);
      results.push({ filename: file, status: 'ingested', chunks: entries.length });
    } catch (err) {
      results.push({ filename: file, status: 'error', reason: err.message });
    }
  }

  return results;
}

router.post('/policies/ingest', async (_req, res) => {
  try {
    const results = ingestFromDirectory();
    if (results.length === 0) {
      return res.json({ message: 'All policy files already ingested', count: 0 });
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

router.post('/policies/upload', async (req, res) => {
  try {
    const { filename, content } = req.body;
    if (!filename || !content) {
      return res.status(400).json({ error: 'filename and content are required' });
    }
    const name = filename.endsWith('.json') ? filename : filename + '.json';
    const filePath = path.join(POLICIES_DIR, name);
    if (!fs.existsSync(POLICIES_DIR)) fs.mkdirSync(POLICIES_DIR, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf-8');

    const results = ingestFromDirectory();
    res.json({ message: 'Saved and ingested', filename: name, ingest: results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/policies/:filename', (req, res) => {
  const filename = decodeURIComponent(req.params.filename);
  deleteFile(filename);
  const filePath = path.join(POLICIES_DIR, filename);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  res.json({ message: 'Deleted', filename });
});

export default router;
