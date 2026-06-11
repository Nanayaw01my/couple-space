import { Schema, model, models } from 'mongoose';

const PushSubscriptionSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, required: true, index: true },
  endpoint: { type: String, required: true, unique: true },
  keys: {
    p256dh: { type: String, required: true },
    auth: { type: String, required: true },
  },
  createdAt: { type: Date, default: Date.now },
});

export default models.PushSub || model('PushSub', PushSubscriptionSchema);
