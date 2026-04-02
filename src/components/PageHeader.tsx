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
    <div className="pb-2">
      <motion.h1
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="text-[28px] font-extrabold tracking-tight"
      >
        {renderTitle()}
      </motion.h1>
      {subtitle && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
          className="mt-1.5 text-sm text-muted"
        >
          {subtitle}
        </motion.p>
      )}
    </div>
  );
}
