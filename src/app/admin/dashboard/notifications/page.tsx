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
  'w-full rounded-xl bg-gray-50 px-3 py-2.5 text-sm border border-gray-200 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 focus-visible:ring-2 focus-visible:ring-orange-500 transition-all placeholder:text-gray-400';

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
      <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-6">Push Notifications</h1>

      {/* Stats Overview */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="rounded-2xl bg-white p-5 border border-gray-200/60 shadow-sm">
          <p className="text-[13px] font-medium text-gray-500">Total Sent</p>
          <p className="text-2xl font-bold text-gray-900 tracking-tight mt-1">{logs.length}</p>
          <p className="text-xs text-gray-400 mt-0.5">notifications</p>
        </div>
        <div className="rounded-2xl bg-white p-5 border border-gray-200/60 shadow-sm">
          <p className="text-[13px] font-medium text-gray-500">Successful Deliveries</p>
          <p className="text-2xl font-bold text-emerald-600 tracking-tight mt-1">{totalSent}</p>
          <p className="text-xs text-gray-400 mt-0.5">across all notifications</p>
        </div>
        <div className="rounded-2xl bg-white p-5 border border-gray-200/60 shadow-sm">
          <p className="text-[13px] font-medium text-gray-500">Failed Deliveries</p>
          <p className="text-2xl font-bold text-red-500 tracking-tight mt-1">{totalFailed}</p>
          <p className="text-xs text-gray-400 mt-0.5">across all notifications</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Send Form */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Send Notification</h2>
          <div className="rounded-2xl bg-white p-5 border border-gray-200/60 shadow-sm space-y-4">
            {/* Required Fields */}
            <div className="space-y-1">
              <label htmlFor="notif-title" className="text-xs font-medium text-gray-500">Title *</label>
              <input
                id="notif-title"
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Schedule Update!"
                className={inputClass}
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="notif-body" className="text-xs font-medium text-gray-500">Message *</label>
              <textarea
                id="notif-body"
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                placeholder="e.g. A new workshop has been added to the schedule"
                rows={3}
                className={`${inputClass} resize-none`}
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="notif-url" className="text-xs font-medium text-gray-500">Link URL</label>
              <input
                id="notif-url"
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
              aria-expanded={showAdvanced}
              className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 rounded-lg px-1 py-0.5"
            >
              {showAdvanced ? <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" /> : <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />}
              Advanced Options
            </button>

            {showAdvanced && (
              <div className="space-y-4 pt-2 border-t border-gray-200">
                {/* Media */}
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-gray-900 uppercase tracking-wider">Media</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label htmlFor="notif-icon" className="text-xs font-medium text-gray-500">Icon URL</label>
                      <input
                        id="notif-icon"
                        type="text"
                        value={form.icon}
                        onChange={(e) => setForm({ ...form, icon: e.target.value })}
                        placeholder="/icons/icon-192x192.png"
                        className={inputClass}
                      />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="notif-badge" className="text-xs font-medium text-gray-500">Badge URL</label>
                      <input
                        id="notif-badge"
                        type="text"
                        value={form.badge}
                        onChange={(e) => setForm({ ...form, badge: e.target.value })}
                        placeholder="/icons/icon-192x192.png"
                        className={inputClass}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="notif-image" className="text-xs font-medium text-gray-500">Image URL</label>
                    <input
                      id="notif-image"
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
                  <p className="text-xs font-semibold text-gray-900 uppercase tracking-wider">Behavior</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label htmlFor="notif-tag" className="text-xs font-medium text-gray-500">Tag</label>
                      <input
                        id="notif-tag"
                        type="text"
                        value={form.tag}
                        onChange={(e) => setForm({ ...form, tag: e.target.value })}
                        placeholder="e.g. schedule-update"
                        className={inputClass}
                      />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="notif-vibrate" className="text-xs font-medium text-gray-500">Vibrate Pattern</label>
                      <input
                        id="notif-vibrate"
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
                        className="rounded accent-orange-500"
                      />
                      <span className="text-gray-900">Require Interaction</span>
                    </label>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.silent}
                        onChange={(e) => setForm({ ...form, silent: e.target.checked })}
                        className="rounded accent-orange-500"
                      />
                      <span className="text-gray-900">Silent</span>
                    </label>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.renotify}
                        onChange={(e) => setForm({ ...form, renotify: e.target.checked })}
                        className="rounded accent-orange-500"
                      />
                      <span className="text-gray-900">Renotify</span>
                    </label>
                  </div>
                </div>

                {/* Localization */}
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-gray-900 uppercase tracking-wider">Localization</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label htmlFor="notif-dir" className="text-xs font-medium text-gray-500">Direction</label>
                      <select
                        id="notif-dir"
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
                      <label htmlFor="notif-lang" className="text-xs font-medium text-gray-500">Language</label>
                      <input
                        id="notif-lang"
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
                  <p className="text-xs font-semibold text-gray-900 uppercase tracking-wider">Timing</p>
                  <div className="space-y-1">
                    <label htmlFor="notif-timestamp" className="text-xs font-medium text-gray-500">Timestamp</label>
                    <input
                      id="notif-timestamp"
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
                    <p className="text-xs font-semibold text-gray-900 uppercase tracking-wider">Actions (max 2)</p>
                    {form.actions.length < 2 && (
                      <button
                        type="button"
                        onClick={addAction}
                        className="text-xs font-medium text-orange-500 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 rounded px-1"
                      >
                        + Add Action
                      </button>
                    )}
                  </div>
                  {form.actions.map((action, i) => (
                    <div key={i} className="flex gap-2 items-end">
                      <div className="flex-1 space-y-1">
                        <label htmlFor={`notif-action-id-${i}`} className="text-xs font-medium text-gray-500">Action ID</label>
                        <input
                          id={`notif-action-id-${i}`}
                          type="text"
                          value={action.action}
                          onChange={(e) => updateAction(i, 'action', e.target.value)}
                          placeholder="e.g. open"
                          className={inputClass}
                        />
                      </div>
                      <div className="flex-1 space-y-1">
                        <label htmlFor={`notif-action-title-${i}`} className="text-xs font-medium text-gray-500">Button Label</label>
                        <input
                          id={`notif-action-title-${i}`}
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
                        aria-label={`Remove action ${i + 1}`}
                        className="shrink-0 mb-0.5 rounded-lg p-2.5 text-red-400 hover:bg-red-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
                      >
                        <XCircle className="h-4 w-4" aria-hidden="true" />
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
              className="bg-gradient-to-r from-orange-500 to-red-500 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
            >
              <Send className="h-4 w-4" aria-hidden="true" />
              <span>{sending ? 'Sending...' : 'Send to All Users'}</span>
            </motion.button>
          </div>

          <div aria-live="polite">
            {result && (
              <div className="mt-4 rounded-2xl bg-green-50 border border-green-200 p-4 text-sm" role="status">
                <p className="font-medium text-green-800">Notification sent! ✅</p>
                <p className="text-green-700 mt-1">
                  {result.sent} delivered, {result.failed} failed
                </p>
              </div>
            )}

            {error && (
              <div className="mt-4 rounded-2xl bg-red-50 border border-red-200 p-4 text-sm" role="alert">
                <p className="font-medium text-red-800">Error: {error}</p>
              </div>
            )}
          </div>
        </div>

        {/* Notification History */}
        <div>
          <h2 className="text-lg font-semibold mb-3">Recent Notifications</h2>
          {logsLoading ? (
            <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm text-center">
              <p className="text-sm text-gray-500">Loading...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm text-center">
              <Bell className="h-8 w-8 text-gray-300 mx-auto mb-2" aria-hidden="true" />
              <p className="text-sm text-gray-500">No notifications sent yet</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[calc(100vh-16rem)] overflow-y-auto pr-1">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                    aria-expanded={expandedLog === log.id}
                    aria-label={`${log.title} — ${log.sent_count} sent, ${log.failed_count} failed`}
                    className="w-full text-left p-4 hover:bg-white/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-inset rounded-2xl"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-900 truncate">{log.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5 truncate">{log.body}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="flex items-center gap-0.5 text-green-600">
                            <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                            {log.sent_count}
                          </span>
                          {log.failed_count > 0 && (
                            <span className="flex items-center gap-0.5 text-red-500">
                              <XCircle className="h-3 w-3" aria-hidden="true" />
                              {log.failed_count}
                            </span>
                          )}
                        </div>
                        <p className="flex items-center gap-1 text-[10px] text-gray-500 mt-1">
                          <Clock className="h-2.5 w-2.5" aria-hidden="true" />
                          {formatDate(log.created_at)}
                        </p>
                      </div>
                    </div>
                  </button>

                  {expandedLog === log.id && (
                    <div className="border-t border-gray-200 p-4 text-xs space-y-3 bg-white/30">
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <p className="font-medium text-gray-500">Total Subscribers</p>
                          <p className="text-gray-900 mt-0.5">{log.total_subscribers}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-500">Delivered</p>
                          <p className="text-green-600 mt-0.5">{log.sent_count}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-500">Failed</p>
                          <p className="text-red-500 mt-0.5">{log.failed_count}</p>
                        </div>
                      </div>

                      {log.url && (
                        <div>
                          <p className="font-medium text-gray-500">Link URL</p>
                          <p className="text-gray-900 mt-0.5">{log.url}</p>
                        </div>
                      )}

                      {/* Show configured options */}
                      {(log.icon || log.badge || log.image || log.tag || log.dir || log.lang ||
                        log.require_interaction || log.silent || log.renotify || log.vibrate ||
                        log.actions) && (
                        <div>
                          <p className="font-medium text-gray-500 mb-1">Options</p>
                          <div className="flex flex-wrap gap-1.5">
                            {log.icon && (
                              <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-0.5 text-[10px] text-gray-500">icon</span>
                            )}
                            {log.badge && (
                              <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-0.5 text-[10px] text-gray-500">badge</span>
                            )}
                            {log.image && (
                              <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-0.5 text-[10px] text-gray-500">image</span>
                            )}
                            {log.tag && (
                              <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-0.5 text-[10px] text-gray-500">tag: {log.tag}</span>
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
                              <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-0.5 text-[10px] text-gray-500">vibrate: {log.vibrate}</span>
                            )}
                            {log.dir && log.dir !== 'auto' && (
                              <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-0.5 text-[10px] text-gray-500">dir: {log.dir}</span>
                            )}
                            {log.lang && (
                              <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-0.5 text-[10px] text-gray-500">lang: {log.lang}</span>
                            )}
                            {log.actions && log.actions.length > 0 && (
                              <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-0.5 text-[10px] text-gray-500">
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
