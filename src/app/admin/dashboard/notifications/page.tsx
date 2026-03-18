'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Send, ChevronDown, ChevronUp, Clock, CheckCircle2, XCircle, Bell } from 'lucide-react';

interface NotificationLog {
  id: string;
  title: string;
  body: string;
  url: string | null;
  icon: string | null;
  badge: string | null;
  image: string | null;
  tag: string | null;
  renotify: boolean;
  require_interaction: boolean;
  silent: boolean;
  vibrate: string | null;
  dir: string | null;
  lang: string | null;
  actions: { action: string; title: string }[] | null;
  timestamp: string | null;
  sent_count: number;
  failed_count: number;
  total_subscribers: number;
  errors: { statusCode?: number; message: string; endpoint: string }[] | null;
  created_at: string;
}

interface NotificationAction {
  action: string;
  title: string;
}

const inputClass =
  'w-full rounded-xl bg-white px-3 py-2.5 text-sm outline-none ring-1 ring-[#E8E8ED] focus:ring-2 focus:ring-[#FF754B] transition-all';

export default function NotificationsPage() {
  const [form, setForm] = useState({
    title: '',
    body: '',
    url: '',
    icon: '',
    badge: '',
    image: '',
    tag: '',
    renotify: false,
    requireInteraction: false,
    silent: false,
    vibrate: '',
    dir: 'auto' as 'auto' | 'ltr' | 'rtl',
    lang: '',
    actions: [] as NotificationAction[],
    timestamp: '',
  });
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sent: number; failed: number } | null>(null);
  const [error, setError] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/notifications');
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch {
      // silent
    } finally {
      setLogsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleSend = async () => {
    if (!form.title || !form.body) return;
    setSending(true);
    setResult(null);
    setError('');

    try {
      const payload: Record<string, unknown> = {
        title: form.title,
        body: form.body,
        url: form.url || '/',
      };

      if (form.icon) payload.icon = form.icon;
      if (form.badge) payload.badge = form.badge;
      if (form.image) payload.image = form.image;
      if (form.tag) payload.tag = form.tag;
      if (form.renotify) payload.renotify = true;
      if (form.requireInteraction) payload.requireInteraction = true;
      if (form.silent) payload.silent = true;
      if (form.vibrate) payload.vibrate = form.vibrate.split(',').map(Number);
      if (form.dir !== 'auto') payload.dir = form.dir;
      if (form.lang) payload.lang = form.lang;
      if (form.actions.length > 0) payload.actions = form.actions;
      if (form.timestamp) payload.timestamp = form.timestamp;

      const res = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to send');
        return;
      }

      const data = await res.json();
      setResult(data);
      setForm({
        title: '', body: '', url: '', icon: '', badge: '', image: '',
        tag: '', renotify: false, requireInteraction: false, silent: false,
        vibrate: '', dir: 'auto', lang: '', actions: [], timestamp: '',
      });
      setShowAdvanced(false);
      fetchLogs();
    } catch {
      setError('Network error');
    } finally {
      setSending(false);
    }
  };

  const addAction = () => {
    if (form.actions.length >= 2) return;
    setForm({ ...form, actions: [...form.actions, { action: '', title: '' }] });
  };

  const updateAction = (index: number, field: 'action' | 'title', value: string) => {
    const updated = [...form.actions];
    updated[index] = { ...updated[index], [field]: value };
    setForm({ ...form, actions: updated });
  };

  const removeAction = (index: number) => {
    setForm({ ...form, actions: form.actions.filter((_, i) => i !== index) });
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  const totalSent = logs.reduce((sum, l) => sum + l.sent_count, 0);
  const totalFailed = logs.reduce((sum, l) => sum + l.failed_count, 0);

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight mb-6">Push Notifications</h1>

      {/* Stats Overview */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="noise-panel rounded-2xl p-4 border border-[#E8E8ED] shadow-sm">
          <div className="relative z-10">
            <p className="text-xs font-medium text-[#86868B]">Total Sent</p>
            <p className="text-2xl font-bold tracking-tight mt-1">{logs.length}</p>
            <p className="text-xs text-[#86868B] mt-0.5">notifications</p>
          </div>
        </div>
        <div className="noise-panel rounded-2xl p-4 border border-[#E8E8ED] shadow-sm">
          <div className="relative z-10">
            <p className="text-xs font-medium text-[#86868B]">Successful Deliveries</p>
            <p className="text-2xl font-bold tracking-tight mt-1 text-green-600">{totalSent}</p>
            <p className="text-xs text-[#86868B] mt-0.5">across all notifications</p>
          </div>
        </div>
        <div className="noise-panel rounded-2xl p-4 border border-[#E8E8ED] shadow-sm">
          <div className="relative z-10">
            <p className="text-xs font-medium text-[#86868B]">Failed Deliveries</p>
            <p className="text-2xl font-bold tracking-tight mt-1 text-red-500">{totalFailed}</p>
            <p className="text-xs text-[#86868B] mt-0.5">across all notifications</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Send Form */}
        <div>
          <h2 className="text-lg font-semibold mb-3">Send Notification</h2>
          <div className="noise-panel rounded-2xl p-5 border border-[#E8E8ED] shadow-sm space-y-4">
            {/* Required Fields */}
            <div className="relative z-10 space-y-1">
              <label className="text-xs font-medium text-[#86868B]">Title *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Schedule Update!"
                className={inputClass}
              />
            </div>

            <div className="relative z-10 space-y-1">
              <label className="text-xs font-medium text-[#86868B]">Message *</label>
              <textarea
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                placeholder="e.g. A new workshop has been added to the schedule"
                rows={3}
                className={`${inputClass} resize-none`}
              />
            </div>

            <div className="relative z-10 space-y-1">
              <label className="text-xs font-medium text-[#86868B]">Link URL</label>
              <input
                type="text"
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                placeholder="e.g. /schedule"
                className={inputClass}
              />
            </div>

            {/* Advanced Options Toggle */}
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="relative z-10 flex items-center gap-1.5 text-xs font-medium text-[#86868B] hover:text-[#1D1D1F] transition-colors"
            >
              {showAdvanced ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              Advanced Options
            </button>

            {showAdvanced && (
              <div className="relative z-10 space-y-4 pt-2 border-t border-[#E8E8ED]">
                {/* Media */}
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-[#1D1D1F] uppercase tracking-wider">Media</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-[#86868B]">Icon URL</label>
                      <input
                        type="text"
                        value={form.icon}
                        onChange={(e) => setForm({ ...form, icon: e.target.value })}
                        placeholder="/icons/icon-192x192.png"
                        className={inputClass}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-[#86868B]">Badge URL</label>
                      <input
                        type="text"
                        value={form.badge}
                        onChange={(e) => setForm({ ...form, badge: e.target.value })}
                        placeholder="/icons/icon-192x192.png"
                        className={inputClass}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-[#86868B]">Image URL</label>
                    <input
                      type="text"
                      value={form.image}
                      onChange={(e) => setForm({ ...form, image: e.target.value })}
                      placeholder="https://example.com/banner.jpg"
                      className={inputClass}
                    />
                  </div>
                </div>

                {/* Behavior */}
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-[#1D1D1F] uppercase tracking-wider">Behavior</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-[#86868B]">Tag</label>
                      <input
                        type="text"
                        value={form.tag}
                        onChange={(e) => setForm({ ...form, tag: e.target.value })}
                        placeholder="e.g. schedule-update"
                        className={inputClass}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-[#86868B]">Vibrate Pattern</label>
                      <input
                        type="text"
                        value={form.vibrate}
                        onChange={(e) => setForm({ ...form, vibrate: e.target.value })}
                        placeholder="200,100,200"
                        className={inputClass}
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-4">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.requireInteraction}
                        onChange={(e) => setForm({ ...form, requireInteraction: e.target.checked })}
                        className="rounded accent-[#FF754B]"
                      />
                      <span className="text-[#1D1D1F]">Require Interaction</span>
                    </label>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.silent}
                        onChange={(e) => setForm({ ...form, silent: e.target.checked })}
                        className="rounded accent-[#FF754B]"
                      />
                      <span className="text-[#1D1D1F]">Silent</span>
                    </label>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.renotify}
                        onChange={(e) => setForm({ ...form, renotify: e.target.checked })}
                        className="rounded accent-[#FF754B]"
                      />
                      <span className="text-[#1D1D1F]">Renotify</span>
                    </label>
                  </div>
                </div>

                {/* Localization */}
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-[#1D1D1F] uppercase tracking-wider">Localization</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-[#86868B]">Direction</label>
                      <select
                        value={form.dir}
                        onChange={(e) => setForm({ ...form, dir: e.target.value as 'auto' | 'ltr' | 'rtl' })}
                        className={inputClass}
                      >
                        <option value="auto">Auto</option>
                        <option value="ltr">Left-to-Right</option>
                        <option value="rtl">Right-to-Left</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-[#86868B]">Language</label>
                      <input
                        type="text"
                        value={form.lang}
                        onChange={(e) => setForm({ ...form, lang: e.target.value })}
                        placeholder="e.g. en"
                        className={inputClass}
                      />
                    </div>
                  </div>
                </div>

                {/* Timestamp */}
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-[#1D1D1F] uppercase tracking-wider">Timing</p>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-[#86868B]">Timestamp</label>
                    <input
                      type="datetime-local"
                      value={form.timestamp}
                      onChange={(e) => setForm({ ...form, timestamp: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-[#1D1D1F] uppercase tracking-wider">Actions (max 2)</p>
                    {form.actions.length < 2 && (
                      <button
                        type="button"
                        onClick={addAction}
                        className="text-xs font-medium text-[#FF754B] hover:underline"
                      >
                        + Add Action
                      </button>
                    )}
                  </div>
                  {form.actions.map((action, i) => (
                    <div key={i} className="flex gap-2 items-end">
                      <div className="flex-1 space-y-1">
                        <label className="text-xs font-medium text-[#86868B]">Action ID</label>
                        <input
                          type="text"
                          value={action.action}
                          onChange={(e) => updateAction(i, 'action', e.target.value)}
                          placeholder="e.g. open"
                          className={inputClass}
                        />
                      </div>
                      <div className="flex-1 space-y-1">
                        <label className="text-xs font-medium text-[#86868B]">Button Label</label>
                        <input
                          type="text"
                          value={action.title}
                          onChange={(e) => updateAction(i, 'title', e.target.value)}
                          placeholder="e.g. Open App"
                          className={inputClass}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAction(i)}
                        className="shrink-0 mb-0.5 rounded-lg p-2.5 text-red-400 hover:bg-red-50 transition-colors"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSend}
              disabled={sending || !form.title || !form.body}
              className="relative z-10 noise-panel-dark flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
            >
              <Send className="relative z-10 h-4 w-4" />
              <span className="relative z-10">{sending ? 'Sending...' : 'Send to All Users'}</span>
            </motion.button>
          </div>

          {result && (
            <div className="mt-4 rounded-2xl bg-green-50 border border-green-200 p-4 text-sm">
              <p className="font-medium text-green-800">Notification sent! ✅</p>
              <p className="text-green-700 mt-1">
                {result.sent} delivered, {result.failed} failed
              </p>
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-2xl bg-red-50 border border-red-200 p-4 text-sm">
              <p className="font-medium text-red-800">Error: {error}</p>
            </div>
          )}
        </div>

        {/* Notification History */}
        <div>
          <h2 className="text-lg font-semibold mb-3">Recent Notifications</h2>
          {logsLoading ? (
            <div className="noise-panel rounded-2xl p-8 border border-[#E8E8ED] shadow-sm text-center">
              <p className="relative z-10 text-sm text-[#86868B]">Loading...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="noise-panel rounded-2xl p-8 border border-[#E8E8ED] shadow-sm text-center">
              <Bell className="relative z-10 h-8 w-8 text-[#E8E8ED] mx-auto mb-2" />
              <p className="relative z-10 text-sm text-[#86868B]">No notifications sent yet</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[calc(100vh-16rem)] overflow-y-auto pr-1">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="noise-panel rounded-2xl border border-[#E8E8ED] shadow-sm overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                    className="relative z-10 w-full text-left p-4 hover:bg-white/40 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-[#1D1D1F] truncate">{log.title}</p>
                        <p className="text-xs text-[#86868B] mt-0.5 truncate">{log.body}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="flex items-center gap-0.5 text-green-600">
                            <CheckCircle2 className="h-3 w-3" />
                            {log.sent_count}
                          </span>
                          {log.failed_count > 0 && (
                            <span className="flex items-center gap-0.5 text-red-500">
                              <XCircle className="h-3 w-3" />
                              {log.failed_count}
                            </span>
                          )}
                        </div>
                        <p className="flex items-center gap-1 text-[10px] text-[#86868B] mt-1">
                          <Clock className="h-2.5 w-2.5" />
                          {formatDate(log.created_at)}
                        </p>
                      </div>
                    </div>
                  </button>

                  {expandedLog === log.id && (
                    <div className="relative z-10 border-t border-[#E8E8ED] p-4 text-xs space-y-3 bg-white/30">
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <p className="font-medium text-[#86868B]">Total Subscribers</p>
                          <p className="text-[#1D1D1F] mt-0.5">{log.total_subscribers}</p>
                        </div>
                        <div>
                          <p className="font-medium text-[#86868B]">Delivered</p>
                          <p className="text-green-600 mt-0.5">{log.sent_count}</p>
                        </div>
                        <div>
                          <p className="font-medium text-[#86868B]">Failed</p>
                          <p className="text-red-500 mt-0.5">{log.failed_count}</p>
                        </div>
                      </div>

                      {log.url && (
                        <div>
                          <p className="font-medium text-[#86868B]">Link URL</p>
                          <p className="text-[#1D1D1F] mt-0.5">{log.url}</p>
                        </div>
                      )}

                      {/* Show configured options */}
                      {(log.icon || log.badge || log.image || log.tag || log.dir || log.lang ||
                        log.require_interaction || log.silent || log.renotify || log.vibrate ||
                        log.actions) && (
                        <div>
                          <p className="font-medium text-[#86868B] mb-1">Options</p>
                          <div className="flex flex-wrap gap-1.5">
                            {log.icon && (
                              <span className="inline-flex items-center rounded-md bg-[#F5F5F7] px-2 py-0.5 text-[10px] text-[#86868B]">icon</span>
                            )}
                            {log.badge && (
                              <span className="inline-flex items-center rounded-md bg-[#F5F5F7] px-2 py-0.5 text-[10px] text-[#86868B]">badge</span>
                            )}
                            {log.image && (
                              <span className="inline-flex items-center rounded-md bg-[#F5F5F7] px-2 py-0.5 text-[10px] text-[#86868B]">image</span>
                            )}
                            {log.tag && (
                              <span className="inline-flex items-center rounded-md bg-[#F5F5F7] px-2 py-0.5 text-[10px] text-[#86868B]">tag: {log.tag}</span>
                            )}
                            {log.require_interaction && (
                              <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-[10px] text-amber-700">require interaction</span>
                            )}
                            {log.silent && (
                              <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-[10px] text-blue-700">silent</span>
                            )}
                            {log.renotify && (
                              <span className="inline-flex items-center rounded-md bg-purple-50 px-2 py-0.5 text-[10px] text-purple-700">renotify</span>
                            )}
                            {log.vibrate && (
                              <span className="inline-flex items-center rounded-md bg-[#F5F5F7] px-2 py-0.5 text-[10px] text-[#86868B]">vibrate: {log.vibrate}</span>
                            )}
                            {log.dir && log.dir !== 'auto' && (
                              <span className="inline-flex items-center rounded-md bg-[#F5F5F7] px-2 py-0.5 text-[10px] text-[#86868B]">dir: {log.dir}</span>
                            )}
                            {log.lang && (
                              <span className="inline-flex items-center rounded-md bg-[#F5F5F7] px-2 py-0.5 text-[10px] text-[#86868B]">lang: {log.lang}</span>
                            )}
                            {log.actions && log.actions.length > 0 && (
                              <span className="inline-flex items-center rounded-md bg-[#F5F5F7] px-2 py-0.5 text-[10px] text-[#86868B]">
                                {log.actions.length} action{log.actions.length > 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Error details */}
                      {log.errors && log.errors.length > 0 && (
                        <div>
                          <p className="font-medium text-red-500 mb-1">Errors</p>
                          <div className="space-y-1 max-h-32 overflow-y-auto">
                            {log.errors.map((err, i) => (
                              <div key={i} className="rounded-lg bg-red-50 px-2 py-1.5 text-[10px] text-red-700">
                                {err.statusCode && <span className="font-semibold">[{err.statusCode}]</span>}{' '}
                                {err.message.slice(0, 120)}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
