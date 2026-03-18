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
          whileTap={{ scale: 0.93 }}
          onClick={() => onFilterChange(filter.value)}
          className={`relative whitespace-nowrap rounded-full border px-4 py-2 text-xs font-semibold tracking-wide transition-colors ${
            activeFilter === filter.value
              ? 'border-[#1D1D1F] bg-[#1D1D1F] text-white shadow-sm'
              : 'border-[#E8E8ED] bg-white text-[#86868B] hover:border-[#1D1D1F] hover:text-[#1D1D1F]'
          }`}
        >
          {filter.label}
        </motion.button>
      ))}
    </div>
  );
}
