'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { GUESS_PARTNER_QUESTIONS } from '@/lib/questions';
import toast from 'react-hot-toast';
import { RotateCcw } from 'lucide-react';

export default function GuessPartnerPage() {
  const { data: session } = useSession();
  const [dbAnswers, setDbAnswers] = useState<any[]>([]);
  const [idx, setIdx] = useState(0);
  const [saving, setSaving] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const userId = (session?.user as any)?.id as string;
  const userName = session?.user?.name ?? 'You';

  useEffect(() => {
    fetch('/api/games/guess-partner').then(r => r.json()).then(d => {
      if (Array.isArray(d)) setDbAnswers(d);
    });
  }, []);

  const q = GUESS_PARTNER_QUESTIONS[idx];
  const dbQ = dbAnswers.find(a => a.questionId === q?.id);

  // My answer entry in the answers array
  const myEntry = dbQ?.answers?.find((a: any) => a.userId === userId);
  const partnerEntry = dbQ?.answers?.find((a: any) => a.userId !== userId);
  const myAnswer = myEntry?.answerIndex ?? -1;
  const partnerAnswer = partnerEntry?.answerIndex ?? -1;

  const myAnswered = dbAnswers.filter(a => a.answers?.some((e: any) => e.userId === userId && e.answerIndex >= 0)).length;
  const partnerAnswered = dbAnswers.filter(a => a.answers?.some((e: any) => e.userId !== userId && e.answerIndex >= 0)).length;
  const partnerName = dbAnswers.flatMap((a: any) => a.answers ?? []).find((e: any) => e.userId !== userId)?.userName ?? 'Partner';

  const matchCount = dbAnswers.filter(a => {
    const mine = a.answers?.find((e: any) => e.userId === userId);
    const theirs = a.answers?.find((e: any) => e.userId !== userId);
    return mine?.answerIndex >= 0 && theirs?.answerIndex >= 0 && mine.answerIndex === theirs.answerIndex;
  }).length;

  const bothAnsweredAll = myAnswered === GUESS_PARTNER_QUESTIONS.length && partnerAnswered === GUESS_PARTNER_QUESTIONS.length;

  async function pick(optIdx: number) {
    if (saving || !userId) return;
    setSaving(true);
    try {
      const res = await fetch('/api/games/guess-partner', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: q.id, answerIndex: optIdx }),
      });
      const updated = await res.json();
      setDbAnswers(prev => {
        const exists = prev.find(a => a.questionId === updated.questionId);
        return exists ? prev.map(a => a.questionId === updated.questionId ? updated : a) : [...prev, updated];
      });
      if (idx < GUESS_PARTNER_QUESTIONS.length - 1) {
        setTimeout(() => setIdx(i => i + 1), 500);
      } else {
        setShowResults(true);
      }
    } catch { toast.error('Failed to save'); } finally { setSaving(false); }
  }

  async function reset() {
    await fetch('/api/games/guess-partner', { method: 'DELETE' });
    setDbAnswers([]); setIdx(0); setShowResults(false);
    toast.success('Game reset!');
  }

  if (showResults || bothAnsweredAll) {
    const pct = Math.round((matchCount / GUESS_PARTNER_QUESTIONS.length) * 100);
    return (
      <div className="px-4 py-5 max-w-lg mx-auto pb-10">
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl p-6 text-white text-center mb-5">
          <div className="text-5xl mb-3">🧠</div>
          <h2 className="font-playfair text-3xl font-bold mb-1">Results!</h2>
          <div className="text-6xl font-black my-4">{pct}%</div>
          <p className="text-white/80">You matched on <strong>{matchCount}</strong> out of <strong>{GUESS_PARTNER_QUESTIONS.length}</strong> questions</p>
          <div className="mt-4 text-sm text-white/70">
            {pct >= 80 ? '🏆 You know each other incredibly well!' : pct >= 60 ? '💕 Great connection — keep learning!' : '🌱 Room to grow and discover more!'}
          </div>
        </div>

        <div className="space-y-3 mb-5">
          {GUESS_PARTNER_QUESTIONS.map(q => {
            const dbQ = dbAnswers.find(a => a.questionId === q.id);
            const mine = dbQ?.answers?.find((e: any) => e.userId === userId);
            const theirs = dbQ?.answers?.find((e: any) => e.userId !== userId);
            const myA = mine?.answerIndex ?? -1;
            const theirA = theirs?.answerIndex ?? -1;
            const match = myA >= 0 && theirA >= 0 && myA === theirA;
            return (
              <div key={q.id} className={`bg-white rounded-2xl border p-4 ${match ? 'border-emerald-200' : 'border-blue-100'}`}>
                <div className="flex items-start justify-between mb-2 gap-2">
                  <p className="text-sm font-semibold text-gray-800">{q.question}</p>
                  <span className="text-lg flex-shrink-0">{match ? '✅' : '🔀'}</span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {myA >= 0 && <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-lg font-medium">You: {q.options[myA]?.split(' ')[0]}...</span>}
                  {theirA >= 0 && <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-1 rounded-lg font-medium">{theirs?.userName ?? 'Partner'}: {q.options[theirA]?.split(' ')[0]}...</span>}
                </div>
              </div>
            );
          })}
        </div>

        <button onClick={reset} className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-2xl font-bold shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2">
          <RotateCcw size={18} /> Play Again
        </button>
      </div>
    );
  }

  if (!userId) return <div className="flex items-center justify-center min-h-[60vh]"><div className="text-4xl animate-pulse">🧠</div></div>;

  return (
    <div className="px-4 py-5 max-w-lg mx-auto pb-10">
      <div className="mb-5">
        <div className="inline-block bg-blue-100 text-blue-600 text-xs font-bold px-3 py-1 rounded-full mb-2 tracking-wider uppercase">Guess Your Partner</div>
        <h1 className="font-playfair text-3xl font-bold text-gray-900">How Well Do You Know Each Other? 🧠</h1>
        <p className="text-gray-500 text-sm mt-1">Both answer about <strong>yourselves</strong>. Then see how well you match!</p>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 bg-gray-100 rounded-full h-2">
          <div className="bg-gradient-to-r from-blue-400 to-indigo-400 h-2 rounded-full transition-all" style={{ width: `${(myAnswered / GUESS_PARTNER_QUESTIONS.length) * 100}%` }} />
        </div>
        <span className="text-xs font-bold text-gray-500 whitespace-nowrap">{myAnswered}/{GUESS_PARTNER_QUESTIONS.length} done</span>
      </div>

      {/* Partner status */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-2xl px-4 py-3 mb-4 flex items-center justify-between">
        <span className="text-sm text-indigo-700 font-medium">{partnerName}&apos;s progress</span>
        <span className="text-sm font-bold text-indigo-600">
          {partnerAnswered}/{GUESS_PARTNER_QUESTIONS.length} answered
        </span>
      </div>

      {/* Question card */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Question {idx + 1} of {GUESS_PARTNER_QUESTIONS.length}</span>
          {myAnswer >= 0 && <span className="text-xs bg-emerald-100 text-emerald-600 px-2 py-1 rounded-full font-bold">✓ Answered</span>}
        </div>

        <p className="font-playfair text-xl font-semibold text-gray-900 mb-5 leading-snug">{q.question}</p>

        <div className="space-y-2.5">
          {q.options.map((opt, i) => {
            const isMine = myAnswer === i;
            const isPartner = partnerAnswer === i && partnerAnswer >= 0;
            return (
              <button
                key={i}
                onClick={() => pick(i)}
                disabled={saving}
                className={`w-full p-4 rounded-2xl border-2 text-left transition-all active:scale-[0.97] ${
                  isMine && isPartner ? 'border-emerald-400 bg-emerald-50'
                  : isMine ? 'border-blue-400 bg-blue-50'
                  : isPartner ? 'border-indigo-300 bg-indigo-50'
                  : 'border-gray-100 bg-gray-50 hover:border-blue-200 hover:bg-blue-50/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                    isMine ? 'bg-blue-400 text-white' : isPartner ? 'bg-indigo-400 text-white' : 'bg-gray-200 text-gray-500'
                  }`}>{String.fromCharCode(65 + i)}</span>
                  <span className="text-sm font-medium text-gray-800 flex-1">{opt}</span>
                  <div className="flex gap-1 flex-shrink-0">
                    {isMine && <span className="text-[10px] bg-blue-100 text-blue-500 px-1.5 py-0.5 rounded-full font-bold">You</span>}
                    {isPartner && <span className="text-[10px] bg-indigo-100 text-indigo-500 px-1.5 py-0.5 rounded-full font-bold">{partnerEntry?.userName ?? 'Partner'}</span>}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Nav */}
      <div className="flex gap-3 mt-4">
        <button onClick={() => setIdx(i => Math.max(0, i - 1))} disabled={idx === 0} className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-600 font-bold disabled:opacity-40">← Prev</button>
        <button onClick={() => setIdx(i => Math.min(GUESS_PARTNER_QUESTIONS.length - 1, i + 1))} disabled={idx === GUESS_PARTNER_QUESTIONS.length - 1} className="flex-1 py-3 bg-gradient-to-r from-blue-400 to-indigo-400 text-white rounded-xl font-bold shadow-md">Next →</button>
      </div>

      {bothAnsweredAll && (
        <button onClick={() => setShowResults(true)} className="w-full mt-3 py-4 bg-gradient-to-r from-emerald-400 to-teal-400 text-white rounded-2xl font-bold shadow-lg active:scale-95 transition-all">
          See Results 🏆
        </button>
      )}
    </div>
  );
}
