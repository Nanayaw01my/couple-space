import webpush from 'web-push';
import connectDB from './mongodb';
import PushSub from './models/PushSubscription';

const VAPID_PUBLIC  = process.env.VAPID_PUBLIC_KEY  || 'BJipe0kUR_qAJw80iBccEDyfBdOanfskizTqphXq2v5iBCHH-40EakLBB6LnkfrJM4tlYK8yWq3Cah_KlPHtIAM';
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY || 'HqN0mb_YEpRH9uo-74vZ_NfmdvuQEFyg4iZzaTLwgb0';

webpush.setVapidDetails('mailto:noreply@couplespace.app', VAPID_PUBLIC, VAPID_PRIVATE);
export { VAPID_PUBLIC };

export async function sendPushToUser(userId: string, payload: { title: string; body: string; url?: string; tag?: string }) {
  try {
    await connectDB();
    const subs = await PushSub.find({ userId });
    const stale: string[] = [];
    await Promise.allSettled(subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth } },
          JSON.stringify(payload)
        );
      } catch (err: any) {
        if (err?.statusCode === 410 || err?.statusCode === 404) stale.push(sub.endpoint);
      }
    }));
    if (stale.length > 0) await PushSub.deleteMany({ endpoint: { $in: stale } });
  } catch { /* best-effort */ }
}
