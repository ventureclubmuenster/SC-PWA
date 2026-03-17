'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Mail, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-8 text-center">
        {/* Logo / Branding */}
        <div className="space-y-2">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold">Startup Contacts</h1>
          <p className="text-sm text-gray-400">
            Venture Club Münster
          </p>
        </div>

        {sent ? (
          /* Success state */
          <div className="space-y-4 rounded-2xl bg-gray-900 p-6">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-900/50">
              <Mail className="h-6 w-6 text-green-400" />
            </div>
            <h2 className="text-lg font-semibold">Check your email</h2>
            <p className="text-sm text-gray-400">
              We sent a magic link to <span className="font-medium text-white">{email}</span>.
              Click the link to sign in.
            </p>
          </div>
        ) : (
          /* Login form */
          <div className="space-y-6">
            <div className="rounded-2xl bg-gray-900 p-6 space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-800">
                <Mail className="h-6 w-6 text-gray-400" />
              </div>
              <p className="text-sm text-gray-400">
                No account detected. Enter your email or open the link you received by mail to login.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="w-full rounded-xl bg-gray-900 px-4 py-3 text-sm text-white placeholder-gray-500 outline-none ring-1 ring-gray-800 focus:ring-indigo-500 transition-all"
              />
              {error && (
                <p className="text-sm text-red-400">{error}</p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send Magic Link'}
              </button>
            </form>

            <div className="text-center">
              <a
                href={`/auth/demo?token=SC-DEMO-2024-VCM`}
                className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
              >
                Continue with demo account →
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
