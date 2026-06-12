import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import PickANumber from '@/lib/models/PickANumber';
import { PICK_A_NUMBER_QUESTIONS } from '@/lib/questions';
import { getSessionCoupleId } from '@/lib/coupleId';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as any).id;
  const coupleId = await getSessionCoupleId(userId, (session.user as any).coupleId);
  if (!coupleId) return NextResponse.json({ picked: [] });

  await connectDB();
  const picked = await PickANumber.find({ coupleId }).sort({ number: 1 });
  return NextResponse.json({ picked });
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = (session.user as any).id;
    const coupleId = await getSessionCoupleId(userId, (session.user as any).coupleId);
    if (!coupleId) return NextResponse.json({ error: 'Not in a couple yet — please set up your couple space first' }, { status: 400 });

    const body = await req.json();
    await connectDB();

    if (body.action === 'pick') {
      const num = body.number;
      if (!num || num < 1 || num > 50) return NextResponse.json({ error: 'Invalid number' }, { status: 400 });
      const q = PICK_A_NUMBER_QUESTIONS.find(q => q.number === num);
      if (!q) return NextResponse.json({ error: 'Question not found' }, { status: 404 });
      const existing = await PickANumber.findOne({ coupleId, number: num });
      if (existing) return NextResponse.json(existing);
      const card = await PickANumber.create({
        coupleId, number: num, category: q.category, question: q.question, answers: [],
      });
      return NextResponse.json(card);
    }

    if (body.action === 'answer') {
      const card = await PickANumber.findOne({ coupleId, number: body.number });
      if (!card) return NextResponse.json({ error: 'Card not found' }, { status: 404 });
      if (card.status === 'done') return NextResponse.json(card);
      const already = card.answers.some((a: any) => a.userId.toString() === userId);
      if (already) return NextResponse.json(card);
      const text = body.text?.trim();
      if (!text) return NextResponse.json({ error: 'Answer cannot be empty' }, { status: 400 });
      card.answers.push({ userId, userName: session.user.name, text });
      if (card.answers.length >= 2) card.status = 'done';
      await card.save();
      return NextResponse.json(card);
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    console.error('[pick-a-number POST]', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as any).id;
  const coupleId = await getSessionCoupleId(userId, (session.user as any).coupleId);
  if (!coupleId) return NextResponse.json({ ok: true });
  await connectDB();
  await PickANumber.deleteMany({ coupleId });
  return NextResponse.json({ ok: true });
}
