'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ArrowLeft, KeyRound, Mail, AlertCircle } from 'lucide-react';
import { getFingerprint } from '@/lib/fingerprint';
import { useLanguage } from '@/lib/i18n';

type LoginState =
  | { step: 'checking-fingerprint' }
  | { step: 'email' }
  | { step: 'code-sent'; email: string }
  | { step: 'verifying' };

function LoginFlow() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const router = useRouter();
  const next = searchParams.get('next');
  const initialized = useRef(false);

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
      setError(t.login.enterFourDigitCode);
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
        setError(data.error || t.login.invalidCode);
        setState({ step: 'code-sent', email: currentEmail });
        setLoading(false);
        return;
      }

      router.push(next || '/home');
    } catch {
      setError(t.common.networkError);
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
        setError(data.error || t.login.resendFailed);
      }
    } catch {
      setError(t.common.networkErrorShort);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="pb-2"
      >
        <h1 className="text-[28px] font-extrabold tracking-tight">
          <span className="gradient-accent-text">{t.login.title}</span>
        </h1>
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
          className="mt-1.5 text-sm text-muted"
        >
          {t.login.subtitle}
        </motion.p>
      </motion.div>

      <AnimatePresence mode="wait">
        {state.step === 'checking-fingerprint' && (
          <motion.div
            key="checking-fingerprint"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="card-clean rounded-2xl p-6 space-y-4 text-center"
          >
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted" />
            <p className="text-sm text-muted">{t.common.loading}</p>
          </motion.div>
        )}

        {state.step === 'email' && (
          <motion.div
            key="email"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.22, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-4"
          >
            {showPwaHint && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="card-clean rounded-2xl p-4 flex items-start gap-3"
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(251, 191, 36, 0.15)' }}
                >
                  <AlertCircle className="h-4 w-4" style={{ color: 'var(--status-warning)' }} />
                </div>
                <p className="text-xs" style={{ color: 'var(--status-warning)' }}>
                  {t.login.pwaHint}
                </p>
              </motion.div>
            )}

            <div className="card-clean rounded-2xl p-5 space-y-3">
              <div className="flex items-start gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: 'rgba(247,108,7,0.15)' }}
                >
                  <Mail className="h-4 w-4" style={{ color: 'var(--accent)' }} />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>{t.login.ticketReceived}</p>
                  <p className="text-xs text-muted">{t.login.ticketReceivedDesc}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: 'rgba(247,108,7,0.15)' }}
                >
                  <KeyRound className="h-4 w-4" style={{ color: 'var(--accent)' }} />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>{t.login.alreadyRedeemed}</p>
                  <p className="text-xs text-muted">{t.login.alreadyRedeemedDesc}</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSendCode} className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.login.emailPlaceholder}
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
                className="w-full btn-primary rounded-2xl py-3.5 text-sm font-semibold flex items-center justify-center gap-2 transition-opacity duration-150 disabled:opacity-50"
              >
                {loading ? t.login.sendingCode : t.login.signIn}
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
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'var(--surface-3)' }}
                >
                  <KeyRound className="h-5 w-5" style={{ color: 'var(--accent)' }} />
                </div>
                <div>
                  <h2 className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>
                    {t.login.enterCode}
                  </h2>
                  <p className="text-xs text-muted">
                    {t.login.codeHint}
                  </p>
                </div>
              </div>

              <div
                className="flex items-center gap-2 rounded-xl px-3.5 py-2.5"
                style={{ background: 'rgba(247,108,7,0.08)' }}
              >
                <Mail className="h-4 w-4 shrink-0" style={{ color: 'var(--accent)' }} />
                <span className="text-xs font-medium truncate" style={{ color: 'var(--accent)' }}>
                  {state.email}
                </span>
              </div>

              <form onSubmit={handleVerifyCode} className="space-y-3">
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
                  className="w-full btn-primary rounded-2xl py-3.5 text-sm font-semibold transition-opacity duration-150 disabled:opacity-50"
                >
                  {loading ? t.login.verifying : t.login.confirmCode}
                </motion.button>
              </form>

              <div className="flex justify-between pt-1">
                <button
                  onClick={() => {
                    setError('');
                    setCode('');
                    setState({ step: 'email' });
                  }}
                  className="flex items-center gap-1 text-xs font-medium text-muted transition-colors duration-150"
                >
                  <ArrowLeft className="h-3 w-3" />
                  {t.login.differentEmail}
                </button>
                <button
                  onClick={handleResendCode}
                  disabled={loading}
                  className="text-xs font-medium transition-colors duration-150 disabled:opacity-50"
                  style={{ color: 'var(--accent)' }}
                >
                  {t.login.resendCode}
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
            className="card-clean rounded-2xl p-6 space-y-4 text-center"
          >
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted" />
            <p className="text-sm text-muted">{t.login.signingIn}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function LoginPage() {
  return (
    <>
      {/* Gradient header — matches dashboard */}
      <div className="fixed top-0 left-0 right-0 z-0 h-32 top-bar-gradient" />

      {/* Logo in top area */}
      <div className="fixed top-0 left-0 right-0 z-[5] h-20">
        <div className="mx-auto max-w-lg px-5 h-full flex items-center">
          <div className="flex items-center rounded-xl bg-black/30 backdrop-blur-sm px-3 py-1.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/SC Logo white.png"
              alt="Startup Contacts"
              className="h-20 object-contain"
            />
          </div>
        </div>
      </div>

      {/* Main content card — same as dashboard layout */}
      <main
        className="relative z-10 mt-24 min-h-screen rounded-t-[36px] px-5 pt-8 pb-32"
        style={{ background: 'var(--background)' }}
      >
        <div className="mx-auto max-w-lg">
          <Suspense
            fallback={
              <div className="card-clean rounded-2xl p-6 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted" />
              </div>
            }
          >
            <LoginFlow />
          </Suspense>
        </div>
      </main>
    </>
  );
}
