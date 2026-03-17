'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useDemoUser, isDemoMode } from '@/lib/demo';
import { DEMO_COOKIE } from '@/app/auth/demo/route';
import PageHeader from '@/components/PageHeader';
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
        <div className="h-8 w-32 animate-pulse rounded bg-[#E8E8ED]" />
        <div className="h-64 animate-pulse rounded-2xl bg-[#E8E8ED]" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Profile" subtitle="Manage your account" />

      {/* Avatar & Email */}
      <div className="noise-panel-accent flex items-center gap-4 rounded-2xl p-4 border border-[#E8E8ED] shadow-sm">
        <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full noise-panel-dark">
          <User className="relative z-10 h-6 w-6 text-white" />
        </div>
        <div className="relative z-10">
          <p className="font-semibold text-sm text-[#1D1D1F]">{form.full_name || 'No name set'}</p>
          <p className="text-xs text-[#86868B]">{profile?.email}</p>
          <p className="text-[10px] text-[#86868B] mt-0.5 capitalize font-medium">{profile?.role}</p>
        </div>
      </div>

      {/* Edit Form */}
      <div className="space-y-4 noise-panel rounded-2xl p-4 border border-[#E8E8ED] shadow-sm">
        <div className="relative z-10 space-y-1">
          <label className="text-xs font-medium text-[#86868B]">Full Name</label>
          <input
            type="text"
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            className="w-full rounded-xl bg-white px-3 py-2.5 text-sm outline-none ring-1 ring-[#E8E8ED] focus:ring-2 focus:ring-[#FF754B] transition-all"
          />
        </div>

        <div className="relative z-10 space-y-1">
          <label className="text-xs font-medium text-[#86868B]">University</label>
          <input
            type="text"
            value={form.university}
            onChange={(e) => setForm({ ...form, university: e.target.value })}
            className="w-full rounded-xl bg-white px-3 py-2.5 text-sm outline-none ring-1 ring-[#E8E8ED] focus:ring-2 focus:ring-[#FF754B] transition-all"
          />
        </div>

        <div className="relative z-10 flex items-center justify-between">
          <label className="text-xs font-medium text-[#86868B]">Afterparty RSVP</label>
          <button
            onClick={() => setForm({ ...form, afterparty_rsvp: !form.afterparty_rsvp })}
            className={`h-6 w-11 rounded-full transition-colors ${
              form.afterparty_rsvp ? 'bg-[#FF754B]' : 'bg-[#E8E8ED]'
            }`}
          >
            <div
              className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                form.afterparty_rsvp ? 'translate-x-5.5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="relative z-10 noise-panel-dark flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
        >
          <Save className="relative z-10 h-4 w-4" />
          <span className="relative z-10">{saving ? 'Saving...' : 'Save Profile'}</span>
        </button>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-3 text-sm font-medium text-red-500 border border-[#E8E8ED] hover:bg-red-50 transition-all shadow-sm"
      >
        <LogOut className="h-4 w-4" />
        Sign Out
      </button>
    </div>
  );
}
