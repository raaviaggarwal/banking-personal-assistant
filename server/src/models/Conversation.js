import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, default: '' },
}, { _id: false });

const conversationSchema = new mongoose.Schema({
  title: { type: String, default: 'New Chat' },
  mode: { type: String, enum: ['general', 'policy'], default: 'general' },
  messages: { type: [messageSchema], default: [] },
}, { timestamps: true });

conversationSchema.index({ updatedAt: -1 });

export default mongoose.model('Conversation', conversationSchema);
