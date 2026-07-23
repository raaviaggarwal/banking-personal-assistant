import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STORE_PATH = path.resolve(__dirname, '..', '..', '..', 'data', 'vector-store.json');

let chunks = [];

export function addChunks(entries) {
  const startId = chunks.length;
  const newChunks = entries.map((e, i) => ({
    id: startId + i,
    filename: e.filename,
    text: e.text,
    metadata: e.metadata || {},
  }));
  chunks.push(...newChunks);
  resetIdfCache();
  save();
  return newChunks;
}

function tokenize(text) {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
}

function computeIDF() {
  const docCount = chunks.length;
  if (docCount === 0) return {};
  const df = {};
  for (const c of chunks) {
    const tokens = new Set(tokenize(c.text));
    for (const t of tokens) {
      df[t] = (df[t] || 0) + 1;
    }
  }
  const idf = {};
  for (const [t, count] of Object.entries(df)) {
    idf[t] = Math.log((docCount + 1) / (count + 1)) + 1;
  }
  return idf;
}

let _idfCache = null;

function getIdf() {
  if (!_idfCache) _idfCache = computeIDF();
  return _idfCache;
}

export function resetIdfCache() {
  _idfCache = null;
}

export function search(query, topK = 5) {
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return [];

  const idf = getIdf();

  const scored = chunks.map((c) => {
    const textTokens = new Set(tokenize(c.text));
    let matchSum = 0;
    let totalSum = 0;
    for (const t of queryTokens) {
      const w = idf[t] || 1;
      totalSum += w;
      if (textTokens.has(t)) matchSum += w;
    }
    return { ...c, score: totalSum > 0 ? matchSum / totalSum : 0 };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK).filter((c) => c.score > 0.04);
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
  const dir = path.dirname(STORE_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const data = chunks.map((c) => ({
    id: c.id,
    filename: c.filename,
    text: c.text,
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

function extractTextRecursive(obj, depth = 0) {
  if (depth > 20) return '';
  if (typeof obj === 'string') return obj + '\n';
  if (typeof obj === 'number' || typeof obj === 'boolean') return String(obj) + '\n';
  if (typeof obj !== 'object' || obj === null) return '';
  let result = '';
  for (const val of Object.values(obj)) {
    result += extractTextRecursive(val, depth + 1);
  }
  return result;
}

export function flattenPolicyJSON(data, filename) {
  let text = `Document: ${filename}\n`;
  if (data.title) text += `Title: ${data.title}\n`;
  if (data.documentRef) text += `Reference: ${data.documentRef}\n`;
  if (data.lastUpdated) text += `Last Updated: ${data.lastUpdated}\n`;
  if (data.description) text += `Description: ${data.description}\n`;
  text += '\n';
  text += extractTextRecursive(data);
  return text;
}

export function chunkContent(text, maxLen = 800) {
  if (text.length <= maxLen) return [text];
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    let end = Math.min(start + maxLen, text.length);
    if (end < text.length) {
      const boundary = text.lastIndexOf('. ', end);
      const newline = text.lastIndexOf('\n', end);
      const splitAt = Math.max(boundary, newline);
      if (splitAt > start) end = splitAt + 2;
    }
    chunks.push(text.slice(start, end));
    const overlap = text.lastIndexOf('. ', Math.min(start + maxLen - 100, end - 1));
    start = (overlap > start) ? overlap + 2 : end;
  }
  return chunks;
}
