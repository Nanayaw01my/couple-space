'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Send, Mic, Pencil, Trash2, X } from 'lucide-react';
import { format, isToday, isYesterday, isSameDay } from 'date-fns';
import toast from 'react-hot-toast';
import { playSend } from '@/lib/sounds';

interface Msg {
  _id: string;
  senderId: string;
  senderName: string;
  content: string;
  type?: string;
  audioData?: string;
  edited?: boolean;
  createdAt: string;
}

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
  const [recording, setRecording] = useState(false);
  const [selectedMsg, setSelectedMsg] = useState<Msg | null>(null);
  const [editingMsg, setEditingMsg] = useState<Msg | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const prevCount = useRef(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
  useEffect(() => { if (editingMsg) textareaRef.current?.focus(); }, [editingMsg]);

  function startLongPress(msg: Msg) {
    if (msg.senderId !== userId) return;
    longPressTimer.current = setTimeout(() => {
      navigator.vibrate?.(30);
      setSelectedMsg(msg);
    }, 500);
  }
  function cancelLongPress() {
    if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
  }

  async function send() {
    if (!input.trim() || sending) return;
    const content = input.trim(); setInput(''); setSending(true);
    try {
      if (editingMsg) {
        const res = await fetch('/api/chat', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messageId: editingMsg._id, content }),
        }).catch(() => null);
        if (res?.ok) { setEditingMsg(null); await fetchMessages(); }
        else toast.error('Failed to edit');
      } else {
        playSend();
        const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content }) }).catch(() => null);
        if (res?.ok) { await fetchMessages(); bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }
      }
    } finally { setSending(false); }
  }

  async function deleteMessage(msgId: string) {
    setSelectedMsg(null);
    const res = await fetch('/api/chat', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageId: msgId }),
    }).catch(() => null);
    if (res?.ok) await fetchMessages();
    else toast.error('Failed to delete');
  }

  function startEdit(msg: Msg) {
    setSelectedMsg(null);
    setEditingMsg(msg);
    setInput(msg.content);
  }

  function cancelEdit() { setEditingMsg(null); setInput(''); }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      mr.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunks, { type: mr.mimeType || 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onload = async () => {
          const audioData = reader.result as string;
          setSending(true);
          playSend();
          await fetch('/api/chat', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'audio', audioData }),
          }).catch(() => null);
          await fetchMessages();
          bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
          setSending(false);
        };
      };
      mr.start();
      recorderRef.current = mr;
      setRecording(true);
    } catch {
      toast.error('Microphone not available');
    }
  }

  function stopRecording() { recorderRef.current?.stop(); setRecording(false); }

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
                    <div
                      onTouchStart={() => startLongPress(msg)}
                      onTouchEnd={cancelLongPress}
                      onTouchMove={cancelLongPress}
                      onContextMenu={e => { e.preventDefault(); if (mine) setSelectedMsg(msg); }}
                      className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed select-none ${mine ? 'bg-rose-500 text-white rounded-br-sm' : 'bg-white text-gray-900 border border-gray-200 rounded-bl-sm shadow-sm'} ${mine && selectedMsg?._id === msg._id ? 'opacity-70' : ''}`}
                    >
                      {msg.type === 'audio' ? (
                        <audio src={msg.audioData} controls className="h-9 max-w-[180px]" style={{ borderRadius: '16px' }} />
                      ) : (
                        <span className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.content}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5 mx-1">
                      <span className="text-[10px] text-gray-400">{format(new Date(msg.createdAt), 'h:mm a')}</span>
                      {msg.edited && <span className="text-[10px] text-gray-400">· edited</span>}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Editing indicator */}
      {editingMsg && (
        <div className="fixed left-0 right-0 z-30 bg-amber-50 border-t border-amber-200 px-4 py-2 flex items-center gap-2" style={{ bottom: 'calc(72px + 56px)' }}>
          <Pencil size={13} className="text-amber-600 shrink-0" />
          <span className="text-xs text-amber-700 font-medium flex-1 truncate">Editing: {editingMsg.content}</span>
          <button onClick={cancelEdit} className="text-gray-400 hover:text-gray-600 p-1"><X size={14} /></button>
        </div>
      )}

      {/* Input bar */}
      <div className="fixed bottom-[72px] left-0 right-0 z-30 bg-white/90 backdrop-blur border-t border-gray-200 px-3 py-2.5">
        <div className="flex items-end gap-2 max-w-lg mx-auto">
          {!editingMsg && (
            <button onClick={recording ? stopRecording : startRecording}
              className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all ${recording ? 'bg-red-500 animate-pulse' : 'bg-gray-100'}`}>
              <Mic size={18} className={recording ? 'text-white' : 'text-gray-500'} />
            </button>
          )}
          <textarea ref={textareaRef} value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
              if (e.key === 'Escape' && editingMsg) cancelEdit();
            }}
            rows={1} placeholder={editingMsg ? 'Edit message...' : 'Type a message...'} style={{ minHeight: 40, maxHeight: 84 }}
            className="flex-1 resize-none rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-300 overflow-hidden"
          />
          <button onClick={send} disabled={!input.trim() || sending}
            className={`flex-shrink-0 w-10 h-10 rounded-full text-white flex items-center justify-center shadow-md active:scale-90 transition-all disabled:opacity-40 ${editingMsg ? 'bg-amber-500' : 'bg-rose-500'}`}>
            {editingMsg ? <Pencil size={15} /> : <Send size={16} strokeWidth={2.5} />}
          </button>
        </div>
      </div>

      {/* Long-press action sheet */}
      {selectedMsg && (
        <div className="fixed inset-0 z-50 bg-black/40" onClick={() => setSelectedMsg(null)}>
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
            {selectedMsg.type !== 'audio' && (
              <p className="text-gray-400 text-xs text-center mb-4 px-4 truncate">&ldquo;{selectedMsg.content}&rdquo;</p>
            )}
            {selectedMsg.type !== 'audio' && (
              <button onClick={() => startEdit(selectedMsg)} className="w-full py-3.5 flex items-center gap-3 px-4 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors">
                <Pencil size={18} className="text-gray-500" />
                <span className="font-medium text-gray-800">Edit message</span>
              </button>
            )}
            <button onClick={() => deleteMessage(selectedMsg._id)} className="w-full py-3.5 flex items-center gap-3 px-4 rounded-xl hover:bg-red-50 active:bg-red-100 transition-colors">
              <Trash2 size={18} className="text-red-500" />
              <span className="font-medium text-red-500">Delete message</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
