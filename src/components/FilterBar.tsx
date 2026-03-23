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
          className="tap-btn relative whitespace-nowrap rounded-full border px-4 py-2.5 text-xs font-semibold tracking-wide transition-colors duration-150 min-h-[44px] flex items-center"
          style={{
            background: activeFilter === filter.value ? 'var(--foreground)' : 'var(--card)',
            color: activeFilter === filter.value ? 'var(--background)' : 'var(--muted)',
            borderColor: activeFilter === filter.value ? 'var(--foreground)' : 'var(--border)',
          }}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
});

export default FilterBar;
