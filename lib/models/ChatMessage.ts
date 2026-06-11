import { Schema, model, models } from 'mongoose';

const ChatMessageSchema = new Schema({
  coupleId: { type: Schema.Types.ObjectId, required: true, index: true },
  senderId: { type: Schema.Types.ObjectId, required: true },
  senderName: { type: String, required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, index: true },
});

export default models.ChatMessage || model('ChatMessage', ChatMessageSchema);
