'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { LOVE_QUIZ_QUESTIONS } from '@/lib/questions';
import toast from 'react-hot-toast';
import { RotateCcw } from 'lucide-react';

export default function LoveQuizPage() {
  const { data: session } = useSession();
  const [dbAnswers, setDbAnswers] = useState<any[]>([]);
  const [idx, setIdx] = useState(0);
  const [saving, setSaving] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const userId = (session?.user as any)?.id as string;
  const userName = session?.user?.name ?? 'You';

  useEffect(() => {
    fetch('/api/games/love-quiz').then(r => r.json()).then(d => {
      if (Array.isArray(d)) setDbAnswers(d);
    });
  }, []);

  const q = LOVE_QUIZ_QUESTIONS[idx];
  const dbQ = dbAnswers.find(a => a.questionId === q?.id);

  const myEntry = dbQ?.answers?.find((a: any) => a.userId === userId);
  const partnerEntry = dbQ?.answers?.find((a: any) => a.userId !== userId);
  const myAnswer = myEntry?.answerIndex ?? -1;

  const myAnswered = dbAnswers.filter(a => a.answers?.some((e: any) => e.userId === userId && e.answerIndex >= 0)).length;
  const partnerAnswered = dbAnswers.filter(a => a.answers?.some((e: any) => e.userId !== userId && e.answerIndex >= 0)).length;
  const partnerName = dbAnswers.flatMap((a: any) => a.answers ?? []).find((e: any) => e.userId !== userId)?.userName ?? 'Partner';

  const bothAnsweredAll = myAnswered === LOVE_QUIZ_QUESTIONS.length && partnerAnswered === LOVE_QUIZ_QUESTIONS.length;

  const matchCount = dbAnswers.filter(a => {
    const mine = a.answers?.find((e: any) => e.userId === userId);
    const theirs = a.answers?.find((e: any) => e.userId !== userId);
    return mine?.answerIndex >= 0 && theirs?.answerIndex >= 0 && mine.answerIndex === theirs.answerIndex;
  }).length;

  const pct = LOVE_QUIZ_QUESTIONS.length > 0 ? Math.round((matchCount / LOVE_QUIZ_QUESTIONS.length) * 100) : 0;

  async function pick(optIdx: number) {
    if (saving || !userId) return;
    setSaving(true);
    try {
      const res = await fetch('/api/games/love-quiz', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: q.id, answerIndex: optIdx }),
      });
      const updated = await res.json();
      setDbAnswers(prev => {
        const exists = prev.find(a => a.questionId === updated.questionId);
        return exists ? prev.map(a => a.questionId === updated.questionId ? updated : a) : [...prev, updated];
      });
      if (idx < LOVE_QUIZ_QUESTIONS.length - 1) setTimeout(() => setIdx(i => i + 1), 400);
      else setShowResults(true);
    } catch { toast.error('Failed to save'); } finally { setSaving(false); }
  }

  async function reset() {
    await fetch('/api/games/love-quiz', { method: 'DELETE' });
    setDbAnswers([]); setIdx(0); setShowResults(false);
    toast.success('Quiz reset!');
  }

  if (showResults && bothAnsweredAll) {
    return (
      <div className="px-4 py-5 max-w-lg mx-auto pb-10">
        <div className={`rounded-3xl p-6 text-white text-center mb-5 ${pct >= 70 ? 'bg-gradient-to-br from-emerald-400 to-teal-500' : pct >= 50 ? 'bg-gradient-to-br from-amber-400 to-orange-500' : 'bg-gradient-to-br from-pink-400 to-rose-500'}`}>
          <div className="text-5xl mb-2">💝</div>
          <div className="font-playfair text-4xl font-bold mb-1">{pct}% Compatible</div>
          <p className="text-white/80 text-sm">You matched on {matchCount}/{LOVE_QUIZ_QUESTIONS.length} love style questions</p>
          <div className="mt-3 text-sm font-medium text-white/90">
            {pct >= 80 ? '🏆 Beautifully aligned — you just get each other.' : pct >= 60 ? '💛 Great compatibility with beautiful differences.' : '🌱 Different styles that complement each other!'}
          </div>
        </div>

        <div className="space-y-3 mb-5">
          {LOVE_QUIZ_QUESTIONS.map(q => {
            const dbQ = dbAnswers.find(a => a.questionId === q.id);
            const mine = dbQ?.answers?.find((e: any) => e.userId === userId);
            const theirs = dbQ?.answers?.find((e: any) => e.userId !== userId);
            const myA = mine?.answerIndex ?? -1;
            const theirA = theirs?.answerIndex ?? -1;
            const match = myA >= 0 && theirA >= 0 && myA === theirA;
            return (
              <div key={q.id} className={`bg-white rounded-2xl border p-4 ${match ? 'border-emerald-200' : 'border-gray-100'}`}>
                <p className="text-sm font-semibold text-gray-800 mb-3">{q.question}</p>
                <div className="space-y-2">
                  {myA >= 0 && (
                    <div className="flex items-start gap-2">
                      <span className="text-xs font-bold text-pink-500 w-8 flex-shrink-0">You</span>
                      <span className="text-xs text-gray-700 bg-pink-50 px-2 py-1 rounded-lg flex-1">{q.options[myA]}</span>
                    </div>
                  )}
                  {theirA >= 0 && (
                    <div className="flex items-start gap-2">
                      <span className="text-xs font-bold text-rose-500 flex-shrink-0" style={{ width: '2rem' }}>{theirs?.userName?.split(' ')[0] ?? 'Partner'}</span>
                      <span className="text-xs text-gray-700 bg-rose-50 px-2 py-1 rounded-lg flex-1">{q.options[theirA]}</span>
                    </div>
                  )}
                  {match && <div className="text-xs text-emerald-600 font-bold text-center mt-1">✅ You match!</div>}
                </div>
              </div>
            );
          })}
        </div>

        <button onClick={reset} className="w-full py-4 bg-gradient-to-r from-pink-400 to-rose-500 text-white rounded-2xl font-bold shadow-lg active:scale-95 flex items-center justify-center gap-2">
          <RotateCcw size={18} /> Retake Quiz
        </button>
      </div>
    );
  }

  if (showResults && !bothAnsweredAll) {
    return (
      <div className="px-4 py-5 max-w-lg mx-auto text-center">
        <div className="bg-pink-50 border border-pink-200 rounded-3xl p-8">
          <div className="text-5xl mb-4">⏳</div>
          <h2 className="font-playfair text-2xl font-bold text-gray-900 mb-2">Waiting for {partnerName}...</h2>
          <p className="text-gray-500 text-sm mb-4">You&apos;ve finished! {partnerName} has answered {partnerAnswered}/{LOVE_QUIZ_QUESTIONS.length} questions.</p>
          <p className="text-pink-600 font-medium text-sm">Results will unlock when both of you have answered all questions.</p>
        </div>
      </div>
    );
  }

  if (!userId) return <div className="flex items-center justify-center min-h-[60vh]"><div className="text-4xl animate-pulse">💝</div></div>;

  return (
    <div className="px-4 py-5 max-w-lg mx-auto pb-10">
      <div className="mb-5">
        <div className="inline-block bg-pink-100 text-pink-600 text-xs font-bold px-3 py-1 rounded-full mb-2 tracking-wider uppercase">Love Quiz</div>
        <h1 className="font-playfair text-3xl font-bold text-gray-900">Compatibility Quiz 💝</h1>
        <p className="text-gray-500 text-sm mt-1">Answer independently. Results reveal only when both finish.</p>
      </div>

      {/* Status bars */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-pink-50 border border-pink-100 rounded-2xl p-3">
          <div className="text-xs font-bold text-pink-500 mb-1">You</div>
          <div className="w-full bg-pink-100 rounded-full h-1.5 mb-1">
            <div className="bg-pink-400 h-1.5 rounded-full transition-all" style={{ width: `${(myAnswered / LOVE_QUIZ_QUESTIONS.length) * 100}%` }} />
          </div>
          <div className="text-xs text-pink-600 font-medium">{myAnswered}/{LOVE_QUIZ_QUESTIONS.length}</div>
        </div>
        <div className="bg-rose-50 border border-rose-100 rounded-2xl p-3">
          <div className="text-xs font-bold text-rose-500 mb-1">{partnerName}</div>
          <div className="w-full bg-rose-100 rounded-full h-1.5 mb-1">
            <div className="bg-rose-400 h-1.5 rounded-full transition-all" style={{ width: `${(partnerAnswered / LOVE_QUIZ_QUESTIONS.length) * 100}%` }} />
          </div>
          <div className="text-xs text-rose-600 font-medium">{partnerAnswered}/{LOVE_QUIZ_QUESTIONS.length}</div>
        </div>
      </div>

      {/* Progress dots */}
      <div className="flex gap-1.5 mb-5 flex-wrap">
        {LOVE_QUIZ_QUESTIONS.map((_, i) => {
          const dbQ2 = dbAnswers.find(a => a.questionId === LOVE_QUIZ_QUESTIONS[i].id);
          const mine = dbQ2?.answers?.find((e: any) => e.userId === userId);
          return (
            <button key={i} onClick={() => setIdx(i)} className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${i === idx ? 'ring-2 ring-pink-400 ring-offset-1' : ''} ${mine?.answerIndex >= 0 ? 'bg-gradient-to-br from-pink-400 to-rose-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
              {i + 1}
            </button>
          );
        })}
      </div>

      {/* Question */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-5">
        <div className="text-center text-xs font-bold text-pink-400 mb-3 uppercase tracking-wider">Question {idx + 1} of {LOVE_QUIZ_QUESTIONS.length}</div>
        <p className="font-playfair text-lg font-semibold text-gray-900 mb-5 text-center leading-snug">{q.question}</p>

        <div className="space-y-2.5">
          {q.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => pick(i)}
              disabled={saving}
              className={`w-full p-4 rounded-2xl border-2 text-left transition-all active:scale-[0.97] ${
                myAnswer === i ? 'border-pink-400 bg-pink-50 shadow-md shadow-pink-100'
                : 'border-gray-100 bg-gray-50 hover:border-pink-200 hover:bg-pink-50/40'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${myAnswer === i ? 'bg-pink-400 text-white' : 'bg-gray-200 text-gray-500'}`}>{i + 1}</span>
                <span className="text-sm text-gray-800">{opt}</span>
                {myAnswer === i && <span className="ml-auto text-pink-400">✓</span>}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3 mt-4">
        <button onClick={() => setIdx(i => Math.max(0, i - 1))} disabled={idx === 0} className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-600 font-bold disabled:opacity-40">← Prev</button>
        <button onClick={() => idx < LOVE_QUIZ_QUESTIONS.length - 1 ? setIdx(i => i + 1) : setShowResults(true)} className="flex-1 py-3 bg-gradient-to-r from-pink-400 to-rose-500 text-white rounded-xl font-bold shadow-md">
          {idx < LOVE_QUIZ_QUESTIONS.length - 1 ? 'Next →' : 'Finish 💝'}
        </button>
      </div>
    </div>
  );
}
