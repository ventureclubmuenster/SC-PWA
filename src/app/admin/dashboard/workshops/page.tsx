'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Pencil, Plus, Upload } from 'lucide-react';

interface Workshop {
  id: string;
  title: string;
  description: string | null;
  capacity: number;
  time: string;
  end_time: string | null;
  location: string | null;
  host: string;
  host_logo_url: string | null;
  has_waiting_list: boolean;
  cv_required: boolean;
  exhibitor_id: string | null;
}

interface Exhibitor {
  id: string;
  full_name: string | null;
  email: string;
  company: string | null;
}

const empty = { title: '', description: '', capacity: 30, time: '', end_time: '', location: '', host: '', host_logo_url: '', has_waiting_list: false, cv_required: false, exhibitor_id: '' };

export default function WorkshopsCmsPage() {
  const [items, setItems] = useState<Workshop[]>([]);
  const [exhibitors, setExhibitors] = useState<Exhibitor[]>([]);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = () =>
    fetch('/api/admin/workshops')
      .then((r) => r.json())
      .then((d) => Array.isArray(d) && setItems(d));

  const loadExhibitors = () =>
    fetch('/api/admin/exhibitors')
      .then((r) => r.json())
      .then((d) => Array.isArray(d) && setExhibitors(d));

  useEffect(() => { load(); loadExhibitors(); }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
    const { url } = await res.json();
    if (url) setForm((f) => ({ ...f, host_logo_url: url }));
    setUploading(false);
  };

  const toLocal = (iso: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toISOString().slice(0, 16);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = {
      title: form.title,
      description: form.description || null,
      capacity: form.capacity,
      time: new Date(form.time).toISOString(),
      end_time: form.end_time ? new Date(form.end_time).toISOString() : null,
      location: form.location || null,
      host: form.host,
      host_logo_url: form.host_logo_url || null,
      has_waiting_list: form.has_waiting_list,
      cv_required: form.cv_required,
      exhibitor_id: form.exhibitor_id || null,
    };
    if (editId) {
      await fetch(`/api/admin/workshops/${editId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    } else {
      await fetch('/api/admin/workshops', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    }
    setForm(empty);
    setEditId(null);
    setShowForm(false);
    load();
  };

  const handleEdit = (w: Workshop) => {
    setForm({
      title: w.title,
      description: w.description || '',
      capacity: w.capacity,
      time: toLocal(w.time),
      end_time: w.end_time ? toLocal(w.end_time) : '',
      location: w.location || '',
      host: w.host,
      host_logo_url: w.host_logo_url || '',
      has_waiting_list: w.has_waiting_list,
      cv_required: w.cv_required,
      exhibitor_id: w.exhibitor_id || '',
    });
    setEditId(w.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this workshop?')) return;
    await fetch(`/api/admin/workshops/${id}`, { method: 'DELETE' });
    load();
  };

  const fmt = (iso: string) => new Date(iso).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Workshops</h1>
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
          <input required value={form.host} onChange={(e) => setForm((f) => ({ ...f, host: e.target.value }))} placeholder="Host / Company *" className="w-full rounded-lg bg-[#F5F5F7] px-3 py-2 text-sm border border-[#E8E8ED] focus:border-[#FF754B] focus:outline-none" />
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 cursor-pointer rounded-lg bg-[#F5F5F7] px-3 py-2 text-sm border border-[#E8E8ED] hover:border-[#ccc]">
              <Upload className="h-4 w-4" /> {uploading ? 'Uploading...' : 'Host Logo'}
              <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
            </label>
            {form.host_logo_url && <img src={form.host_logo_url} alt="" className="h-8 w-8 object-contain" />}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[#86868B] mb-1 block">Start Time *</label>
              <input required type="datetime-local" value={form.time} onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))} className="w-full rounded-lg bg-[#F5F5F7] px-3 py-2 text-sm border border-[#E8E8ED] focus:border-[#FF754B] focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-[#86868B] mb-1 block">End Time</label>
              <input type="datetime-local" value={form.end_time} onChange={(e) => setForm((f) => ({ ...f, end_time: e.target.value }))} className="w-full rounded-lg bg-[#F5F5F7] px-3 py-2 text-sm border border-[#E8E8ED] focus:border-[#FF754B] focus:outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} placeholder="Location" className="rounded-lg bg-[#F5F5F7] px-3 py-2 text-sm border border-[#E8E8ED] focus:border-[#FF754B] focus:outline-none" />
            <input required type="number" value={form.capacity} onChange={(e) => setForm((f) => ({ ...f, capacity: parseInt(e.target.value) || 0 }))} placeholder="Capacity *" className="rounded-lg bg-[#F5F5F7] px-3 py-2 text-sm border border-[#E8E8ED] focus:border-[#FF754B] focus:outline-none" />
          </div>
          <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Description" rows={2} className="w-full rounded-lg bg-[#F5F5F7] px-3 py-2 text-sm border border-[#E8E8ED] focus:border-[#FF754B] focus:outline-none" />

          {/* Exhibitor assignment */}
          <div>
            <label className="text-xs text-[#86868B] mb-1 block">Linked Exhibitor</label>
            <select value={form.exhibitor_id} onChange={(e) => setForm((f) => ({ ...f, exhibitor_id: e.target.value }))} className="w-full rounded-lg bg-[#F5F5F7] px-3 py-2 text-sm border border-[#E8E8ED] focus:border-[#FF754B] focus:outline-none">
              <option value="">No exhibitor</option>
              {exhibitors.map((ex) => <option key={ex.id} value={ex.id}>{ex.company || ex.full_name || ex.email}</option>)}
            </select>
          </div>

          {/* Waiting list & CV required toggles */}
          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.has_waiting_list} onChange={(e) => setForm((f) => ({ ...f, has_waiting_list: e.target.checked }))} className="h-4 w-4 rounded border-[#E8E8ED] text-[#FF754B] focus:ring-[#FF754B]" />
              Waiting List
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.cv_required} onChange={(e) => setForm((f) => ({ ...f, cv_required: e.target.checked }))} className="h-4 w-4 rounded border-[#E8E8ED] text-[#FF754B] focus:ring-[#FF754B]" />
              CV Required
            </label>
          </div>

          <div className="flex gap-2">
            <motion.button whileTap={{ scale: 0.95 }} type="submit" className="rounded-lg noise-panel-dark px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90">{editId ? 'Update' : 'Create'}</motion.button>
            <motion.button whileTap={{ scale: 0.95 }} type="button" onClick={() => setShowForm(false)} className="rounded-lg bg-[#F5F5F7] px-4 py-2.5 text-sm font-medium hover:bg-[#E8E8ED]">Cancel</motion.button>
          </div>
        </form>
        </motion.div>
      )}
      </AnimatePresence>

      <div className="space-y-2">
        {items.map((w, i) => (
          <motion.div
            key={w.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="flex items-center gap-3 rounded-2xl bg-white p-3 border border-[#E8E8ED]"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold truncate">{w.title}</p>
                {w.has_waiting_list && <span className="shrink-0 rounded-full bg-amber-100 text-amber-700 px-2 py-0.5 text-[10px] font-medium">Waiting List</span>}
                {w.cv_required && <span className="shrink-0 rounded-full bg-blue-100 text-blue-700 px-2 py-0.5 text-[10px] font-medium">CV Required</span>}
              </div>
              <p className="text-xs text-[#86868B]">{w.host} · {fmt(w.time)}{w.end_time ? ` – ${fmt(w.end_time)}` : ''} · {w.capacity} spots</p>
            </div>
            <motion.button whileTap={{ scale: 0.85 }} onClick={() => handleEdit(w)} className="p-1.5 rounded hover:bg-[#F5F5F7]"><Pencil className="h-4 w-4 text-[#86868B]" /></motion.button>
            <motion.button whileTap={{ scale: 0.85 }} onClick={() => handleDelete(w.id)} className="p-1.5 rounded hover:bg-[#F5F5F7]"><Trash2 className="h-4 w-4 text-red-500" /></motion.button>
          </motion.div>
        ))}
        {items.length === 0 && <p className="text-sm text-[#86868B] text-center py-8">No workshops yet</p>}
      </div>
    </div>
  );
}
