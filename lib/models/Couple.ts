import { Schema, model, models } from 'mongoose';

// A Couple links two users together
const CoupleSchema = new Schema({
  members: [{ type: Schema.Types.ObjectId, ref: 'User' }], // exactly 2
  inviteCode: { type: String, unique: true, sparse: true }, // used before partner joins
  startDate: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
});

export default models.Couple || model('Couple', CoupleSchema);
