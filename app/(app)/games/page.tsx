import Link from 'next/link';

const GAMES = [
  { href: '/games/truth-or-dare', emoji: '🎭', title: 'Truth or Dare', desc: 'Challenge each other from anywhere', color: 'border-rose-100 bg-rose-50' },
  { href: '/games/this-or-that', emoji: '🤔', title: 'This or That', desc: 'Pick one — see if you match!', color: 'border-pink-100 bg-pink-50' },
  { href: '/games/never-have-i-ever', emoji: '🙈', title: 'Never Have I Ever', desc: 'Confess and see what your partner admits', color: 'border-purple-100 bg-purple-50' },
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
