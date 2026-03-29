'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';
import { Mail, Loader2 } from 'lucide-react';

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

function LoginFlow() {
  const searchParams = useSearchParams();
  const next = searchParams.get('next');
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const supabase = createClient();

    const callbackUrl = next
      ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`
      : `${window.location.origin}/auth/callback`;

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: callbackUrl,
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
    <div className="relative flex min-h-screen flex-col items-center justify-center px-6" style={{ zIndex: 1 }}>
      <div className="w-full max-w-sm space-y-8 text-center">
        {/* Logo / Branding */}
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
          <p className="text-sm font-medium text-muted">
            Venture Club Münster
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {sent ? (
            /* Success — check email */
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
                Schaue in dein E-Mail-Postfach und bestätige deinen Login.
                <br />
                <span className="font-medium" style={{ color: 'var(--foreground)' }}>{email}</span>
              </p>
              <button
                onClick={() => { setSent(false); setError(''); }}
                className="text-xs font-medium text-muted transition-colors duration-150"
              >
                Andere E-Mail verwenden
              </button>
            </motion.div>
          ) : (
            /* Email Form */
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.22, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-4"
            >
              <form onSubmit={handleLogin} className="space-y-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="deine@email.com"
                  required
                  className="w-full rounded-xl px-4 py-3.5 text-sm input-field"
                />
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15 }}
                    className="text-sm text-red-500"
                  >
                    {error}
                  </motion.p>
                )}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl py-3.5 text-sm font-semibold text-white transition-opacity duration-150 disabled:opacity-50 gradient-glow"
                  style={{ background: 'linear-gradient(135deg, #ff4d42, #ff8a2a)' }}
                >
                  {loading ? 'Wird gesendet...' : 'Anmelden'}
                </motion.button>
              </form>


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
