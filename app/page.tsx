import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 py-16">
      <div className="max-w-sm w-full text-center">
        <div className="text-6xl mb-4 animate-heartbeat inline-block">💕</div>
        <h1 className="font-playfair text-4xl font-bold text-gray-900 mb-3">Couple Space</h1>
        <p className="text-gray-500 text-base mb-10 leading-relaxed">
          Your private space to chat, play games, and grow closer — just the two of you.
        </p>

        <div className="space-y-3">
          <Link href="/register" className="block w-full py-4 bg-rose-500 text-white rounded-2xl font-bold text-base shadow-lg shadow-rose-200 active:scale-95 transition-all text-center">
            Create Account
          </Link>
          <Link href="/login" className="block w-full py-4 border-2 border-gray-200 text-gray-700 rounded-2xl font-bold text-base active:scale-95 transition-all text-center">
            Sign In
          </Link>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-4 text-left">
          {[
            { emoji: '💬', title: 'Private Chat', desc: 'Message each other anytime' },
            { emoji: '🎭', title: 'Truth or Dare', desc: 'Play from anywhere' },
            { emoji: '📝', title: 'Shared Notes', desc: 'Leave little love notes' },
            { emoji: '😊', title: 'Mood Tracker', desc: 'Share how you feel daily' },
          ].map(f => (
            <div key={f.title} className="bg-gray-50 rounded-2xl p-4">
              <div className="text-2xl mb-1">{f.emoji}</div>
              <p className="font-bold text-gray-900 text-sm">{f.title}</p>
              <p className="text-gray-400 text-xs mt-0.5">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
