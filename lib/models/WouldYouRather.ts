import { Schema, model, models } from 'mongoose';

const WouldYouRatherSchema = new Schema({
  coupleId: { type: Schema.Types.ObjectId, required: true, index: true },
  roundNumber: { type: Number, required: true },
  promptIndex: { type: Number, required: true },
  optionA: { type: String, required: true },
  optionB: { type: String, required: true },
  picks: [{
    userId: { type: Schema.Types.ObjectId },
    userName: { type: String },
    pick: { type: String, enum: ['a', 'b'] },
  }],
  status: { type: String, enum: ['picking', 'done'], default: 'picking' },
  createdAt: { type: Date, default: Date.now },
});

export default models.WouldYouRather || model('WouldYouRather', WouldYouRatherSchema);
