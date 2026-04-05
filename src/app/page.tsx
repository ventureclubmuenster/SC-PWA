'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Loader2, ArrowLeft, KeyRound } from 'lucide-react';
import { getFingerprint } from '@/lib/fingerprint';

const OFFSETS = ['0%', '-33%', '-66%', '-22%', '-55%', '-11%', '-44%', '-77%', '-30%', '-60%', '-15%', '-50%', '-5%', '-40%', '-70%'];

function WatermarkBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 overflow-hidden select-none"
      style={{ zIndex: 0 }}
    >
      <div className="absolute inset-0 flex flex-col" style={{ gap: '1.1rem', paddingTop: '0.5rem' }}>
        {OFFSETS.map((offset, i) => (
          <div
            key={i}
            className="whitespace-nowrap font-black"
            style={{
              fontSize: 'clamp(2rem, 6vw, 4.5rem)',
              color: 'var(--foreground)',
              opacity: 0.028,
              letterSpacing: '0.14em',
              transform: `translateX(${offset})`,
            }}
          >
            {'STARTUP\u00A0CONTACTS\u00A0\u00A0\u00A0STARTUP\u00A0CONTACTS\u00A0\u00A0\u00A0STARTUP\u00A0CONTACTS\u00A0\u00A0\u00A0STARTUP\u00A0CONTACTS'}
          </div>
        ))}
      </div>
    </div>
  );
}

type LoginState =
  | { step: 'checking-fingerprint' }
  | { step: 'email' }
  | { step: 'code-sent'; email: string }
  | { step: 'verifying' };

