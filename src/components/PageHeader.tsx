'use client';

import { motion } from 'framer-motion';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
}

export default function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <div className="-mx-4 -mt-6 mb-1 noise-panel-accent border-b border-[#E8E8ED] px-5 pt-5 pb-4">
      <motion.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative z-10 text-2xl font-bold tracking-tight text-[#1D1D1F]"
      >
        {title}
      </motion.h1>
      {subtitle && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="relative z-10 mt-0.5 text-sm text-[#86868B]"
        >
          {subtitle}
        </motion.p>
      )}
    </div>
  );
}
