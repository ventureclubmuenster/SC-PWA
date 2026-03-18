'use client';

import { useState } from 'react';
import { Send } from 'lucide-react';

export default function NotificationsPage() {
  const [form, setForm] = useState({ title: '', body: '', url: '' });
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sent: number; failed: number } | null>(null);
  const [error, setError] = useState('');

  const handleSend = async () => {
    if (!form.title || !form.body) return;
    setSending(true);
    setResult(null);
    setError('');

    try {
      const res = await fetch('/api/cms/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          body: form.body,
          url: form.url || '/',
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to send');
        return;
      }

      const data = await res.json();
      setResult(data);
      setForm({ title: '', body: '', url: '' });
    } catch {
      setError('Network error');
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight mb-6">Push Notifications</h1>

      <div className="max-w-lg space-y-4">
        <div className="noise-panel rounded-2xl p-5 border border-[#E8E8ED] shadow-sm space-y-4">
          <div className="relative z-10 space-y-1">
            <label className="text-xs font-medium text-[#86868B]">Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Schedule Update!"
              className="w-full rounded-xl bg-white px-3 py-2.5 text-sm outline-none ring-1 ring-[#E8E8ED] focus:ring-2 focus:ring-[#FF754B] transition-all"
            />
          </div>

          <div className="relative z-10 space-y-1">
            <label className="text-xs font-medium text-[#86868B]">Message *</label>
            <textarea
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              placeholder="e.g. A new workshop has been added to the schedule"
              rows={3}
              className="w-full rounded-xl bg-white px-3 py-2.5 text-sm outline-none ring-1 ring-[#E8E8ED] focus:ring-2 focus:ring-[#FF754B] transition-all resize-none"
            />
          </div>

          <div className="relative z-10 space-y-1">
            <label className="text-xs font-medium text-[#86868B]">Link URL (optional)</label>
            <input
              type="text"
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              placeholder="e.g. /schedule"
              className="w-full rounded-xl bg-white px-3 py-2.5 text-sm outline-none ring-1 ring-[#E8E8ED] focus:ring-2 focus:ring-[#FF754B] transition-all"
            />
          </div>

          <button
            onClick={handleSend}
            disabled={sending || !form.title || !form.body}
            className="relative z-10 noise-panel-dark flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
          >
            <Send className="relative z-10 h-4 w-4" />
            <span className="relative z-10">{sending ? 'Sending...' : 'Send to All Users'}</span>
          </button>
        </div>

        {result && (
          <div className="rounded-2xl bg-green-50 border border-green-200 p-4 text-sm">
            <p className="font-medium text-green-800">
              Notification sent! ✅
            </p>
            <p className="text-green-700 mt-1">
              {result.sent} delivered, {result.failed} failed
            </p>
          </div>
        )}

        {error && (
          <div className="rounded-2xl bg-red-50 border border-red-200 p-4 text-sm">
            <p className="font-medium text-red-800">Error: {error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
