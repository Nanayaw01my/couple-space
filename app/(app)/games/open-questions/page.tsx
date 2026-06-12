'use client';
import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import { playReveal, playSend } from '@/lib/sounds';

interface Round {
  _id: string; roundNumber: number; question: string;
  answers: { userId: string; userName: string; text: string }[];
  status: 'answering' | 'done';
}

export default function OpenQuestionsPage() {
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id as string;

  const [current, setCurrent] = useState<Round | null>(null);
  const [history, setHistory] = useState<Round[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [answerText, setAnswerText] = useState('');

  const fetchState = useCallback(async () => {
    try {
      const res = await fetch('/api/games/open-questions').catch(() => null);
      if (!res?.ok) { setLoading(false); return; }
      const data = await res.json();
      setCurrent(data.current ?? null); setHistory(data.history ?? []); setLoading(false);
    } catch { setLoading(false); }
  }, []);

  useEffect(() => { fetchState(); const t = setInterval(fetchState, 4000); return () => clearInterval(t); }, [fetchState]);

  async function doAction(body: object) {
    setSubmitting(true);
    try {
      const res = await fetch('/api/games/open-questions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      let data: any = {};
      try { data = await res.json(); } catch {}
      if (!res.ok) { toast.error(data.error || `Error ${res.status}`); return; }
      if ((body as any).action === 'answer') playSend();
      if (data.status === 'done') playReveal();
      await fetchState();
    } catch (err: any) { toast.error(err?.message || 'Network error'); } finally { setSubmitting(false); }
  }

  if (loading || !userId) return <div className="flex items-center justify-center min-h-[60vh]"><div className="text-4xl animate-pulse">💬</div></div>;

  const myAnswer = current?.answers.find(a => a.userId === userId);
  const partnerAnswer = current?.answers.find(a => a.userId !== userId);

  return (
    <div className="px-4 py-5 max-w-lg mx-auto pb-10">
      <div className="mb-6">
        <div className="inline-block bg-amber-100 text-amber-700 text-xs font-bold px-3 py-1 rounded-full mb-2 tracking-wider uppercase">Game</div>
        <h1 className="font-playfair text-3xl font-bold text-gray-900">Open Questions 💬</h1>
        <p className="text-gray-500 text-sm mt-1">Answer honestly — then see what your partner said!</p>
      </div>

      {!current && (
        <div className="text-center py-10">
          <div className="text-7xl mb-6">💬</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Ready to share?</h2>
          <p className="text-gray-500 text-sm mb-8">A question appears — both answer honestly, then reveal!</p>
          <button onClick={() => doAction({ action: 'start' })} disabled={submitting}
            className="px-8 py-4 bg-gradient-to-r from-amber-400 to-orange-400 text-white rounded-2xl font-bold text-lg shadow-xl active:scale-95 transition-all disabled:opacity-50">
            Get a Question 🎲
          </button>
        </div>
      )}

      {current && (
        <div>
          <div className="mb-4 text-center">
            <span className="inline-block bg-gray-100 text-gray-600 text-xs font-bold px-3 py-1 rounded-full">Round {current.roundNumber}</span>
          </div>

          <div className="bg-white rounded-3xl border border-amber-100 shadow-xl p-6 mb-5">
            <div className="text-4xl text-center mb-3">❓</div>
            <p className="font-playfair text-xl font-semibold text-gray-900 italic text-center leading-snug">
              &ldquo;{current.question}&rdquo;
            </p>
          </div>

          {!myAnswer ? (
            <div>
              <textarea
                value={answerText}
                onChange={e => setAnswerText(e.target.value)}
                rows={3}
                placeholder="Type your honest answer..."
                className="w-full px-4 py-3 rounded-2xl border border-amber-200 text-gray-900 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-200 mb-3"
              />
              <button
                onClick={async () => {
                  if (!answerText.trim()) { toast.error('Write your answer first!'); return; }
                  await doAction({ action: 'answer', text: answerText });
                  setAnswerText('');
                }}
                disabled={submitting || !answerText.trim()}
                className="w-full py-4 bg-gradient-to-r from-amber-400 to-orange-400 text-white rounded-2xl font-bold shadow-lg active:scale-95 transition-all disabled:opacity-50">
                Submit Answer ✓
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
                <p className="text-xs font-bold text-gray-500 uppercase mb-1">Your answer</p>
                <p className="text-gray-900 font-medium">{myAnswer.text}</p>
              </div>

              {!partnerAnswer ? (
                <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 text-center">
                  <p className="text-gray-400 text-sm">Waiting for your partner&apos;s answer...</p>
                  <div className="flex justify-center gap-1.5 mt-2">
                    {[0,150,300].map(d => <span key={d} className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />)}
                  </div>
                </div>
              ) : (
                <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4">
                  <p className="text-xs font-bold text-gray-500 uppercase mb-1">{partnerAnswer.userName}&apos;s answer</p>
                  <p className="text-gray-900 font-medium">{partnerAnswer.text}</p>
                </div>
              )}
            </div>
          )}

          {current.status === 'done' && (
            <button onClick={() => doAction({ action: 'start' })} disabled={submitting}
              className="mt-5 w-full py-4 bg-gradient-to-r from-amber-400 to-orange-400 text-white rounded-2xl font-bold shadow-lg active:scale-95 transition-all disabled:opacity-50">
              Next Question →
            </button>
          )}
        </div>
      )}

      {history.length > 0 && (
        <div className="mt-10">
          <h2 className="font-bold text-gray-700 mb-4 text-sm uppercase tracking-wider">Past Questions</h2>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {history.map(h => {
              const myH = h.answers.find(a => a.userId === userId);
              const partnerH = h.answers.find(a => a.userId !== userId);
              return (
                <div key={h._id} className="p-4 rounded-2xl border border-amber-100 bg-amber-50 text-sm">
                  <p className="text-gray-700 italic font-medium mb-2 text-xs">&ldquo;{h.question}&rdquo;</p>
                  <div className="grid grid-cols-2 gap-2">
                    {myH && <div className="bg-white rounded-xl p-2 border border-amber-100"><p className="text-[10px] font-bold text-gray-400 uppercase mb-0.5">You</p><p className="text-gray-700 text-xs">{myH.text}</p></div>}
                    {partnerH && <div className="bg-white rounded-xl p-2 border border-amber-100"><p className="text-[10px] font-bold text-gray-400 uppercase mb-0.5">{partnerH.userName}</p><p className="text-gray-700 text-xs">{partnerH.text}</p></div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
