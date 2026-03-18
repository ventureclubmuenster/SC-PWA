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
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className={`relative z-10 w-full max-w-lg overflow-y-auto rounded-t-2xl bg-[#F5F5F7] shadow-2xl ${tall ? 'min-h-[70vh] max-h-[92vh]' : 'max-h-[85vh]'}`}
          >
            {/* Handle + close */}
            <div className="sticky top-0 z-20 flex items-center justify-between px-5 pt-3 pb-2 bg-[#F5F5F7]">
              <div className="mx-auto h-1 w-10 rounded-full bg-[#E8E8ED]" />
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="absolute right-4 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-[#E8E8ED] hover:bg-[#d4d4d9] transition-colors"
              >
                <X className="h-4 w-4 text-[#86868B]" />
              </motion.button>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.25 }}
              className="px-5 pb-8"
            >
              {children}
            </motion.div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
