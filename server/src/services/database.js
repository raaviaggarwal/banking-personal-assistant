import mongoose from 'mongoose';
import { MONGODB_URI } from '../config.js';

let connected = false;

export async function initDatabase() {
  if (!MONGODB_URI) {
    console.warn('MONGODB_URI not set — conversation history will not persist');
    return;
  }

  try {
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
    connected = true;
    console.log('Connected to MongoDB via Mongoose');
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    console.log('Falling back to in-memory conversation storage');
  }
}

export function isConnected() {
  return connected;
}

export async function closeDatabase() {
  await mongoose.disconnect();
  connected = false;
}
