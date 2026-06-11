import { Schema, model, models } from 'mongoose';

const NeverHaveIEverSchema = new Schema({
  coupleId: { type: Schema.Types.ObjectId, required: true, index: true },
  roundNumber: { type: Number, required: true },
  promptIndex: { type: Number, required: true },
  statement: { type: String, required: true },
  answers: [{
    userId: { type: Schema.Types.ObjectId },
    userName: { type: String },
    // true = "I have", false = "Never"
    have: { type: Boolean },
  }],
  status: { type: String, enum: ['answering', 'done'], default: 'answering' },
  createdAt: { type: Date, default: Date.now },
});

export default models.NeverHaveIEver || model('NeverHaveIEver', NeverHaveIEverSchema);
