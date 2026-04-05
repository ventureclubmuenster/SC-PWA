'use client';

import { useState, useEffect, Suspense, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import {
  Loader2,
  CheckCircle,
  XCircle,
  Ticket,
  ArrowLeft,
  Upload,
  Download,
} from 'lucide-react';
import { getFingerprint } from '@/lib/fingerprint';
import { useLanguage } from '@/lib/i18n';

type AttendeeRole = 'student' | 'entrepreneur' | 'other';

type PageState =
  | { step: 'loading' }
  | { step: 'install-pwa'; encryptedToken: string; ticketLabel?: string }
  | { step: 'form'; encryptedToken: string }
  | { step: 'code-sent'; encryptedToken: string; email: string }
  | { step: 'verifying' }
  | { step: 'success'; ticketId: string; sessionError?: string }
  | { step: 'activated' }
  | { step: 'error'; message: string };

const FORM_STORAGE_KEY = 'personalize_form_data';

function SuccessRedirect({ sessionError }: { sessionError?: string }) {
  const router = useRouter();
  const { t } = useLanguage();

  useEffect(() => {
    if (!sessionError) {
      const timer = setTimeout(() => router.replace('/home'), 2000);
      return () => clearTimeout(timer);
    }
  }, [sessionError, router]);

  return (
    <motion.div
      key="success"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      className="card-clean rounded-2xl p-6 space-y-4"
    >
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: 'rgba(74, 222, 128, 0.1)' }}>
        <CheckCircle className="h-6 w-6" style={{ color: 'var(--status-success)' }} />
      </div>
      <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
        {t.personalize.successTitle}
      </h2>
      <p className="text-sm text-muted">
        {t.personalize.successDesc}
      </p>
      {sessionError ? (
        <>
          <p className="text-xs" style={{ color: 'var(--status-warning)' }}>{sessionError}</p>
          <motion.a
            href="/"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="inline-block w-full rounded-2xl py-3.5 text-sm font-semibold transition-opacity duration-150 hover:opacity-90 btn-primary gradient-glow"
          >
            {t.personalize.toLogin}
          </motion.a>
        </>
      ) : (
        <p className="text-xs text-muted">{t.personalize.redirecting}</p>
      )}
    </motion.div>
  );
}

