import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import MemoryChallenge from '@/lib/models/MemoryChallenge';
import { getSessionCoupleId } from '@/lib/coupleId';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = (session.user as any).id;
    const coupleId = await getSessionCoupleId(userId, (session.user as any).coupleId);
    if (!coupleId) return NextResponse.json([]);

    await connectDB();
    const answers = await MemoryChallenge.find({ coupleId }).sort({ questionId: 1 });
    return NextResponse.json(answers);
  } catch (err: any) {
    console.error('[memory-challenge GET]', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = (session.user as any).id;
    const userName = session.user.name ?? 'Partner';
    const coupleId = await getSessionCoupleId(userId, (session.user as any).coupleId);
    if (!coupleId) return NextResponse.json({ error: 'Not in a couple yet — please set up your couple space first' }, { status: 400 });

    const { questionId, answerIndex } = await req.json();
    await connectDB();

    const doc = await MemoryChallenge.findOneAndUpdate(
      { coupleId, questionId },
      { $setOnInsert: { coupleId, questionId } },
      { upsert: true, new: true }
    );
    const idx = doc.answers.findIndex((a: any) => a.userId === userId);
    if (idx >= 0) { doc.answers[idx].answerIndex = answerIndex; doc.answers[idx].userName = userName; }
    else { doc.answers.push({ userId, userName, answerIndex }); }
    await doc.save();
    return NextResponse.json(doc);
  } catch (err: any) {
    console.error('[memory-challenge PATCH]', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = (session.user as any).id;
    const coupleId = await getSessionCoupleId(userId, (session.user as any).coupleId);
    if (!coupleId) return NextResponse.json({ ok: true });

    await connectDB();
    await MemoryChallenge.updateMany({ coupleId }, { $set: { answers: [] } });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('[memory-challenge DELETE]', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
