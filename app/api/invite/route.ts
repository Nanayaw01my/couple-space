import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import Couple from '@/lib/models/Couple';

export const dynamic = 'force-dynamic';

// GET: look up invite code details (public — no auth needed)
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  if (!code) return NextResponse.json({ error: 'Missing code' }, { status: 400 });

  await connectDB();
  const couple = await Couple.findOne({ inviteCode: code.toUpperCase() });
  if (!couple) return NextResponse.json({ error: 'Invalid invite code' }, { status: 404 });
  if (couple.members.length >= 2) return NextResponse.json({ error: 'Couple already full' }, { status: 400 });

  const creator = await User.findById(couple.members[0]).select('name');
  return NextResponse.json({ valid: true, creatorName: creator?.name });
}

// POST: join a couple using invite code
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as any).id;

  const body = await req.json();
  const code = body.code?.toUpperCase();
  if (!code) return NextResponse.json({ error: 'Missing invite code' }, { status: 400 });

  await connectDB();
  const user = await User.findById(userId);
  if (user.coupleId) return NextResponse.json({ error: 'You are already in a couple' }, { status: 400 });

  const couple = await Couple.findOne({ inviteCode: code });
  if (!couple) return NextResponse.json({ error: 'Invalid invite code' }, { status: 404 });
  if (couple.members.length >= 2) return NextResponse.json({ error: 'This couple is already full' }, { status: 400 });
  if (couple.members[0].toString() === userId) return NextResponse.json({ error: 'You cannot join your own invite' }, { status: 400 });

  // Use $set/$unset to atomically update the couple
  await Couple.findByIdAndUpdate(couple._id, {
    $push: { members: userId },
    $unset: { inviteCode: 1 },
  });

  user.coupleId = couple._id;
  await user.save();

  return NextResponse.json({ ok: true, coupleId: couple._id });
}
