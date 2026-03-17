'use client';

import { useEffect, useState } from 'react';
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
    fetch('/api/cms/partners')
      .then((r) => r.json())
      .then((d) => Array.isArray(d) && setItems(d));

  useEffect(() => { load(); }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/cms/upload', { method: 'POST', body: fd });
    const { url } = await res.json();
    if (url) setForm((f) => ({ ...f, logo_url: url }));
    setUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = { ...form, logo_url: form.logo_url || null, description: form.description || null, booth_number: form.booth_number || null, website: form.website || null };
    if (editId) {
      await fetch(`/api/cms/partners/${editId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    } else {
      await fetch('/api/cms/partners', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
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
    await fetch(`/api/cms/partners/${id}`, { method: 'DELETE' });
    load();
  };

  const badge: Record<string, string> = { gold: 'bg-yellow-900/50 text-yellow-300', silver: 'bg-gray-700/50 text-gray-300', bronze: 'bg-orange-900/50 text-orange-300' };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Partners</h1>
        <button onClick={() => { setForm(empty); setEditId(null); setShowForm(!showForm); }} className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold hover:bg-indigo-500">
          <Plus className="h-4 w-4" /> Add
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 space-y-3 rounded-xl bg-gray-900 p-4 border border-gray-800">
          <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Company Name *" className="w-full rounded-lg bg-gray-800 px-3 py-2 text-sm border border-gray-700 focus:border-indigo-500 focus:outline-none" />
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 cursor-pointer rounded-lg bg-gray-800 px-3 py-2 text-sm border border-gray-700 hover:border-gray-600">
              <Upload className="h-4 w-4" /> {uploading ? 'Uploading...' : 'Logo'}
              <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
            </label>
            {form.logo_url && <img src={form.logo_url} alt="" className="h-8 w-8 object-contain" />}
          </div>
          <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as Partner['category'] }))} className="w-full rounded-lg bg-gray-800 px-3 py-2 text-sm border border-gray-700 focus:border-indigo-500 focus:outline-none">
            <option value="gold">Gold</option>
            <option value="silver">Silver</option>
            <option value="bronze">Bronze</option>
          </select>
          <input value={form.booth_number} onChange={(e) => setForm((f) => ({ ...f, booth_number: e.target.value }))} placeholder="Booth Number" className="w-full rounded-lg bg-gray-800 px-3 py-2 text-sm border border-gray-700 focus:border-indigo-500 focus:outline-none" />
          <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Description" rows={2} className="w-full rounded-lg bg-gray-800 px-3 py-2 text-sm border border-gray-700 focus:border-indigo-500 focus:outline-none" />
          <input value={form.website} onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))} placeholder="Website URL" className="w-full rounded-lg bg-gray-800 px-3 py-2 text-sm border border-gray-700 focus:border-indigo-500 focus:outline-none" />
          <div className="flex gap-2">
            <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold hover:bg-indigo-500">{editId ? 'Update' : 'Create'}</button>
            <button type="button" onClick={() => setShowForm(false)} className="rounded-lg bg-gray-800 px-4 py-2 text-sm hover:bg-gray-700">Cancel</button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {items.map((p) => (
          <div key={p.id} className="flex items-center gap-3 rounded-xl bg-gray-900 p-3 border border-gray-800">
            <div className="h-10 w-10 shrink-0 rounded-lg bg-gray-800 flex items-center justify-center overflow-hidden">
              {p.logo_url && <img src={p.logo_url} alt={p.name} className="h-8 w-8 object-contain" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold truncate">{p.name}</p>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${badge[p.category]}`}>{p.category}</span>
              </div>
              {p.booth_number && <p className="text-xs text-gray-500">Booth {p.booth_number}</p>}
            </div>
            <button onClick={() => handleEdit(p)} className="p-1.5 rounded hover:bg-gray-800"><Pencil className="h-4 w-4 text-gray-400" /></button>
            <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded hover:bg-gray-800"><Trash2 className="h-4 w-4 text-red-400" /></button>
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-gray-500 text-center py-8">No partners yet</p>}
      </div>
    </div>
  );
}
