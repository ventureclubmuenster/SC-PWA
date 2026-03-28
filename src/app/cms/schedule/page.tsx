'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Pencil, Plus } from 'lucide-react';
import TimePicker from '@/components/admin/TimePicker';

interface Speaker {
  id: string;
  name: string;
  photo_url: string | null;
}

interface ScheduleItem {
  id: string;
  title: string;
  time: string;
  end_time: string | null;
  location: string;
  category: 'keynote' | 'workshop' | 'podcast' | 'event';
  workshop_id: string | null;
  description: string | null;
  speaker_id: string | null;
  speaker?: Speaker | null;
}

const categories = ['keynote', 'podcast', 'event'] as const;
const FIXED_DATE = '2026-01-01';
const empty = { title: '', time: '', end_time: '', location: '', category: 'keynote' as ScheduleItem['category'], description: '', speaker_id: '' };

export default function ScheduleCmsPage() {
  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const load = () =>
    Promise.all([
      fetch('/api/admin/schedule').then((r) => r.json()),
      fetch('/api/admin/speakers').then((r) => r.json()),
    ]).then(([s, sp]) => {
      if (Array.isArray(s)) setItems(s);
      if (Array.isArray(sp)) setSpeakers(sp);
    });

  useEffect(() => { load(); }, []);

  const toLocal = (iso: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.end_time && form.time && form.end_time <= form.time) {
      alert('End time must be after start time.');
      return;
    }
    const body = {
      title: form.title,
      time: new Date(`${FIXED_DATE}T${form.time}:00`).toISOString(),
      end_time: form.end_time ? new Date(`${FIXED_DATE}T${form.end_time}:00`).toISOString() : null,
      location: form.location,
      category: form.category,
      description: form.description || null,
      speaker_id: form.speaker_id || null,
    };
    if (editId) {
      await fetch(`/api/admin/schedule/${editId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    } else {
      await fetch('/api/admin/schedule', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    }
    setForm(empty);
    setEditId(null);
    setShowForm(false);
    load();
  };

  const handleEdit = (item: ScheduleItem) => {
    setForm({
      title: item.title,
      time: toLocal(item.time),
      end_time: item.end_time ? toLocal(item.end_time) : '',
      location: item.location,
      category: item.category,
      description: item.description || '',
      speaker_id: item.speaker_id || '',
    });
    setEditId(item.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this schedule item?')) return;
    await fetch(`/api/admin/schedule/${id}`, { method: 'DELETE' });
    load();
  };

  const fmt = (iso: string) => new Date(iso).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  const catColors: Record<string, string> = { keynote: 'bg-purple-100 text-purple-700', workshop: 'bg-blue-100 text-blue-700', podcast: 'bg-amber-100 text-amber-700', event: 'bg-green-100 text-green-700' };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Schedule</h1>
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.95 }} onClick={() => { setForm(empty); setEditId(null); setShowForm(!showForm); }} className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-violet-500 to-purple-600 px-3 py-2.5 text-sm font-semibold text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500">
          <Plus className="h-4 w-4" aria-hidden="true" /> Add
        </motion.button>
      </div>

      <AnimatePresence>
      {showForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          style={{ overflow: 'hidden' }}
        >
        <form onSubmit={handleSubmit} className="mb-6 space-y-3 rounded-2xl bg-white p-4 border border-gray-200">
          <input required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Title *" aria-label="Title" className="w-full rounded-lg bg-gray-50 px-3 py-2 text-sm border border-gray-200 focus:border-violet-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500" />
          <div className="grid grid-cols-2 gap-3">
            <TimePicker
              label="Start Time *"
              required
              value={form.time}
              onChange={(v) => setForm((f) => ({ ...f, time: v }))}
            />
            <TimePicker
              label="End Time"
              value={form.end_time}
              onChange={(v) => setForm((f) => ({ ...f, end_time: v }))}
            />
          </div>
          <input required value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} placeholder="Location / Stage *" aria-label="Location / Stage" className="w-full rounded-lg bg-gray-50 px-3 py-2 text-sm border border-gray-200 focus:border-violet-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500" />
          <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as ScheduleItem['category'] }))} aria-label="Category" className="w-full rounded-lg bg-gray-50 px-3 py-2 text-sm border border-gray-200 focus:border-violet-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500">
            {categories.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
          </select>
          <select value={form.speaker_id} onChange={(e) => setForm((f) => ({ ...f, speaker_id: e.target.value }))} aria-label="Speaker" className="w-full rounded-lg bg-gray-50 px-3 py-2 text-sm border border-gray-200 focus:border-violet-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500">
            <option value="">No speaker</option>
            {speakers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Description" aria-label="Description" rows={2} className="w-full rounded-lg bg-gray-50 px-3 py-2 text-sm border border-gray-200 focus:border-violet-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500" />
          <div className="flex gap-2">
            <motion.button whileTap={{ scale: 0.95 }} type="submit" className="rounded-lg bg-gradient-to-r from-violet-500 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500">{editId ? 'Update' : 'Create'}</motion.button>
            <motion.button whileTap={{ scale: 0.95 }} type="button" onClick={() => setShowForm(false)} className="rounded-lg bg-gray-50 px-4 py-2.5 text-sm font-medium hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500">Cancel</motion.button>
          </div>
        </form>
        </motion.div>
      )}
      </AnimatePresence>

      <div className="space-y-2">
        {items.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="flex items-center gap-3 rounded-2xl bg-white p-3 border border-gray-200"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold truncate">{item.title}</p>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${catColors[item.category] || 'bg-gray-50 text-gray-500'}`}>{item.category.charAt(0).toUpperCase() + item.category.slice(1)}</span>
                {item.workshop_id && <span className="shrink-0 rounded-full bg-gray-50 text-gray-500 px-2 py-0.5 text-[10px] font-medium">Auto</span>}
              </div>
              <p className="text-xs text-gray-500">{fmt(item.time)}{item.end_time ? ` – ${fmt(item.end_time)}` : ''} · {item.location}{item.speaker ? ` · ${item.speaker.name}` : ''}</p>
            </div>
            {!item.workshop_id && (
              <>
                <motion.button whileTap={{ scale: 0.85 }} onClick={() => handleEdit(item)} aria-label={`Edit ${item.title}`} className="p-2 rounded-lg hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"><Pencil className="h-4 w-4 text-gray-500" aria-hidden="true" /></motion.button>
                <motion.button whileTap={{ scale: 0.85 }} onClick={() => handleDelete(item.id)} aria-label={`Delete ${item.title}`} className="p-2 rounded-lg hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"><Trash2 className="h-4 w-4 text-red-500" aria-hidden="true" /></motion.button>
              </>
            )}
          </motion.div>
        ))}
        {items.length === 0 && <p className="text-sm text-gray-500 text-center py-8">No schedule items yet</p>}
      </div>
    </div>
  );
}
