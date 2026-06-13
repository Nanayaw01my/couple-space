import { Schema, model, models } from 'mongoose';
const LoveNoteSchema = new Schema({
  coupleId: { type: Schema.Types.ObjectId, required: true, index: true },
  senderId: { type: Schema.Types.ObjectId, required: true },
  senderName: { type: String, required: true },
  message: { type: String, required: true },
  opened: { type: Boolean, default: false },
  openedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
});
export default models.LoveNote || model('LoveNote', LoveNoteSchema);
