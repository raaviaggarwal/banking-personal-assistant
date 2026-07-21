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
  save();
  return newChunks;
}

function tokenize(text) {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean);
}

export function search(query, topK = 5) {
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return [];

  const scored = chunks.map((c) => {
    const textTokens = tokenize(c.text);
    const matches = queryTokens.filter((t) => textTokens.includes(t)).length;
    return { ...c, score: matches / queryTokens.length };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK).filter((c) => c.score > 0);
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

export function flattenPolicyJSON(data, filename) {
  let text = `Document: ${filename}\n`;
  if (data.title) text += `Title: ${data.title}\n`;
  if (data.documentRef) text += `Reference: ${data.documentRef}\n`;
  if (data.lastUpdated) text += `Last Updated: ${data.lastUpdated}\n`;
  if (data.description) text += `Description: ${data.description}\n`;
  text += '\n';
  if (data.sections) {
    for (const [, section] of Object.entries(data.sections)) {
      if (section.title) text += `## ${section.title}\n\n`;
      if (section.articles) {
        for (const article of section.articles) {
          if (article.title) text += `### ${article.title}\n\n`;
          if (article.content) text += `${article.content}\n\n`;
        }
      }
    }
  } else if (data.articles) {
    for (const article of data.articles) {
      if (article.title) text += `### ${article.title}\n\n`;
      if (article.content) text += `${article.content}\n\n`;
    }
  }
  return text;
}

export function chunkContent(text, maxLen = 800) {
  if (text.length <= maxLen) return [text];
  const chunks = [];
  for (let i = 0; i < text.length; i += maxLen - 100) {
    chunks.push(text.slice(i, i + maxLen));
  }
  return chunks;
}
