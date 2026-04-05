'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import ProfileContent from '@/components/ProfileContent';
import { useLanguage } from '@/lib/i18n';

const ProfileOverlayContext = createContext<{
  isOpen: boolean;
  open: () => void;
  close: () => void;
}>({ isOpen: false, open: () => {}, close: () => {} });

export function useProfileOverlay() {
  return useContext(ProfileOverlayContext);
}

export function ProfileOverlayProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const { t } = useLanguage();

  return (
    <ProfileOverlayContext.Provider value={{ isOpen, open, close }}>
      {children}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 top-24 z-[55] overflow-y-auto rounded-t-[36px]"
            style={{ background: 'var(--background)' }}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between px-5 pt-5 pb-2">
              <span className="text-lg font-bold">{t.profile.title}</span>
              <button
                onClick={close}
                className="flex h-10 w-10 items-center justify-center rounded-full transition-colors duration-150"
                style={{ background: 'var(--surface-2)' }}
              >
                <X className="h-5 w-5" style={{ color: 'var(--foreground)' }} />
              </button>
            </div>
            <div className="mx-auto max-w-lg px-5 pb-32 pt-2">
              <ProfileContent />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </ProfileOverlayContext.Provider>
  );
}
