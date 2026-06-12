import { Schema, model, models } from 'mongoose';

const PickANumberSchema = new Schema({
  coupleId: { type: Schema.Types.ObjectId, required: true, index: true },
  number: { type: Number, required: true },
  category: { type: String, required: true },
  question: { type: String, required: true },
  answers: [{
    userId: { type: Schema.Types.ObjectId },
    userName: { type: String },
    text: { type: String },
  }],
  status: { type: String, enum: ['open', 'done'], default: 'open' },
  openedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
});

PickANumberSchema.index({ coupleId: 1, number: 1 }, { unique: true });

export default models.PickANumber || model('PickANumber', PickANumberSchema);
