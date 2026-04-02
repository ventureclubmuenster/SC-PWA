'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface DetailModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  tall?: boolean;
}

const ease = [0.22, 1, 0.36, 1] as [number, number, number, number];

export default function DetailModal({ open, onClose, children, tall }: DetailModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease }}
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className={`relative z-10 w-full max-w-lg overflow-y-auto rounded-t-[20px] ${tall ? 'min-h-[70vh] max-h-[92vh]' : 'max-h-[85vh]'}`}
            style={{ background: 'var(--surface-1)' }}
          >
            {/* Handle + close */}
            <div className="sticky top-0 z-20 flex items-center justify-between px-5 pt-3 pb-2 backdrop-blur-xl" style={{ background: 'color-mix(in srgb, var(--surface-1) 80%, transparent)' }}>
              <div className="mx-auto h-1 w-10 rounded-full" style={{ background: 'var(--border)' }} />
              <motion.button
                whileHover={{ scale: 1.1, transition: { duration: 0.15 } }}
                whileTap={{ scale: 0.9, transition: { duration: 0.1 } }}
                onClick={onClose}
                className="absolute right-4 top-3 flex h-8 w-8 items-center justify-center rounded-full transition-colors duration-150"
                style={{ background: 'var(--surface-2)' }}
              >
                <X className="h-4 w-4 text-muted" />
              </motion.button>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.2, ease }}
              className="px-5 pb-8"
            >
              {children}
            </motion.div>

            {/* Bottom accent glow */}
            <div
              className="absolute bottom-0 left-[5%] right-[5%] h-[80px] pointer-events-none z-0"
              style={{ background: 'radial-gradient(ellipse at center bottom, rgba(255,94,0,0.08), transparent 70%)' }}
            />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
