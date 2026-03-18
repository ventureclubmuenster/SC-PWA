'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await fetch('/api/admin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      router.push('/admin/dashboard');
    } else {
      setError('Invalid password');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="noise-panel w-full max-w-sm space-y-4 rounded-2xl p-6 border border-[#E8E8ED] shadow-sm"
      >
        <h1 className="relative z-10 text-xl font-bold text-center tracking-tight">Admin Panel</h1>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="relative z-10 w-full rounded-xl bg-white px-4 py-3 text-sm border border-[#E8E8ED] focus:border-[#FF754B] focus:ring-2 focus:ring-[#FF754B]/20 focus:outline-none transition-all"
          autoFocus
        />
        {error && <p className="relative z-10 text-red-500 text-xs text-center">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="relative z-10 noise-panel-dark w-full rounded-xl py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 transition-all"
        >
          <span className="relative z-10">{loading ? 'Signing in...' : 'Sign In'}</span>
        </button>
      </form>
    </div>
  );
}
