import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import NeverHaveIEver from '@/lib/models/NeverHaveIEver';
import { NEVER_HAVE_I_EVER } from '@/lib/questions';
import { getSessionCoupleId } from '@/lib/coupleId';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as any).id;
  const coupleId = await getSessionCoupleId(userId, (session.user as any).coupleId);
  if (!coupleId) return NextResponse.json({ current: null, history: [] });

  await connectDB();
  const current = await NeverHaveIEver.findOne({ coupleId, status: 'answering' }).sort({ roundNumber: -1 });
  const history = await NeverHaveIEver.find({ coupleId, status: 'done' }).sort({ roundNumber: -1 }).limit(20);
  return NextResponse.json({ current, history });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as any).id;
  const coupleId = await getSessionCoupleId(userId, (session.user as any).coupleId);
  if (!coupleId) return NextResponse.json({ error: 'Not in a couple yet — please set up your couple space first' }, { status: 400 });

  const body = await req.json();
  await connectDB();

  if (body.action === 'start') {
    const existing = await NeverHaveIEver.findOne({ coupleId, status: 'answering' });
    if (existing) return NextResponse.json({ error: 'Round already in progress' }, { status: 400 });
    const count = await NeverHaveIEver.countDocuments({ coupleId });
    const promptIndex = count % NEVER_HAVE_I_EVER.length;
    const round = await NeverHaveIEver.create({
      coupleId, roundNumber: count + 1, promptIndex,
      statement: NEVER_HAVE_I_EVER[promptIndex], answers: [],
    });
    return NextResponse.json(round);
  }

  if (body.action === 'answer') {
    const round = await NeverHaveIEver.findOne({ coupleId, status: 'answering' });
    if (!round) return NextResponse.json({ error: 'No active round' }, { status: 404 });
    const already = round.answers.some((a: any) => a.userId.toString() === userId);
    if (already) return NextResponse.json({ error: 'Already answered' }, { status: 400 });
    round.answers.push({ userId, userName: session.user.name, have: body.have });
    if (round.answers.length >= 2) round.status = 'done';
    await round.save();
    return NextResponse.json(round);
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}

export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as any).id;
  const coupleId = await getSessionCoupleId(userId, (session.user as any).coupleId);
  if (!coupleId) return NextResponse.json({ ok: true });
  await connectDB();
  await NeverHaveIEver.deleteMany({ coupleId });
  return NextResponse.json({ ok: true });
}
