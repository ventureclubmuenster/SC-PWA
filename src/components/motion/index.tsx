'use client';

import { motion } from 'framer-motion';
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

// Animated list item (fade + slide up)
export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 14 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Interactive card wrapper with hover lift + tap
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
    <motion.div
      whileHover={{ y: -2, transition: { duration: 0.15, ease } }}
      whileTap={{ scale: 0.97, transition: { duration: 0.1 } }}
      className={className}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
}

// Animated button
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
    <motion.button
      whileHover={disabled ? {} : { scale: 1.02, transition: { duration: 0.15, ease } }}
      whileTap={disabled ? {} : { scale: 0.97, transition: { duration: 0.1 } }}
      className={className}
      onClick={onClick}
      disabled={disabled}
      type={type}
    >
      {children}
    </motion.button>
  );
}

// Fade-in wrapper
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
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Slide-in from bottom (for forms / panels)
export function SlideIn({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2, ease }}
      className={className}
      style={{ overflow: 'hidden' }}
    >
      {children}
    </motion.div>
  );
}

// Skeleton loader
export function Skeleton({ className }: { className?: string }) {
  return <div className={`skeleton ${className || ''}`} />;
}
