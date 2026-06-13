import { Schema, model, models } from 'mongoose';
const LoveQuizSchema = new Schema({
  coupleId: { type: Schema.Types.ObjectId, required: true },
  questionId: { type: Number, required: true },
  answers: [{
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    answerIndex: { type: Number, default: -1 },
  }],
});
LoveQuizSchema.index({ coupleId: 1, questionId: 1 }, { unique: true });
export default models.LoveQuiz || model('LoveQuiz', LoveQuizSchema);
