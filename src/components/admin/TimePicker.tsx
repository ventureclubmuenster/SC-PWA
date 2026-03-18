'use client';

import { useState, useRef, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface TimePickerProps {
  value: string; // "HH:MM" format
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
const MINUTES = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

export default function TimePicker({ value, onChange, label, required }: TimePickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const hourRef = useRef<HTMLDivElement>(null);
  const minuteRef = useRef<HTMLDivElement>(null);

  const [hour, minute] = value ? value.split(':') : ['', ''];

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Scroll to selected values when opening
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        if (hourRef.current && hour) {
          const el = hourRef.current.querySelector(`[data-hour="${hour}"]`);
          el?.scrollIntoView({ block: 'center', behavior: 'instant' });
        }
        if (minuteRef.current && minute) {
          const closest = MINUTES.reduce((prev, curr) =>
            Math.abs(parseInt(curr) - parseInt(minute)) < Math.abs(parseInt(prev) - parseInt(minute)) ? curr : prev
          );
          const el = minuteRef.current.querySelector(`[data-minute="${closest}"]`);
          el?.scrollIntoView({ block: 'center', behavior: 'instant' });
        }
      }, 0);
    }
  }, [open, hour, minute]);

  const setTime = (h: string, m: string) => {
    onChange(`${h}:${m}`);
  };

  const selectHour = (h: string) => {
    const m = minute || '00';
    setTime(h, m);
  };

  const selectMinute = (m: string) => {
    const h = hour || '09';
    setTime(h, m);
  };

  const displayValue = value || '';

  return (
    <div ref={ref} className="relative">
      {label && <label className="text-xs text-[#86868B] mb-1 block">{label}</label>}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`flex w-full items-center gap-2 rounded-lg bg-[#F5F5F7] px-3 py-2 text-sm text-left border transition-colors ${
          open ? 'border-[#FF754B]' : 'border-[#E8E8ED]'
        }`}
      >
        <Clock className="h-4 w-4 text-[#86868B] shrink-0" />
        <span className={displayValue ? 'text-[#1D1D1F]' : 'text-[#86868B]'}>
          {displayValue || 'Select time'}
        </span>
      </button>
      {required && !value && (
        <input
          tabIndex={-1}
          className="absolute opacity-0 h-0 w-0"
          value={value}
          onChange={() => {}}
          required
        />
      )}

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-xl bg-white border border-[#E8E8ED] shadow-lg overflow-hidden">
          {/* Quick presets */}
          <div className="flex flex-wrap gap-1.5 p-3 border-b border-[#E8E8ED]">
            {['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => { onChange(t); setOpen(false); }}
                className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  value === t
                    ? 'bg-[#FF754B] text-white'
                    : 'bg-[#F5F5F7] text-[#1D1D1F] hover:bg-[#E8E8ED]'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Hour & Minute columns */}
          <div className="flex divide-x divide-[#E8E8ED]">
            <div ref={hourRef} className="flex-1 max-h-48 overflow-y-auto p-1">
              <p className="text-[10px] font-medium text-[#86868B] px-2 py-1 sticky top-0 bg-white">Hour</p>
              {HOURS.map((h) => (
                <button
                  key={h}
                  type="button"
                  data-hour={h}
                  onClick={() => selectHour(h)}
                  className={`w-full rounded-lg px-2 py-2 text-sm text-center transition-colors ${
                    hour === h
                      ? 'bg-[#FF754B] text-white font-semibold'
                      : 'hover:bg-[#F5F5F7]'
                  }`}
                >
                  {h}
                </button>
              ))}
            </div>
            <div ref={minuteRef} className="flex-1 max-h-48 overflow-y-auto p-1">
              <p className="text-[10px] font-medium text-[#86868B] px-2 py-1 sticky top-0 bg-white">Min</p>
              {MINUTES.map((m) => (
                <button
                  key={m}
                  type="button"
                  data-minute={m}
                  onClick={() => selectMinute(m)}
                  className={`w-full rounded-lg px-2 py-2 text-sm text-center transition-colors ${
                    minute === m
                      ? 'bg-[#FF754B] text-white font-semibold'
                      : 'hover:bg-[#F5F5F7]'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Confirm */}
          <div className="p-2 border-t border-[#E8E8ED]">
            <button
              type="button"
              onClick={() => setOpen(false)}
              disabled={!value}
              className="w-full rounded-lg noise-panel-dark py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              <span className="relative z-10">Confirm {value || ''}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
