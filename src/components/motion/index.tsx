'use client';

import { motion } from 'framer-motion';
import { memo } from 'react';
import type { ReactNode } from 'react';

const ease = [0.22, 1, 0.36, 1] as const;

// Staggered list container
export function StaggerList({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.03 } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Animated list item (fade + slide up) — GPU-only: opacity + translateY
export const StaggerItem = memo(function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 14 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease } },
      }}
      style={{ willChange: 'transform, opacity' }}
      className={className}
    >
      {children}
    </motion.div>
  );
});

// Interactive card wrapper — scale-only tap for GPU perf
export const TapCard = memo(function TapCard({
  children,
  className,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <motion.div
      whileTap={{ scale: 0.97, transition: { duration: 0.1 } }}
      style={{ willChange: 'transform' }}
      className={className}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
});

// Animated button
export const TapButton = memo(function TapButton({
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
    <motion.button
      whileTap={disabled ? {} : { scale: 0.97, transition: { duration: 0.1 } }}
      style={{ willChange: 'transform' }}
      className={className}
      onClick={onClick}
      disabled={disabled}
      type={type}
    >
      {children}
    </motion.button>
  );
});

// Fade-in wrapper — GPU-only
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
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay, ease }}
      style={{ willChange: 'transform, opacity' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Page transition wrapper
export function PageTransition({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.22, ease }}
      style={{ willChange: 'transform, opacity' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Slide-in — uses clipPath instead of height to avoid layout thrashing
export function SlideIn({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, clipPath: 'inset(0 0 100% 0)' }}
      animate={{ opacity: 1, clipPath: 'inset(0 0 0% 0)' }}
      exit={{ opacity: 0, clipPath: 'inset(0 0 100% 0)' }}
      transition={{ duration: 0.2, ease }}
      style={{ willChange: 'clip-path, opacity' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Skeleton loader
export function Skeleton({ className }: { className?: string }) {
  return <div className={`skeleton ${className || ''}`} />;
}
