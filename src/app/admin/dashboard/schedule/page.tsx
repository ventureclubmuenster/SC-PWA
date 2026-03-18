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
  category: 'workshop' | 'main-stage' | 'panel' | 'networking';
  workshop_id: string | null;
  description: string | null;
  speaker_id: string | null;
  speaker?: Speaker | null;
}

const categories = ['main-stage', 'panel', 'networking'] as const;
const FIXED_DATE = '2026-01-01';
const empty = { title: '', time: '', end_time: '', location: '', category: 'main-stage' as ScheduleItem['category'], description: '', speaker_id: '' };

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
  const catColors: Record<string, string> = { 'main-stage': 'bg-purple-100 text-purple-700', workshop: 'bg-blue-100 text-blue-700', panel: 'bg-amber-100 text-amber-700', networking: 'bg-green-100 text-green-700' };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Schedule</h1>
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.95 }} onClick={() => { setForm(empty); setEditId(null); setShowForm(!showForm); }} className="flex items-center gap-1.5 rounded-lg noise-panel-dark px-3 py-2.5 text-sm font-semibold text-white hover:opacity-90">
          <Plus className="h-4 w-4" /> Add
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
        <form onSubmit={handleSubmit} className="mb-6 space-y-3 rounded-2xl bg-white p-4 border border-[#E8E8ED]">
          <input required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Title *" className="w-full rounded-lg bg-[#F5F5F7] px-3 py-2 text-sm border border-[#E8E8ED] focus:border-[#FF754B] focus:outline-none" />
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
          <input required value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} placeholder="Location / Stage *" className="w-full rounded-lg bg-[#F5F5F7] px-3 py-2 text-sm border border-[#E8E8ED] focus:border-[#FF754B] focus:outline-none" />
          <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as ScheduleItem['category'] }))} className="w-full rounded-lg bg-[#F5F5F7] px-3 py-2 text-sm border border-[#E8E8ED] focus:border-[#FF754B] focus:outline-none">
            {categories.map((c) => <option key={c} value={c}>{c.replace('-', ' ')}</option>)}
          </select>
          <select value={form.speaker_id} onChange={(e) => setForm((f) => ({ ...f, speaker_id: e.target.value }))} className="w-full rounded-lg bg-[#F5F5F7] px-3 py-2 text-sm border border-[#E8E8ED] focus:border-[#FF754B] focus:outline-none">
            <option value="">No speaker</option>
            {speakers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Description" rows={2} className="w-full rounded-lg bg-[#F5F5F7] px-3 py-2 text-sm border border-[#E8E8ED] focus:border-[#FF754B] focus:outline-none" />
          <div className="flex gap-2">
            <motion.button whileTap={{ scale: 0.95 }} type="submit" className="rounded-lg noise-panel-dark px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90">{editId ? 'Update' : 'Create'}</motion.button>
            <motion.button whileTap={{ scale: 0.95 }} type="button" onClick={() => setShowForm(false)} className="rounded-lg bg-[#F5F5F7] px-4 py-2.5 text-sm font-medium hover:bg-[#E8E8ED]">Cancel</motion.button>
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
            className="flex items-center gap-3 rounded-2xl bg-white p-3 border border-[#E8E8ED]"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold truncate">{item.title}</p>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${catColors[item.category] || 'bg-[#F5F5F7] text-[#86868B]'}`}>{item.category.replace('-', ' ')}</span>
                {item.workshop_id && <span className="shrink-0 rounded-full bg-[#F5F5F7] text-[#86868B] px-2 py-0.5 text-[10px] font-medium">Auto</span>}
              </div>
              <p className="text-xs text-[#86868B]">{fmt(item.time)}{item.end_time ? ` – ${fmt(item.end_time)}` : ''} · {item.location}{item.speaker ? ` · ${item.speaker.name}` : ''}</p>
            </div>
            {!item.workshop_id && (
              <>
                <motion.button whileTap={{ scale: 0.85 }} onClick={() => handleEdit(item)} className="p-1.5 rounded hover:bg-[#F5F5F7]"><Pencil className="h-4 w-4 text-[#86868B]" /></motion.button>
                <motion.button whileTap={{ scale: 0.85 }} onClick={() => handleDelete(item.id)} className="p-1.5 rounded hover:bg-[#F5F5F7]"><Trash2 className="h-4 w-4 text-red-500" /></motion.button>
              </>
            )}
          </motion.div>
        ))}
        {items.length === 0 && <p className="text-sm text-[#86868B] text-center py-8">No schedule items yet</p>}
      </div>
    </div>
  );
}
