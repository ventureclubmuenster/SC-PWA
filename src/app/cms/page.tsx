'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileText } from 'lucide-react';

export default function CmsLoginPage() {
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
      router.push('/cms/speakers');
    } else {
      setError('Invalid password');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#f8f9fb]">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-5 rounded-2xl bg-white p-8 shadow-sm border border-gray-200/60"
        aria-labelledby="cms-login-heading"
      >
        <div className="flex flex-col items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-200">
            <FileText className="h-6 w-6 text-white" aria-hidden="true" />
          </div>
          <h1 id="cms-login-heading" className="text-xl font-semibold text-gray-900 tracking-tight">CMS</h1>
        </div>
        <div>
          <label htmlFor="cms-password" className="sr-only">Password</label>
          <input
            id="cms-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            aria-describedby={error ? 'cms-login-error' : undefined}
            aria-invalid={error ? true : undefined}
            className="w-full rounded-xl bg-gray-50 px-4 py-3 text-sm border border-gray-200 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 focus:outline-none transition-all placeholder:text-gray-400"
            autoFocus
          />
        </div>
        <div aria-live="assertive">
          {error && <p id="cms-login-error" className="text-red-600 text-xs text-center" role="alert">{error}</p>}
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 transition-all shadow-sm shadow-violet-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </div>
  );
}
