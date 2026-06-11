'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const result = await signIn('credentials', { email: form.email, password: form.password, redirect: false });
    setLoading(false);
    if (result?.ok) router.push('/dashboard');
    else toast.error('Invalid email or password');
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">💕</div>
          <h1 className="font-playfair text-2xl font-bold text-gray-900">Welcome back</h1>
          <p className="text-gray-500 text-sm mt-1">Sign in to your couple space</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email" required placeholder="Email address" value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            className="w-full px-4 py-3.5 rounded-xl border border-gray-200 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
          />
          <input
            type="password" required placeholder="Password" value={form.password}
            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            className="w-full px-4 py-3.5 rounded-xl border border-gray-200 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
          />
          <button
            type="submit" disabled={loading}
            className="w-full py-4 bg-rose-500 text-white rounded-2xl font-bold text-base shadow-lg shadow-rose-200 active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-gray-500 text-sm mt-6">
          New here?{' '}
          <Link href="/register" className="text-rose-500 font-semibold">Create account</Link>
        </p>
      </div>
    </div>
  );
}
