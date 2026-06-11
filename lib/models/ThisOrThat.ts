import { Schema, model, models } from 'mongoose';

const ThisOrThatSchema = new Schema({
  coupleId: { type: Schema.Types.ObjectId, required: true, index: true },
  roundNumber: { type: Number, required: true },
  promptIndex: { type: Number, required: true },
  thisOption: { type: String, required: true },
  thatOption: { type: String, required: true },
  picks: [{
    userId: { type: Schema.Types.ObjectId },
    userName: { type: String },
    pick: { type: String, enum: ['this', 'that'] },
  }],
  status: { type: String, enum: ['picking', 'done'], default: 'picking' },
  createdAt: { type: Date, default: Date.now },
});

export default models.ThisOrThat || model('ThisOrThat', ThisOrThatSchema);
