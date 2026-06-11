'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password !== form.confirm) { toast.error('Passwords do not match'); return; }
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Registration failed'); return; }
      const result = await signIn('credentials', { email: form.email, password: form.password, redirect: false });
      if (result?.ok) router.push('/setup');
      else toast.error('Login failed after registration');
    } catch { toast.error('Something went wrong'); } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">💕</div>
          <h1 className="font-playfair text-2xl font-bold text-gray-900">Create Account</h1>
          <p className="text-gray-500 text-sm mt-1">Start your couple space today</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text" required placeholder="Your name" value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className="w-full px-4 py-3.5 rounded-xl border border-gray-200 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
          />
          <input
            type="email" required placeholder="Email address" value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            className="w-full px-4 py-3.5 rounded-xl border border-gray-200 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
          />
          <input
            type="password" required placeholder="Password (min 6 characters)" value={form.password}
            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            className="w-full px-4 py-3.5 rounded-xl border border-gray-200 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
          />
          <input
            type="password" required placeholder="Confirm password" value={form.confirm}
            onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
            className="w-full px-4 py-3.5 rounded-xl border border-gray-200 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
          />
          <button
            type="submit" disabled={loading}
            className="w-full py-4 bg-rose-500 text-white rounded-2xl font-bold text-base shadow-lg shadow-rose-200 active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-gray-500 text-sm mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-rose-500 font-semibold">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
