'use client';

import { motion } from 'framer-motion';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  /** Word(s) in the title to highlight with accent color */
  accent?: string;
}

export default function PageHeader({ title, subtitle, accent }: PageHeaderProps) {
  const renderTitle = () => {
    if (!accent) return title;
    const idx = title.toLowerCase().indexOf(accent.toLowerCase());
    if (idx === -1) return title;
    const before = title.slice(0, idx);
    const match = title.slice(idx, idx + accent.length);
    const after = title.slice(idx + accent.length);
    return (
      <>
        {before}
        <span className="gradient-accent-text">{match}</span>
        {after}
      </>
    );
  };

  return (
    <div className="-mx-4 -mt-6 mb-4 sticky top-0 z-30 backdrop-blur-xl border-b px-5 pt-5 pb-4" style={{ background: 'color-mix(in srgb, var(--background) 80%, transparent)', borderColor: 'var(--border)' }}>
      <motion.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        className="text-2xl font-extrabold tracking-tight uppercase"
      >
        {renderTitle()}
      </motion.h1>
      {subtitle && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
          className="mt-1 section-label"
        >
          {subtitle}
        </motion.p>
      )}
    </div>
  );
}
