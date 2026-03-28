'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Pencil, Plus, Upload } from 'lucide-react';

interface Partner {
  id: string;
  name: string;
  logo_url: string | null;
  description: string | null;
  booth_number: string | null;
  category: 'gold' | 'silver' | 'bronze';
  website: string | null;
}

const empty = { name: '', logo_url: '', description: '', booth_number: '', category: 'gold' as Partner['category'], website: '' };

export default function PartnersPage() {
  const [items, setItems] = useState<Partner[]>([]);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = () =>
    fetch('/api/admin/partners')
      .then((r) => r.json())
      .then((d) => Array.isArray(d) && setItems(d));

  useEffect(() => { load(); }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
    const { url } = await res.json();
    if (url) setForm((f) => ({ ...f, logo_url: url }));
    setUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = { ...form, logo_url: form.logo_url || null, description: form.description || null, booth_number: form.booth_number || null, website: form.website || null };
    if (editId) {
      await fetch(`/api/admin/partners/${editId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    } else {
      await fetch('/api/admin/partners', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    }
    setForm(empty);
    setEditId(null);
    setShowForm(false);
    load();
  };

  const handleEdit = (p: Partner) => {
    setForm({ name: p.name, logo_url: p.logo_url || '', description: p.description || '', booth_number: p.booth_number || '', category: p.category, website: p.website || '' });
    setEditId(p.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this partner?')) return;
    await fetch(`/api/admin/partners/${id}`, { method: 'DELETE' });
    load();
  };

  const badge: Record<string, string> = { gold: 'bg-yellow-100 text-yellow-700', silver: 'bg-gray-100 text-gray-600', bronze: 'bg-orange-100 text-orange-700' };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Partners</h1>
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
          <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Company Name *" aria-label="Company Name" className="w-full rounded-lg bg-gray-50 px-3 py-2 text-sm border border-gray-200 focus:border-violet-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500" />
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 cursor-pointer rounded-lg bg-gray-50 px-3 py-2 text-sm border border-gray-200 hover:border-[#ccc] focus-within:ring-2 focus-within:ring-violet-500 focus-within:ring-offset-1">
              <Upload className="h-4 w-4" aria-hidden="true" /> {uploading ? 'Uploading...' : 'Logo'}
              <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
            </label>
            {form.logo_url && <img src={form.logo_url} alt="Preview" className="h-8 w-8 object-contain" />}
          </div>
          <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as Partner['category'] }))} aria-label="Category" className="w-full rounded-lg bg-gray-50 px-3 py-2 text-sm border border-gray-200 focus:border-violet-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500">
            <option value="gold">Gold</option>
            <option value="silver">Silver</option>
            <option value="bronze">Bronze</option>
          </select>
          <input value={form.booth_number} onChange={(e) => setForm((f) => ({ ...f, booth_number: e.target.value }))} placeholder="Booth Number" aria-label="Booth Number" className="w-full rounded-lg bg-gray-50 px-3 py-2 text-sm border border-gray-200 focus:border-violet-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500" />
          <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Description" aria-label="Description" rows={2} className="w-full rounded-lg bg-gray-50 px-3 py-2 text-sm border border-gray-200 focus:border-violet-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500" />
          <input value={form.website} onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))} placeholder="Website URL" aria-label="Website URL" className="w-full rounded-lg bg-gray-50 px-3 py-2 text-sm border border-gray-200 focus:border-violet-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500" />
          <div className="flex gap-2">
            <motion.button whileTap={{ scale: 0.95 }} type="submit" className="rounded-lg bg-gradient-to-r from-violet-500 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500">{editId ? 'Update' : 'Create'}</motion.button>
            <motion.button whileTap={{ scale: 0.95 }} type="button" onClick={() => setShowForm(false)} className="rounded-lg bg-gray-50 px-4 py-2.5 text-sm font-medium hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500">Cancel</motion.button>
          </div>
        </form>
        </motion.div>
      )}
      </AnimatePresence>

      <div className="space-y-2">
        {items.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="flex items-center gap-3 rounded-2xl bg-white p-3 border border-gray-200"
          >
            <div className="h-10 w-10 shrink-0 rounded-lg bg-gray-50 flex items-center justify-center overflow-hidden">
              {p.logo_url && <img src={p.logo_url} alt={p.name} className="h-8 w-8 object-contain" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold truncate">{p.name}</p>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${badge[p.category]}`}>{p.category}</span>
              </div>
              {p.booth_number && <p className="text-xs text-gray-500">Booth {p.booth_number}</p>}
            </div>
            <motion.button whileTap={{ scale: 0.85 }} onClick={() => handleEdit(p)} aria-label={`Edit ${p.name}`} className="p-2 rounded-lg hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"><Pencil className="h-4 w-4 text-gray-500" aria-hidden="true" /></motion.button>
            <motion.button whileTap={{ scale: 0.85 }} onClick={() => handleDelete(p.id)} aria-label={`Delete ${p.name}`} className="p-2 rounded-lg hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"><Trash2 className="h-4 w-4 text-red-500" aria-hidden="true" /></motion.button>
          </motion.div>
        ))}
        {items.length === 0 && <p className="text-sm text-gray-500 text-center py-8">No partners yet</p>}
      </div>
    </div>
  );
}
