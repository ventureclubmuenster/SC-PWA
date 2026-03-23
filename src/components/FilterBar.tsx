'use client';

import { memo } from 'react';

interface FilterBarProps {
  filters: { label: string; value: string }[];
  activeFilter: string;
  onFilterChange: (value: string) => void;
}

const FilterBar = memo(function FilterBar({ filters, activeFilter, onFilterChange }: FilterBarProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {filters.map((filter) => (
        <button
          key={filter.value}
          onClick={() => onFilterChange(filter.value)}
          className="tap-btn relative whitespace-nowrap rounded-full border px-4 py-2.5 text-xs font-semibold tracking-wide transition-all duration-150 min-h-[44px] flex items-center"
          style={{
            background: activeFilter === filter.value ? 'linear-gradient(135deg, #FF6B35, #FF3CAC)' : 'var(--card)',
            backdropFilter: activeFilter !== filter.value ? 'blur(12px)' : undefined,
            WebkitBackdropFilter: activeFilter !== filter.value ? 'blur(12px)' : undefined,
            color: activeFilter === filter.value ? '#FFFFFF' : 'var(--muted)',
            borderColor: activeFilter === filter.value ? 'transparent' : 'var(--border)',
          }}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
});

export default FilterBar;
