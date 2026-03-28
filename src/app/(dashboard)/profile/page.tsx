'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useDemoUser, isDemoMode } from '@/lib/demo';
import { useProfile as useCachedProfile } from '@/components/DataProvider';
import { useTheme } from '@/components/ThemeProvider';
import { DEMO_COOKIE } from '@/app/auth/demo/route';
import PageHeader from '@/components/PageHeader';
import { User, LogOut, Save, Bell, BellOff, Upload, FileText, Trash2, Sun, Moon, Mail } from 'lucide-react';
import { FadeIn, TapButton } from '@/components/motion';
import type { Profile } from '@/types';
import PushNotificationManager from '@/components/push/PushNotificationManager';

export default function ProfilePage() {
  const { profile: cachedProfile, loading: cacheLoading, refreshProfile } = useCachedProfile();
  const { theme, toggleTheme } = useTheme();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingCv, setUploadingCv] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [form, setForm] = useState({
    full_name: '',
    university: '',
    afterparty_rsvp: false,
  });
  const demoUser = useDemoUser();

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

  const handleSendEmail = async () => {
    setSendingEmail(true);
    const res = await fetch('/api/send-email', { method: 'POST' });
    setSendingEmail(false);
    if (!res.ok) {
      alert('E-Mail konnte nicht gesendet werden.');
    }
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
    <div className="space-y-6">
      <PageHeader title="Profile" subtitle="Manage your account" />

      {/* Avatar & Email */}
      <FadeIn delay={0}>
        <div className="card-accent flex items-center gap-5 rounded-2xl p-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl gradient-accent gradient-glow">
            <User className="h-7 w-7 text-white" />
          </div>
        <div>
          <p className="font-semibold text-sm">{form.full_name || 'No name set'}</p>
          <p className="text-xs text-muted mt-0.5">{profile?.email}</p>
          <p className="text-[10px] text-muted mt-1 capitalize font-medium">{profile?.role}</p>
        </div>
      </div>
      </FadeIn>

      {/* Theme Toggle */}
      <FadeIn delay={0.05}>
        <div className="card-clean rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">Appearance</p>
              <p className="text-xs text-muted mt-0.5">
                {theme === 'dark' ? 'Dark mode' : 'Light mode'}
              </p>
            </div>
            <button
              onClick={toggleTheme}
              className="flex h-10 w-10 items-center justify-center rounded-full transition-colors duration-150"
              style={{ background: 'var(--surface-2)' }}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5" style={{ color: 'var(--accent)' }} />
              ) : (
                <Moon className="h-5 w-5" style={{ color: 'var(--accent)' }} />
              )}
            </button>
          </div>
        </div>
      </FadeIn>

      {/* Edit Form */}
      <FadeIn delay={0.1}>
      <div className="space-y-5 card-clean rounded-2xl p-5">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted">Full Name</label>
          <input
            type="text"
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            className="w-full rounded-xl px-4 py-3 text-sm input-field"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted">University</label>
          <input
            type="text"
            value={form.university}
            onChange={(e) => setForm({ ...form, university: e.target.value })}
            className="w-full rounded-xl px-4 py-3 text-sm input-field"
          />
        </div>

        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-muted">Afterparty RSVP</label>
          <button
            onClick={() => setForm({ ...form, afterparty_rsvp: !form.afterparty_rsvp })}
            className="h-6 w-11 rounded-full transition-colors duration-150"
            style={{ background: form.afterparty_rsvp ? 'var(--accent)' : 'var(--toggle-off)' }}
          >
            <div
              className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-150 ${
                form.afterparty_rsvp ? 'translate-x-5.5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>

        <TapButton
          onClick={handleSave}
          disabled={saving}
          className="btn-primary gradient-glow flex w-full items-center justify-center gap-2 py-3.5 text-sm font-semibold transition-opacity duration-150 hover:opacity-90 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          <span>{saving ? 'Saving...' : 'Save Profile'}</span>
        </TapButton>
      </div>
      </FadeIn>

      {/* CV Upload */}
      <FadeIn delay={0.2}>
      <div className="card-clean rounded-2xl p-5 space-y-4">
        <div>
          <p className="text-sm font-semibold">CV / Resume</p>
          <p className="text-xs text-muted mt-0.5">
            {profile?.cv_url ? 'Your CV has been uploaded' : 'Upload your CV (PDF recommended)'}
          </p>
        </div>

        {profile?.cv_url ? (
          <div className="flex items-center gap-2">
            <a
              href={profile.cv_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center gap-2 rounded-xl bg-green-500/10 px-4 py-3 text-xs font-medium text-green-400 transition-colors duration-150"
            >
              <FileText className="h-4 w-4" />
              View CV
            </a>
            <button
              onClick={handleCvRemove}
              disabled={uploadingCv}
              className="rounded-xl bg-red-500/10 px-3 py-3 text-xs font-medium text-red-400 disabled:opacity-50 transition-colors duration-150"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <label className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-dashed py-5 text-sm font-medium text-muted transition-colors duration-150" style={{ borderColor: 'var(--border)' }}>
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

      {/* Send Email */}
      <FadeIn delay={0.25}>
        <TapButton
          onClick={handleSendEmail}
          disabled={sendingEmail}
          className="w-full card-clean rounded-2xl p-5 text-left transition-opacity duration-150 disabled:opacity-60"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">E-Mail senden</p>
              <p className="text-xs text-muted mt-0.5">
                {sendingEmail ? 'Wird gesendet...' : 'Sendet eine E-Mail an das Team'}
              </p>
            </div>
            <Mail size={20} style={{ color: 'var(--accent)' }} />
          </div>
        </TapButton>
      </FadeIn>

      {/* Push Notifications */}
      <FadeIn delay={0.3}>
      <PushNotificationManager>
        {({ isSubscribed, isLoading, subscribe }) => (
          <TapButton
            onClick={subscribe}
            disabled={isSubscribed || isLoading}
            className="w-full card-clean rounded-2xl p-5 text-left transition-opacity duration-150 disabled:opacity-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Push Notifications</p>
                <p className="text-xs text-muted mt-0.5">
                  {isLoading ? 'Enabling...' : isSubscribed ? 'Notifications are enabled' : 'Tap to enable notifications'}
                </p>
              </div>
              {isSubscribed ? (
                <Bell size={20} style={{ color: 'var(--accent)' }} />
              ) : (
                <BellOff size={20} className="text-muted" />
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
        className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-medium text-red-400 card-clean transition-colors duration-150"
      >
        <LogOut className="h-4 w-4" />
        Abmelden
      </TapButton>
      </FadeIn>
    </div>
  );
}
