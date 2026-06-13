import { Schema, model, models } from 'mongoose';
const ReflectionSchema = new Schema({
  coupleId: { type: Schema.Types.ObjectId, required: true, index: true },
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  week: { type: String, required: true },
  weekLabel: { type: String, required: true },
  wentWell: { type: String, default: '' },
  madeHappy: { type: String, default: '' },
  appreciation: { type: String, default: '' },
  improvements: { type: String, default: '' },
  concerns: { type: String, default: '' },
  nextWeekGoals: { type: String, default: '' },
  futurePlans: { type: String, default: '' },
  updatedAt: { type: Date, default: Date.now },
});
ReflectionSchema.index({ coupleId: 1, userId: 1, week: 1 }, { unique: true });
export default models.Reflection || model('Reflection', ReflectionSchema);
