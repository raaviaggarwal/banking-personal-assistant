import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STORE_PATH = path.resolve(__dirname, '..', '..', '..', 'data', 'vector-store.json');

let chunks = [];

function cosineSimilarity(a, b) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : dot / denom;
}

export function addChunks(entries) {
  const startId = chunks.length;
  const newChunks = entries.map((e, i) => ({
    id: startId + i,
    filename: e.filename,
    text: e.text,
    embedding: e.embedding,
    metadata: e.metadata || {},
  }));
  chunks.push(...newChunks);
  save();
  return newChunks;
}

export function search(queryEmbedding, topK = 5) {
  const scored = chunks.map((c) => ({
    ...c,
    score: cosineSimilarity(queryEmbedding, c.embedding),
  }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK);
}

export function getFiles() {
  const seen = new Set();
  return chunks
    .map((c) => c.filename)
    .filter((f) => {
      if (seen.has(f)) return false;
      seen.add(f);
      return true;
    });
}

export function deleteFile(filename) {
  chunks = chunks.filter((c) => c.filename !== filename);
  save();
}

export function count() {
  return chunks.length;
}

export function save() {
  const data = chunks.map((c) => ({
    id: c.id,
    filename: c.filename,
    text: c.text,
    embedding: c.embedding,
    metadata: c.metadata,
  }));
  fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

export function load() {
  if (fs.existsSync(STORE_PATH)) {
    try {
      const raw = fs.readFileSync(STORE_PATH, 'utf-8');
      chunks = JSON.parse(raw);
    } catch {
      chunks = [];
    }
  } else {
    chunks = [];
  }
}
