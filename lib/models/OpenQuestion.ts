import { Schema, model, models } from 'mongoose';

const OpenQuestionSchema = new Schema({
  coupleId: { type: Schema.Types.ObjectId, required: true, index: true },
  roundNumber: { type: Number, required: true },
  promptIndex: { type: Number, required: true },
  question: { type: String, required: true },
  answers: [{
    userId: { type: Schema.Types.ObjectId },
    userName: { type: String },
    text: { type: String },
  }],
  status: { type: String, enum: ['answering', 'done'], default: 'answering' },
  createdAt: { type: Date, default: Date.now },
});

export default models.OpenQuestion || model('OpenQuestion', OpenQuestionSchema);
