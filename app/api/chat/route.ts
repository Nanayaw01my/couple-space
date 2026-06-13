import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import ChatMessage from '@/lib/models/ChatMessage';
import Couple from '@/lib/models/Couple';
import { sendPushToUser } from '@/lib/push';
import { getSessionCoupleId } from '@/lib/coupleId';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as any).id;
  const coupleId = await getSessionCoupleId(userId, (session.user as any).coupleId);
  if (!coupleId) return NextResponse.json([]);

  await connectDB();
  const messages = await ChatMessage.find({ coupleId }).sort({ createdAt: 1 }).limit(100);
  return NextResponse.json(messages);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as any).id;
  const coupleId = (session.user as any).coupleId;
  if (!coupleId) return NextResponse.json({ error: 'Not in a couple yet' }, { status: 400 });

  const { content, type, audioData } = await req.json();

  await connectDB();

  if (type === 'audio') {
    if (!audioData) return NextResponse.json({ error: 'No audio data' }, { status: 400 });
    const msg = await ChatMessage.create({
      coupleId, senderId: userId, senderName: session.user.name,
      content: '🎤 Voice message', type: 'audio', audioData,
    });
    const couple = await Couple.findById(coupleId);
    const partnerId = couple?.members.find((m: any) => m.toString() !== userId)?.toString();
    if (partnerId) {
      sendPushToUser(partnerId, { title: `${session.user.name} 🎤`, body: 'Sent a voice message', url: '/chat', tag: 'chat' });
    }
    return NextResponse.json(msg);
  }

  if (!content?.trim()) return NextResponse.json({ error: 'Empty message' }, { status: 400 });

  const msg = await ChatMessage.create({
    coupleId,
    senderId: userId,
    senderName: session.user.name,
    content: content.trim(),
  });

  // Notify partner
  const couple = await Couple.findById(coupleId);
  const partnerId = couple?.members.find((m: any) => m.toString() !== userId)?.toString();
  if (partnerId) {
    const preview = content.trim().length > 60 ? content.trim().slice(0, 60) + '…' : content.trim();
    sendPushToUser(partnerId, { title: `${session.user.name} 💬`, body: preview, url: '/chat', tag: 'chat' });
  }

  return NextResponse.json(msg);
}

// Edit own text message
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as any).id;
  const coupleId = await getSessionCoupleId(userId, (session.user as any).coupleId);
  if (!coupleId) return NextResponse.json({ error: 'Not in a couple' }, { status: 400 });
  const { messageId, content } = await req.json();
  if (!messageId || !content?.trim()) return NextResponse.json({ error: 'Invalid' }, { status: 400 });
  await connectDB();
  const msg = await ChatMessage.findOne({ _id: messageId, coupleId });
  if (!msg) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (msg.senderId.toString() !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  msg.content = content.trim();
  msg.edited = true;
  await msg.save();
  return NextResponse.json(msg);
}

// Delete a message (own) — POST body { messageId }
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as any).id;
  const coupleId = await getSessionCoupleId(userId, (session.user as any).coupleId);

  let body: any = null;
  try { body = await req.json(); } catch {}

  if (body?.messageId) {
    if (!coupleId) return NextResponse.json({ error: 'Not in a couple' }, { status: 400 });
    await connectDB();
    const msg = await ChatMessage.findOne({ _id: body.messageId, coupleId });
    if (!msg) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (msg.senderId.toString() !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    await msg.deleteOne();
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'messageId required' }, { status: 400 });
}
