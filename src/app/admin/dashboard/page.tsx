'use client';

import { useEffect, useState } from 'react';

interface DayData {
  date: string;
  registrations: number;
  activeUsers: number;
  validatedTickets: number;
}

interface Analytics {
  days: DayData[];
  totalUsers: number;
  totalValidated: number;
}

function BarChart({ data, dataKey, color, label }: { data: DayData[]; dataKey: keyof DayData; color: string; label: string }) {
  const values = data.map((d) => d[dataKey] as number);
  const max = Math.max(...values, 1);

  return (
    <div className="noise-panel rounded-2xl p-5 border border-[#E8E8ED] shadow-sm">
      <p className="relative z-10 text-sm font-semibold text-[#1D1D1F] mb-4">{label}</p>
      <div className="relative z-10 flex items-end gap-[3px] h-36">
        {data.map((d, i) => {
          const h = (values[i] / max) * 100;
          return (
            <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group relative">
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 hidden group-hover:block bg-[#1D1D1F] text-white text-[10px] font-medium px-1.5 py-0.5 rounded whitespace-nowrap z-20">
                {values[i]}
              </div>
              <div
                className="w-full rounded-t-sm transition-all duration-300"
                style={{ height: `${Math.max(h, 2)}%`, backgroundColor: color, opacity: h > 2 ? 1 : 0.3 }}
              />
            </div>
          );
        })}
      </div>
      <div className="relative z-10 flex justify-between mt-2">
        <span className="text-[10px] text-[#86868B]">{formatDate(data[0]?.date)}</span>
        <span className="text-[10px] text-[#86868B]">{formatDate(data[data.length - 1]?.date)}</span>
      </div>
    </div>
  );
}

function AreaChart({ data, dataKey, color, label }: { data: DayData[]; dataKey: keyof DayData; color: string; label: string }) {
  const values = data.map((d) => d[dataKey] as number);
  const max = Math.max(...values, 1);
  const w = 400;
  const h = 144;
  const padding = 4;

  const points = values.map((v, i) => ({
    x: padding + (i / (values.length - 1)) * (w - padding * 2),
    y: h - padding - (v / max) * (h - padding * 2),
  }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const areaPath = `${linePath} L${points[points.length - 1].x},${h} L${points[0].x},${h} Z`;

  return (
    <div className="noise-panel rounded-2xl p-5 border border-[#E8E8ED] shadow-sm">
      <p className="relative z-10 text-sm font-semibold text-[#1D1D1F] mb-4">{label}</p>
      <svg viewBox={`0 0 ${w} ${h}`} className="relative z-10 w-full h-36" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`grad-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <path d={areaPath} fill={`url(#grad-${dataKey})`} />
        <path d={linePath} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3" fill="white" stroke={color} strokeWidth="2" />
        ))}
      </svg>
      <div className="relative z-10 flex justify-between mt-2">
        <span className="text-[10px] text-[#86868B]">{formatDate(data[0]?.date)}</span>
        <span className="text-[10px] text-[#86868B]">{formatDate(data[data.length - 1]?.date)}</span>
      </div>
    </div>
  );
}

function formatDate(dateStr?: string) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function AdminDashboardPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);

  useEffect(() => {
    fetch('/api/admin/analytics')
      .then((r) => r.json())
      .then(setAnalytics);
  }, []);

  if (!analytics) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded-xl bg-[#E8E8ED]" />
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-56 animate-pulse rounded-2xl bg-[#E8E8ED]" />
          ))}
        </div>
      </div>
    );
  }

  const { days, totalUsers, totalValidated } = analytics;
  const validationRate = totalUsers > 0 ? Math.round((totalValidated / totalUsers) * 100) : 0;

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight mb-6">Dashboard</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="noise-panel rounded-2xl p-4 border border-[#E8E8ED] shadow-sm">
          <p className="relative z-10 text-2xl font-bold">{totalUsers}</p>
          <p className="relative z-10 text-sm font-medium text-[#86868B]">Total Users</p>
        </div>
        <div className="noise-panel rounded-2xl p-4 border border-[#E8E8ED] shadow-sm">
          <p className="relative z-10 text-2xl font-bold">{totalValidated}</p>
          <p className="relative z-10 text-sm font-medium text-[#86868B]">Validated Tickets</p>
        </div>
        <div className="noise-panel rounded-2xl p-4 border border-[#E8E8ED] shadow-sm">
          <p className="relative z-10 text-2xl font-bold">{validationRate}%</p>
          <p className="relative z-10 text-sm font-medium text-[#86868B]">Validation Rate</p>
        </div>
      </div>

      {/* Graphs */}
      <div className="grid grid-cols-2 gap-4">
        <AreaChart data={days} dataKey="validatedTickets" color="#34C759" label="Cumulative Validated Tickets" />
        <BarChart data={days} dataKey="activeUsers" color="#FF754B" label="Active Users (Daily)" />
        <BarChart data={days} dataKey="registrations" color="#007AFF" label="New Registrations (Daily)" />
        <AreaChart
          data={days}
          dataKey="registrations"
          color="#5856D6"
          label="Registration Trend"
        />
      </div>
    </div>
  );
}
