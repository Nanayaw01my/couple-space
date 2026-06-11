'use client';
import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';

interface Round {
  _id: string; roundNumber: number;
  thisOption: string; thatOption: string;
  picks: { userId: string; userName: string; pick: 'this' | 'that' }[];
  status: 'picking' | 'done';
}

export default function ThisOrThatPage() {
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id as string;

  const [current, setCurrent] = useState<Round | null>(null);
  const [history, setHistory] = useState<Round[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchState = useCallback(async () => {
    const res = await fetch('/api/games/this-or-that').catch(() => null);
    if (!res?.ok) { setLoading(false); return; }
    const data = await res.json();
    setCurrent(data.current ?? null); setHistory(data.history ?? []); setLoading(false);
  }, []);

  useEffect(() => { fetchState(); const t = setInterval(fetchState, 4000); return () => clearInterval(t); }, [fetchState]);

  async function doAction(body: object) {
    setSubmitting(true);
    try {
      const res = await fetch('/api/games/this-or-that', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Something went wrong'); return; }
      await fetchState();
    } catch { toast.error('Network error'); } finally { setSubmitting(false); }
  }

  if (loading || !userId) return <div className="flex items-center justify-center min-h-[60vh]"><div className="text-4xl animate-pulse">🤔</div></div>;

  const myPick = current?.picks.find(p => p.userId === userId);
  const partnerPick = current?.picks.find(p => p.userId !== userId);
  const waitingForPartner = myPick && !partnerPick && current?.status === 'picking';

  return (
    <div className="px-4 py-5 max-w-lg mx-auto pb-10">
      <div className="mb-6">
        <div className="inline-block bg-pink-100 text-pink-600 text-xs font-bold px-3 py-1 rounded-full mb-2 tracking-wider uppercase">Game</div>
        <h1 className="font-playfair text-3xl font-bold text-gray-900">This or That 🤔</h1>
        <p className="text-gray-500 text-sm mt-1">Pick one — see if you match your partner!</p>
      </div>

      {!current && (
        <div className="text-center py-10">
          <div className="text-7xl mb-6">🎴</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Ready to play?</h2>
          <p className="text-gray-500 text-sm mb-8">Each round gives you two options — pick one and see if you match!</p>
          <button onClick={() => doAction({ action: 'start' })} disabled={submitting}
            className="px-8 py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-2xl font-bold text-lg shadow-xl active:scale-95 transition-all disabled:opacity-50">
            Start Round 🎲
          </button>
        </div>
      )}

      {current && (
        <div>
          <div className="mb-3 text-center">
            <span className="inline-block bg-gray-100 text-gray-600 text-xs font-bold px-3 py-1 rounded-full">Round {current.roundNumber}</span>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-6 mb-5 text-center">
            <p className="text-gray-400 text-sm font-medium mb-6">Which do you prefer?</p>
            <div className="grid grid-cols-2 gap-4">
              {(['this', 'that'] as const).map((side) => {
                const label = side === 'this' ? current.thisOption : current.thatOption;
                const picked = myPick?.pick === side;
                const partnerPicked = partnerPick?.pick === side;
                const isMatch = current.status === 'done' && myPick?.pick === side && partnerPick?.pick === side;
                return (
                  <button key={side}
                    onClick={() => !myPick && doAction({ action: 'pick', pick: side })}
                    disabled={submitting || !!myPick}
                    className={`py-8 px-3 rounded-2xl font-bold text-base transition-all border-2 ${
                      isMatch ? 'bg-green-50 border-green-400 text-green-700' :
                      picked ? 'bg-rose-50 border-rose-400 text-rose-600' :
                      partnerPicked && current.status === 'done' ? 'bg-gray-50 border-gray-300 text-gray-600' :
                      'bg-gray-50 border-gray-100 text-gray-800 active:scale-95'
                    } ${myPick ? 'cursor-default' : 'cursor-pointer'}`}>
                    <p className="text-sm leading-snug">{label}</p>
                    {picked && <p className="text-xs mt-2 font-medium">✓ You</p>}
                    {partnerPicked && current.status === 'done' && <p className="text-xs mt-1 font-medium text-gray-500">✓ {partnerPick.userName}</p>}
                  </button>
                );
              })}
            </div>

            {waitingForPartner && (
              <div className="mt-5">
                <p className="text-gray-400 text-sm">Waiting for your partner to pick...</p>
                <div className="flex justify-center gap-1.5 mt-2">
                  {[0,150,300].map(d => <span key={d} className="w-2 h-2 bg-rose-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />)}
                </div>
              </div>
            )}

            {current.status === 'done' && myPick && partnerPick && (
              <div className={`mt-5 rounded-2xl px-4 py-3 ${myPick.pick === partnerPick.pick ? 'bg-green-50 border border-green-200' : 'bg-orange-50 border border-orange-200'}`}>
                <p className={`font-bold text-sm ${myPick.pick === partnerPick.pick ? 'text-green-700' : 'text-orange-700'}`}>
                  {myPick.pick === partnerPick.pick ? '💚 You both matched!' : '🧡 You picked differently!'}
                </p>
              </div>
            )}
          </div>

          {current.status === 'done' && (
            <button onClick={() => doAction({ action: 'start' })} disabled={submitting}
              className="w-full py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-2xl font-bold shadow-lg active:scale-95 transition-all disabled:opacity-50">
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
              const myH = h.picks.find(p => p.userId === userId);
              const partnerH = h.picks.find(p => p.userId !== userId);
              const matched = myH && partnerH && myH.pick === partnerH.pick;
              return (
                <div key={h._id} className={`p-3 rounded-xl border text-sm flex items-center gap-3 ${matched ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                  <span>{matched ? '💚' : '🧡'}</span>
                  <div>
                    <span className="text-gray-500 text-xs">Round {h.roundNumber}: </span>
                    <span className="font-semibold text-gray-800">{h.thisOption}</span>
                    <span className="text-gray-400"> vs </span>
                    <span className="font-semibold text-gray-800">{h.thatOption}</span>
                    {myH && partnerH && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        You: <b>{myH.pick === 'this' ? h.thisOption : h.thatOption}</b> · {partnerH.userName}: <b>{partnerH.pick === 'this' ? h.thisOption : h.thatOption}</b>
                      </p>
                    )}
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
