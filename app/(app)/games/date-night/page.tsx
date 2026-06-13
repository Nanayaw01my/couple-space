'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { DATE_NIGHT_IDEAS } from '@/lib/questions';
import toast from 'react-hot-toast';
import { Heart, Check, Trash2 } from 'lucide-react';

const CATS = ['All', 'Stay-In', 'Go Out', 'Adventure', 'Romantic', 'Creative'];
const CAT_COLORS: Record<string, string> = {
  'Stay-In': 'from-violet-400 to-purple-500',
  'Go Out': 'from-amber-400 to-orange-500',
  'Adventure': 'from-emerald-400 to-teal-500',
  'Romantic': 'from-rose-400 to-pink-500',
  'Creative': 'from-blue-400 to-indigo-500',
};

export default function DateNightPage() {
  const { data: session } = useSession();
  const [filter, setFilter] = useState('All');
  const [current, setCurrent] = useState<typeof DATE_NIGHT_IDEAS[0] | null>(null);
  const [saved, setSaved] = useState<any[]>([]);
  const [spinning, setSpinning] = useState(false);
  const [tab, setTab] = useState<'generate' | 'saved'>('generate');

  useEffect(() => {
    fetch('/api/games/date-night').then(r => r.json()).then(d => {
      if (Array.isArray(d)) setSaved(d);
    });
    spinIdea('All');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function spinIdea(cat: string) {
    setSpinning(true);
    const pool = cat === 'All' ? DATE_NIGHT_IDEAS : DATE_NIGHT_IDEAS.filter(d => d.category === cat);
    setTimeout(() => {
      const pick = pool[Math.floor(Math.random() * pool.length)];
      setCurrent(pick);
      setSpinning(false);
    }, 600);
  }

  function handleFilterChange(cat: string) {
    setFilter(cat);
    spinIdea(cat);
  }

  async function saveIdea() {
    if (!current) return;
    const alreadySaved = saved.find(s => s.ideaId === current.id);
    if (alreadySaved) return toast.error('Already in your saved list!');

    const res = await fetch('/api/games/date-night', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ideaId: current.id, idea: current.idea, category: current.category, emoji: current.emoji }),
    });
    if (res.ok) {
      const d = await res.json();
      setSaved(prev => [d, ...prev]);
      toast.success('Saved to your date ideas! 💕');
    } else {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error || 'Failed to save');
    }
  }

  async function toggleComplete(id: string, completed: boolean) {
    const res = await fetch('/api/games/date-night', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, completed: !completed }),
    });
    const d = await res.json();
    setSaved(prev => prev.map(s => s._id === id ? d : s));
  }

  async function removeDate(id: string) {
    await fetch('/api/games/date-night', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    setSaved(prev => prev.filter(s => s._id !== id));
    toast.success('Removed');
  }

  const completedCount = saved.filter(s => s.completed).length;

  return (
    <div className="px-4 py-5 max-w-lg mx-auto pb-10">
      <div className="mb-5">
        <div className="inline-block bg-slate-100 text-slate-600 text-xs font-bold px-3 py-1 rounded-full mb-2 tracking-wider uppercase">Date Night</div>
        <div className="flex items-center justify-between">
          <h1 className="font-playfair text-3xl font-bold text-gray-900">Date Night 🌙</h1>
          {saved.length > 0 && <span className="text-xs bg-emerald-100 text-emerald-600 font-bold px-2 py-1 rounded-full">{completedCount}/{saved.length} done</span>}
        </div>
        <p className="text-gray-500 text-sm mt-1">55 ideas across 5 categories. Spin and get inspired.</p>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-100 rounded-xl p-1 mb-4">
        <button onClick={() => setTab('generate')} className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${tab === 'generate' ? 'bg-white text-slate-700 shadow-sm' : 'text-gray-500'}`}>Generate</button>
        <button onClick={() => setTab('saved')} className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${tab === 'saved' ? 'bg-white text-slate-700 shadow-sm' : 'text-gray-500'}`}>
          Saved {saved.length > 0 && `(${saved.length})`}
        </button>
      </div>

      {tab === 'generate' ? (
        <>
          {/* Category filter */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-5 -mx-1 px-1">
            {CATS.map(c => (
              <button key={c} onClick={() => handleFilterChange(c)} className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold border transition-all ${filter === c ? 'bg-gray-900 text-white border-gray-900' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400'}`}>{c}</button>
            ))}
          </div>

          {/* Main card */}
          <div className={`rounded-3xl p-7 text-white mb-5 transition-all duration-500 bg-gradient-to-br ${current ? CAT_COLORS[current.category] || 'from-slate-600 to-gray-800' : 'from-slate-600 to-gray-800'} ${spinning ? 'opacity-40 scale-95' : 'opacity-100 scale-100'}`}>
            {current ? (
              <>
                <div className="text-6xl mb-4 text-center">{current.emoji}</div>
                <div className="text-xs font-bold text-white/70 text-center mb-2 uppercase tracking-widest">{current.category}</div>
                <p className="text-lg font-bold text-center leading-snug">{current.idea}</p>
              </>
            ) : (
              <div className="text-center py-4 text-white/60">Generating...</div>
            )}
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <button onClick={() => spinIdea(filter)} disabled={spinning} className="py-4 bg-gray-900 text-white rounded-2xl font-bold text-sm active:scale-95 transition-all disabled:opacity-60">
              {spinning ? '...' : '🎲 New Idea'}
            </button>
            <button onClick={saveIdea} disabled={!current} className="py-4 bg-gradient-to-r from-slate-600 to-gray-700 text-white rounded-2xl font-bold text-sm shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60">
              <Heart size={16} fill="white" /> Save It
            </button>
          </div>

          {/* All ideas list */}
          <div className="mt-6">
            <h2 className="font-bold text-gray-700 text-sm mb-3">Browse All {filter === 'All' ? '' : filter} Ideas</h2>
            <div className="space-y-2">
              {(filter === 'All' ? DATE_NIGHT_IDEAS : DATE_NIGHT_IDEAS.filter(d => d.category === filter)).map(idea => {
                const isSaved = saved.find(s => s.ideaId === idea.id);
                return (
                  <button key={idea.id} onClick={() => setCurrent(idea)} className={`w-full text-left p-3.5 rounded-2xl border transition-all active:scale-[0.98] ${current?.id === idea.id ? 'border-slate-400 bg-slate-50' : 'border-gray-100 bg-white hover:border-slate-300'}`}>
                    <div className="flex items-start gap-3">
                      <span className="text-2xl flex-shrink-0">{idea.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800 leading-snug line-clamp-2">{idea.idea}</p>
                        <span className="text-xs text-gray-400 mt-0.5">{idea.category}</span>
                      </div>
                      {isSaved && <Heart size={14} className="text-rose-400 flex-shrink-0 mt-0.5" fill="#fb7185" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        <div>
          {saved.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <div className="text-5xl mb-3">🌙</div>
              <p className="font-medium">No saved dates yet!</p>
              <p className="text-sm mt-1">Generate an idea and save it here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {saved.map(d => (
                <div key={d._id} className={`bg-white rounded-2xl border p-4 ${d.completed ? 'border-emerald-200 bg-emerald-50/40' : 'border-gray-100'}`}>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl flex-shrink-0">{d.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium leading-snug ${d.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>{d.idea}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-400">{d.category}</span>
                        {d.completed && <span className="text-xs text-emerald-500 font-bold">✓ Done!</span>}
                        {d.savedByName && !d.completed && <span className="text-xs text-gray-300">· saved by {d.savedByName}</span>}
                      </div>
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      <button onClick={() => toggleComplete(d._id, d.completed)} className={`p-2 rounded-xl transition-all ${d.completed ? 'bg-emerald-100 text-emerald-500' : 'bg-gray-100 text-gray-400 hover:bg-emerald-50 hover:text-emerald-400'}`}>
                        <Check size={15} />
                      </button>
                      <button onClick={() => removeDate(d._id)} className="p-2 rounded-xl bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-400 transition-all">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
