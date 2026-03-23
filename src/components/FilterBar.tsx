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
          className={`tap-btn relative whitespace-nowrap rounded-full border px-4 py-2.5 text-xs font-semibold tracking-wide transition-colors duration-150 min-h-[44px] flex items-center ${
            activeFilter === filter.value
              ? 'border-[#1D1D1F] bg-[#1D1D1F] text-white'
              : 'border-[rgba(0,0,0,0.06)] bg-white text-[#86868B] hover:border-[#1D1D1F] hover:text-[#1D1D1F]'
          }`}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
});

export default FilterBar;
