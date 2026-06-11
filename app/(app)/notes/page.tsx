'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import { Trash2, Plus } from 'lucide-react';

interface Note { _id: string; authorId: string; authorName: string; content: string; color: string; createdAt: string; }

const COLORS = ['#fff9db', '#ffe0eb', '#e0f2fe', '#dcfce7', '#f3e8ff'];

export default function NotesPage() {
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id;
  const [notes, setNotes] = useState<Note[]>([]);
  const [input, setInput] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetch('/api/notes').then(r => r.json()).then(setNotes).catch(() => {}); }, []);

  async function addNote() {
    if (!input.trim()) return;
    setSubmitting(true);
    const res = await fetch('/api/notes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: input.trim(), color }) });
    if (res.ok) { const note = await res.json(); setNotes(n => [note, ...n]); setInput(''); toast.success('Note added! 📝'); }
    else toast.error('Failed to add note');
    setSubmitting(false);
  }

  async function deleteNote(id: string) {
    await fetch('/api/notes', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    setNotes(n => n.filter(note => note._id !== id));
  }

  return (
    <div className="px-4 py-5 max-w-lg mx-auto">
      <div className="mb-5">
        <div className="inline-block bg-yellow-100 text-yellow-700 text-xs font-bold px-3 py-1 rounded-full mb-2 tracking-wider uppercase">Notes</div>
        <h1 className="font-playfair text-3xl font-bold text-gray-900">Love Notes 📝</h1>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-5">
        <textarea value={input} onChange={e => setInput(e.target.value)} rows={3} placeholder="Write a note for your partner..."
          className="w-full text-sm text-gray-800 placeholder-gray-300 border border-gray-100 rounded-xl px-3 py-2.5 resize-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100 transition-all mb-3"
        />
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            {COLORS.map(c => (
              <button key={c} onClick={() => setColor(c)} className={`w-6 h-6 rounded-full border-2 transition-all ${color === c ? 'border-gray-400 scale-110' : 'border-transparent'}`} style={{ background: c }} />
            ))}
          </div>
          <button onClick={addNote} disabled={submitting || !input.trim()} className="ml-auto flex items-center gap-1.5 px-4 py-2 bg-rose-500 text-white rounded-xl font-bold text-sm active:scale-95 transition-all disabled:opacity-50">
            <Plus size={14} /> Add
          </button>
        </div>
      </div>

      <div className="columns-2 gap-3">
        {notes.map(note => (
          <div key={note._id} className="break-inside-avoid mb-3 rounded-2xl p-4 relative" style={{ background: note.color }}>
            <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{note.content}</p>
            <p className="text-[10px] text-gray-400 mt-2 font-medium">{note.authorName}</p>
            {note.authorId === userId && (
              <button onClick={() => deleteNote(note._id)} className="absolute top-2 right-2 p-1 rounded-lg hover:bg-black/10 transition-all">
                <Trash2 size={12} className="text-gray-400" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
