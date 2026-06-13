'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { Home, Gamepad2, MessageCircle, MessageSquare, Smile, LogOut, Image, MessageCircleHeart } from 'lucide-react';
import PushSetup from '@/components/PushSetup';
import CallManager from '@/components/CallManager';

const NAV = [
  { href: '/dashboard', icon: Home, label: 'Home' },
  { href: '/chat', icon: MessageCircle, label: 'Chat' },
  { href: '/games', icon: Gamepad2, label: 'Games' },
  { href: '/memories', icon: Image, label: 'Memories' },
  { href: '/mood', icon: Smile, label: 'Mood' },
  { href: '/daily-talk', icon: MessageCircleHeart, label: 'Daily' },
  { href: '/notes', icon: MessageSquare, label: 'Notes' },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <PushSetup />
      <header className="fixed top-0 left-0 right-0 z-40 glass border-b border-white/60 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg animate-heartbeat inline-block">💕</span>
          <span className="font-playfair font-bold text-gray-900 text-base">Couple Space</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            {session?.user?.name || '—'}
          </span>
          <button onClick={() => signOut({ callbackUrl: '/' })} className="p-2 rounded-full hover:bg-gray-100 transition-all">
            <LogOut size={16} className="text-gray-500" />
          </button>
        </div>
      </header>

      <main className="flex-1 pt-14 pb-nav">{children}</main>

      <nav className="fixed bottom-0 left-0 right-0 z-40 glass border-t border-white/60 safe-area-inset-bottom">
        <div className="flex items-center justify-around px-2 py-2">
          {NAV.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
            return (
              <Link key={href} href={href} className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all ${active ? 'text-rose-500' : 'text-gray-400'}`}>
                <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
                <span className={active ? 'text-[10px] font-bold' : 'text-[10px] font-medium'}>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
      <CallManager />
    </div>
  );
}
