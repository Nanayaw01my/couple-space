'use client';
import { useSession } from 'next-auth/react';
import { useEffect, useState, useCallback } from 'react';
import { format, differenceInDays } from 'date-fns';
import Link from 'next/link';
import { MessageCircle, Gamepad2, Smile, MessageSquare } from 'lucide-react';

export default function DashboardPage() {
  const { data: session } = useSession();
  const [couple, setCouple] = useState<any>(null);
  const [partner, setPartner] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const fetchCouple = useCallback(async () => {
    const res = await fetch('/api/couple').catch(() => null);
    if (!res?.ok) return;
    const d = await res.json();
    setCouple(d.couple);
    setPartner(d.partner);
  }, []);

  useEffect(() => {
    fetchCouple();
    // Poll every 5 seconds so page updates the moment partner joins
    const t = setInterval(fetchCouple, 5000);
    return () => clearInterval(t);
  }, [fetchCouple]);

  const coupleId = (session?.user as any)?.coupleId;
  const startDate = couple?.startDate ? new Date(couple.startDate) : null;
  const daysTogether = startDate ? differenceInDays(new Date(), startDate) : null;

  return (
    <div className="px-4 py-5 max-w-lg mx-auto space-y-5">
      {/* Hero */}
      <div className="rounded-3xl p-6 text-white relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #f43f5e 0%, #be185d 50%, #000000 100%)' }}>
        <div className="absolute top-0 right-0 text-8xl opacity-10 select-none">💕</div>
        <p className="text-white/70 text-sm font-medium mb-1">Welcome back,</p>
        <h1 className="font-playfair text-3xl font-bold mb-1">{session?.user?.name} 💕</h1>
        {partner ? (
          <p className="text-white/80 text-sm">with {partner.name}</p>
        ) : (
          <p className="text-white/60 text-sm italic">Waiting for your partner to join...</p>
        )}
        {startDate && (
          <div className="mt-4 bg-white/15 rounded-2xl px-4 py-3 inline-block">
            <p className="text-xs text-white/70 font-medium">Together since {format(startDate, 'MMM d, yyyy')}</p>
            <p className="text-2xl font-bold">{daysTogether} days 🥰</p>
          </div>
        )}
      </div>

      {/* No partner yet — show invite code */}
      {!partner && couple?.inviteCode && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4">
          <p className="text-sm font-bold text-gray-800 mb-1">Share this code with your partner:</p>
          <div className="flex items-center gap-3">
            <span className="font-mono text-2xl font-bold text-rose-500 tracking-widest">{couple.inviteCode}</span>
            <button
              onClick={() => { navigator.clipboard.writeText(couple.inviteCode); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
              className="ml-auto px-3 py-1.5 bg-rose-500 text-white text-xs font-bold rounded-lg active:scale-95 transition-all"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2">They enter this code when they sign up to join your space.</p>
        </div>
      )}

      {/* No couple yet */}
      {!coupleId && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
          <div className="text-4xl mb-2">💑</div>
          <p className="font-bold text-gray-900 mb-1">Set up your space</p>
          <p className="text-gray-500 text-sm mb-4">Create a couple space or join your partner&apos;s.</p>
          <Link href="/setup" className="inline-block px-6 py-3 bg-rose-500 text-white rounded-xl font-bold text-sm">
            Get Started
          </Link>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { href: '/chat', icon: MessageCircle, label: 'Chat', color: 'bg-rose-50 border-rose-100', iconColor: 'text-rose-500' },
          { href: '/games/truth-or-dare', icon: Gamepad2, label: 'Truth or Dare', color: 'bg-gray-50 border-gray-100', iconColor: 'text-gray-700' },
          { href: '/mood', icon: Smile, label: 'Mood', color: 'bg-pink-50 border-pink-100', iconColor: 'text-pink-500' },
          { href: '/notes', icon: MessageSquare, label: 'Notes', color: 'bg-yellow-50 border-yellow-100', iconColor: 'text-yellow-600' },
        ].map(a => (
          <Link key={a.href} href={a.href} className={`${a.color} border rounded-2xl p-4 flex items-center gap-3 active:scale-95 transition-all`}>
            <a.icon size={20} className={a.iconColor} />
            <span className="font-semibold text-gray-800 text-sm">{a.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
