import { Schema, model, models } from 'mongoose';
const GuessPartnerSchema = new Schema({
  coupleId: { type: Schema.Types.ObjectId, required: true },
  questionId: { type: Number, required: true },
  answers: [{
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    answerIndex: { type: Number, default: -1 },
  }],
});
GuessPartnerSchema.index({ coupleId: 1, questionId: 1 }, { unique: true });
export default models.GuessPartner || model('GuessPartner', GuessPartnerSchema);
