import Link from 'next/link';

const GAMES = [
  {
    href: '/love-jar',
    emoji: '🫙',
    title: 'Love Jar',
    desc: 'Leave secret love notes. Your partner opens them one by one.',
    badge: 'Love Notes',
    color: 'border-rose-200 bg-gradient-to-br from-rose-50 to-red-50',
  },
  {
    href: '/goals',
    emoji: '💫',
    title: 'Couple Goals',
    desc: 'Your shared bucket list — tick off adventures and dreams together.',
    badge: 'Bucket List',
    color: 'border-pink-200 bg-gradient-to-br from-pink-50 to-fuchsia-50',
  },
  { href: '/games/truth-or-dare', emoji: '🎭', title: 'Truth or Dare', desc: 'Challenge each other from anywhere', color: 'border-rose-100 bg-rose-50' },
  { href: '/games/this-or-that', emoji: '🤔', title: 'This or That', desc: 'Pick one — see if you match!', color: 'border-pink-100 bg-pink-50' },
  { href: '/games/would-you-rather', emoji: '🤯', title: 'Would You Rather', desc: 'Make impossible choices together', color: 'border-indigo-100 bg-indigo-50' },
  { href: '/games/never-have-i-ever', emoji: '🙈', title: 'Never Have I Ever', desc: 'Confess and see what your partner admits', color: 'border-purple-100 bg-purple-50' },
  { href: '/games/open-questions', emoji: '💬', title: 'Open Questions', desc: 'Answer honestly, then compare!', color: 'border-amber-100 bg-amber-50' },
  { href: '/games/pick-a-number', emoji: '🎰', title: 'Pick a Number', desc: '50 cards, 50 questions, endless conversations', color: 'border-teal-100 bg-teal-50' },
];

export default function GamesPage() {
  return (
    <div className="px-4 py-5 max-w-lg mx-auto">
      <div className="mb-6">
        <div className="inline-block bg-rose-100 text-rose-600 text-xs font-bold px-3 py-1 rounded-full mb-2 tracking-wider uppercase">Games</div>
        <h1 className="font-playfair text-3xl font-bold text-gray-900">Play Together 🎮</h1>
        <p className="text-gray-500 text-sm mt-1">Fun games to keep things exciting.</p>
      </div>
      <div className="space-y-3">
        {GAMES.map(g => (
          <Link key={g.href} href={g.href} className={`flex items-center gap-4 rounded-2xl border ${g.color} shadow-sm p-5 active:scale-95 transition-all`}>
            <span className="text-4xl">{g.emoji}</span>
            <div>
              <p className="font-bold text-gray-900">{g.title}</p>
              <p className="text-gray-500 text-sm">{g.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
