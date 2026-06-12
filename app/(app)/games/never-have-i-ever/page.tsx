'use client';
import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';

interface Round {
  _id: string; roundNumber: number; statement: string;
  answers: { userId: string; userName: string; have: boolean }[];
  status: 'answering' | 'done';
}

export default function NeverHaveIEverPage() {
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id as string;

  const [current, setCurrent] = useState<Round | null>(null);
  const [history, setHistory] = useState<Round[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchState = useCallback(async () => {
    try {
      const res = await fetch('/api/games/never-have-i-ever').catch(() => null);
      if (!res?.ok) { setLoading(false); return; }
      const data = await res.json();
      setCurrent(data.current ?? null); setHistory(data.history ?? []); setLoading(false);
    } catch { setLoading(false); }
  }, []);

  useEffect(() => { fetchState(); const t = setInterval(fetchState, 4000); return () => clearInterval(t); }, [fetchState]);

  async function doAction(body: object) {
    setSubmitting(true);
    try {
      const res = await fetch('/api/games/never-have-i-ever', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      let data: any = {};
      try { data = await res.json(); } catch { /* non-JSON response */ }
      if (!res.ok) { toast.error(data.error || `Error ${res.status}`); return; }
      await fetchState();
    } catch (err: any) { toast.error(err?.message || 'Network error'); } finally { setSubmitting(false); }
  }

  if (loading || !userId) return <div className="flex items-center justify-center min-h-[60vh]"><div className="text-4xl animate-pulse">🙈</div></div>;

  const myAnswer = current?.answers.find(a => a.userId === userId);
  const partnerAnswer = current?.answers.find(a => a.userId !== userId);

  return (
    <div className="px-4 py-5 max-w-lg mx-auto pb-10">
      <div className="mb-6">
        <div className="inline-block bg-purple-100 text-purple-600 text-xs font-bold px-3 py-1 rounded-full mb-2 tracking-wider uppercase">Game</div>
        <h1 className="font-playfair text-3xl font-bold text-gray-900">Never Have I Ever 🙈</h1>
        <p className="text-gray-500 text-sm mt-1">Tap "I Have" or "Never" — see what your partner admits!</p>
      </div>

      {!current && (
        <div className="text-center py-10">
          <div className="text-7xl mb-6">🙈</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Ready to confess?</h2>
          <p className="text-gray-500 text-sm mb-8">A statement appears — tap honestly, then see what your partner says!</p>
          <button onClick={() => doAction({ action: 'start' })} disabled={submitting}
            className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl font-bold text-lg shadow-xl active:scale-95 transition-all disabled:opacity-50">
            Start Round 🎲
          </button>
        </div>
      )}

      {current && (
        <div>
          <div className="mb-4 text-center">
            <span className="inline-block bg-gray-100 text-gray-600 text-xs font-bold px-3 py-1 rounded-full">Round {current.roundNumber}</span>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-6 mb-5">
            <div className="text-5xl text-center mb-4">🙈</div>
            <p className="font-playfair text-xl font-semibold text-gray-900 italic text-center leading-snug">
              &ldquo;{current.statement}&rdquo;
            </p>
          </div>

          {!myAnswer ? (
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => doAction({ action: 'answer', have: true })} disabled={submitting}
                className="py-5 bg-gradient-to-br from-rose-500 to-pink-600 text-white rounded-2xl font-bold text-lg shadow-xl active:scale-95 transition-all disabled:opacity-50">
                <div className="text-3xl mb-1">😅</div>
                I Have!
              </button>
              <button onClick={() => doAction({ action: 'answer', have: false })} disabled={submitting}
                className="py-5 bg-gradient-to-br from-gray-700 to-gray-900 text-white rounded-2xl font-bold text-lg shadow-xl active:scale-95 transition-all disabled:opacity-50">
                <div className="text-3xl mb-1">😇</div>
                Never!
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex items-center gap-3">
                <span className="text-2xl">{myAnswer.have ? '😅' : '😇'}</span>
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase">You said</p>
                  <p className="font-bold text-gray-900">{myAnswer.have ? 'I Have!' : 'Never!'}</p>
                </div>
              </div>

              {!partnerAnswer ? (
                <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 text-center">
                  <p className="text-gray-400 text-sm">Waiting for your partner...</p>
                  <div className="flex justify-center gap-1.5 mt-2">
                    {[0,150,300].map(d => <span key={d} className="w-2 h-2 bg-rose-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />)}
                  </div>
                </div>
              ) : (
                <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4 flex items-center gap-3">
                  <span className="text-2xl">{partnerAnswer.have ? '😅' : '😇'}</span>
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase">{partnerAnswer.userName} said</p>
                    <p className="font-bold text-gray-900">{partnerAnswer.have ? 'I Have!' : 'Never!'}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {current.status === 'done' && (
            <button onClick={() => doAction({ action: 'start' })} disabled={submitting}
              className="mt-5 w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl font-bold shadow-lg active:scale-95 transition-all disabled:opacity-50">
              Next Round →
            </button>
          )}
        </div>
      )}

      {history.length > 0 && (
        <div className="mt-10">
          <h2 className="font-bold text-gray-700 mb-4 text-sm uppercase tracking-wider">Past Rounds</h2>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {history.map(h => {
              const myH = h.answers.find(a => a.userId === userId);
              const partnerH = h.answers.find(a => a.userId !== userId);
              return (
                <div key={h._id} className="p-3 rounded-xl border border-gray-200 bg-gray-50 text-sm">
                  <p className="text-gray-700 italic mb-1 text-xs">&ldquo;{h.statement}&rdquo;</p>
                  <div className="flex gap-4 text-xs">
                    {myH && <span className="font-semibold text-gray-700">You: {myH.have ? '😅 I Have' : '😇 Never'}</span>}
                    {partnerH && <span className="font-semibold text-gray-500">{partnerH.userName}: {partnerH.have ? '😅 I Have' : '😇 Never'}</span>}
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
