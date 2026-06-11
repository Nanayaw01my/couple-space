'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

export default function PushSetup() {
  const { status } = useSession();
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (status !== 'authenticated') return;
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) return;
    const permission = Notification.permission;
    if (permission === 'granted') { registerPush(); return; }
    if (permission === 'denied') return;
    const key = 'push-prompt-shown';
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
    setShown(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  async function registerPush() {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      const { publicKey } = await fetch('/api/push/subscribe').then(r => r.json());
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(publicKey) });
      await fetch('/api/push/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(sub.toJSON()) });
    } catch { /* best-effort */ }
  }

  async function handleEnable() {
    setShown(false);
    const result = await Notification.requestPermission();
    if (result === 'granted') { await registerPush(); toast.success('Notifications enabled! 🔔'); }
  }

  if (!shown) return null;

  return (
    <div className="fixed top-16 left-4 right-4 z-50 max-w-sm mx-auto bg-white rounded-2xl shadow-2xl border border-rose-100 p-4">
      <div className="flex items-start gap-3">
        <div className="text-2xl flex-shrink-0">🔔</div>
        <div className="flex-1">
          <p className="font-bold text-gray-900 text-sm">Enable notifications?</p>
          <p className="text-gray-500 text-xs mt-0.5 leading-relaxed">Get notified when your partner messages you or it&apos;s your turn in a game.</p>
          <div className="flex gap-2 mt-3">
            <button onClick={handleEnable} className="flex-1 py-2 bg-rose-500 text-white text-xs font-bold rounded-xl active:scale-95 transition-all">Enable</button>
            <button onClick={() => setShown(false)} className="flex-1 py-2 border border-gray-200 text-gray-500 text-xs font-semibold rounded-xl active:scale-95 transition-all">Not now</button>
          </div>
        </div>
      </div>
    </div>
  );
}
