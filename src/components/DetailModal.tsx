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
        style={{ background: 'var(--overlay)', backdropFilter: 'blur(4px)' }}
        onClick={handleClose}
      />

      <div
        ref={panelRef}
        className={`relative z-10 w-full max-w-lg overflow-y-auto rounded-t-[20px] translate-y-full modal-panel ${tall ? 'min-h-[70vh] max-h-[92vh]' : 'max-h-[85vh]'}`}
        style={{ background: 'var(--card-solid)' }}
      >
        <div className="sticky top-0 z-20 flex items-center justify-between px-5 pt-3 pb-2 gpu-layer" style={{ background: 'var(--card-solid)', borderBottom: '1px solid var(--border-subtle)' }}>
          <div className="mx-auto h-1 w-10 rounded-full" style={{ background: 'var(--border)' }} />
          <button
            onClick={handleClose}
            className="absolute right-4 top-3 flex h-8 w-8 items-center justify-center rounded-full transition-colors duration-150"
            style={{ background: 'var(--muted-light)' }}
          >
            <X className="h-4 w-4 text-muted" />
          </button>
        </div>

        <div className="px-5 pb-8 anim-scale-in">
          {children}
        </div>
      </div>
    </div>
  );
}
