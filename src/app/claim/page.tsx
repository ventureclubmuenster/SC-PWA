'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';
import { Mail, CheckCircle, XCircle, Ticket, Loader2, User } from 'lucide-react';

type AttendeeRole = 'student' | 'entrepreneur' | 'other';

type ClaimState =
  | { step: 'loading' }
  | { step: 'already-claimed' }
  | { step: 'login'; token: string }
  | { step: 'login-sent'; token: string; email: string }
  | { step: 'profile'; token: string }
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
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [age, setAge] = useState('');
  const [attendeeRole, setAttendeeRole] = useState<AttendeeRole | ''>('');
  const [profileError, setProfileError] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);

  const claimTicket = useCallback(
    async (claimToken: string, profile: { firstName: string; lastName: string; age: number; attendeeRole: AttendeeRole }) => {
      setState({ step: 'claiming', token: claimToken });

      try {
        const res = await fetch('/api/tickets/claim', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: claimToken, profile }),
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

  // On mount: validate token format, check token status, then check auth state
  useEffect(() => {
    if (!token || token.length !== 64) {
      setState({ step: 'error', message: 'Ungültiger oder fehlender Claim-Link.' });
      return;
    }

    // Check token status first (no auth required)
    fetch(`/api/tickets/claim?token=${encodeURIComponent(token)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'already-claimed') {
          setState({ step: 'already-claimed' });
          return;
        }
        if (data.status === 'expired') {
          setState({ step: 'error', message: 'Dieser Link ist abgelaufen.' });
          return;
        }
        if (data.status === 'invalid') {
          setState({ step: 'error', message: 'Ungültiger oder fehlender Claim-Link.' });
          return;
        }

        // Token is claimable — check auth state
        const supabase = createClient();
        supabase.auth.getUser().then(({ data: { user } }) => {
          if (user) {
            setState({ step: 'profile', token });
          } else {
            setState({ step: 'login', token });
          }
        });
      })
      .catch(() => {
        setState({ step: 'error', message: 'Netzwerkfehler. Bitte versuche es erneut.' });
      });
  }, [token]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');

    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(`/claim?token=${token}`)}`;

    // Sign up new user → triggers "Confirm Sign Up" email
    const { data, error } = await supabase.auth.signUp({
      email,
      password: crypto.randomUUID(),
      options: { emailRedirectTo: redirectTo },
    });

    if (error) {
      setLoginError(error.message);
      setLoginLoading(false);
      return;
    }

    // User already exists (empty identities) → fall back to magic link
    if (data?.user?.identities?.length === 0) {
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirectTo },
      });
      if (otpError) {
        setLoginError(otpError.message);
        setLoginLoading(false);
        return;
      }
    }

    setState({ step: 'login-sent', token, email });
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

          {/* Already claimed */}
          {state.step === 'already-claimed' && (
            <motion.div
              key="already-claimed"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="card-clean rounded-2xl p-6 space-y-4"
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full" style={{ background: 'var(--surface-2)' }}>
                <CheckCircle className="h-6 w-6 text-muted" />
              </div>
              <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>Bereits eingelöst</h2>
              <p className="text-sm text-muted">
                Dieses Ticket wurde bereits aktiviert und kann nicht erneut eingelöst werden.
              </p>
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
                Nach der Bestätigung wirst du zur Ticket-Aktivierung weitergeleitet.
              </p>
            </motion.div>
          )}

          {/* Profile form */}
          {state.step === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.22, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-6"
            >
              <div className="card-clean rounded-2xl p-6 space-y-4">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full" style={{ background: 'var(--surface-2)' }}>
                  <User className="h-6 w-6 text-muted" />
                </div>
                <p className="text-sm text-muted">
                  Bitte gib deine Daten an, um dein Ticket zu aktivieren.
                </p>
              </div>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setProfileError('');

                  if (!firstName.trim() || !lastName.trim() || !age || !attendeeRole) {
                    setProfileError('Bitte fülle alle Felder aus.');
                    return;
                  }

                  const ageNum = parseInt(age, 10);
                  if (isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
                    setProfileError('Bitte gib ein gültiges Alter an.');
                    return;
                  }

                  setProfileLoading(true);
                  await claimTicket(state.token, {
                    firstName: firstName.trim(),
                    lastName: lastName.trim(),
                    age: ageNum,
                    attendeeRole,
                  });
                  setProfileLoading(false);
                }}
                className="space-y-4"
              >
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Vorname"
                    required
                    className="w-full rounded-xl px-4 py-3.5 text-sm input-field"
                  />
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Nachname"
                    required
                    className="w-full rounded-xl px-4 py-3.5 text-sm input-field"
                  />
                </div>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="Alter"
                  required
                  min={1}
                  max={120}
                  className="w-full rounded-xl px-4 py-3.5 text-sm input-field"
                />
                <div className="flex flex-col gap-2">
                  <p className="text-sm font-medium text-left" style={{ color: 'var(--foreground)' }}>Rolle</p>
                  <div className="flex gap-2">
                    {([
                      { value: 'student' as const, label: 'Studierende/r' },
                      { value: 'entrepreneur' as const, label: 'Unternehmer' },
                      { value: 'other' as const, label: 'Sonstiges' },
                    ]).map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setAttendeeRole(option.value)}
                        className={`flex-1 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-150 ${
                          attendeeRole === option.value
                            ? 'bg-[#1D1D1F] text-white'
                            : 'input-field'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
                {profileError && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15 }}
                    className="text-sm text-red-500"
                  >
                    {profileError}
                  </motion.p>
                )}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  type="submit"
                  disabled={profileLoading}
                  className="w-full rounded-xl bg-[#1D1D1F] py-3.5 text-sm font-semibold text-white transition-opacity duration-150 hover:opacity-90 disabled:opacity-50"
                >
                  {profileLoading ? 'Wird aktiviert...' : 'Ticket aktivieren'}
                </motion.button>
              </form>
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
