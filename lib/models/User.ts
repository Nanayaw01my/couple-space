import { Schema, model, models } from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  coupleId: { type: Schema.Types.ObjectId, ref: 'Couple', default: null },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  createdAt: { type: Date, default: Date.now },
});

UserSchema.pre('save', async function () {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
});

UserSchema.methods.comparePassword = function (plain: string) {
  return bcrypt.compare(plain, this.password);
};

export default models.User || model('User', UserSchema);
