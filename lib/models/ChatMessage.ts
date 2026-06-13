import { Schema, model, models } from 'mongoose';

const ChatMessageSchema = new Schema({
  coupleId: { type: Schema.Types.ObjectId, required: true, index: true },
  senderId: { type: Schema.Types.ObjectId, required: true },
  senderName: { type: String, required: true },
  content: { type: String, default: '' },
  type: { type: String, enum: ['text', 'audio'], default: 'text' },
  audioData: { type: String },
  edited: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now, index: true },
});

export default models.ChatMessage || model('ChatMessage', ChatMessageSchema);
