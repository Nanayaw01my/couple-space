'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import { Send, MessageCircle, ChevronDown } from 'lucide-react';
import { TRUTH_PROMPTS, DARE_PROMPTS } from '@/lib/questions';

function randomFrom(arr: string[]) { return arr[Math.floor(Math.random() * arr.length)]; }

interface Round {
  _id: string; roundNumber: number;
  askerId: string; responderId: string;
  askerName: string; responderName: string;
  type: 'truth' | 'dare' | null; prompt: string | null; response: string;
  status: 'pending' | 'composing' | 'answering' | 'done';
}

interface ChatMsg { _id: string; senderId: string; senderName: string; content: string; createdAt: string; }

function MiniChat({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchMsgs = useCallback(async () => {
    const res = await fetch('/api/chat').catch(() => null);
    if (res?.ok) { const d: ChatMsg[] = await res.json(); setMessages(d.slice(-30)); }
  }, []);

  useEffect(() => { fetchMsgs(); const t = setInterval(fetchMsgs, 4000); return () => clearInterval(t); }, [fetchMsgs]);
  useEffect(() => { if (open) setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100); }, [open, messages.length]);

  async function send() {
    if (!input.trim() || sending) return;
    const content = input.trim(); setInput(''); setSending(true);
    await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content }) }).catch(() => null);
    await fetchMsgs(); setSending(false);
  }

  return (
    <div className="fixed bottom-[72px] right-3 z-50">
      {open && (
        <div className="absolute bottom-14 right-0 w-72 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden" style={{ maxHeight: 360 }}>
          <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between bg-gray-50">
            <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Chat</span>
            <button onClick={() => setOpen(false)}><ChevronDown size={14} className="text-gray-500" /></button>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5" style={{ minHeight: 200 }}>
            {messages.length === 0 ? <p className="text-center text-xs text-gray-300 py-6">No messages yet</p> :
              messages.map(msg => {
                const mine = msg.senderId === userId;
                return (
                  <div key={msg._id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`px-3 py-1.5 rounded-xl text-xs max-w-[80%] ${mine ? 'bg-rose-500 text-white' : 'bg-gray-100 text-gray-800'}`}>{msg.content}</div>
                  </div>
                );
              })}
            <div ref={bottomRef} />
          </div>
          <div className="border-t border-gray-100 px-2 py-2 flex gap-1.5">
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') send(); }}
              placeholder="Type..." className="flex-1 text-xs rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-200" />
            <button onClick={send} disabled={!input.trim() || sending} className="w-8 h-8 rounded-full bg-rose-500 text-white flex items-center justify-center disabled:opacity-40">
              <Send size={12} />
            </button>
          </div>
        </div>
      )}
      <button onClick={() => setOpen(v => !v)} className="w-12 h-12 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-lg active:scale-90 transition-all">
        <MessageCircle size={20} />
      </button>
    </div>
  );
}

