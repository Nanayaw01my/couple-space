import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import PushSub from '@/lib/models/PushSubscription';
import { VAPID_PUBLIC } from '@/lib/push';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ publicKey: VAPID_PUBLIC });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as any).id;
  const { endpoint, keys } = await req.json();
  if (!endpoint || !keys?.p256dh || !keys?.auth) return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 });
  await connectDB();
  await PushSub.findOneAndUpdate({ endpoint }, { userId, endpoint, keys }, { upsert: true, new: true });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  if (body.endpoint) { await connectDB(); await PushSub.deleteOne({ endpoint: body.endpoint }); }
  return NextResponse.json({ ok: true });
}
