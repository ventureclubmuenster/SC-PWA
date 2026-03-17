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
        <div className="space-y-3">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl noise-panel-dark">
            <Sparkles className="relative z-10 h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1D1D1F]">Startup Contacts</h1>
          <p className="text-sm font-medium text-[#86868B]">
            Venture Club Münster
          </p>
        </div>

        {sent ? (
          /* Success state */
          <div className="noise-panel space-y-4 rounded-2xl p-6 border border-[#E8E8ED] shadow-sm">
            <div className="relative z-10 mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-50">
              <Mail className="h-6 w-6 text-green-500" />
            </div>
            <h2 className="relative z-10 text-lg font-semibold text-[#1D1D1F]">Check your email</h2>
            <p className="relative z-10 text-sm text-[#86868B]">
              We sent a magic link to <span className="font-medium text-[#1D1D1F]">{email}</span>.
              Click the link to sign in.
            </p>
          </div>
        ) : (
          /* Login form */
          <div className="space-y-6">
            <div className="noise-panel rounded-2xl p-6 space-y-4 border border-[#E8E8ED] shadow-sm">
              <div className="relative z-10 mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#F5F5F7]">
                <Mail className="h-6 w-6 text-[#86868B]" />
              </div>
              <p className="relative z-10 text-sm text-[#86868B]">
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
                className="w-full rounded-xl bg-white px-4 py-3.5 text-sm text-[#1D1D1F] placeholder-[#86868B] outline-none ring-1 ring-[#E8E8ED] focus:ring-2 focus:ring-[#FF754B] transition-all shadow-sm"
              />
              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="noise-panel-dark w-full rounded-xl py-3.5 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
              >
                <span className="relative z-10">{loading ? 'Sending...' : 'Send Magic Link'}</span>
              </button>
            </form>

            <div className="text-center">
              <a
                href={`/auth/demo?token=SC-DEMO-2024-VCM`}
                className="text-xs font-medium text-[#86868B] hover:text-[#1D1D1F] transition-colors"
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
