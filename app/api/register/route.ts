import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const { name, email, password } = await req.json();
  if (!name?.trim() || !email?.trim() || !password) {
    return NextResponse.json({ error: 'All fields required' }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: 'Password too short' }, { status: 400 });
  }
  await connectDB();
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
  await User.create({ name: name.trim(), email: email.toLowerCase(), password });
  return NextResponse.json({ ok: true });
}
