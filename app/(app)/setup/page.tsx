'use client';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function SetupPage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [mode, setMode] = useState<'choose' | 'create' | 'join'>('choose');
  const [startDate, setStartDate] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    setLoading(true);
    try {
      const res = await fetch('/api/couple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startDate: startDate || null }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      setGeneratedCode(data.inviteCode);
      await update(); // refresh session with new coupleId
    } catch { toast.error('Something went wrong'); } finally { setLoading(false); }
  }

  async function handleJoin() {
    if (!inviteCode.trim()) { toast.error('Enter an invite code'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: inviteCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      toast.success('You joined! 💕');
      await update();
      router.push('/dashboard');
    } catch { toast.error('Something went wrong'); } finally { setLoading(false); }
  }

  if (mode === 'choose') return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm text-center">
        <div className="text-5xl mb-4">💕</div>
        <h1 className="font-playfair text-2xl font-bold text-gray-900 mb-2">Set up your space</h1>
        <p className="text-gray-500 text-sm mb-8">Are you starting a new couple space or joining your partner&apos;s?</p>
        <div className="space-y-3">
          <button onClick={() => setMode('create')} className="w-full py-4 bg-rose-500 text-white rounded-2xl font-bold shadow-lg shadow-rose-200 active:scale-95 transition-all">
            Create our space 💑
          </button>
          <button onClick={() => setMode('join')} className="w-full py-4 border-2 border-gray-200 text-gray-700 rounded-2xl font-bold active:scale-95 transition-all">
            Join with invite code
          </button>
        </div>
      </div>
    </div>
  );

  if (mode === 'create') return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {!generatedCode ? (
          <>
            <div className="text-center mb-8">
              <div className="text-4xl mb-2">💑</div>
              <h1 className="font-playfair text-2xl font-bold text-gray-900">Create your space</h1>
              <p className="text-gray-500 text-sm mt-1">When did you two start dating?</p>
            </div>
            <input
              type="date" value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full px-4 py-3.5 rounded-xl border border-gray-200 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 mb-4"
            />
            <button
              onClick={handleCreate} disabled={loading}
              className="w-full py-4 bg-rose-500 text-white rounded-2xl font-bold shadow-lg shadow-rose-200 active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Space'}
            </button>
            <button onClick={() => setMode('choose')} className="w-full mt-3 text-sm text-gray-400 hover:text-gray-600">← Back</button>
          </>
        ) : (
          <div className="text-center">
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="font-playfair text-2xl font-bold text-gray-900 mb-2">Space created!</h2>
            <p className="text-gray-500 text-sm mb-6">Share this code with your partner so they can join:</p>
            <div className="bg-rose-50 border-2 border-rose-200 rounded-2xl px-6 py-4 mb-6">
              <p className="font-mono text-4xl font-bold text-rose-500 tracking-widest">{generatedCode}</p>
            </div>
            <p className="text-gray-400 text-xs mb-8">They enter this code when they create their account.</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full py-4 bg-rose-500 text-white rounded-2xl font-bold shadow-lg shadow-rose-200 active:scale-95 transition-all"
            >
              Go to Dashboard →
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">🔑</div>
          <h1 className="font-playfair text-2xl font-bold text-gray-900">Join your partner</h1>
          <p className="text-gray-500 text-sm mt-1">Enter the code your partner shared with you</p>
        </div>
        <input
          type="text" placeholder="Enter invite code (e.g. A3F9)" value={inviteCode}
          onChange={e => setInviteCode(e.target.value.toUpperCase())}
          className="w-full px-4 py-3.5 rounded-xl border border-gray-200 text-gray-900 text-sm text-center tracking-widest font-mono text-lg uppercase focus:outline-none focus:ring-2 focus:ring-rose-300 mb-4"
          maxLength={8}
        />
        <button
          onClick={handleJoin} disabled={loading}
          className="w-full py-4 bg-rose-500 text-white rounded-2xl font-bold shadow-lg shadow-rose-200 active:scale-95 transition-all disabled:opacity-50"
        >
          {loading ? 'Joining...' : 'Join Space 💕'}
        </button>
        <button onClick={() => setMode('choose')} className="w-full mt-3 text-sm text-gray-400 hover:text-gray-600">← Back</button>
      </div>
    </div>
  );
}