function LoginFlow() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const next = searchParams.get('next');
  const initialized = useRef(false);

  // Detect standalone PWA mode
  const isStandalone = typeof window !== 'undefined' && (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );

  const [state, setState] = useState<LoginState>(
    isStandalone ? { step: 'checking-fingerprint' } : { step: 'email' }
  );
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPwaHint, setShowPwaHint] = useState(false);

  // On mount in PWA mode: check for pending personalization by fingerprint
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    if (!isStandalone) return;

    getFingerprint()
      .then((fp) =>
        fetch('/api/tickets/personalize/lookup-fingerprint', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fingerprint: fp }),
        }),
      )
      .then((res) => res.json())
      .then((data) => {
        if (data.found && data.encryptedToken) {
          router.replace(`/personalize?t=${encodeURIComponent(data.encryptedToken)}`);
        } else {
          // First PWA launch without a linked ticket → show hint once
          const hintKey = 'pwa_first_launch_hint_shown';
          if (!localStorage.getItem(hintKey)) {
            setShowPwaHint(true);
            localStorage.setItem(hintKey, '1');
          }
          setState({ step: 'email' });
        }
      })
      .catch(() => {
        setState({ step: 'email' });
      });
  }, [isStandalone, router]);

  const currentEmail = state.step === 'code-sent' ? state.email : email.trim();

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
    } catch {
      // Silently ignore – always proceed to code screen
    }

    setState({ step: 'code-sent', email: email.trim() });
    setLoading(false);
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (code.length !== 4) {
      setError('Bitte gib den vierstelligen Code ein.');
      return;
    }

    setLoading(true);
    setState({ step: 'verifying' });

    try {
      const res = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: currentEmail, code }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Ungültiger Code.');
        setState({ step: 'code-sent', email: currentEmail });
        setLoading(false);
        return;
      }

      router.push(next || '/home');
    } catch {
      setError('Netzwerkfehler. Bitte versuche es erneut.');
      setState({ step: 'code-sent', email: currentEmail });
    }
    setLoading(false);
  };

  const handleResendCode = async () => {
    setError('');
    setLoading(true);
    setCode('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: currentEmail }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Code konnte nicht erneut gesendet werden.');
      }
    } catch {
      setError('Netzwerkfehler.');
    }
    setLoading(false);
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-6" style={{ zIndex: 1 }}>
      <div className="w-full max-w-sm space-y-8 text-center">
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
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--foreground)' }}>Startup Contacts</h1>
          <p className="text-sm font-medium text-muted">Venture Club Münster</p>
        </motion.div>

        <AnimatePresence mode="wait">
          {state.step === 'checking-fingerprint' && (
            <motion.div
              key="checking-fingerprint"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted" />
              <p className="text-sm text-muted">Wird geladen...</p>
            </motion.div>
          )}

          {state.step === 'email' && (
            <motion.div
              key="email"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.22, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-4"
            >
              <div className="card-clean rounded-2xl p-5 space-y-2 text-left">
                {showPwaHint && (
                  <div className="rounded-2xl p-3 mb-2 text-xs" style={{ color: 'var(--status-warning)', background: 'rgba(251, 191, 36, 0.1)' }}>
                    Kein Ticket gefunden. Bitte fahre mit der Ticket-Personalisierung im Browser fort – öffne dazu den Link in deiner Bestellungsmail.
                  </div>
                )}
                <p className="text-sm text-muted">
                  <span className="font-semibold" style={{ color: 'var(--foreground)' }}>Ticket erhalten?</span>{' '}
                  Personalisiere es über den Link in deiner Bestellungsmail.
                </p>
                <p className="text-sm text-muted">
                  <span className="font-semibold" style={{ color: 'var(--foreground)' }}>Bereits eingelöst?</span>{' '}
                  Melde dich mit deiner E-Mail an.
                </p>
              </div>

              <form onSubmit={handleSendCode} className="space-y-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="deine@email.com"
                  required
                  className="w-full rounded-2xl px-4 py-3.5 text-sm input-field"
                />
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15 }}
                    className="text-sm"
                    style={{ color: 'var(--status-error)' }}
                  >
                    {error}
                  </motion.p>
                )}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-2xl py-3.5 text-sm font-semibold transition-opacity duration-150 disabled:opacity-50 btn-primary gradient-glow"
                >
                  {loading ? 'Wird gesendet...' : 'Anmelden'}
                </motion.button>
              </form>
            </motion.div>
          )}

          {state.step === 'code-sent' && (
            <motion.div
              key="code-sent"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-4"
            >
              <div className="card-clean rounded-2xl p-6 space-y-4">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: 'var(--surface-3)' }}>
                  <KeyRound className="h-6 w-6" style={{ color: 'var(--accent)' }} />
                </div>
                <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
                  Code eingeben
                </h2>
                <p className="text-sm text-muted">
                  Wenn ein Ticket unter dieser E-Mail hinterlegt ist, erhältst du einen Code an{' '}
                  <span className="font-medium" style={{ color: 'var(--foreground)' }}>{state.email}</span>.
                </p>

                <form onSubmit={handleVerifyCode} className="space-y-4">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={4}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="0000"
                    className="w-full rounded-2xl px-4 py-4 text-center text-2xl font-bold tracking-[0.3em] input-field"
                    autoFocus
                  />

                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.15 }}
                      className="text-sm"
                      style={{ color: 'var(--status-error)' }}
                    >
                      {error}
                    </motion.p>
                  )}

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    type="submit"
                    disabled={loading || code.length !== 4}
                    className="w-full rounded-2xl py-3.5 text-sm font-semibold transition-opacity duration-150 disabled:opacity-50 btn-primary gradient-glow"
                  >
                    {loading ? 'Wird überprüft...' : 'Code bestätigen'}
                  </motion.button>
                </form>

                <div className="flex justify-between">
                  <button
                    onClick={() => {
                      setError('');
                      setCode('');
                      setState({ step: 'email' });
                    }}
                    className="flex items-center gap-1 text-xs font-medium text-muted transition-colors duration-150"
                  >
                    <ArrowLeft className="h-3 w-3" />
                    Andere E-Mail
                  </button>
                  <button
                    onClick={handleResendCode}
                    disabled={loading}
                    className="text-xs font-medium text-muted transition-colors duration-150 disabled:opacity-50"
                  >
                    Code erneut senden
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {state.step === 'verifying' && (
            <motion.div
              key="verifying"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="card-clean rounded-2xl p-6 space-y-4"
            >
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted" />
              <p className="text-sm text-muted">Wird angemeldet...</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <>
      <WatermarkBackground />
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted" />
          </div>
        }
      >
        <LoginFlow />
      </Suspense>
    </>
  );
}