export default function TruthOrDarePage() {
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id as string | undefined;

  const [current, setCurrent] = useState<Round | null>(null);
  const [history, setHistory] = useState<Round[]>([]);
  const [loading, setLoading] = useState(true);
  const [questionText, setQuestionText] = useState('');
  const [responseText, setResponseText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchState = useCallback(async () => {
    try {
      const res = await fetch('/api/games/truth-or-dare').catch(() => null);
      if (!res?.ok) { setLoading(false); return; }
      const data = await res.json();
      setCurrent(data.current ?? null); setHistory(data.history ?? []); setLoading(false);
    } catch { setLoading(false); }
  }, []);

  useEffect(() => { fetchState(); const t = setInterval(fetchState, 4000); return () => clearInterval(t); }, [fetchState]);

  useEffect(() => {
    if (current?.status === 'composing' && current.type && !questionText)
      setQuestionText(current.type === 'truth' ? randomFrom(TRUTH_PROMPTS) : randomFrom(DARE_PROMPTS));
    if (current?.status !== 'composing') setQuestionText('');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.status, current?.type]);

  async function doAction(body: object) {
    setSubmitting(true);
    try {
      const res = await fetch('/api/games/truth-or-dare', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      let data: any = {};
      try { data = await res.json(); } catch { /* non-JSON response */ }
      if (!res.ok) { toast.error(data.error || `Error ${res.status}`); return; }
      await fetchState();
    } catch (err: any) { toast.error(err?.message || 'Network error'); } finally { setSubmitting(false); }
  }

  if (loading || !userId) return <div className="flex items-center justify-center min-h-[60vh]"><div className="text-4xl animate-pulse">🎭</div></div>;

  const isAsker = current?.askerId === userId;
  const isResponder = current?.responderId === userId;
  const askerName = current?.askerName || 'Your partner';
  const responderName = current?.responderName || 'Your partner';

  return (
    <div className="px-4 py-5 max-w-lg mx-auto pb-28">
      <div className="mb-6">
        <div className="inline-block bg-rose-100 text-rose-600 text-xs font-bold px-3 py-1 rounded-full mb-2 tracking-wider uppercase">Truth or Dare</div>
        <h1 className="font-playfair text-3xl font-bold text-gray-900">Truth or Dare 🎭</h1>
        <p className="text-gray-500 text-sm mt-1">Couples edition — honest, deep, and daring.</p>
      </div>

      {!current && (
        <div className="text-center py-10">
          <div className="text-7xl mb-6">🎴</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">No game in progress</h2>
          <p className="text-gray-500 text-sm mb-8">Start the game — challenge your partner first!</p>
          <button onClick={() => doAction({ action: 'start' })} disabled={submitting}
            className="px-8 py-4 bg-gradient-to-r from-gray-900 to-gray-700 text-white rounded-2xl font-bold text-lg shadow-xl active:scale-95 transition-all disabled:opacity-50">
            Start Game 🎭
          </button>
        </div>
      )}

      {current?.status === 'pending' && isAsker && (
        <div className="text-center py-10">
          <div className="text-7xl mb-6 animate-bounce">📣</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Challenge sent!</h2>
          <p className="text-gray-500 text-sm mb-6">Waiting for {responderName} to pick Truth or Dare...</p>
          <div className="flex justify-center gap-1.5">{[0,150,300].map(d => <span key={d} className="w-2 h-2 bg-rose-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />)}</div>
        </div>
      )}

      {current?.status === 'pending' && isResponder && (
        <div className="text-center">
          <div className="mb-4"><span className="inline-block bg-black text-white text-xs font-bold px-4 py-1.5 rounded-full tracking-wider uppercase">{askerName} is challenging you!</span></div>
          <div className="text-5xl mb-4">🎴</div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">{askerName} asks: Truth or Dare?</h2>
          <p className="text-gray-500 text-sm mb-8">Pick your card — Round {current.roundNumber}</p>
          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => doAction({ action: 'pick', type: 'truth' })} disabled={submitting}
              className="py-10 bg-gradient-to-br from-gray-900 to-gray-700 text-white rounded-3xl font-bold text-xl shadow-xl active:scale-95 transition-all disabled:opacity-50">
              <div className="text-4xl mb-2">🔮</div>Truth
            </button>
            <button onClick={() => doAction({ action: 'pick', type: 'dare' })} disabled={submitting}
              className="py-10 bg-gradient-to-br from-rose-500 to-pink-600 text-white rounded-3xl font-bold text-xl shadow-xl active:scale-95 transition-all disabled:opacity-50">
              <div className="text-4xl mb-2">🔥</div>Dare
            </button>
          </div>
        </div>
      )}

      {current?.status === 'composing' && isAsker && (
        <div>
          <div className="mb-4 flex justify-center">
            <span className={`inline-block text-xs font-bold px-4 py-1.5 rounded-full tracking-wider uppercase ${current.type === 'truth' ? 'bg-gray-900 text-white' : 'bg-rose-500 text-white'}`}>
              {responderName} chose {current.type === 'truth' ? '🔮 Truth' : '🔥 Dare'}!
            </span>
          </div>
          <div className={`bg-white rounded-3xl border shadow-xl p-6 mb-5 ${current.type === 'truth' ? 'border-gray-200' : 'border-rose-100'}`}>
            <div className="text-5xl text-center mb-3">{current.type === 'truth' ? '🔮' : '🔥'}</div>
            <p className="text-center text-sm text-gray-500 mb-4">Write your {current.type} question for {responderName}</p>
            <textarea value={questionText} onChange={e => setQuestionText(e.target.value)} rows={4}
              placeholder={current.type === 'truth' ? 'What do you want to ask...' : 'What do you dare them to do...'}
              className={`w-full px-4 py-3 rounded-xl border text-gray-900 text-sm resize-none focus:outline-none focus:ring-2 font-playfair italic ${current.type === 'truth' ? 'border-gray-200 focus:ring-gray-100' : 'border-rose-200 focus:ring-rose-100'}`}
            />
            <p className="text-[11px] text-gray-400 mt-2 text-center">A suggestion is pre-filled — feel free to change it!</p>
          </div>
          <button onClick={() => doAction({ action: 'send', prompt: questionText })} disabled={submitting || !questionText.trim()}
            className={`w-full py-4 rounded-2xl text-white font-bold shadow-lg active:scale-95 transition-all disabled:opacity-50 ${current.type === 'truth' ? 'bg-gradient-to-r from-gray-900 to-gray-700' : 'bg-gradient-to-r from-rose-500 to-pink-500'}`}>
            Send to {responderName} 💕
          </button>
        </div>
      )}

      {current?.status === 'composing' && isResponder && (
        <div className="text-center py-10">
          <div className="mb-3"><span className={`inline-block text-xs font-bold px-4 py-1.5 rounded-full tracking-wider uppercase ${current.type === 'truth' ? 'bg-gray-900 text-white' : 'bg-rose-500 text-white'}`}>You chose {current.type === 'truth' ? '🔮 Truth' : '🔥 Dare'}</span></div>
          <div className="text-6xl mb-5 animate-pulse">✍️</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Waiting for {askerName}&apos;s question...</h2>
          <div className="flex justify-center gap-1.5 mt-6">{[0,150,300].map(d => <span key={d} className="w-2 h-2 bg-rose-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />)}</div>
        </div>
      )}

      {current?.status === 'answering' && isResponder && (
        <div>
          <div className="mb-4 flex justify-center"><span className="inline-block bg-black text-white text-xs font-bold px-4 py-1.5 rounded-full tracking-wider uppercase">Your Turn to Answer</span></div>
          <div className={`bg-white rounded-3xl border shadow-xl p-6 mb-5 ${current.type === 'truth' ? 'border-gray-200' : 'border-rose-100'}`}>
            <div className="text-5xl text-center mb-3">{current.type === 'truth' ? '🔮' : '🔥'}</div>
            <div className={`text-center text-xs font-bold uppercase tracking-widest mb-4 ${current.type === 'truth' ? 'text-gray-700' : 'text-rose-500'}`}>{current.type === 'truth' ? 'Truth' : 'Dare'} — from {askerName}</div>
            <p className="font-playfair text-xl font-semibold text-gray-900 italic text-center">&ldquo;{current.prompt}&rdquo;</p>
          </div>
          <textarea value={responseText} onChange={e => setResponseText(e.target.value)} rows={4} placeholder="Your response..."
            className={`w-full px-4 py-3 rounded-xl border text-gray-900 text-sm resize-none focus:outline-none focus:ring-2 ${current.type === 'truth' ? 'border-gray-200 focus:ring-gray-100' : 'border-rose-200 focus:ring-rose-100'}`} />
          <button onClick={async () => {
            if (!responseText.trim()) { toast.error('Write your response first!'); return; }
            await doAction({ action: 'respond', response: responseText.trim() });
            setResponseText(''); toast.success('Response sent! 🎉');
          }} disabled={submitting || !responseText.trim()}
            className={`mt-4 w-full py-4 rounded-2xl text-white font-bold shadow-lg active:scale-95 transition-all disabled:opacity-50 ${current.type === 'truth' ? 'bg-gradient-to-r from-gray-900 to-gray-700' : 'bg-gradient-to-r from-rose-500 to-pink-500'}`}>
            Send Response 💕
          </button>
        </div>
      )}

      {current?.status === 'answering' && isAsker && (
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <span className={`inline-block text-xs font-bold px-4 py-1.5 rounded-full tracking-wider uppercase ${current.type === 'truth' ? 'bg-gray-900 text-white' : 'bg-rose-500 text-white'}`}>
              {current.type === 'truth' ? '🔮 Truth' : '🔥 Dare'}
            </span>
          </div>
          <div className="bg-white rounded-3xl border border-gray-100 shadow-lg p-6 mb-6 text-left">
            <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-2">You asked {responderName}:</p>
            <p className="font-playfair text-lg font-semibold text-gray-900 italic">&ldquo;{current.prompt}&rdquo;</p>
          </div>
          <div className="text-5xl mb-4 animate-pulse">💭</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Waiting for {responderName}...</h2>
          <div className="flex justify-center gap-1.5 mt-6">{[0,150,300].map(d => <span key={d} className="w-2 h-2 bg-rose-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />)}</div>
        </div>
      )}

      {history.length > 0 && (
        <div className="mt-10">
          <h2 className="font-bold text-gray-700 mb-4 text-sm uppercase tracking-wider">Past Rounds</h2>
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
            {history.map(h => (
              <div key={h._id} className={`p-4 rounded-2xl border ${h.type === 'truth' ? 'border-gray-200 bg-gray-50' : 'border-rose-100 bg-rose-50'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${h.type === 'truth' ? 'bg-gray-200 text-gray-700' : 'bg-rose-200 text-rose-700'}`}>{h.type === 'truth' ? '🔮 Truth' : '🔥 Dare'}</span>
                  <span className="text-xs text-gray-400">{h.askerName} asked {h.responderName} · Round {h.roundNumber}</span>
                </div>
                <p className="text-sm text-gray-700 italic mb-2">&ldquo;{h.prompt}&rdquo;</p>
                {h.response && <p className="text-sm text-gray-600 font-medium bg-white rounded-xl px-3 py-2 border border-gray-100">{h.response}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-10 pt-6 border-t border-gray-100 text-center">
        <button onClick={async () => {
          if (!confirm('Reset the game?')) return;
          await fetch('/api/games/truth-or-dare', { method: 'DELETE' });
          setCurrent(null); setHistory([]); toast.success('Game reset!');
        }} className="text-xs text-gray-400 hover:text-red-400 transition-colors underline underline-offset-2">Reset Game</button>
      </div>

      <MiniChat userId={userId} />
    </div>
  );
}
