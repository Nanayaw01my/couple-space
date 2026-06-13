import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getISOWeek, getISOWeekYear, startOfWeek, endOfWeek, format } from 'date-fns';
import connectDB from '@/lib/mongodb';
import Reflection from '@/lib/models/Reflection';
import { getSessionCoupleId } from '@/lib/coupleId';

export const dynamic = 'force-dynamic';

function getWeekKey(date: Date) {
  const week = getISOWeek(date);
  const year = getISOWeekYear(date);
  return `${year}-W${String(week).padStart(2, '0')}`;
}

function getWeekLabel(date: Date) {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  const end = endOfWeek(date, { weekStartsOn: 1 });
  return `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`;
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as any).id as string;
  const coupleId = await getSessionCoupleId(userId, (session.user as any).coupleId);
  if (!coupleId) return NextResponse.json({ error: 'Not in a couple' }, { status: 400 });

  const { searchParams } = new URL(req.url);
  const week = searchParams.get('week') || getWeekKey(new Date());

  await connectDB();
  const all = await Reflection.find({ coupleId, week }).sort({ updatedAt: -1 });
  const mine = all.find((r: any) => r.userId === userId) ?? null;
  const partner = all.find((r: any) => r.userId !== userId) ?? null;
  return NextResponse.json({ mine, partner });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as any).id as string;
  const coupleId = await getSessionCoupleId(userId, (session.user as any).coupleId);
  if (!coupleId) return NextResponse.json({ error: 'Not in a couple' }, { status: 400 });

  const body = await req.json();
  const { week: bodyWeek, weekLabel: bodyWeekLabel, ...fields } = body;
  const now = new Date();
  const week = bodyWeek || getWeekKey(now);
  const weekLabel = bodyWeekLabel || getWeekLabel(now);

  await connectDB();
  const reflection = await Reflection.findOneAndUpdate(
    { coupleId, userId, week },
    { ...fields, coupleId, userId, userName: session.user.name, week, weekLabel, updatedAt: new Date() },
    { upsert: true, new: true }
  );
  return NextResponse.json(reflection);
}
