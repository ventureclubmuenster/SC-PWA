'use client';

import { useState, useEffect, Suspense, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import {
  Loader2,
  CheckCircle,
  XCircle,
  Send,
  RotateCcw,
  Clock,
} from 'lucide-react';

type PageState =
  | { step: 'loading' }
  | { step: 'form'; encryptedToken: string }
  | { step: 'transfer-pending'; encryptedToken: string; transferToEmail: string }
  | { step: 'success'; email: string }
  | { step: 'revoked' }
  | { step: 'activated' }
  | { step: 'error'; message: string };

function TransferFlow() {
  const searchParams = useSearchParams();
  const encryptedToken = searchParams.get('t') ?? '';
  const initialized = useRef(false);

  const [state, setState] = useState<PageState>(
    encryptedToken ? { step: 'loading' } : { step: 'error', message: 'Ungültiger oder fehlender Link.' }
  );
  const [recipientEmail, setRecipientEmail] = useState('');
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // On mount: check token status
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    if (!encryptedToken) return; // already showing error from init

    fetch(`/api/tickets/transfer?t=${encodeURIComponent(encryptedToken)}`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'activated') {
          setState({ step: 'activated' });
        } else if (data.status === 'transfer-pending') {
          setState({
            step: 'transfer-pending',
            encryptedToken,
            transferToEmail: data.transferToEmail,
          });
        } else if (data.status === 'expired') {
          setState({ step: 'error', message: 'Dieser Link ist abgelaufen.' });
        } else if (data.status === 'invalid') {
          setState({ step: 'error', message: 'Ungültiger Link.' });
        } else {
          setState({ step: 'form', encryptedToken });
        }
      })
      .catch(() => {
        setState({ step: 'error', message: 'Netzwerkfehler. Bitte versuche es erneut.' });
      });
  }, [encryptedToken]);

  // Submit transfer
  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!recipientEmail.trim()) {
      setFormError('Bitte gib eine E-Mail-Adresse ein.');
      return;
    }

    setFormLoading(true);

    try {
      const res = await fetch('/api/tickets/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          encryptedToken,
          recipientEmail: recipientEmail.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || 'Unbekannter Fehler.');
        setFormLoading(false);
        return;
      }

      setState({ step: 'success', email: recipientEmail.trim() });
    } catch {
      setFormError('Netzwerkfehler. Bitte versuche es erneut.');
    }
    setFormLoading(false);
  };

  // Revoke transfer
  const handleRevoke = async () => {
    setFormError('');
    setFormLoading(true);

    try {
      const res = await fetch('/api/tickets/transfer/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ encryptedToken }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || 'Unbekannter Fehler.');
        setFormLoading(false);
        return;
      }

      setState({ step: 'revoked' });
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
            Ticket weiterleiten
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

          {/* Transfer Form */}
          {state.step === 'form' && (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.22, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-4"
            >
              <div className="card-clean rounded-2xl p-6 space-y-4">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: 'var(--surface-3)' }}>
                  <Send className="h-6 w-6 text-muted" />
                </div>
                <p className="text-sm text-muted">
                  Gib die E-Mail-Adresse der Person ein, an die du dein Ticket weiterleiten möchtest.
                </p>
              </div>

              <form onSubmit={handleTransfer} className="space-y-4">
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="empfänger@email.com"
                  required
                  className="w-full rounded-2xl px-4 py-3.5 text-sm input-field"
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
                  disabled={formLoading}
                  className="w-full rounded-2xl py-3.5 text-sm font-semibold transition-opacity duration-150 hover:opacity-90 disabled:opacity-50 btn-primary gradient-glow"
                >
                  {formLoading ? 'Wird gesendet...' : 'Ticket weiterleiten'}
                </motion.button>
              </form>
            </motion.div>
          )}

          {/* Transfer Pending */}
          {state.step === 'transfer-pending' && (
            <motion.div
              key="transfer-pending"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-4"
            >
              <div className="card-clean rounded-2xl p-6 space-y-4">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: 'var(--surface-3)' }}>
                  <Clock className="h-6 w-6" style={{ color: 'var(--accent)' }} />
                </div>
                <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
                  Transfer ausstehend
                </h2>
                <p className="text-sm text-muted">
                  Dieses Ticket wird gerade an{' '}
                  <span className="font-medium" style={{ color: 'var(--foreground)' }}>
                    {state.transferToEmail}
                  </span>{' '}
                  weitergeleitet. Sobald der Empfänger das Ticket aktiviert, ist der Transfer abgeschlossen.
                </p>

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
                  onClick={handleRevoke}
                  disabled={formLoading}
                  className="w-full rounded-2xl py-3.5 text-sm font-semibold transition-opacity duration-150 hover:opacity-90 disabled:opacity-50 btn-glass"
                >
                  <span className="flex items-center justify-center gap-2">
                    <RotateCcw className="h-4 w-4" />
                    {formLoading ? 'Wird widerrufen...' : 'Transfer widerrufen'}
                  </span>
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Transfer Success */}
          {state.step === 'success' && (
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
                Transfer gestartet! 📩
              </h2>
              <p className="text-sm text-muted">
                Eine E-Mail mit dem Ticket wurde an{' '}
                <span className="font-medium" style={{ color: 'var(--foreground)' }}>{state.email}</span>{' '}
                gesendet. Der Empfänger kann das Ticket jetzt personalisieren und aktivieren.
              </p>
              <p className="text-xs text-muted">
                Solange das Ticket noch nicht aktiviert wurde, kannst du den Transfer über diesen Link widerrufen.
              </p>
            </motion.div>
          )}

          {/* Transfer Revoked */}
          {state.step === 'revoked' && (
            <motion.div
              key="revoked"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="card-clean rounded-2xl p-6 space-y-4"
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: 'var(--surface-3)' }}>
                <RotateCcw className="h-6 w-6 text-muted" />
              </div>
              <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
                Transfer widerrufen
              </h2>
              <p className="text-sm text-muted">
                Der Transfer wurde erfolgreich widerrufen. Du kannst das Ticket jetzt erneut weiterleiten oder selbst personalisieren.
              </p>
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setState({ step: 'form', encryptedToken })}
                  className="flex-1 rounded-2xl py-3.5 text-sm font-semibold transition-opacity duration-150 hover:opacity-90 btn-glass"
                >
                  Erneut weiterleiten
                </motion.button>
                <motion.a
                  href={`/personalize?t=${encryptedToken}`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex-1 rounded-2xl py-3.5 text-sm font-semibold transition-opacity duration-150 hover:opacity-90 flex items-center justify-center btn-primary gradient-glow"
                >
                  Selbst aktivieren
                </motion.a>
              </div>
            </motion.div>
          )}

          {/* Already Activated */}
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
                Bereits aktiviert
              </h2>
              <p className="text-sm text-muted">
                Dieses Ticket wurde bereits aktiviert und kann nicht mehr weitergeleitet werden.
              </p>
              <motion.a
                href="/"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="inline-block w-full rounded-2xl py-3.5 text-sm font-semibold transition-opacity duration-150 hover:opacity-90 btn-primary gradient-glow"
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
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
                <XCircle className="h-6 w-6" style={{ color: 'var(--status-error)' }} />
              </div>
              <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>Fehler</h2>
              <p className="text-sm text-muted">{state.message}</p>
              <motion.a
                href="/"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="inline-block w-full rounded-2xl py-3.5 text-sm font-semibold transition-opacity duration-150 hover:opacity-90 btn-primary gradient-glow"
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

export default function TransferPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted" />
        </div>
      }
    >
      <TransferFlow />
    </Suspense>
  );
}
