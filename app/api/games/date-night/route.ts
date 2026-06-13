import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import SavedDate from '@/lib/models/SavedDate';
import { getSessionCoupleId } from '@/lib/coupleId';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = (session.user as any).id;
    const coupleId = await getSessionCoupleId(userId, (session.user as any).coupleId);
    if (!coupleId) return NextResponse.json([]);

    await connectDB();
    const saved = await SavedDate.find({ coupleId }).sort({ createdAt: -1 });
    return NextResponse.json(saved);
  } catch (err: any) {
    console.error('[date-night GET]', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = (session.user as any).id;
    const userName = session.user.name ?? 'Partner';
    const coupleId = await getSessionCoupleId(userId, (session.user as any).coupleId);
    if (!coupleId) return NextResponse.json({ error: 'Not in a couple yet — please set up your couple space first' }, { status: 400 });

    const { ideaId, idea, category, emoji } = await req.json();
    await connectDB();

    const existing = await SavedDate.findOne({ coupleId, ideaId });
    if (existing) return NextResponse.json({ error: 'Already saved' }, { status: 400 });

    const saved = await SavedDate.create({
      coupleId, ideaId, idea, category, emoji,
      savedBy: userId,
      savedByName: userName,
    });
    return NextResponse.json(saved, { status: 201 });
  } catch (err: any) {
    console.error('[date-night POST]', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = (session.user as any).id;
    const coupleId = await getSessionCoupleId(userId, (session.user as any).coupleId);
    if (!coupleId) return NextResponse.json({ error: 'Not in a couple' }, { status: 400 });

    const { id, completed, scheduledFor } = await req.json();
    await connectDB();

    const update: any = {};
    if (completed !== undefined) update.completed = completed;
    if (scheduledFor !== undefined) update.scheduledFor = scheduledFor;

    const d = await SavedDate.findOneAndUpdate(
      { _id: id, coupleId },
      { $set: update },
      { new: true }
    );
    if (!d) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(d);
  } catch (err: any) {
    console.error('[date-night PATCH]', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = (session.user as any).id;
    const coupleId = await getSessionCoupleId(userId, (session.user as any).coupleId);
    if (!coupleId) return NextResponse.json({ error: 'Not in a couple' }, { status: 400 });

    const { id } = await req.json();
    await connectDB();
    await SavedDate.findOneAndDelete({ _id: id, coupleId });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('[date-night DELETE]', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
