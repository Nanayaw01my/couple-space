'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Send } from 'lucide-react';
import { format, isToday, isYesterday, isSameDay } from 'date-fns';

interface Msg { _id: string; senderId: string; senderName: string; content: string; createdAt: string; }

function DateSep({ date }: { date: Date }) {
  const label = isToday(date) ? 'Today' : isYesterday(date) ? 'Yesterday' : format(date, 'MMMM d, yyyy');
  return (
    <div className="flex items-center justify-center my-4">
      <div className="flex-1 h-px bg-gray-200" />
      <span className="mx-3 text-[11px] font-semibold text-gray-400">{label}</span>
      <div className="flex-1 h-px bg-gray-200" />
    </div>
  );
}

export default function ChatPage() {
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id as string;
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const prevCount = useRef(0);

  const fetchMessages = useCallback(async () => {
    const res = await fetch('/api/chat').catch(() => null);
    if (!res?.ok) return;
    setMessages(await res.json());
  }, []);

  useEffect(() => { fetchMessages().then(() => bottomRef.current?.scrollIntoView({ behavior: 'instant' as ScrollBehavior })); }, [fetchMessages]);
  useEffect(() => { const t = setInterval(fetchMessages, 4000); return () => clearInterval(t); }, [fetchMessages]);
  useEffect(() => {
    if (messages.length > prevCount.current) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    prevCount.current = messages.length;
  }, [messages.length]);
  useEffect(() => {
    const el = textareaRef.current; if (!el) return;
    el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 84) + 'px';
  }, [input]);

  async function send() {
    if (!input.trim() || sending) return;
    const content = input.trim(); setInput(''); setSending(true);
    const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content }) }).catch(() => null);
    if (res?.ok) { await fetchMessages(); bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }
    setSending(false);
  }

  const items: Array<{ type: 'sep'; date: Date } | { type: 'msg'; msg: Msg }> = [];
  messages.forEach((msg, i) => {
    const d = new Date(msg.createdAt);
    if (i === 0 || !isSameDay(d, new Date(messages[i-1].createdAt))) items.push({ type: 'sep', date: d });
    items.push({ type: 'msg', msg });
  });

  return (
    <div className="flex flex-col h-[calc(100vh-56px-72px)]">
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-20">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-5xl mb-3">💕</div>
            <p className="text-gray-400 text-sm">No messages yet. Say hi! 💕</p>
          </div>
        ) : (
          <div className="space-y-1">
            {items.map((item, i) => {
              if (item.type === 'sep') return <DateSep key={`s${i}`} date={item.date} />;
              const { msg } = item;
              const mine = msg.senderId === userId;
              return (
                <div key={msg._id} className={`flex ${mine ? 'justify-end' : 'justify-start'} mb-1`}>
                  <div className={`flex flex-col ${mine ? 'items-end' : 'items-start'} max-w-[78%]`}>
                    {!mine && <span className="text-[11px] font-semibold text-gray-400 mb-0.5 ml-1">{msg.senderName}</span>}
                    <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${mine ? 'bg-rose-500 text-white rounded-br-sm' : 'bg-white text-gray-900 border border-gray-200 rounded-bl-sm shadow-sm'}`}>
                      {msg.content}
                    </div>
                    <span className="text-[10px] text-gray-400 mt-0.5 mx-1">{format(new Date(msg.createdAt), 'h:mm a')}</span>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>
      <div className="fixed bottom-[72px] left-0 right-0 z-30 bg-white/90 backdrop-blur border-t border-gray-200 px-3 py-2.5">
        <div className="flex items-end gap-2 max-w-lg mx-auto">
          <textarea ref={textareaRef} value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            rows={1} placeholder="Type a message..." style={{ minHeight: 40, maxHeight: 84 }}
            className="flex-1 resize-none rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-300 overflow-hidden"
          />
          <button onClick={send} disabled={!input.trim() || sending}
            className="flex-shrink-0 w-10 h-10 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-md active:scale-90 transition-all disabled:opacity-40">
            <Send size={16} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
}
