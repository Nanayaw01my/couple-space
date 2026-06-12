import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import ThisOrThat from '@/lib/models/ThisOrThat';
import { THIS_OR_THAT } from '@/lib/questions';
import { getSessionCoupleId } from '@/lib/coupleId';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as any).id;
  const coupleId = await getSessionCoupleId(userId, (session.user as any).coupleId);
  if (!coupleId) return NextResponse.json({ current: null, history: [] });

  await connectDB();
  const current = await ThisOrThat.findOne({ coupleId, status: 'picking' }).sort({ roundNumber: -1 });
  const history = await ThisOrThat.find({ coupleId, status: 'done' }).sort({ roundNumber: -1 }).limit(20);
  return NextResponse.json({ current, history });
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

    if (body.action === 'start') {
      const existing = await ThisOrThat.findOne({ coupleId, status: 'picking' });
      if (existing) return NextResponse.json({ error: 'Round already in progress' }, { status: 400 });
      const count = await ThisOrThat.countDocuments({ coupleId });
      const promptIndex = count % THIS_OR_THAT.length;
      const prompt = THIS_OR_THAT[promptIndex];
      const round = await ThisOrThat.create({
        coupleId, roundNumber: count + 1, promptIndex,
        thisOption: prompt.this, thatOption: prompt.that, picks: [],
      });
      return NextResponse.json(round);
    }

    if (body.action === 'pick') {
      const round = await ThisOrThat.findOne({ coupleId, status: 'picking' });
      if (!round) return NextResponse.json({ error: 'No active round' }, { status: 404 });
      const alreadyPicked = round.picks.some((p: any) => p.userId.toString() === userId);
      if (alreadyPicked) return NextResponse.json({ error: 'Already picked' }, { status: 400 });
      round.picks.push({ userId, userName: session.user.name, pick: body.pick });
      if (round.picks.length >= 2) round.status = 'done';
      await round.save();
      return NextResponse.json(round);
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    console.error('[this-or-that POST]', err);
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
  await ThisOrThat.deleteMany({ coupleId });
  return NextResponse.json({ ok: true });
}
