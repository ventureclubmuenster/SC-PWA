'use client';

import { motion } from 'framer-motion';

interface FilterBarProps {
  filters: { label: string; value: string }[];
  activeFilter: string;
  onFilterChange: (value: string) => void;
}

export default function FilterBar({ filters, activeFilter, onFilterChange }: FilterBarProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {filters.map((filter) => (
        <motion.button
          key={filter.value}
          whileTap={{ scale: 0.95, transition: { duration: 0.1 } }}
          onClick={() => onFilterChange(filter.value)}
          className="relative whitespace-nowrap border px-4 py-2.5 text-xs font-semibold tracking-wide transition-colors duration-150 min-h-[44px] flex items-center"
          style={{
            borderRadius: 'var(--radius-pill)',
            ...(activeFilter === filter.value
              ? { borderColor: 'var(--highlight)', background: 'var(--highlight)', color: 'var(--highlight-text)' }
              : { borderColor: 'var(--border)', background: 'var(--surface-1)', color: 'var(--muted)' }),
          }}
        >
          {filter.label}
        </motion.button>
      ))}
    </div>
  );
}
