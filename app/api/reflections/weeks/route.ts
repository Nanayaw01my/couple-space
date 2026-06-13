import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Reflection from '@/lib/models/Reflection';
import { getSessionCoupleId } from '@/lib/coupleId';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as any).id as string;
  const coupleId = await getSessionCoupleId(userId, (session.user as any).coupleId);
  if (!coupleId) return NextResponse.json({ error: 'Not in a couple' }, { status: 400 });

  await connectDB();
  const weeks = await Reflection.aggregate([
    { $match: { coupleId: new mongoose.Types.ObjectId(coupleId) } },
    { $group: { _id: '$week', weekLabel: { $first: '$weekLabel' }, count: { $sum: 1 } } },
    { $sort: { _id: -1 } },
    { $limit: 20 },
  ]);
  return NextResponse.json(weeks);
}
