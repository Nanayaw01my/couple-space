import { Schema, model, models } from 'mongoose';
const CoupleGoalSchema = new Schema({
  coupleId: { type: Schema.Types.ObjectId, required: true, index: true },
  text: { type: String, required: true },
  completed: { type: Boolean, default: false },
  completedBy: { type: String, default: null },
  addedBy: { type: Schema.Types.ObjectId, required: true },
  addedByName: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});
export default models.CoupleGoal || model('CoupleGoal', CoupleGoalSchema);
