'use client';

import { useEffect, useState } from 'react';
import { Trash2, Pencil, Plus, Upload } from 'lucide-react';

interface Speaker {
  id: string;
  name: string;
  photo_url: string | null;
  linkedin: string | null;
  bio: string | null;
}

const empty = { name: '', photo_url: '', linkedin: '', bio: '' };

export default function SpeakersPage() {
  const [items, setItems] = useState<Speaker[]>([]);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = () =>
    fetch('/api/cms/speakers')
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
    if (url) setForm((f) => ({ ...f, photo_url: url }));
    setUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = { ...form, photo_url: form.photo_url || null, linkedin: form.linkedin || null, bio: form.bio || null };
    if (editId) {
      await fetch(`/api/cms/speakers/${editId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    } else {
      await fetch('/api/cms/speakers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    }
    setForm(empty);
    setEditId(null);
    setShowForm(false);
    load();
  };

  const handleEdit = (s: Speaker) => {
    setForm({ name: s.name, photo_url: s.photo_url || '', linkedin: s.linkedin || '', bio: s.bio || '' });
    setEditId(s.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this speaker?')) return;
    await fetch(`/api/cms/speakers/${id}`, { method: 'DELETE' });
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Speakers</h1>
        <button onClick={() => { setForm(empty); setEditId(null); setShowForm(!showForm); }} className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold hover:bg-indigo-500">
          <Plus className="h-4 w-4" /> Add
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 space-y-3 rounded-xl bg-gray-900 p-4 border border-gray-800">
          <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Name *" className="w-full rounded-lg bg-gray-800 px-3 py-2 text-sm border border-gray-700 focus:border-indigo-500 focus:outline-none" />
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 cursor-pointer rounded-lg bg-gray-800 px-3 py-2 text-sm border border-gray-700 hover:border-gray-600">
              <Upload className="h-4 w-4" /> {uploading ? 'Uploading...' : 'Photo'}
              <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
            </label>
            {form.photo_url && <img src={form.photo_url} alt="" className="h-8 w-8 rounded-full object-cover" />}
          </div>
          <input value={form.linkedin} onChange={(e) => setForm((f) => ({ ...f, linkedin: e.target.value }))} placeholder="LinkedIn URL" className="w-full rounded-lg bg-gray-800 px-3 py-2 text-sm border border-gray-700 focus:border-indigo-500 focus:outline-none" />
          <textarea value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} placeholder="Bio" rows={3} className="w-full rounded-lg bg-gray-800 px-3 py-2 text-sm border border-gray-700 focus:border-indigo-500 focus:outline-none" />
          <div className="flex gap-2">
            <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold hover:bg-indigo-500">{editId ? 'Update' : 'Create'}</button>
            <button type="button" onClick={() => setShowForm(false)} className="rounded-lg bg-gray-800 px-4 py-2 text-sm hover:bg-gray-700">Cancel</button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {items.map((s) => (
          <div key={s.id} className="flex items-center gap-3 rounded-xl bg-gray-900 p-3 border border-gray-800">
            <div className="h-10 w-10 shrink-0 rounded-full bg-gray-800 overflow-hidden">
              {s.photo_url && <img src={s.photo_url} alt={s.name} className="h-full w-full object-cover" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{s.name}</p>
              {s.bio && <p className="text-xs text-gray-500 truncate">{s.bio}</p>}
            </div>
            <button onClick={() => handleEdit(s)} className="p-1.5 rounded hover:bg-gray-800"><Pencil className="h-4 w-4 text-gray-400" /></button>
            <button onClick={() => handleDelete(s.id)} className="p-1.5 rounded hover:bg-gray-800"><Trash2 className="h-4 w-4 text-red-400" /></button>
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-gray-500 text-center py-8">No speakers yet</p>}
      </div>
    </div>
  );
}
