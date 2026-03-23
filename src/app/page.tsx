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
    <div className="bg-bloom flex min-h-screen flex-col items-center justify-center px-6">
      <div className="relative z-10 w-full max-w-sm space-y-8 text-center">
        {/* Logo / Branding */}
        <div className="space-y-3 anim-fade-in">
          <div
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl gradient-accent gradient-glow anim-fade-in"
            style={{ '--fade-delay': '100ms' } as React.CSSProperties}
          >
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-title text-2xl">Startup Contacts</h1>
          <p className="text-subtitle">
            Venture Club Münster
          </p>
        </div>

        {sent ? (
          <div className="glass-card space-y-4 p-8 anim-scale-in">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-500/15">
              <Mail className="h-6 w-6 text-green-400" />
            </div>
            <h2 className="text-lg font-semibold">Check your email</h2>
            <p className="text-sm text-muted">
              We sent a magic link to <span className="font-medium text-primary">{email}</span>.
              Click the link to sign in.
            </p>
          </div>
        ) : (
          <div
            className="space-y-6 anim-fade-in"
            style={{ '--fade-delay': '150ms' } as React.CSSProperties}
          >
            <div className="glass-card p-8 space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full" style={{ background: 'var(--muted-light)' }}>
                <Mail className="h-6 w-6 text-muted" />
              </div>
              <p className="text-sm text-muted">
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
                className="w-full px-4 py-3.5 text-sm input-field"
              />
              {error && (
                <p className="text-sm text-red-400 anim-fade-in">
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="tap-btn w-full btn-primary py-3.5 text-sm font-semibold transition-opacity duration-150 hover:opacity-90 disabled:opacity-50 gradient-glow"
              >
                {loading ? 'Sending...' : 'Send Magic Link'}
              </button>
            </form>

            <div className="text-center">
              <a
                href={`/auth/demo?token=SC-DEMO-2024-VCM`}
                className="text-xs font-medium text-muted transition-colors duration-150"
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
