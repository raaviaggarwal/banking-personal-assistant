import 'dotenv/config';

const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';
const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY || '';
const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1';
const MONGODB_URI = process.env.MONGODB_URI || '';

export { PORT, NODE_ENV, NVIDIA_API_KEY, NVIDIA_BASE_URL, MONGODB_URI };
