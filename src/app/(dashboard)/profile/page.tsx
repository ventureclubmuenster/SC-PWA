'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useDemoUser, isDemoMode } from '@/lib/demo';
import { DEMO_COOKIE } from '@/app/auth/demo/route';
import { User, LogOut, Save } from 'lucide-react';
import type { Profile } from '@/types';

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: '',
    university: '',
    afterparty_rsvp: false,
  });
  const demoUser = useDemoUser();

  useEffect(() => {
    const load = async () => {
      if (demoUser) {
        setProfile(demoUser);
        setForm({
          full_name: demoUser.full_name || '',
          university: demoUser.university || '',
          afterparty_rsvp: demoUser.afterparty_rsvp || false,
        });
        setLoading(false);
        return;
      }
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        if (data) {
          setProfile(data);
          setForm({
            full_name: data.full_name || '',
            university: data.university || '',
            afterparty_rsvp: data.afterparty_rsvp || false,
          });
        }
      }
      setLoading(false);
    };
    load();
  }, [demoUser]);

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    if (isDemoMode()) {
      // Update demo cookie in-place
      const updated = { ...profile, ...form, updated_at: new Date().toISOString() };
      document.cookie = `${DEMO_COOKIE}=${encodeURIComponent(JSON.stringify(updated))}; max-age=${60 * 60 * 24 * 365}; path=/; samesite=lax`;
      setProfile(updated);
      setSaving(false);
      return;
    }
    const supabase = createClient();
    await supabase
      .from('profiles')
      .update({
        full_name: form.full_name,
        university: form.university,
        afterparty_rsvp: form.afterparty_rsvp,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.id);
    setSaving(false);
  };

  const handleLogout = async () => {
    if (isDemoMode()) {
      document.cookie = `${DEMO_COOKIE}=; max-age=0; path=/`;
      window.location.href = '/';
      return;
    }
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-32 animate-pulse rounded bg-gray-800" />
        <div className="h-64 animate-pulse rounded-xl bg-gray-800" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Profile</h1>

      {/* Avatar & Email */}
      <div className="flex items-center gap-4 rounded-xl bg-gray-900 p-4 border border-gray-800">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600">
          <User className="h-6 w-6 text-white" />
        </div>
        <div>
          <p className="font-semibold text-sm">{form.full_name || 'No name set'}</p>
          <p className="text-xs text-gray-400">{profile?.email}</p>
          <p className="text-[10px] text-gray-600 mt-0.5 capitalize">{profile?.role}</p>
        </div>
      </div>

      {/* Edit Form */}
      <div className="space-y-4 rounded-xl bg-gray-900 p-4 border border-gray-800">
        <div className="space-y-1">
          <label className="text-xs text-gray-400">Full Name</label>
          <input
            type="text"
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            className="w-full rounded-lg bg-gray-800 px-3 py-2 text-sm outline-none ring-1 ring-gray-700 focus:ring-indigo-500"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-gray-400">University</label>
          <input
            type="text"
            value={form.university}
            onChange={(e) => setForm({ ...form, university: e.target.value })}
            className="w-full rounded-lg bg-gray-800 px-3 py-2 text-sm outline-none ring-1 ring-gray-700 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center justify-between">
          <label className="text-xs text-gray-400">Afterparty RSVP</label>
          <button
            onClick={() => setForm({ ...form, afterparty_rsvp: !form.afterparty_rsvp })}
            className={`h-6 w-11 rounded-full transition-colors ${
              form.afterparty_rsvp ? 'bg-indigo-600' : 'bg-gray-700'
            }`}
          >
            <div
              className={`h-5 w-5 rounded-full bg-white transition-transform ${
                form.afterparty_rsvp ? 'translate-x-5.5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 py-3 text-sm text-red-400 border border-gray-800 hover:bg-gray-800 transition-colors"
      >
        <LogOut className="h-4 w-4" />
        Sign Out
      </button>
    </div>
  );
}
