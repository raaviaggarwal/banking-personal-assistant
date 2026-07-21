import mongoose from 'mongoose';
import User from '../models/User.js';
import { MONGODB_URI } from '../config.js';

let connected = false;
let retries = 0;
const MAX_RETRIES = 3;

export async function initDatabase() {
  if (!MONGODB_URI) {
    console.warn('MONGODB_URI not set — conversation history will not persist');
    return;
  }

  while (retries < MAX_RETRIES) {
    try {
      await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
      connected = true;
      console.log('Connected to MongoDB via Mongoose');
      await seedAdmin();
      return;
    } catch (err) {
      retries++;
      console.error(`MongoDB connection attempt ${retries}/${MAX_RETRIES} failed:`, err.message);
      if (retries < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, 2000));
      }
    }
  }

  console.log('Falling back to in-memory conversation storage');
}

async function seedAdmin() {
  try {
    const existing = await User.findOne({ username: 'admin' });
    if (!existing) {
      await User.create({ username: 'admin', password: 'admin123' });
      console.log('Seeded admin user (admin / admin123)');
    }
  } catch (err) {
    console.error('Failed to seed admin user:', err.message);
  }
}

export function isConnected() {
  return connected;
}

export async function closeDatabase() {
  await mongoose.disconnect();
  connected = false;
}
