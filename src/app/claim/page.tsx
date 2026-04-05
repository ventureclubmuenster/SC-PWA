'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';
import { Mail, CheckCircle, XCircle, Ticket, Loader2 } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';

type AttendeeRole = 'student' | 'entrepreneur' | 'other';

interface ClaimFormData {
  firstName: string;
  lastName: string;
  university: string;
  afterpartyRsvp: boolean;
  attendeeRole: AttendeeRole;
}

const STORAGE_KEY = 'claim_profile_data';

function saveFormToStorage(data: ClaimFormData) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
}

function loadFormFromStorage(): ClaimFormData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

function clearFormStorage() {
  try { localStorage.removeItem(STORAGE_KEY); } catch {}
}

type ClaimState =
  | { step: 'loading' }
  | { step: 'already-claimed' }
  | { step: 'form'; token: string; needsAuth: boolean }
  | { step: 'login-sent'; token: string; email: string }
  | { step: 'claiming'; token: string }
  | { step: 'success'; ticketId: string }
  | { step: 'error'; message: string };

function ClaimFlow() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [state, setState] = useState<ClaimState>({ step: 'loading' });
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [university, setUniversity] = useState('');
  const [afterpartyRsvp, setAfterpartyRsvp] = useState(false);
  const [attendeeRole, setAttendeeRole] = useState<AttendeeRole | ''>('');
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const claimTicket = useCallback(
    async (claimToken: string, profile: ClaimFormData) => {
      setState({ step: 'claiming', token: claimToken });

      try {
        const res = await fetch('/api/tickets/claim', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: claimToken, profile }),
        });

        const data = await res.json();

        if (!res.ok) {
          setState({ step: 'error', message: data.error || t.common.unknownError });
          return;
        }

        clearFormStorage();
        setState({ step: 'success', ticketId: data.ticketId });
      } catch {
        setState({ step: 'error', message: t.common.networkError });
      }
    },
    [t],
  );

  // On mount: validate token, check status, check auth, auto-claim if returning from email confirmation
  useEffect(() => {
    if (!token || token.length !== 64) {
      setState({ step: 'error', message: t.claim.invalidLink });
      return;
    }

    fetch(`/api/tickets/claim?token=${encodeURIComponent(token)}`, { cache: 'no-store' })
      .then((res) => {
        if (!res.ok) throw new Error('Status check failed');
        return res.json();
      })
      .then((data: { status?: string }) => {
        if (data.status === 'already-claimed') {
          setState({ step: 'already-claimed' });
          return;
        }
        if (data.status === 'expired') {
          setState({ step: 'error', message: t.claim.linkExpired });
          return;
        }
        if (data.status !== 'claimable') {
          setState({ step: 'error', message: t.claim.invalidLink });
          return;
        }

        const supabase = createClient();
        supabase.auth.getUser().then(({ data: { user } }) => {
          if (user) {
            // Returning from email confirmation — auto-claim with stored data
            const stored = loadFormFromStorage();
            if (stored) {
              claimTicket(token, stored);
            } else {
              // Authenticated but no stored data — show form
              setState({ step: 'form', token, needsAuth: false });
            }
          } else {
            setState({ step: 'form', token, needsAuth: true });
          }
        });
      })
      .catch(() => {
        setState({ step: 'error', message: t.common.networkError });
      });
  }, [token, claimTicket, t]);

  const getFormData = (): ClaimFormData | null => {
    if (!firstName.trim() || !lastName.trim() || !attendeeRole) {
      setFormError(t.claim.fillRequired);
      return null;
    }
    return {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      university: university.trim(),
      afterpartyRsvp,
      attendeeRole,
    };
  };

  // Submit for unauthenticated users: save data, trigger email auth
  const handleSubmitWithAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!email.trim()) {
      setFormError(t.claim.enterEmail);
      return;
    }

    const profile = getFormData();
    if (!profile) return;

    setFormLoading(true);
    saveFormToStorage(profile);

    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(`/claim?token=${token}`)}`;

    const { data, error } = await supabase.auth.signUp({
      email,
      password: crypto.randomUUID(),
      options: { emailRedirectTo: redirectTo },
    });

    if (error) {
      setFormError(error.message);
      setFormLoading(false);
      return;
    }

    if (data?.user?.identities?.length === 0) {
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirectTo },
      });
      if (otpError) {
        setFormError(otpError.message);
        setFormLoading(false);
        return;
      }
    }

    setState({ step: 'login-sent', token, email });
    setFormLoading(false);
  };

  // Submit for authenticated users: claim directly
  const handleSubmitDirect = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const profile = getFormData();
    if (!profile) return;

    setFormLoading(true);
    await claimTicket(token, profile);
    setFormLoading(false);
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
            {t.claim.title}
          </h1>
          <p className="text-sm font-medium text-muted">{t.common.startupContacts}</p>
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
              <p className="text-sm text-muted">{t.claim.loading}</p>
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
              <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>{t.claim.alreadyClaimedTitle}</h2>
              <p className="text-sm text-muted">
                {t.claim.alreadyClaimedDesc}
              </p>
              <motion.a
                href="/"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="inline-block w-full rounded-xl bg-[#1D1D1F] py-3.5 text-sm font-semibold text-white transition-opacity duration-150 hover:opacity-90"
              >
                {t.common.toHomepage}
              </motion.a>
            </motion.div>
          )}

          {/* Combined form: profile data + email (if not authenticated) */}
          {state.step === 'form' && (
            <motion.div
              key="form"
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
                  {t.claim.formDesc}
                </p>
              </div>

              <form
                onSubmit={state.needsAuth ? handleSubmitWithAuth : handleSubmitDirect}
                className="space-y-4"
              >
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder={t.claim.firstNamePlaceholder}
                    required
                    className="w-full rounded-xl px-4 py-3.5 text-sm input-field"
                  />
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder={t.claim.lastNamePlaceholder}
                    required
                    className="w-full rounded-xl px-4 py-3.5 text-sm input-field"
                  />
                </div>

                {state.needsAuth && (
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t.claim.emailPlaceholder}
                    required
                    className="w-full rounded-xl px-4 py-3.5 text-sm input-field"
                  />
                )}

                <input
                  type="text"
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  placeholder={t.claim.universityPlaceholder}
                  className="w-full rounded-xl px-4 py-3.5 text-sm input-field"
                />

                <div className="flex flex-col gap-2">
                  <p className="text-sm font-medium text-left" style={{ color: 'var(--foreground)' }}>{t.profile.role} *</p>
                  <div className="flex gap-2">
                    {([
                      { value: 'student' as const, label: t.profile.roleStudent },
                      { value: 'entrepreneur' as const, label: t.profile.roleEntrepreneur },
                      { value: 'other' as const, label: t.profile.roleOther },
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

                <div className="flex items-center justify-between rounded-xl px-4 py-3.5 input-field">
                  <span className="text-sm" style={{ color: 'var(--foreground)' }}>{t.profile.afterpartyRsvp}</span>
                  <button
                    type="button"
                    onClick={() => setAfterpartyRsvp(!afterpartyRsvp)}
                    className="h-6 w-11 rounded-full transition-colors duration-150"
                    style={{ background: afterpartyRsvp ? 'var(--accent, #1D1D1F)' : 'var(--toggle-off, #ccc)' }}
                  >
                    <div
                      className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-150 ${
                        afterpartyRsvp ? 'translate-x-5.5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>

                {formError && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15 }}
                    className="text-sm text-red-500"
                  >
                    {formError}
                  </motion.p>
                )}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  type="submit"
                  disabled={formLoading}
                  className="w-full rounded-xl bg-[#1D1D1F] py-3.5 text-sm font-semibold text-white transition-opacity duration-150 hover:opacity-90 disabled:opacity-50"
                >
                  {formLoading
                    ? t.claim.processing
                    : state.needsAuth
                      ? t.claim.confirmAndActivate
                      : t.claim.activate}
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
              <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>{t.claim.emailSentTitle}</h2>
              <p className="text-sm text-muted">
                {t.claim.emailSentDesc}
                <br />
                <span className="font-medium" style={{ color: 'var(--foreground)' }}>{state.email}</span>
              </p>
              <p className="text-xs text-muted">
                {t.claim.emailSentHint}
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
              <p className="text-sm text-muted">{t.claim.activatingTicket}</p>
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
              <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>{t.claim.successTitle}</h2>
              <p className="text-sm text-muted">
                {t.claim.successDesc}
              </p>
              <motion.a
                href="/ticket"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="inline-block w-full rounded-xl bg-[#1D1D1F] py-3.5 text-sm font-semibold text-white transition-opacity duration-150 hover:opacity-90"
              >
                {t.claim.viewTicket}
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
              <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>{t.common.error}</h2>
              <p className="text-sm text-muted">{state.message}</p>
              <motion.a
                href="/"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="inline-block w-full rounded-xl bg-[#1D1D1F] py-3.5 text-sm font-semibold text-white transition-opacity duration-150 hover:opacity-90"
              >
                {t.common.toHomepage}
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
