import 'dotenv/config';

const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';
const LANGBASE_API_KEY = process.env.LANGBASE_API_KEY || '';
const LANGBASE_PIPE_NAME = process.env.LANGBASE_PIPE_NAME || 'dbomni-assistant';
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';

export { PORT, NODE_ENV, LANGBASE_API_KEY, LANGBASE_PIPE_NAME, OPENROUTER_API_KEY, OPENROUTER_MODEL };
