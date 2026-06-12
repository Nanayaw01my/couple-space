import { Schema, model, models } from 'mongoose';

const TruthDareRoundSchema = new Schema({
  coupleId: { type: Schema.Types.ObjectId, required: true, index: true },
  roundNumber: { type: Number, required: true },
  askerId: { type: Schema.Types.ObjectId, required: true },
  responderId: { type: Schema.Types.ObjectId, required: true },
  askerName: { type: String, required: true },
  responderName: { type: String, default: '' },
  type: { type: String, enum: ['truth', 'dare'], default: null },
  prompt: { type: String, default: null },
  response: { type: String, default: '' },
  // pending=challenge sent, composing=partner picked+asker writes Q, answering=Q sent, done=complete
  status: { type: String, enum: ['pending', 'composing', 'answering', 'done'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
});

export default models.TruthDareRound || model('TruthDareRound', TruthDareRoundSchema);
