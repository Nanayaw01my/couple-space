import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import MoodEntry from '@/lib/models/MoodEntry';
import { format } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const coupleId = (session.user as any).coupleId;
  if (!coupleId) return NextResponse.json([]);
  await connectDB();
  const entries = await MoodEntry.find({ coupleId }).sort({ date: -1 }).limit(60);
  return NextResponse.json(entries);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as any).id;
  const coupleId = (session.user as any).coupleId;
  if (!coupleId) return NextResponse.json({ error: 'Not in a couple' }, { status: 400 });
  const { mood, note } = await req.json();
  const date = format(new Date(), 'yyyy-MM-dd');
  await connectDB();
  const entry = await MoodEntry.findOneAndUpdate(
    { coupleId, userId, date },
    { coupleId, userId, userName: session.user.name, mood, note: note || '', date },
    { upsert: true, new: true }
  );
  return NextResponse.json(entry);
}
