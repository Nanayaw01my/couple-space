import { Schema, model, models } from 'mongoose';
const SavedDateSchema = new Schema({
  coupleId: { type: Schema.Types.ObjectId, required: true, index: true },
  ideaId: { type: Number, required: true },
  idea: { type: String, required: true },
  category: { type: String, required: true },
  emoji: { type: String, default: '📅' },
  savedBy: { type: String, required: true },
  savedByName: { type: String, required: true },
  completed: { type: Boolean, default: false },
  scheduledFor: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
});
SavedDateSchema.index({ coupleId: 1, ideaId: 1 }, { unique: true });
export default models.SavedDate || model('SavedDate', SavedDateSchema);
