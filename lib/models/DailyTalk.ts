import { Schema, model, models } from 'mongoose';
const DailyTalkSchema = new Schema({
  coupleId: { type: Schema.Types.ObjectId, required: true },
  weekKey: { type: String, required: true },
  dayOfWeek: { type: Number, required: true },
  questionIndex: { type: Number, required: true },
  answers: [{
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    answer: { type: String, default: '' },
  }],
  updatedAt: { type: Date, default: Date.now },
});
DailyTalkSchema.index({ coupleId: 1, weekKey: 1, dayOfWeek: 1, questionIndex: 1 }, { unique: true });
export default models.DailyTalk || model('DailyTalk', DailyTalkSchema);
