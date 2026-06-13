import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Memory from '@/lib/models/Memory';
import { getSessionCoupleId } from '@/lib/coupleId';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as any).id as string;
  const coupleId = await getSessionCoupleId(userId, (session.user as any).coupleId);
  if (!coupleId) return NextResponse.json({ error: 'Not in a couple' }, { status: 400 });
  await connectDB();
  const memories = await Memory.find({ coupleId }).sort({ date: -1 }).limit(50);
  return NextResponse.json(memories);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as any).id as string;
  const coupleId = await getSessionCoupleId(userId, (session.user as any).coupleId);
  if (!coupleId) return NextResponse.json({ error: 'Not in a couple' }, { status: 400 });

  const { title, caption, imageData, date } = await req.json();
  if (!title?.trim()) return NextResponse.json({ error: 'Title required' }, { status: 400 });

  await connectDB();
  const memory = await Memory.create({
    coupleId,
    uploadedBy: userId,
    uploadedByName: session.user.name,
    title: title.trim(),
    caption: caption?.trim() || '',
    imageData: imageData || '',
    date: date ? new Date(date) : new Date(),
  });
  return NextResponse.json(memory, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as any).id as string;
  const coupleId = await getSessionCoupleId(userId, (session.user as any).coupleId);
  if (!coupleId) return NextResponse.json({ error: 'Not in a couple' }, { status: 400 });

  const { id } = await req.json();
  await connectDB();
  // Only delete if this memory belongs to the couple
  await Memory.deleteOne({ _id: id, coupleId });
  return NextResponse.json({ ok: true });
}
