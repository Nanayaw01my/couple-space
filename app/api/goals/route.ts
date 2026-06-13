import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import CoupleGoal from '@/lib/models/CoupleGoal';
import { getSessionCoupleId } from '@/lib/coupleId';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = (session.user as any).id;
    const tokenCoupleId = (session.user as any).coupleId;
    const coupleId = await getSessionCoupleId(userId, tokenCoupleId);
    if (!coupleId) return NextResponse.json([]);
    await connectDB();
    const goals = await CoupleGoal.find({ coupleId }).sort({ createdAt: 1 });
    return NextResponse.json(goals);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch goals' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = (session.user as any).id;
    const tokenCoupleId = (session.user as any).coupleId;
    const coupleId = await getSessionCoupleId(userId, tokenCoupleId);
    if (!coupleId) return NextResponse.json({ error: 'Not in a couple' }, { status: 400 });
    const { text } = await req.json();
    if (!text?.trim()) return NextResponse.json({ error: 'Goal text is required' }, { status: 400 });
    await connectDB();
    const goal = await CoupleGoal.create({
      coupleId,
      text: text.trim(),
      addedBy: userId,
      addedByName: session.user.name,
    });
    return NextResponse.json(goal);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create goal' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = (session.user as any).id;
    const tokenCoupleId = (session.user as any).coupleId;
    const coupleId = await getSessionCoupleId(userId, tokenCoupleId);
    if (!coupleId) return NextResponse.json({ error: 'Not in a couple' }, { status: 400 });
    const { goalId } = await req.json();
    if (!goalId) return NextResponse.json({ error: 'goalId is required' }, { status: 400 });
    await connectDB();
    const goal = await CoupleGoal.findOne({ _id: goalId, coupleId });
    if (!goal) return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    goal.completed = !goal.completed;
    goal.completedBy = goal.completed ? session.user.name : null;
    await goal.save();
    return NextResponse.json(goal);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to toggle goal' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = (session.user as any).id;
    const tokenCoupleId = (session.user as any).coupleId;
    const coupleId = await getSessionCoupleId(userId, tokenCoupleId);
    if (!coupleId) return NextResponse.json({ error: 'Not in a couple' }, { status: 400 });
    const { goalId } = await req.json();
    if (!goalId) return NextResponse.json({ error: 'goalId is required' }, { status: 400 });
    await connectDB();
    await CoupleGoal.deleteOne({ _id: goalId, coupleId, addedBy: userId });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to delete goal' }, { status: 500 });
  }
}
