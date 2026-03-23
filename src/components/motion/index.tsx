'use client';

import type { ReactNode } from 'react';

/**
 * All list/card animations now use CSS @keyframes on the compositor thread.
 * Framer Motion is only kept where truly needed (AnimatePresence in modals).
 */

// Staggered list container — just renders children; stagger via CSS delay
export function StaggerList({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}

// Animated list item — CSS `animation-delay` set via `--stagger-delay`
let _staggerCounter = 0;
export function StaggerItem({ children, className, index }: { children: ReactNode; className?: string; index?: number }) {
  const i = index ?? _staggerCounter++;
  // Reset counter on next tick (each StaggerList render)
  if (i === 0) setTimeout(() => { _staggerCounter = 0; }, 0);
  return (
    <div
      className={`anim-stagger-item ${className || ''}`}
      style={{ '--stagger-delay': `${i * 30}ms` } as React.CSSProperties}
    >
      {children}
    </div>
  );
}

// Interactive card — pure CSS tap feedback
export function TapCard({
  children,
  className,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <div className={`tap-card ${className || ''}`} onClick={onClick}>
      {children}
    </div>
  );
}

// Animated button — pure CSS tap feedback
export function TapButton({
  children,
  className,
  onClick,
  disabled,
  type,
}: {
  children: ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
  disabled?: boolean;
  type?: 'submit' | 'button';
}) {
  return (
    <button
      className={`tap-btn ${className || ''}`}
      onClick={onClick}
      disabled={disabled}
      type={type}
    >
      {children}
    </button>
  );
}

// Fade-in wrapper — CSS animation
export function FadeIn({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <div
      className={`anim-fade-in ${className || ''}`}
      style={{ '--fade-delay': `${delay * 1000}ms` } as React.CSSProperties}
    >
      {children}
    </div>
  );
}

// Page transition wrapper — simple CSS fade
export function PageTransition({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={`anim-fade-in ${className || ''}`}>
      {children}
    </div>
  );
}

// Slide-in — CSS animation
export function SlideIn({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={`anim-fade-in ${className || ''}`}>
      {children}
    </div>
  );
}

// Skeleton loader
export function Skeleton({ className }: { className?: string }) {
  return <div className={`skeleton ${className || ''}`} />;
}
