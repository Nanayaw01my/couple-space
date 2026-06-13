'use client';
import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import { Plus, X } from 'lucide-react';

interface LoveNote {
  _id: string;
  senderId: string;
  senderName: string;
  message: string;
  opened: boolean;
  openedAt: string | null;
  createdAt: string;
}

interface NoteData {
  myNotes: LoveNote[];
  partnerNotes: LoveNote[];
}

export default function LoveJarPage() {
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id;

  const [data, setData] = useState<NoteData>({ myNotes: [], partnerNotes: [] });
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [revealedNote, setRevealedNote] = useState<LoveNote | null>(null);
  const [opening, setOpening] = useState(false);

  const fetchNotes = useCallback(async () => {
    try {
      const res = await fetch('/api/love-jar');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchNotes();
    const interval = setInterval(fetchNotes, 5000);
    return () => clearInterval(interval);
  }, [fetchNotes]);

  const unopenedPartnerNotes = data.partnerNotes.filter(n => !n.opened);
  const partnerName = data.partnerNotes[0]?.senderName ?? data.myNotes[0] ? undefined : undefined;
  const anyPartnerName = data.partnerNotes[0]?.senderName;

  async function openNote() {
    const oldest = unopenedPartnerNotes[0];
    if (!oldest) return;
    setOpening(true);
    try {
      const res = await fetch('/api/love-jar', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteId: oldest._id }),
      });
      if (res.ok) {
        const updated = await res.json();
        setRevealedNote(updated);
        await fetchNotes();
      } else {
        toast.error('Could not open note');
      }
    } catch {
      toast.error('Something went wrong');
    }
    setOpening(false);
  }

  async function addNote() {
    if (!message.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/love-jar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      if (res.ok) {
        toast.success('Note added to the jar! 🫙');
        setMessage('');
        setShowForm(false);
        await fetchNotes();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to add note');
      }
    } catch {
      toast.error('Something went wrong');
    }
    setSubmitting(false);
  }

  return (
    <div className="px-4 py-5 max-w-lg mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="inline-block bg-rose-100 text-rose-600 text-xs font-bold px-3 py-1 rounded-full mb-2 tracking-wider uppercase">
          Love Jar
        </div>
        <h1 className="font-playfair text-3xl font-bold text-gray-900">🫙 Love Jar</h1>
        <p className="text-gray-500 text-sm mt-1">Leave love notes for each other</p>
      </div>

      {/* Unopened count banner */}
      <div className="bg-gradient-to-r from-rose-400 to-pink-500 rounded-2xl p-5 mb-5 text-white shadow-lg shadow-rose-200">
        {unopenedPartnerNotes.length > 0 ? (
          <>
            <p className="text-lg font-bold mb-1">
              {unopenedPartnerNotes.length} note{unopenedPartnerNotes.length !== 1 ? 's' : ''} waiting for you 💌
            </p>
            <p className="text-rose-100 text-sm mb-4">
              {anyPartnerName ? `${anyPartnerName} left you something sweet` : 'Your partner left you something sweet'}
            </p>
            <button
              onClick={openNote}
              disabled={opening}
              className="bg-white text-rose-500 font-bold px-5 py-2.5 rounded-xl active:scale-95 transition-all disabled:opacity-60 text-sm shadow-sm"
            >
              {opening ? 'Opening…' : 'Open a Note 💝'}
            </button>
          </>
        ) : (
          <p className="text-base font-medium">
            Your jar is empty 🥺{' '}
            {anyPartnerName ? `Waiting for ${anyPartnerName}…` : 'Waiting for your partner…'}
          </p>
        )}
      </div>

      {/* Revealed note overlay */}
      {revealedNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6">
          <div className="bg-white rounded-3xl p-7 max-w-sm w-full shadow-2xl relative animate-bounce-in">
            <button
              onClick={() => setRevealedNote(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-100 transition-all"
            >
              <X size={18} className="text-gray-400" />
            </button>
            <div className="text-center mb-4">
              <span className="text-5xl">💌</span>
            </div>
            <p className="text-gray-800 text-center leading-relaxed text-base font-medium whitespace-pre-wrap">
              {revealedNote.message}
            </p>
            <p className="text-center text-xs text-rose-400 font-bold mt-4">
              — {revealedNote.senderName}
            </p>
            <button
              onClick={() => setRevealedNote(null)}
              className="mt-5 w-full py-2.5 bg-rose-500 text-white rounded-xl font-bold text-sm active:scale-95 transition-all"
            >
              Close 💕
            </button>
          </div>
        </div>
      )}

      {/* Add note form toggle */}
      <div className="mb-6">
        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-5 py-3 bg-white border-2 border-rose-200 text-rose-500 font-bold rounded-2xl text-sm active:scale-95 transition-all shadow-sm hover:bg-rose-50"
          >
            <Plus size={16} /> Add a Note +
          </button>
        ) : (
          <div className="bg-white rounded-2xl border border-rose-100 shadow-sm p-4">
            <p className="text-sm font-bold text-gray-700 mb-2">Write a love note 💕</p>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value.slice(0, 150))}
              rows={4}
              maxLength={150}
              placeholder="Say something sweet..."
              className="w-full text-sm text-gray-800 placeholder-gray-300 border border-gray-100 rounded-xl px-3 py-2.5 resize-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100 transition-all mb-2"
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">{message.length}/150</span>
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowForm(false); setMessage(''); }}
                  className="px-4 py-2 text-gray-500 font-medium text-sm rounded-xl hover:bg-gray-100 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={addNote}
                  disabled={submitting || !message.trim()}
                  className="px-5 py-2 bg-rose-500 text-white rounded-xl font-bold text-sm active:scale-95 transition-all disabled:opacity-50"
                >
                  {submitting ? 'Adding…' : 'Drop in Jar 🫙'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Partner notes section */}
      {data.partnerNotes.length > 0 && (
        <div className="mb-6">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
            Notes from {anyPartnerName ?? 'your partner'}
          </p>
          <div className="space-y-2">
            {data.partnerNotes.map(note => (
              <div
                key={note._id}
                className={`rounded-2xl p-4 border transition-all ${
                  note.opened
                    ? 'bg-rose-50 border-rose-100'
                    : 'bg-gray-50 border-gray-100'
                }`}
              >
                {note.opened ? (
                  <>
                    <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{note.message}</p>
                    <p className="text-[10px] text-rose-400 font-bold mt-1.5">
                      Opened {note.openedAt ? new Date(note.openedAt).toLocaleDateString() : ''} 💕
                    </p>
                  </>
                ) : (
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">💌</span>
                    <p className="text-sm text-gray-400 italic">Not opened yet…</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* My notes section */}
      {data.myNotes.length > 0 && (
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Notes I sent</p>
          <div className="space-y-2">
            {data.myNotes.map(note => (
              <div key={note._id} className="rounded-2xl p-4 bg-pink-50 border border-pink-100">
                <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{note.message}</p>
                <p className="text-[10px] text-pink-400 font-bold mt-1.5">
                  {note.opened ? `Opened ${note.openedAt ? new Date(note.openedAt).toLocaleDateString() : ''} ✓` : 'Waiting to be opened…'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.myNotes.length === 0 && data.partnerNotes.length === 0 && (
        <div className="text-center py-12 text-gray-300">
          <div className="text-5xl mb-3">🫙</div>
          <p className="text-sm font-medium">The jar is empty. Be the first to add a note!</p>
        </div>
      )}
    </div>
  );
}
