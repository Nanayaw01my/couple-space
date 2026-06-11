import { Schema, model, models } from 'mongoose';

const NoteSchema = new Schema({
  coupleId: { type: Schema.Types.ObjectId, required: true, index: true },
  authorId: { type: Schema.Types.ObjectId, required: true },
  authorName: { type: String, required: true },
  content: { type: String, required: true },
  color: { type: String, default: '#fff9db' },
  createdAt: { type: Date, default: Date.now },
});

export default models.Note || model('Note', NoteSchema);
