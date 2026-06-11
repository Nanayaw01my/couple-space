import { Schema, model, models } from 'mongoose';

const MoodEntrySchema = new Schema({
  coupleId: { type: Schema.Types.ObjectId, required: true, index: true },
  userId: { type: Schema.Types.ObjectId, required: true },
  userName: { type: String, required: true },
  mood: { type: String, required: true }, // emoji
  note: { type: String, default: '' },
  date: { type: String, required: true }, // YYYY-MM-DD
  createdAt: { type: Date, default: Date.now },
});

MoodEntrySchema.index({ coupleId: 1, userId: 1, date: 1 }, { unique: true });

export default models.MoodEntry || model('MoodEntry', MoodEntrySchema);
