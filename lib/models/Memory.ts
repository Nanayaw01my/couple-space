import { Schema, model, models } from 'mongoose';
const MemorySchema = new Schema({
  coupleId: { type: Schema.Types.ObjectId, required: true, index: true },
  uploadedBy: { type: String, required: true },    // userId
  uploadedByName: { type: String, required: true },
  title: { type: String, required: true },
  caption: { type: String, default: '' },
  imageData: { type: String, default: '' },
  date: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
});
export default models.Memory || model('Memory', MemorySchema);
