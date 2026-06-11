import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import Couple from '@/lib/models/Couple';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

// GET: get current couple info
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const coupleId = (session.user as any).coupleId;
  if (!coupleId) return NextResponse.json({ couple: null, partner: null });

  await connectDB();
  const couple = await Couple.findById(coupleId);
  if (!couple) return NextResponse.json({ couple: null, partner: null });

  const userId = (session.user as any).id;
  const partnerId = couple.members.find((m: any) => m.toString() !== userId);
  const partner = partnerId ? await User.findById(partnerId).select('name email') : null;

  return NextResponse.json({ couple, partner });
}

// POST: create a couple (first user, generates invite code)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as any).id;

  await connectDB();
  const user = await User.findById(userId);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  if (user.coupleId) return NextResponse.json({ error: 'Already in a couple' }, { status: 400 });

  const body = await req.json();
  const inviteCode = crypto.randomBytes(4).toString('hex').toUpperCase();
  const couple = await Couple.create({ members: [userId], inviteCode, startDate: body.startDate || null });
  user.coupleId = couple._id;
  await user.save();

  return NextResponse.json({ couple, inviteCode });
}

// PATCH: update couple start date
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const coupleId = (session.user as any).coupleId;
  if (!coupleId) return NextResponse.json({ error: 'No couple' }, { status: 400 });

  const body = await req.json();
  await connectDB();
  const couple = await Couple.findByIdAndUpdate(coupleId, { startDate: body.startDate }, { new: true });
  return NextResponse.json(couple);
}
