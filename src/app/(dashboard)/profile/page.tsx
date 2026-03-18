'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useDemoUser, isDemoMode } from '@/lib/demo';
import { useProfile as useCachedProfile } from '@/components/DataProvider';
import { DEMO_COOKIE } from '@/app/auth/demo/route';
import PageHeader from '@/components/PageHeader';
import { User, LogOut, Save, Bell, BellOff, Upload, FileText, Trash2 } from 'lucide-react';
import { FadeIn, TapButton } from '@/components/motion';
import type { Profile } from '@/types';
import PushNotificationManager from '@/components/push/PushNotificationManager';

export default function ProfilePage() {
  const { profile: cachedProfile, loading: cacheLoading, refreshProfile } = useCachedProfile();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingCv, setUploadingCv] = useState(false);
  const [form, setForm] = useState({
    full_name: '',
    university: '',
    afterparty_rsvp: false,
  });
  const demoUser = useDemoUser();

  // Hydrate from cache
  useEffect(() => {
    const p = demoUser || cachedProfile;
    if (p) {
      setProfile(p);
      setForm({
        full_name: p.full_name || '',
        university: p.university || '',
        afterparty_rsvp: p.afterparty_rsvp || false,
      });
      setLoading(false);
    } else if (!cacheLoading) {
      setLoading(false);
    }
  }, [demoUser, cachedProfile, cacheLoading]);

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
    refreshProfile();
    setSaving(false);
  };

  const handleCvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    setUploadingCv(true);
    const supabase = createClient();
    const ext = file.name.split('.').pop();
    const fileName = `${profile.id}/cv-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('cvs')
      .upload(fileName, file, { contentType: file.type, upsert: true });

    if (!uploadError) {
      const { data: urlData } = supabase.storage
        .from('cvs')
        .getPublicUrl(fileName);

      await supabase
        .from('profiles')
        .update({ cv_url: urlData.publicUrl, updated_at: new Date().toISOString() })
        .eq('id', profile.id);
      setProfile((p) => p ? { ...p, cv_url: urlData.publicUrl } : p);
      refreshProfile();
    }
    setUploadingCv(false);
    e.target.value = '';
  };

  const handleCvRemove = async () => {
    if (!profile?.cv_url) return;
    setUploadingCv(true);
    const supabase = createClient();
    await supabase
      .from('profiles')
      .update({ cv_url: null, updated_at: new Date().toISOString() })
      .eq('id', profile.id);
    setProfile((p) => p ? { ...p, cv_url: null } : p);
    refreshProfile();
    setUploadingCv(false);
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
    return null;
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Profile" subtitle="Manage your account" />

      {/* Avatar & Email */}
      <FadeIn delay={0}>
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
      </FadeIn>

      {/* Edit Form */}
      <FadeIn delay={0.1}>
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

        <TapButton
          onClick={handleSave}
          disabled={saving}
          className="relative z-10 noise-panel-dark flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
        >
          <Save className="relative z-10 h-4 w-4" />
          <span className="relative z-10">{saving ? 'Saving...' : 'Save Profile'}</span>
        </TapButton>
      </div>
      </FadeIn>

      {/* CV Upload */}
      <FadeIn delay={0.2}>
      <div className="noise-panel rounded-2xl p-4 border border-[#E8E8ED] shadow-sm space-y-3">
        <div className="relative z-10">
          <p className="text-sm font-semibold text-[#1D1D1F]">CV / Resume</p>
          <p className="text-xs text-[#86868B] mt-0.5">
            {profile?.cv_url ? 'Your CV has been uploaded' : 'Upload your CV (PDF recommended)'}
          </p>
        </div>

        {profile?.cv_url ? (
          <div className="relative z-10 flex items-center gap-2">
            <a
              href={profile.cv_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center gap-2 rounded-xl bg-green-50 px-3 py-2.5 text-xs font-medium text-green-600 hover:bg-green-100 transition-all"
            >
              <FileText className="h-4 w-4" />
              View CV
            </a>
            <button
              onClick={handleCvRemove}
              disabled={uploadingCv}
              className="rounded-xl bg-red-50 px-3 py-2.5 text-xs font-medium text-red-600 hover:bg-red-100 disabled:opacity-50 transition-all"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <label className="relative z-10 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#E8E8ED] py-4 text-sm font-medium text-[#86868B] hover:border-[#FF754B] hover:text-[#FF754B] transition-all">
            <Upload className="h-4 w-4" />
            {uploadingCv ? 'Uploading...' : 'Upload CV'}
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleCvUpload}
              className="hidden"
              disabled={uploadingCv}
            />
          </label>
        )}
      </div>
      </FadeIn>

      {/* Push Notifications */}
      <FadeIn delay={0.3}>
      <PushNotificationManager>
        {({ isSubscribed, isLoading, subscribe }) => (
          <TapButton
            onClick={subscribe}
            disabled={isSubscribed || isLoading}
            className="w-full noise-panel rounded-2xl p-4 border border-[#E8E8ED] shadow-sm text-left transition-all disabled:opacity-100"
          >
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-[#1D1D1F]">Push Notifications</p>
                <p className="text-xs text-[#86868B] mt-0.5">
                  {isLoading ? 'Enabling...' : isSubscribed ? 'Notifications are enabled' : 'Tap to enable notifications'}
                </p>
              </div>
              {isSubscribed ? (
                <Bell size={20} className="text-[#FF754B]" />
              ) : (
                <BellOff size={20} className="text-[#86868B]" />
              )}
            </div>
          </TapButton>
        )}
      </PushNotificationManager>
      </FadeIn>

      {/* Logout */}
      <FadeIn delay={0.4}>
      <TapButton
        onClick={handleLogout}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-3 text-sm font-medium text-red-500 border border-[#E8E8ED] hover:bg-red-50 transition-all shadow-sm"
      >
        <LogOut className="h-4 w-4" />
        Sign Out
      </TapButton>
      </FadeIn>
    </div>
  );
}
