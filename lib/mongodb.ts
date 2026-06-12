import mongoose from 'mongoose';

declare global {
  var _mongoConn: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
}

if (!global._mongoConn) global._mongoConn = { conn: null, promise: null };

export default async function connectDB() {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) throw new Error('MONGODB_URI environment variable is not set');
  if (global._mongoConn.conn) return global._mongoConn.conn;
  if (!global._mongoConn.promise) {
    global._mongoConn.promise = mongoose.connect(MONGODB_URI);
  }
  global._mongoConn.conn = await global._mongoConn.promise;
  return global._mongoConn.conn;
}
