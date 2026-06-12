'use client';
import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import { PICK_A_NUMBER_QUESTIONS } from '@/lib/questions';
import { playPick, playReveal } from '@/lib/sounds';

const CATEGORY_COLORS: Record<string, string> = {
  Romantic: 'bg-rose-100 text-rose-700',
  Deep: 'bg-blue-100 text-blue-700',
  Appreciation: 'bg-amber-100 text-amber-700',
  Future: 'bg-emerald-100 text-emerald-700',
  Funny: 'bg-yellow-100 text-yellow-700',
  Growth: 'bg-purple-100 text-purple-700',
};

interface Card {
  _id: string;
  number: number;
  category: string;
  question: string;
  answers: { userId: string; userName: string; text: string }[];
  status: 'open' | 'done';
}

export default function PickANumberPage() {
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id as string;

  const [picked, setPicked] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCard, setActiveCard] = useState<Card | null>(null);
  const [answerText, setAnswerText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchState = useCallback(async () => {
    try {
      const res = await fetch('/api/games/pick-a-number').catch(() => null);
      if (!res?.ok) { setLoading(false); return; }
      const data = await res.json();
      setPicked(data.picked ?? []);
      setLoading(false);
    } catch { setLoading(false); }
  }, []);

  useEffect(() => { fetchState(); const t = setInterval(fetchState, 4000); return () => clearInterval(t); }, [fetchState]);

  useEffect(() => {
    if (activeCard) {
      const updated = picked.find(c => c.number === activeCard.number);
      if (updated) setActiveCard(updated);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [picked]);

  async function pickNumber(num: number) {
    playPick();
    setSubmitting(true);
    try {
      const res = await fetch('/api/games/pick-a-number', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'pick', number: num }),
      });
      let data: any = {};
      try { data = await res.json(); } catch {}
      if (!res.ok) { toast.error(data.error || 'Error'); return; }
      await fetchState();
      setActiveCard(data);
      setAnswerText('');
    } catch { toast.error('Network error'); } finally { setSubmitting(false); }
  }

  async function submitAnswer() {
    if (!activeCard || !answerText.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/games/pick-a-number', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'answer', number: activeCard.number, text: answerText }),
      });
      let data: any = {};
      try { data = await res.json(); } catch {}
      if (!res.ok) { toast.error(data.error || 'Error'); return; }
      if (data.status === 'done') playReveal();
      setActiveCard(data);
      setAnswerText('');
      await fetchState();
    } catch { toast.error('Network error'); } finally { setSubmitting(false); }
  }

  if (loading || !userId) return <div className="flex items-center justify-center min-h-[60vh]"><div className="text-4xl animate-pulse">🎰</div></div>;

  const pickedMap = new Map(picked.map(c => [c.number, c]));
  const answeredCount = picked.filter(c => c.status === 'done').length;

  return (
    <div className="px-4 py-5 max-w-lg mx-auto pb-10">
      <div className="mb-4">
        <div className="inline-block bg-teal-100 text-teal-700 text-xs font-bold px-3 py-1 rounded-full mb-2 tracking-wider uppercase">Game</div>
        <h1 className="font-playfair text-3xl font-bold text-gray-900">Pick a Number 🎰</h1>
        <p className="text-gray-500 text-sm mt-1">Tap a number — a question appears. Answer honestly!</p>
        <p className="text-xs text-teal-600 font-medium mt-1">{answeredCount}/50 answered</p>
      </div>

      {/* Active card modal */}
      {activeCard && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <span className="text-3xl font-black text-gray-200">#{activeCard.number}</span>
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${CATEGORY_COLORS[activeCard.category] || 'bg-gray-100 text-gray-700'}`}>{activeCard.category}</span>
            </div>
            <p className="font-playfair text-lg font-semibold text-gray-900 italic leading-snug mb-5">&ldquo;{activeCard.question}&rdquo;</p>

            {(() => {
              const myA = activeCard.answers.find(a => a.userId === userId);
              const partnerA = activeCard.answers.find(a => a.userId !== userId);
              return (
                <div className="space-y-3">
                  {myA ? (
                    <div className="bg-teal-50 rounded-2xl p-3 border border-teal-100">
                      <p className="text-xs font-bold text-gray-400 uppercase mb-1">Your answer</p>
                      <p className="text-gray-800 text-sm">{myA.text}</p>
                    </div>
                  ) : (
                    <div>
                      <textarea value={answerText} onChange={e => setAnswerText(e.target.value)} rows={2}
                        placeholder="Your answer..." className="w-full px-3 py-2 rounded-xl border border-teal-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-200 mb-2" />
                      <button onClick={submitAnswer} disabled={submitting || !answerText.trim()}
                        className="w-full py-3 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-2xl font-bold text-sm disabled:opacity-50 active:scale-95 transition-all">
                        Submit Answer ✓
                      </button>
                    </div>
                  )}
                  {partnerA ? (
                    <div className="bg-gray-50 rounded-2xl p-3 border border-gray-100">
                      <p className="text-xs font-bold text-gray-400 uppercase mb-1">{partnerA.userName}&apos;s answer</p>
                      <p className="text-gray-800 text-sm">{partnerA.text}</p>
                    </div>
                  ) : myA ? (
                    <div className="text-center py-2">
                      <p className="text-gray-400 text-xs">Waiting for partner...</p>
                      <div className="flex justify-center gap-1 mt-1">{[0,150,300].map(d => <span key={d} className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce" style={{animationDelay:`${d}ms`}} />)}</div>
                    </div>
                  ) : null}
                </div>
              );
            })()}

            <button onClick={() => setActiveCard(null)} className="mt-4 w-full py-2 text-sm text-gray-400 hover:text-gray-600 transition-colors">
              Close
            </button>
          </div>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-5 gap-2 sm:gap-3">
        {PICK_A_NUMBER_QUESTIONS.map(q => {
          const card = pickedMap.get(q.number);
          const isDone = card?.status === 'done';
          const isOpen = card?.status === 'open';
          return (
            <button key={q.number}
              onClick={() => { if (card) { setActiveCard(card); } else { pickNumber(q.number); } }}
              disabled={submitting}
              className={`aspect-square rounded-2xl font-black text-lg transition-all active:scale-90 flex items-center justify-center
                ${isDone ? 'bg-teal-500 text-white shadow-md' :
                  isOpen ? 'bg-amber-400 text-white shadow-md animate-pulse' :
                  'bg-white border-2 border-gray-100 text-gray-700 hover:border-teal-200 shadow-sm'}`}>
              {q.number}
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex gap-3 text-xs text-gray-500 justify-center">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-white border-2 border-gray-200 inline-block" /> Not picked</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-400 inline-block" /> Answering</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-teal-500 inline-block" /> Done</span>
      </div>

      {answeredCount === 50 && (
        <div className="mt-8 text-center">
          <p className="text-2xl mb-2">🎉</p>
          <p className="font-bold text-gray-900">You&apos;ve answered all 50 questions!</p>
          <button onClick={async () => {
            if (!confirm('Reset all cards?')) return;
            await fetch('/api/games/pick-a-number', { method: 'DELETE' });
            setPicked([]); toast.success('Game reset!');
          }} className="mt-3 text-xs text-gray-400 hover:text-red-400 underline">Reset Game</button>
        </div>
      )}
    </div>
  );
}
