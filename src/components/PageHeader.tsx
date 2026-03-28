'use client';

import { motion } from 'framer-motion';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
}

export default function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <div className="-mx-4 -mt-6 mb-1 sticky top-0 z-30 backdrop-blur-xl border-b px-5 pt-5 pb-4" style={{ background: 'color-mix(in srgb, var(--background) 80%, transparent)', borderColor: 'var(--border)' }}>
      <motion.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        className="text-2xl font-bold tracking-tight"
      >
        {title}
      </motion.h1>
      {subtitle && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
          className="mt-0.5 text-sm text-muted"
        >
          {subtitle}
        </motion.p>
      )}
    </div>
  );
}
