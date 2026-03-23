'use client';

import { memo } from 'react';

interface FilterBarProps {
  filters: { label: string; value: string }[];
  activeFilter: string;
  onFilterChange: (value: string) => void;
}

const FilterBar = memo(function FilterBar({ filters, activeFilter, onFilterChange }: FilterBarProps) {
  return (
    <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-hide">
      {filters.map((filter) => (
        <button
          key={filter.value}
          onClick={() => onFilterChange(filter.value)}
          className="tap-btn relative whitespace-nowrap rounded-full px-4 py-2.5 text-xs font-semibold tracking-wide transition-all duration-150 min-h-[44px] flex items-center"
          style={{
            background: activeFilter === filter.value ? 'linear-gradient(135deg, #FF6B35, #FF3CAC, #8B5CF6)' : 'var(--surface-1)',
            boxShadow: activeFilter === filter.value ? '0 4px 16px rgba(255,107,53,0.2), 0 2px 6px rgba(255,60,172,0.12)' : 'var(--shadow-sm)',
            color: activeFilter === filter.value ? '#FFFFFF' : 'var(--muted)',
          }}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
});

export default FilterBar;
