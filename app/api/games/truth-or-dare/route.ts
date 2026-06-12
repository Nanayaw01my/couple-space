import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import TruthDareRound from '@/lib/models/TruthDareRound';
import Couple from '@/lib/models/Couple';
import { sendPushToUser } from '@/lib/push';
import { TRUTH_PROMPTS, DARE_PROMPTS } from '@/lib/questions';
import { getSessionCoupleId } from '@/lib/coupleId';

export const dynamic = 'force-dynamic';

function randomFrom(arr: string[]) { return arr[Math.floor(Math.random() * arr.length)]; }

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as any).id;
  const coupleId = await getSessionCoupleId(userId, (session.user as any).coupleId);
  if (!coupleId) return NextResponse.json({ current: null, history: [] });

  await connectDB();
  const current = await TruthDareRound.findOne({ coupleId, status: { $ne: 'done' } }).sort({ roundNumber: -1 });
  const history = await TruthDareRound.find({ coupleId, status: 'done' }).sort({ roundNumber: -1 }).limit(20);
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

    const couple = await Couple.findById(coupleId);
    const partnerId = couple?.members.find((m: any) => m.toString() !== userId)?.toString();

    if (body.action === 'start') {
      const existing = await TruthDareRound.findOne({ coupleId, status: { $ne: 'done' } });
      if (existing) return NextResponse.json({ error: 'Game already in progress' }, { status: 400 });
      if (!partnerId) return NextResponse.json({ error: 'Partner not joined yet' }, { status: 400 });
      const round = await TruthDareRound.create({
        coupleId, roundNumber: 1,
        askerId: userId, responderId: partnerId,
        askerName: session.user.name!, responderName: '',
        status: 'pending',
      });
      sendPushToUser(partnerId, { title: 'Truth or Dare 🎭', body: `${session.user.name} is challenging you — Truth or Dare?`, url: '/games/truth-or-dare', tag: 'tod' });
      return NextResponse.json(round);
    }

    if (body.action === 'pick') {
      const round = await TruthDareRound.findOne({ coupleId, status: 'pending' });
      if (!round) return NextResponse.json({ error: 'No active challenge' }, { status: 404 });
      if (round.responderId.toString() !== userId) return NextResponse.json({ error: 'Not your pick' }, { status: 403 });
      round.type = body.type;
      round.responderName = session.user.name!;
      round.status = 'composing';
      await round.save();
      sendPushToUser(round.askerId.toString(), { title: 'Truth or Dare 🎭', body: `${session.user.name} chose ${round.type === 'truth' ? '🔮 Truth' : '🔥 Dare'} — write your question!`, url: '/games/truth-or-dare', tag: 'tod' });
      return NextResponse.json(round);
    }

    if (body.action === 'send') {
      const round = await TruthDareRound.findOne({ coupleId, status: 'composing' });
      if (!round) return NextResponse.json({ error: 'No active round' }, { status: 404 });
      if (round.askerId.toString() !== userId) return NextResponse.json({ error: 'Not your turn' }, { status: 403 });
      const prompt = body.prompt?.trim();
      if (!prompt) return NextResponse.json({ error: 'Question cannot be empty' }, { status: 400 });
      round.prompt = prompt;
      round.status = 'answering';
      await round.save();
      sendPushToUser(round.responderId.toString(), { title: `${session.user.name} asks: ${round.type === 'truth' ? '🔮 Truth' : '🔥 Dare'}`, body: prompt, url: '/games/truth-or-dare', tag: 'tod' });
      return NextResponse.json(round);
    }

    if (body.action === 'respond') {
      const round = await TruthDareRound.findOne({ coupleId, status: 'answering' });
      if (!round) return NextResponse.json({ error: 'No active round' }, { status: 404 });
      if (round.responderId.toString() !== userId) return NextResponse.json({ error: 'Not your turn' }, { status: 403 });
      round.response = body.response;
      round.status = 'done';
      await round.save();
      const next = await TruthDareRound.create({
        coupleId, roundNumber: round.roundNumber + 1,
        askerId: round.responderId, responderId: round.askerId,
        askerName: round.responderName, responderName: round.askerName,
        status: 'pending',
      });
      sendPushToUser(round.askerId.toString(), { title: 'Truth or Dare 🎭', body: `${session.user.name} answered! Your turn to be challenged 🎴`, url: '/games/truth-or-dare', tag: 'tod' });
      return NextResponse.json({ completedRound: round, nextRound: next });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    console.error('[truth-or-dare POST]', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as any).id;
  const coupleId = await getSessionCoupleId(userId, (session.user as any).coupleId);
  if (!coupleId) return NextResponse.json({ ok: true });
  await connectDB();
  await TruthDareRound.deleteMany({ coupleId });
  return NextResponse.json({ ok: true });
}
