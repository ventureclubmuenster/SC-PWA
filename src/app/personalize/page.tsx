'use client';

import { useState, useEffect, Suspense, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
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

function PersonalizeFlow() {
  const searchParams = useSearchParams();
  const paramToken = searchParams.get('t') ?? '';
  const initialized = useRef(false);

  const [state, setState] = useState<PageState>(
    paramToken ? { step: 'loading' } : { step: 'error', message: 'Ungültiger oder fehlender Link.' }
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
  const [debugLogs, setDebugLogs] = useState<string[]>([]);

  const addLog = (msg: string) => {
    setDebugLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const encryptedToken = paramToken;

  // On mount: check ticket status, then register fingerprint only if claimable
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    if (!paramToken) return; // already showing error state from init

    addLog(`Token: ${paramToken.slice(0, 20)}...`);

    fetch(`/api/tickets/personalize?t=${encodeURIComponent(paramToken)}`, { cache: 'no-store' })
      .then((res) => {
        addLog(`Status check response: ${res.status}`);
        return res.json();
      })
      .then(async (data) => {
        addLog(`Ticket status: ${data.status || data.error || JSON.stringify(data)}`);

        if (data.status === 'activated') {
          setState({ step: 'activated' });
          return;
        }
        if (data.status === 'expired') {
          setState({ step: 'error', message: 'Dieser Link ist abgelaufen.' });
          return;
        }
        if (data.status === 'invalid') {
          setState({ step: 'error', message: 'Ungültiger Link.' });
          return;
        }

        // Ticket is claimable — register fingerprint for PWA handoff
        try {
          const fp = await getFingerprint();
          addLog(`Fingerprint: ${fp}`);
          const fpRes = await fetch('/api/tickets/personalize/register-fingerprint', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fingerprint: fp, encryptedToken: paramToken }),
          });
          const fpData = await fpRes.json();
          if (!fpRes.ok) {
            addLog(`FP registration failed: ${fpData.error || fpData.detail || JSON.stringify(fpData)}`);
          } else {
            addLog('FP registered ✓');
          }
        } catch (err) {
          addLog(`FP error: ${err instanceof Error ? err.message : String(err)}`);
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
        addLog(`Network error: ${err instanceof Error ? err.message : String(err)}`);
        setState({ step: 'error', message: 'Netzwerkfehler. Bitte versuche es erneut.' });
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
      setFormError('Bitte fülle alle Pflichtfelder aus.');
      return;
    }
    if (!privacyConsent || !termsConsent) {
      setFormError('Bitte stimme der Datenschutzerklärung und den AGB zu.');
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
        setFormError(data.error || 'Unbekannter Fehler.');
        setFormLoading(false);
        return;
      }

      setState({ step: 'code-sent', encryptedToken, email: email.trim() });
    } catch {
      setFormError('Netzwerkfehler. Bitte versuche es erneut.');
    }
    setFormLoading(false);
  };

  // Submit verification code
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (code.length !== 4) {
      setFormError('Bitte gib den vierstelligen Code ein.');
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
        setFormError(data.error || 'Unbekannter Fehler.');
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
      setFormError('Netzwerkfehler. Bitte versuche es erneut.');
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
        setFormError(data.error || 'Code konnte nicht erneut gesendet werden.');
      } else {
        setCode('');
        setFormError('');
      }
    } catch {
      setFormError('Netzwerkfehler.');
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
            Ticket personalisieren
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
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full" style={{ background: 'var(--surface-2)' }}>
                  <Download className="h-6 w-6" style={{ color: 'var(--accent)' }} />
                </div>
                <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
                  App installieren
                </h2>
                <p className="text-sm text-muted">
                  Für das beste Erlebnis installiere die Startup Contacts App auf deinem Gerät.
                </p>

                {!showInstallInstructions ? (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setShowInstallInstructions(true)}
                    className="w-full rounded-xl bg-[#1D1D1F] py-3.5 text-sm font-semibold text-white transition-opacity duration-150 hover:opacity-90"
                  >
                    Wie installiere ich die App?
                  </motion.button>
                ) : (
                  <div className="text-left space-y-3 text-sm text-muted">
                    <p><strong>iOS (Safari):</strong></p>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>Tippe auf das Teilen-Symbol (⬆) unten</li>
                      <li>{'Wähle „Zum Home-Bildschirm"'}</li>
                      <li>{'Tippe auf „Hinzufügen"'}</li>
                    </ol>
                    <p className="mt-3"><strong>Android (Chrome):</strong></p>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>Tippe auf das Menü (⋮) oben rechts</li>
                      <li>{'Wähle „App installieren" oder „Zum Startbildschirm hinzufügen"'}</li>
                    </ol>
                  </div>
                )}
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setState({ step: 'form', encryptedToken: state.encryptedToken })}
                className="w-full rounded-xl py-3.5 text-sm font-semibold transition-opacity duration-150 hover:opacity-90"
                style={{ background: 'var(--surface-2)', color: 'var(--foreground)' }}
              >
                Im Browser fortfahren →
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
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full" style={{ background: 'var(--surface-2)' }}>
                  <Ticket className="h-6 w-6 text-muted" />
                </div>
                <p className="text-sm text-muted">
                  Gib deine Daten ein, um dein Ticket zu personalisieren.
                </p>
              </div>

              <form onSubmit={handleSubmitForm} className="space-y-4">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Vorname *"
                    required
                    className="w-full rounded-xl px-4 py-3.5 text-sm input-field"
                  />
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Nachname *"
                    required
                    className="w-full rounded-xl px-4 py-3.5 text-sm input-field"
                  />
                </div>

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="E-Mail *"
                  required
                  className="w-full rounded-xl px-4 py-3.5 text-sm input-field"
                />

                {/* Role selection */}
                <div className="flex flex-col gap-2">
                  <p className="text-sm font-medium text-left" style={{ color: 'var(--foreground)' }}>Rolle *</p>
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

                {/* Afterparty RSVP */}
                <div className="flex items-center justify-between rounded-xl px-4 py-3.5 input-field">
                  <span className="text-sm" style={{ color: 'var(--foreground)' }}>Afterparty RSVP</span>
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
                <div className="flex items-center justify-between rounded-xl px-4 py-3.5 input-field">
                  <span className="text-sm" style={{ color: 'var(--foreground)' }}>
                    {cvFile ? cvFile.name : 'CV hochladen (optional)'}
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
                <div className="space-y-3 text-left">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={privacyConsent}
                      onChange={(e) => setPrivacyConsent(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded accent-[#1D1D1F]"
                    />
                    <span className="text-xs text-muted">
                      Ich stimme der{' '}
                      <a href="/datenschutz" target="_blank" className="underline" style={{ color: 'var(--accent)' }}>
                        Datenschutzerklärung
                      </a>{' '}
                      zu. *
                    </span>
                  </label>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={termsConsent}
                      onChange={(e) => setTermsConsent(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded accent-[#1D1D1F]"
                    />
                    <span className="text-xs text-muted">
                      Ich akzeptiere die{' '}
                      <a href="/agb" target="_blank" className="underline" style={{ color: 'var(--accent)' }}>
                        Allgemeinen Geschäftsbedingungen
                      </a>
                      . *
                    </span>
                  </label>
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
                  {formLoading ? 'Wird verarbeitet...' : 'Bestätigungscode anfordern'}
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
                  Code eingeben
                </h2>
                <p className="text-sm text-muted">
                  Wir haben einen vierstelligen Code an{' '}
                  <span className="font-medium" style={{ color: 'var(--foreground)' }}>{state.email}</span>{' '}
                  gesendet.
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
                    className="w-full rounded-xl px-4 py-4 text-center text-2xl font-bold tracking-[0.3em] input-field"
                    autoFocus
                  />

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
                    disabled={formLoading || code.length !== 4}
                    className="w-full rounded-xl bg-[#1D1D1F] py-3.5 text-sm font-semibold text-white transition-opacity duration-150 hover:opacity-90 disabled:opacity-50"
                  >
                    {formLoading ? 'Wird überprüft...' : 'Code bestätigen'}
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
                    E-Mail ändern
                  </button>
                  <button
                    onClick={handleResendCode}
                    disabled={formLoading}
                    className="text-xs font-medium text-muted transition-colors duration-150 disabled:opacity-50"
                  >
                    Code erneut senden
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
              <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
                Ticket aktiviert! 🎉
              </h2>
              <p className="text-sm text-muted">
                Dein Ticket wurde erfolgreich personalisiert und aktiviert.
              </p>
              {state.sessionError && (
                <p className="text-xs text-amber-500">{state.sessionError}</p>
              )}
              <motion.a
                href="/home"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="inline-block w-full rounded-xl bg-[#1D1D1F] py-3.5 text-sm font-semibold text-white transition-opacity duration-150 hover:opacity-90"
              >
                {state.sessionError ? 'Zur Anmeldung' : 'Zum Dashboard →'}
              </motion.a>
            </motion.div>
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
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full" style={{ background: 'var(--surface-2)' }}>
                <CheckCircle className="h-6 w-6 text-muted" />
              </div>
              <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
                Bereits aktiviert
              </h2>
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

        {/* Debug Logs */}
        {debugLogs.length > 0 && (
          <div className="mt-6 w-full rounded-xl p-4 text-left text-[10px] font-mono leading-relaxed space-y-0.5 overflow-auto max-h-48" style={{ background: 'var(--surface-2)', color: 'var(--muted)' }}>
            {debugLogs.map((log, i) => (
              <div key={i} className={log.includes('error') || log.includes('failed') || log.includes('Failed') ? 'text-red-400' : ''}>{log}</div>
            ))}
          </div>
        )}
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
