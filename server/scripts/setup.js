import 'dotenv/config';
import { Langbase } from 'langbase';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const POLICIES_DIR = path.resolve(__dirname, '..', '..', 'data', 'policies');
const STORE_PATH = path.resolve(__dirname, '..', '..', 'data', 'vector-store.json');

const LANGBASE_API_KEY = process.env.LANGBASE_API_KEY;
const PIPE_NAME = process.env.LANGBASE_PIPE_NAME || 'dbomni-assistant';

if (!LANGBASE_API_KEY) {
  console.error('LANGBASE_API_KEY is not set in .env');
  process.exit(1);
}

const langbase = new Langbase({ apiKey: LANGBASE_API_KEY });

function flattenPolicyJSON(data, filename) {
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

function chunkContent(text, maxLen = 800) {
  if (text.length <= maxLen) return [text];
  const chunks = [];
  for (let i = 0; i < text.length; i += maxLen - 100) {
    chunks.push(text.slice(i, i + maxLen));
  }
  return chunks;
}

async function main() {
  console.log('=== Langbase Setup ===\n');

  console.log(`1. Creating Pipe "${PIPE_NAME}"...`);
  try {
    const pipe = await langbase.pipes.create({
      name: PIPE_NAME,
      description: 'DBomni banking personal assistant with policy RAG',
      model: 'openai:gpt-4o-mini',
      stream: true,
    });
    console.log(`   ✓ Pipe created: ${pipe.name}`);
  } catch (err) {
    if (err.message?.includes('already exists')) {
      console.log(`   ✓ Pipe "${PIPE_NAME}" already exists`);
    } else {
      console.error(`   ✗ Failed to create pipe: ${err.message}`);
      process.exit(1);
    }
  }

  console.log('\n2. Ingesting policy documents (keyword-search based)...');

  if (!fs.existsSync(POLICIES_DIR)) {
    console.log('   ! No policies directory found.');
    return;
  }

  const jsonFiles = fs.readdirSync(POLICIES_DIR).filter((f) => f.endsWith('.json'));
  if (jsonFiles.length === 0) {
    console.log('   ! No JSON policy files found.');
    return;
  }

  let existingChunks = [];
  if (fs.existsSync(STORE_PATH)) {
    try { existingChunks = JSON.parse(fs.readFileSync(STORE_PATH, 'utf-8')); } catch {}
  }

  const existingFiles = new Set(existingChunks.map((c) => c.filename));
  let allChunks = [...existingChunks];

  for (const file of jsonFiles) {
    if (existingFiles.has(file)) {
      console.log(`   - ${file} already ingested`);
      continue;
    }

    try {
      const raw = fs.readFileSync(path.join(POLICIES_DIR, file), 'utf-8');
      const data = JSON.parse(raw);
      const text = flattenPolicyJSON(data, file);
      const textChunks = chunkContent(text);

      const entries = textChunks.map((chunk, i) => ({
        id: allChunks.length + i,
        filename: file,
        text: chunk,
        metadata: { documentRef: file },
      }));

      allChunks.push(...entries);
      console.log(`   ✓ ${file} (${entries.length} chunks)`);
    } catch (err) {
      console.error(`   ✗ ${file}: ${err.message}`);
    }
  }

  try {
    const dir = path.dirname(STORE_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(STORE_PATH, JSON.stringify(allChunks, null, 2), 'utf-8');
    console.log(`\n   ✓ Vector store saved (${allChunks.length} total chunks)`);
  } catch (err) {
    console.error(`   ✗ Failed to save: ${err.message}`);
  }

  console.log('\n=== Setup complete ===');
  console.log(`Pipe:   ${PIPE_NAME}`);
  console.log('RAG:    keyword-based search (no embeddings needed)');
}

main().catch(console.error);
