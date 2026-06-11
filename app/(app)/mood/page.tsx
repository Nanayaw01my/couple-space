'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const MOODS = [
  { emoji: '😍', label: 'In Love' },
  { emoji: '😊', label: 'Happy' },
  { emoji: '😌', label: 'Calm' },
  { emoji: '😔', label: 'Sad' },
  { emoji: '😤', label: 'Frustrated' },
  { emoji: '😴', label: 'Tired' },
];

interface Entry { _id: string; userId: string; userName: string; mood: string; note: string; date: string; }

export default function MoodPage() {
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id;
  const [entries, setEntries] = useState<Entry[]>([]);
  const [selected, setSelected] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const today = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => { fetch('/api/mood').then(r => r.json()).then(setEntries).catch(() => {}); }, []);

  const myToday = entries.find(e => e.userId === userId && e.date === today);
  const partnerToday = entries.find(e => e.userId !== userId && e.date === today);

  async function saveMood() {
    if (!selected) { toast.error('Pick a mood first!'); return; }
    setSubmitting(true);
    const res = await fetch('/api/mood', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mood: selected, note }) });
    if (res.ok) { const entry = await res.json(); setEntries(e => [entry, ...e.filter(x => !(x.userId === userId && x.date === today))]); toast.success('Mood saved! 😊'); }
    setSubmitting(false);
  }

  return (
    <div className="px-4 py-5 max-w-lg mx-auto">
      <div className="mb-5">
        <div className="inline-block bg-pink-100 text-pink-600 text-xs font-bold px-3 py-1 rounded-full mb-2 tracking-wider uppercase">Mood</div>
        <h1 className="font-playfair text-3xl font-bold text-gray-900">How are you feeling? 😊</h1>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
        <p className="text-sm font-bold text-gray-700 mb-3">Today&apos;s mood</p>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {MOODS.map(m => (
            <button key={m.emoji} onClick={() => setSelected(m.emoji)}
              className={`py-3 rounded-2xl border-2 transition-all flex flex-col items-center gap-1 ${selected === m.emoji ? 'border-rose-400 bg-rose-50' : 'border-gray-100 bg-gray-50'}`}>
              <span className="text-2xl">{m.emoji}</span>
              <span className="text-[10px] font-medium text-gray-600">{m.label}</span>
            </button>
          ))}
        </div>
        <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} placeholder="Add a note (optional)..."
          className="w-full text-sm text-gray-800 placeholder-gray-300 border border-gray-100 rounded-xl px-3 py-2.5 resize-none mb-3 focus:outline-none focus:ring-2 focus:ring-rose-100"
        />
        <button onClick={saveMood} disabled={submitting || !selected} className="w-full py-3 bg-rose-500 text-white rounded-xl font-bold text-sm active:scale-95 transition-all disabled:opacity-50">
          Save Mood 💕
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-xs font-bold text-gray-500 mb-2">You today</p>
          {myToday ? <><div className="text-4xl">{myToday.mood}</div>{myToday.note && <p className="text-xs text-gray-500 mt-1">{myToday.note}</p>}</> : <p className="text-gray-300 text-sm">Not set yet</p>}
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-xs font-bold text-gray-500 mb-2">Partner today</p>
          {partnerToday ? <><div className="text-4xl">{partnerToday.mood}</div><p className="text-xs text-gray-400 mt-1">{partnerToday.userName}</p>{partnerToday.note && <p className="text-xs text-gray-500 mt-0.5">{partnerToday.note}</p>}</> : <p className="text-gray-300 text-sm">Not set yet</p>}
        </div>
      </div>
    </div>
  );
}
