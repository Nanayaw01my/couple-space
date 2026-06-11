import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Note from '@/lib/models/Note';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const coupleId = (session.user as any).coupleId;
  if (!coupleId) return NextResponse.json([]);
  await connectDB();
  const notes = await Note.find({ coupleId }).sort({ createdAt: -1 }).limit(50);
  return NextResponse.json(notes);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as any).id;
  const coupleId = (session.user as any).coupleId;
  if (!coupleId) return NextResponse.json({ error: 'Not in a couple' }, { status: 400 });
  const { content, color } = await req.json();
  if (!content?.trim()) return NextResponse.json({ error: 'Empty note' }, { status: 400 });
  await connectDB();
  const note = await Note.create({ coupleId, authorId: userId, authorName: session.user.name, content: content.trim(), color: color || '#fff9db' });
  return NextResponse.json(note);
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as any).id;
  const { id } = await req.json();
  await connectDB();
  await Note.deleteOne({ _id: id, authorId: userId });
  return NextResponse.json({ ok: true });
}
