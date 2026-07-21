// Connection test — copy your MONGODB_URI from .env and paste below
// Run: node test.js
import mongoose from 'mongoose';

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/dbomni';

try {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  console.log('Connected');
  await mongoose.disconnect();
} catch (err) {
  console.error(err);
}
