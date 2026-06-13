import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import LoveNote from '@/lib/models/LoveNote';
import { getSessionCoupleId } from '@/lib/coupleId';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as any).id;
  const tokenCoupleId = (session.user as any).coupleId;
  const coupleId = await getSessionCoupleId(userId, tokenCoupleId);
  if (!coupleId) return NextResponse.json({ myNotes: [], partnerNotes: [] });
  await connectDB();
  const all = await LoveNote.find({ coupleId }).sort({ createdAt: 1 });
  const myNotes = all.filter((n: any) => n.senderId.toString() === userId);
  const partnerNotes = all.filter((n: any) => n.senderId.toString() !== userId);
  return NextResponse.json({ myNotes, partnerNotes });
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = (session.user as any).id;
    const tokenCoupleId = (session.user as any).coupleId;
    const coupleId = await getSessionCoupleId(userId, tokenCoupleId);
    if (!coupleId) return NextResponse.json({ error: 'Not in a couple' }, { status: 400 });
    const { message } = await req.json();
    if (!message?.trim()) return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    await connectDB();
    const note = await LoveNote.create({
      coupleId,
      senderId: userId,
      senderName: session.user.name,
      message: message.trim(),
    });
    return NextResponse.json(note);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create note' }, { status: 500 });
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
    const { noteId } = await req.json();
    if (!noteId) return NextResponse.json({ error: 'noteId is required' }, { status: 400 });
    await connectDB();
    const note = await LoveNote.findOneAndUpdate(
      { _id: noteId, coupleId, senderId: { $ne: userId }, opened: false },
      { opened: true, openedAt: new Date() },
      { new: true }
    );
    if (!note) return NextResponse.json({ error: 'Note not found or already opened' }, { status: 404 });
    return NextResponse.json(note);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to open note' }, { status: 500 });
  }
}