function PersonalizeFlow() {
  const searchParams = useSearchParams();
  const paramToken = searchParams.get('t') ?? '';
  const initialized = useRef(false);
  const { t } = useLanguage();

  const [state, setState] = useState<PageState>(
    paramToken ? { step: 'loading' } : { step: 'error', message: t.personalize.invalidLink }
  );
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [attendeeRole, setAttendeeRole] = useState<AttendeeRole | ''>('');
  const [afterpartyRsvp, setAfterpartyRsvp] = useState(false);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [termsConsent, setTermsConsent] = useState(false);
  const [code, setCode] = useState('');
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [showInstallInstructions, setShowInstallInstructions] = useState(false);

  const encryptedToken = paramToken;

  // On mount: check ticket status, then register fingerprint only if claimable
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    if (!paramToken) return; // already showing error state from init


    fetch(`/api/tickets/personalize?t=${encodeURIComponent(paramToken)}`, { cache: 'no-store' })
      .then((res) => {
        return res.json();
      })
      .then(async (data) => {

        if (data.status === 'activated') {
          setState({ step: 'activated' });
          return;
        }
        if (data.status === 'expired') {
          setState({ step: 'error', message: t.personalize.linkExpired });
          return;
        }
        if (data.status === 'invalid') {
          setState({ step: 'error', message: t.personalize.invalidLinkShort });
          return;
        }

        // Ticket is claimable — register fingerprint for PWA handoff
        try {
          const fp = await getFingerprint();
          const fpRes = await fetch('/api/tickets/personalize/register-fingerprint', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fingerprint: fp, encryptedToken: paramToken }),
          });
          const fpData = await fpRes.json();
          if (!fpRes.ok) {
          } else {
          }
        } catch (err) {
        }

        // Check if running as installed PWA
        const isStandalone =
          window.matchMedia('(display-mode: standalone)').matches ||
          (window.navigator as unknown as { standalone?: boolean }).standalone === true;

        if (isStandalone) {
          setState({ step: 'form', encryptedToken: paramToken });
        } else {
          setState({
            step: 'install-pwa',
            encryptedToken: paramToken,
            ticketLabel: data.ticketLabel,
          });
        }

        // Restore saved form data
        try {
          const saved = localStorage.getItem(FORM_STORAGE_KEY);
          if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed.firstName) setFirstName(parsed.firstName);
            if (parsed.lastName) setLastName(parsed.lastName);
            if (parsed.email) setEmail(parsed.email);
            if (parsed.attendeeRole) setAttendeeRole(parsed.attendeeRole);
            if (parsed.afterpartyRsvp) setAfterpartyRsvp(parsed.afterpartyRsvp);
          }
        } catch { /* ignore */ }
      })
      .catch((err) => {
        setState({ step: 'error', message: t.common.networkError });
      });
  }, [paramToken]);

  const saveFormData = () => {
    try {
      localStorage.setItem(
        FORM_STORAGE_KEY,
        JSON.stringify({ firstName, lastName, email, attendeeRole, afterpartyRsvp }),
      );
    } catch { /* ignore */ }
  };

  // Submit personalization form → send verification code
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!firstName.trim() || !lastName.trim() || !email.trim() || !attendeeRole) {
      setFormError(t.personalize.fillRequired);
      return;
    }
    if (!privacyConsent || !termsConsent) {
      setFormError(t.personalize.acceptPrivacyAndTerms);
      return;
    }

    setFormLoading(true);
    saveFormData();

    try {
      const res = await fetch('/api/tickets/personalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          encryptedToken,
          email: email.trim(),
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          attendeeRole,
          afterpartyRsvp,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || t.common.unknownError);
        setFormLoading(false);
        return;
      }

      setState({ step: 'code-sent', encryptedToken, email: email.trim() });
    } catch {
      setFormError(t.common.networkError);
    }
    setFormLoading(false);
  };

  // Submit verification code
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (code.length !== 4) {
      setFormError(t.login.enterFourDigitCode);
      return;
    }

    setFormLoading(true);
    setState({ step: 'verifying' });

    try {
      const res = await fetch('/api/tickets/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          encryptedToken,
          email: email.trim(),
          code,
          profile: {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            attendeeRole,
            afterpartyRsvp,
            privacyConsent,
            termsConsent,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || t.common.unknownError);
        setState({ step: 'code-sent', encryptedToken, email: email.trim() });
        setFormLoading(false);
        return;
      }

      // Clear stored form data
      localStorage.removeItem(FORM_STORAGE_KEY);

      setState({
        step: 'success',
        ticketId: data.ticketId,
        sessionError: data.sessionError,
      });
    } catch {
      setFormError(t.common.networkError);
      setState({ step: 'code-sent', encryptedToken, email: email.trim() });
    }
    setFormLoading(false);
  };

  // Resend code
  const handleResendCode = async () => {
    setFormError('');
    setFormLoading(true);

    try {
      const res = await fetch('/api/tickets/personalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          encryptedToken,
          email: email.trim(),
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          attendeeRole,
          afterpartyRsvp,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setFormError(data.error || t.login.resendFailed);
      } else {
        setCode('');
        setFormError('');
      }
    } catch {
      setFormError(t.common.networkErrorShort);
    }
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
            {t.personalize.title}
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
              <p className="text-sm text-muted">{t.common.loading}</p>
            </motion.div>
          )}

          {/* PWA Install Prompt */}
          {state.step === 'install-pwa' && (
            <motion.div
              key="install-pwa"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-4"
            >
              <div className="card-clean rounded-2xl p-6 space-y-4">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: 'var(--surface-3)' }}>
                  <Download className="h-6 w-6" style={{ color: 'var(--accent)' }} />
                </div>
                <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
                  {t.personalize.installApp}
                </h2>
                <p className="text-sm text-muted">
                  {t.personalize.installDesc}
                </p>

                {!showInstallInstructions ? (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setShowInstallInstructions(true)}
                    className="w-full rounded-2xl py-3.5 text-sm font-semibold transition-opacity duration-150 hover:opacity-90 btn-primary gradient-glow"
                  >
                    {t.personalize.howToInstall}
                  </motion.button>
                ) : (
                  <div className="text-left space-y-3 text-sm text-muted">
                    <p><strong>{t.personalize.iosSafari}</strong></p>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>{t.personalize.iosStep1}</li>
                      <li>{t.personalize.iosStep2}</li>
                      <li>{t.personalize.iosStep3}</li>
                    </ol>
                    <p className="mt-3"><strong>{t.personalize.androidChrome}</strong></p>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>{t.personalize.androidStep1}</li>
                      <li>{t.personalize.androidStep2}</li>
                    </ol>
                  </div>
                )}
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setState({ step: 'form', encryptedToken: state.encryptedToken })}
                className="w-full rounded-2xl py-3.5 text-sm font-semibold transition-opacity duration-150 hover:opacity-90 btn-glass"
              >
                {t.personalize.continueInBrowser}
              </motion.button>
            </motion.div>
          )}

          {/* Personalization Form */}
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
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: 'var(--surface-3)' }}>
                  <Ticket className="h-6 w-6 text-muted" />
                </div>
                <p className="text-sm text-muted">
                  {t.personalize.enterData}
                </p>
              </div>

              <form onSubmit={handleSubmitForm} className="space-y-4">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder={t.personalize.firstNamePlaceholder}
                    required
                    className="w-full rounded-2xl px-4 py-3.5 text-sm input-field"
                  />
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder={t.personalize.lastNamePlaceholder}
                    required
                    className="w-full rounded-2xl px-4 py-3.5 text-sm input-field"
                  />
                </div>

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t.personalize.emailPlaceholder}
                  required
                  className="w-full rounded-2xl px-4 py-3.5 text-sm input-field"
                />

                {/* Role selection */}
                <div className="flex flex-col gap-2">
                  <p className="text-sm font-medium text-left" style={{ color: 'var(--foreground)' }}>{t.personalize.roleLabel}</p>
                  <div className="flex gap-2">
                    {([
                      { value: 'student' as const, label: t.personalize.roleStudent },
                      { value: 'entrepreneur' as const, label: t.personalize.roleEntrepreneur },
                      { value: 'other' as const, label: t.personalize.roleOther },
                    ]).map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setAttendeeRole(option.value)}
                        className={`flex-1 rounded-2xl px-3 py-3 text-sm font-medium transition-all duration-150 ${
                          attendeeRole === option.value
                            ? 'selected-state'
                            : 'input-field'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Afterparty RSVP */}
                <div className="flex items-center justify-between rounded-2xl px-4 py-3.5 input-field">
                  <span className="text-sm" style={{ color: 'var(--foreground)' }}>{t.personalize.afterpartyRsvp}</span>
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

                {/* CV Upload */}
                <div className="flex items-center justify-between rounded-2xl px-4 py-3.5 input-field">
                  <span className="text-sm" style={{ color: 'var(--foreground)' }}>
                    {cvFile ? cvFile.name : t.personalize.cvUpload}
                  </span>
                  <label className="cursor-pointer">
                    <Upload className="h-5 w-5 text-muted" />
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      className="hidden"
                      onChange={(e) => setCvFile(e.target.files?.[0] ?? null)}
                    />
                  </label>
                </div>

                {/* Consent checkboxes */}
                <div className="space-y-2 text-left">
                  <label className="flex items-center gap-3 cursor-pointer rounded-2xl px-4 py-3 transition-colors duration-150" style={{ background: 'var(--surface-2)' }}>
                    <input
                      type="checkbox"
                      checked={privacyConsent}
                      onChange={(e) => setPrivacyConsent(e.target.checked)}
                      className="h-5 w-5 shrink-0 rounded"
                      style={{ accentColor: 'var(--accent)' }}
                    />
                    <span className="text-sm" style={{ color: 'var(--foreground)' }}>
                      {t.personalize.privacyConsentPrefix}
                      <a href="/datenschutz" target="_blank" className="font-medium underline underline-offset-2" style={{ color: 'var(--accent)' }}>
                        {t.personalize.privacyPolicy}
                      </a>
                      {t.personalize.privacyConsentSuffix}
                    </span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer rounded-2xl px-4 py-3 transition-colors duration-150" style={{ background: 'var(--surface-2)' }}>
                    <input
                      type="checkbox"
                      checked={termsConsent}
                      onChange={(e) => setTermsConsent(e.target.checked)}
                      className="h-5 w-5 shrink-0 rounded"
                      style={{ accentColor: 'var(--accent)' }}
                    />
                    <span className="text-sm" style={{ color: 'var(--foreground)' }}>
                      {t.personalize.termsConsentPrefix}
                      <a href="/agb" target="_blank" className="font-medium underline underline-offset-2" style={{ color: 'var(--accent)' }}>
                        {t.personalize.terms}
                      </a>
                      {t.personalize.termsConsentSuffix}
                    </span>
                  </label>
                </div>

                {formError && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15 }}
                    className="text-sm"
                    style={{ color: 'var(--status-error)' }}
                  >
                    {formError}
                  </motion.p>
                )}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  type="submit"
                  disabled={formLoading}
                  className="w-full rounded-2xl py-3.5 text-sm font-semibold transition-opacity duration-150 hover:opacity-90 disabled:opacity-50 btn-primary gradient-glow"
                >
                  {formLoading ? t.personalize.processing : t.personalize.requestCode}
                </motion.button>
              </form>
            </motion.div>
          )}

          {/* Code Entry */}
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
                <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
                  {t.personalize.enterCodeTitle}
                </h2>
                <p className="text-sm text-muted">
                  {t.personalize.codeSentTo}{' '}
                  <span className="font-medium" style={{ color: 'var(--foreground)' }}>{state.email}</span>{' '}
                  {t.personalize.codeSentToSuffix}
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

                  {formError && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.15 }}
                      className="text-sm"
                      style={{ color: 'var(--status-error)' }}
                    >
                      {formError}
                    </motion.p>
                  )}

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    type="submit"
                    disabled={formLoading || code.length !== 4}
                    className="w-full rounded-2xl py-3.5 text-sm font-semibold transition-opacity duration-150 hover:opacity-90 disabled:opacity-50 btn-primary gradient-glow"
                  >
                    {formLoading ? t.login.verifying : t.login.confirmCode}
                  </motion.button>
                </form>

                <div className="flex justify-between">
                  <button
                    onClick={() => {
                      setFormError('');
                      setCode('');
                      setState({ step: 'form', encryptedToken: state.encryptedToken });
                    }}
                    className="flex items-center gap-1 text-xs font-medium text-muted transition-colors duration-150"
                  >
                    <ArrowLeft className="h-3 w-3" />
                    {t.personalize.changeEmail}
                  </button>
                  <button
                    onClick={handleResendCode}
                    disabled={formLoading}
                    className="text-xs font-medium text-muted transition-colors duration-150 disabled:opacity-50"
                  >
                    {t.login.resendCode}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Verifying */}
          {state.step === 'verifying' && (
            <motion.div
              key="verifying"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="card-clean rounded-2xl p-6 space-y-4"
            >
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted" />
              <p className="text-sm text-muted">{t.personalize.activating}</p>
            </motion.div>
          )}

          {/* Success */}
          {state.step === 'success' && (
            <SuccessRedirect sessionError={state.sessionError} />
          )}

          {/* Already activated */}
          {state.step === 'activated' && (
            <motion.div
              key="activated"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="card-clean rounded-2xl p-6 space-y-4"
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: 'var(--surface-3)' }}>
                <CheckCircle className="h-6 w-6 text-muted" />
              </div>
              <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
                {t.personalize.alreadyActivatedTitle}
              </h2>
              <p className="text-sm text-muted">
                {t.personalize.alreadyActivatedDesc}
              </p>
              <motion.a
                href="/"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="inline-block w-full rounded-2xl py-3.5 text-sm font-semibold transition-opacity duration-150 hover:opacity-90 btn-primary gradient-glow"
              >
                {t.common.toHomepage}
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
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
                <XCircle className="h-6 w-6" style={{ color: 'var(--status-error)' }} />
              </div>
              <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>{t.common.error}</h2>
              <p className="text-sm text-muted">{state.message}</p>
              <motion.a
                href="/"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="inline-block w-full rounded-2xl py-3.5 text-sm font-semibold transition-opacity duration-150 hover:opacity-90 btn-primary gradient-glow"
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

export default function PersonalizePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted" />
        </div>
      }
    >
      <PersonalizeFlow />
    </Suspense>
  );
}
