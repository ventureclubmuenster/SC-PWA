'use client';

import { useEffect, useState } from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, Ticket, TrendingUp } from 'lucide-react';

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

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white p-5 border border-gray-200/60 shadow-sm">
      <p className="text-[13px] font-semibold text-gray-500 mb-4">{title}</p>
      <div className="h-48">{children}</div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string | number; color: string }) {
  return (
    <div className="rounded-2xl bg-white p-5 border border-gray-200/60 shadow-sm flex items-start gap-4">
      <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900 tracking-tight">{value}</p>
        <p className="text-[13px] text-gray-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);

  useEffect(() => {
    fetch('/api/admin/analytics')
      .then((r) => r.json())
      .then(setAnalytics);
  }, []);

  useEffect(() => {
    const seen = new Set<string>();
    const poll = () => {
      fetch('/api/admin/webhooks')
        .then((r) => r.ok ? r.json() : [])
        .then((events: { id: string; receivedAt: string; body: unknown; verified: boolean }[]) => {
          for (const evt of events) {
            if (seen.has(evt.id)) continue;
            seen.add(evt.id);
            console.log(
              `%c[Ticket Webhook]%c ${evt.receivedAt} | verified=${evt.verified}`,
              'color: #f97316; font-weight: bold',
              'color: inherit',
            );
            console.log(evt.body);
          }
        })
        .catch(() => {});
    };
    poll();
    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!analytics) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded-xl bg-gray-200" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-gray-200" />)}
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-64 animate-pulse rounded-2xl bg-gray-200" />)}
        </div>
      </div>
    );
  }

  const { days, totalUsers, totalValidated } = analytics;
  const validationRate = totalUsers > 0 ? Math.round((totalValidated / totalUsers) * 100) : 0;
  const chartData = days.map((d) => ({ ...d, label: formatDate(d.date) }));

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-6">Dashboard</h1>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard icon={Users} label="Total Users" value={totalUsers} color="bg-blue-500" />
        <StatCard icon={Ticket} label="Validated Tickets" value={totalValidated} color="bg-emerald-500" />
        <StatCard icon={TrendingUp} label="Validation Rate" value={`${validationRate}%`} color="bg-violet-500" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <ChartCard title="Cumulative Validated Tickets">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="gradValidated" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={36} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 13 }} />
              <Area type="monotone" dataKey="validatedTickets" stroke="#10b981" strokeWidth={2} fill="url(#gradValidated)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Active Users (Daily)">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={36} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 13 }} />
              <Bar dataKey="activeUsers" fill="#f97316" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="New Registrations (Daily)">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={36} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 13 }} />
              <Bar dataKey="registrations" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Registration Trend">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="gradReg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={36} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 13 }} />
              <Area type="monotone" dataKey="registrations" stroke="#8b5cf6" strokeWidth={2} fill="url(#gradReg)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
