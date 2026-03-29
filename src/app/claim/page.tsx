'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';
import { Mail, CheckCircle, XCircle, Ticket, Loader2 } from 'lucide-react';

type ClaimState =
  | { step: 'loading' }
  | { step: 'login'; token: string }
  | { step: 'login-sent'; token: string; email: string }
  | { step: 'claiming'; token: string }
  | { step: 'success'; ticketId: string }
  | { step: 'error'; message: string };

function ClaimFlow() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [state, setState] = useState<ClaimState>({ step: 'loading' });
  const [email, setEmail] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  const claimTicket = useCallback(
    async (claimToken: string) => {
      setState({ step: 'claiming', token: claimToken });

      try {
        const res = await fetch('/api/tickets/claim', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: claimToken }),
        });

        const data = await res.json();

        if (!res.ok) {
          setState({ step: 'error', message: data.error || 'Unbekannter Fehler.' });
          return;
        }

        setState({ step: 'success', ticketId: data.ticketId });
      } catch {
        setState({ step: 'error', message: 'Netzwerkfehler. Bitte versuche es erneut.' });
      }
    },
    [],
  );

  // On mount: validate token format, check auth state
  useEffect(() => {
    if (!token || token.length !== 64) {
      setState({ step: 'error', message: 'Ungültiger oder fehlender Claim-Link.' });
      return;
    }

    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        // Already authenticated — claim directly
        claimTicket(token);
      } else {
        // Need to log in first
        setState({ step: 'login', token });
      }
    });
  }, [token, claimTicket]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');

    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(`/claim?token=${token}`)}`;

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    });

    if (error) {
      setLoginError(error.message);
    } else {
      setState({ step: 'login-sent', token, email });
    }
    setLoginLoading(false);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-8 text-center">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-3"
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
            className="mx-auto h-20 w-20 overflow-hidden rounded-2xl"
          >
            <Image src="/icons/icon-192x192.png" alt="Startup Contacts" width={80} height={80} priority />
          </motion.div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--foreground)' }}>
            Ticket aktivieren
          </h1>
          <p className="text-sm font-medium text-muted">Startup Contacts</p>
        </motion.div>

        <AnimatePresence mode="wait">
          {/* Loading */}
          {state.step === 'loading' && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="card-clean rounded-2xl p-6 space-y-4"
            >
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted" />
              <p className="text-sm text-muted">Wird geladen...</p>
            </motion.div>
          )}

          {/* Login form */}
          {state.step === 'login' && (
            <motion.div
              key="login"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.22, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-6"
            >
              <div className="card-clean rounded-2xl p-6 space-y-4">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full" style={{ background: 'var(--surface-2)' }}>
                  <Ticket className="h-6 w-6 text-muted" />
                </div>
                <p className="text-sm text-muted">
                  Bestätige deine E-Mail-Adresse, um dein Ticket zu aktivieren.
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="deine@email.com"
                  required
                  className="w-full rounded-xl px-4 py-3.5 text-sm input-field"
                />
                {loginError && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15 }}
                    className="text-sm text-red-500"
                  >
                    {loginError}
                  </motion.p>
                )}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  type="submit"
                  disabled={loginLoading}
                  className="w-full rounded-xl bg-[#1D1D1F] py-3.5 text-sm font-semibold text-white transition-opacity duration-150 hover:opacity-90 disabled:opacity-50"
                >
                  {loginLoading ? 'Wird gesendet...' : 'E-Mail bestätigen'}
                </motion.button>
              </form>
            </motion.div>
          )}

          {/* Email sent */}
          {state.step === 'login-sent' && (
            <motion.div
              key="sent"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="card-clean space-y-4 rounded-2xl p-6"
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full" style={{ background: 'var(--surface-2)' }}>
                <Mail className="h-6 w-6" style={{ color: 'var(--accent)' }} />
              </div>
              <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>E-Mail gesendet</h2>
              <p className="text-sm text-muted">
                Bestätige deinen Login über den Link in deiner E-Mail.
                <br />
                <span className="font-medium" style={{ color: 'var(--foreground)' }}>{state.email}</span>
              </p>
              <p className="text-xs text-muted">
                Nach der Bestätigung wird dein Ticket automatisch aktiviert.
              </p>
            </motion.div>
          )}

          {/* Claiming in progress */}
          {state.step === 'claiming' && (
            <motion.div
              key="claiming"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="card-clean rounded-2xl p-6 space-y-4"
            >
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted" />
              <p className="text-sm text-muted">Ticket wird aktiviert...</p>
            </motion.div>
          )}

          {/* Success */}
          {state.step === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="card-clean rounded-2xl p-6 space-y-4"
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
                <CheckCircle className="h-6 w-6 text-green-500" />
              </div>
              <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>Ticket aktiviert! 🎉</h2>
              <p className="text-sm text-muted">
                Dein Ticket wurde erfolgreich mit deinem Account verknüpft.
              </p>
              <motion.a
                href="/ticket"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="inline-block w-full rounded-xl bg-[#1D1D1F] py-3.5 text-sm font-semibold text-white transition-opacity duration-150 hover:opacity-90"
              >
                Mein Ticket ansehen →
              </motion.a>
            </motion.div>
          )}

          {/* Error */}
          {state.step === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="card-clean rounded-2xl p-6 space-y-4"
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
                <XCircle className="h-6 w-6 text-red-500" />
              </div>
              <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>Fehler</h2>
              <p className="text-sm text-muted">{state.message}</p>
              <motion.a
                href="/"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="inline-block w-full rounded-xl bg-[#1D1D1F] py-3.5 text-sm font-semibold text-white transition-opacity duration-150 hover:opacity-90"
              >
                Zur Startseite
              </motion.a>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function ClaimPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted" />
        </div>
      }
    >
      <ClaimFlow />
    </Suspense>
  );
}
