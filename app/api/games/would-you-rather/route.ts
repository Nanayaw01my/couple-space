import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import WouldYouRather from '@/lib/models/WouldYouRather';
import { WOULD_YOU_RATHER } from '@/lib/questions';
import { getSessionCoupleId } from '@/lib/coupleId';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as any).id;
  const coupleId = await getSessionCoupleId(userId, (session.user as any).coupleId);
  if (!coupleId) return NextResponse.json({ current: null, history: [] });

  await connectDB();
  const current = await WouldYouRather.findOne({ coupleId, status: 'picking' }).sort({ roundNumber: -1 });
  const history = await WouldYouRather.find({ coupleId, status: 'done' }).sort({ roundNumber: -1 }).limit(20);
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
      const existing = await WouldYouRather.findOne({ coupleId, status: 'picking' });
      if (existing) return NextResponse.json({ error: 'Round already in progress' }, { status: 400 });
      const count = await WouldYouRather.countDocuments({ coupleId });
      const promptIndex = count % WOULD_YOU_RATHER.length;
      const prompt = WOULD_YOU_RATHER[promptIndex];
      const round = await WouldYouRather.create({
        coupleId, roundNumber: count + 1, promptIndex,
        optionA: prompt.a, optionB: prompt.b, picks: [],
      });
      return NextResponse.json(round);
    }

    if (body.action === 'pick') {
      const round = await WouldYouRather.findOne({ coupleId, status: 'picking' });
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
    console.error('[would-you-rather POST]', err);
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
  await WouldYouRather.deleteMany({ coupleId });
  return NextResponse.json({ ok: true });
}
