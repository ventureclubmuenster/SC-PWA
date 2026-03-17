'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface DetailModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export default function DetailModal({ open, onClose, children }: DetailModalProps) {
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-[100] flex items-end justify-center"
      onClick={(e) => { if (e.target === backdropRef.current) onClose(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-[fadeIn_200ms_ease-out]" />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-t-2xl bg-[#F5F5F7] shadow-2xl animate-[slideUp_300ms_cubic-bezier(0.32,0.72,0,1)]">
        {/* Handle + close */}
        <div className="sticky top-0 z-20 flex items-center justify-between px-5 pt-3 pb-2 bg-[#F5F5F7]">
          <div className="mx-auto h-1 w-10 rounded-full bg-[#E8E8ED]" />
          <button
            onClick={onClose}
            className="absolute right-4 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-[#E8E8ED] hover:bg-[#d4d4d9] transition-colors"
          >
            <X className="h-4 w-4 text-[#86868B]" />
          </button>
        </div>

        <div className="px-5 pb-8">
          {children}
        </div>
      </div>
    </div>
  );
}
