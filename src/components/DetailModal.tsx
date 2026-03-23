'use client';

import { useEffect, useCallback, useRef } from 'react';
import { X } from 'lucide-react';

interface DetailModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  tall?: boolean;
}

export default function DetailModal({ open, onClose, children, tall }: DetailModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      requestAnimationFrame(() => {
        backdropRef.current?.classList.add('opacity-100');
        backdropRef.current?.classList.remove('opacity-0');
        panelRef.current?.classList.add('translate-y-0');
        panelRef.current?.classList.remove('translate-y-full');
      });
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const handleClose = useCallback(() => {
    backdropRef.current?.classList.remove('opacity-100');
    backdropRef.current?.classList.add('opacity-0');
    panelRef.current?.classList.remove('translate-y-0');
    panelRef.current?.classList.add('translate-y-full');
    setTimeout(onClose, 280);
  }, [onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center">
      <div
        ref={backdropRef}
        className="absolute inset-0 gpu-layer opacity-0 transition-opacity duration-200 ease-out"
        style={{ background: 'var(--overlay)' }}
        onClick={handleClose}
      />

      <div
        ref={panelRef}
        className={`relative z-10 w-full max-w-lg overflow-y-auto rounded-t-[28px] translate-y-full modal-panel ${tall ? 'min-h-[70vh] max-h-[92vh]' : 'max-h-[85vh]'}`}
        style={{ background: 'var(--surface-1)', boxShadow: '0 -8px 48px rgba(0,0,0,0.25), 0 -2px 16px rgba(0,0,0,0.15)' }}
      >
        <div className="sticky top-0 z-20 flex items-center justify-between px-6 pt-5 pb-3 gpu-layer" style={{ background: 'var(--surface-1)' }}>
          <div className="mx-auto h-1 w-10 rounded-full" style={{ background: 'var(--muted)', opacity: 0.25 }} />
          <button
            onClick={handleClose}
            className="absolute right-5 top-4 flex h-8 w-8 items-center justify-center rounded-full transition-colors duration-150"
            style={{ background: 'var(--surface-2)' }}
          >
            <X className="h-4 w-4 text-muted" />
          </button>
        </div>

        <div className="px-6 pb-12 anim-scale-in">
          {children}
        </div>
      </div>
    </div>
  );
}
