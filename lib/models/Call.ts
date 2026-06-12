import { Schema, model, models } from 'mongoose';

const CallSchema = new Schema({
  coupleId: { type: Schema.Types.ObjectId, required: true, index: true },
  callerId: { type: Schema.Types.ObjectId, required: true },
  callerName: { type: String, required: true },
  type: { type: String, enum: ['audio', 'video'], required: true },
  status: { type: String, enum: ['ringing', 'active', 'ended', 'rejected'], default: 'ringing' },
  offer: { type: String, default: null },
  answer: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
  endedAt: { type: Date, default: null },
});

CallSchema.index({ createdAt: 1 }, { expireAfterSeconds: 3600 });

export default models.Call || model('Call', CallSchema);
