import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import DailyTalk from '@/lib/models/DailyTalk';
import { getSessionCoupleId } from '@/lib/coupleId';
import { getISOWeek, getISOWeekYear } from 'date-fns';

export const dynamic = 'force-dynamic';

function getWeekKey(d: Date) {
  return `${getISOWeekYear(d)}-W${String(getISOWeek(d)).padStart(2, '0')}`;
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json([]);
  const userId = (session.user as any).id;
  const coupleId = await getSessionCoupleId(userId, (session.user as any).coupleId);
  if (!coupleId) return NextResponse.json([]);
  const { searchParams } = new URL(req.url);
  const day = parseInt(searchParams.get('day') ?? String(new Date().getDay()));
  const week = searchParams.get('week') ?? getWeekKey(new Date());
  await connectDB();
  const docs = await DailyTalk.find({ coupleId, weekKey: week, dayOfWeek: day });
  return NextResponse.json(docs);
}

// PATCH: upsert my answer for a specific question slot
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = (session.user as any).id;
    const userName = session.user.name as string;
    const coupleId = await getSessionCoupleId(userId, (session.user as any).coupleId);
    if (!coupleId) return NextResponse.json({ error: 'Not in a couple' }, { status: 400 });
    const { weekKey, dayOfWeek, questionIndex, answer } = await req.json();
    await connectDB();
    // upsert the document, then update/push the user's answer in the answers array
    const doc = await DailyTalk.findOneAndUpdate(
      { coupleId, weekKey, dayOfWeek, questionIndex },
      { $setOnInsert: { coupleId, weekKey, dayOfWeek, questionIndex } },
      { upsert: true, new: true }
    );
    const idx = doc.answers.findIndex((a: any) => a.userId === userId);
    if (idx >= 0) {
      doc.answers[idx].answer = answer;
      doc.answers[idx].userName = userName;
    } else {
      doc.answers.push({ userId, userName, answer });
    }
    doc.updatedAt = new Date();
    await doc.save();
    return NextResponse.json(doc);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
