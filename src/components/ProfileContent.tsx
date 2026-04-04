'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useProfile as useCachedProfile } from '@/components/DataProvider';
import { useTheme } from '@/components/ThemeProvider';
import Link from 'next/link';
import { User, LogOut, Save, Bell, BellOff, Upload, FileText, Trash2, Sun, Moon, Mail, Wrench, ChevronRight, Fingerprint } from 'lucide-react';
import { FadeIn, TapButton } from '@/components/motion';
import type { Profile } from '@/types';
import PushNotificationManager from '@/components/push/PushNotificationManager';
import { getFingerprint } from '@/lib/fingerprint';

export default function ProfileContent() {
  const { profile: cachedProfile, loading: cacheLoading, refreshProfile } = useCachedProfile();
  const { theme, toggleTheme } = useTheme();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingCv, setUploadingCv] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [fingerprint, setFingerprint] = useState<string>('');
  const [form, setForm] = useState({
    full_name: '',
    first_name: '',
    last_name: '',
    age: '' as string | number,
    attendee_role: '' as string,
    university: '',
    afterparty_rsvp: false,
  });

  useEffect(() => {
    const p = cachedProfile;
    if (p) {
      setProfile(p);
      setForm({
        full_name: p.full_name || '',
        first_name: p.first_name || '',
        last_name: p.last_name || '',
        age: p.age ?? '',
        attendee_role: p.attendee_role || '',
        university: p.university || '',
        afterparty_rsvp: p.afterparty_rsvp || false,
      });
      setLoading(false);
    } else if (!cacheLoading) {
      setLoading(false);
    }
  }, [cachedProfile, cacheLoading]);

  useEffect(() => {
    getFingerprint().then(setFingerprint).catch(() => setFingerprint('N/A'));
  }, []);

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    const supabase = createClient();
    await supabase
      .from('profiles')
      .update({
        first_name: form.first_name,
        last_name: form.last_name,
        full_name: form.full_name,
        age: form.age ? Number(form.age) : null,
        attendee_role: form.attendee_role || null,
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
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  if (loading) {
    return null;
  }

  return (
    <div className="space-y-5">
      {/* Avatar & Email */}
      <FadeIn delay={0}>
        <div className="card-clean flex items-center gap-4 rounded-2xl p-5">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl gradient-accent gradient-glow">
            <User className="h-7 w-7 text-white" />
          </div>
          <div>
            <p className="font-semibold text-sm">{[form.first_name, form.last_name].filter(Boolean).join(' ') || form.full_name || 'No name set'}</p>
            <p className="text-xs text-muted mt-0.5">{profile?.email}</p>
            <p className="text-[10px] text-muted mt-1 capitalize font-medium">{profile?.role}</p>
          </div>
        </div>
      </FadeIn>

      {/* Device Fingerprint */}
      <FadeIn delay={0.02}>
        <div className="card-clean rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: 'var(--surface-2)' }}>
              <Fingerprint className="h-5 w-5 text-muted" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-muted">Device Fingerprint</p>
              <p className="text-sm font-mono font-semibold mt-0.5 truncate" style={{ color: 'var(--foreground)' }}>
                {fingerprint || '...'}
              </p>
            </div>
          </div>
        </div>
      </FadeIn>

      {/* Theme Toggle */}
      <FadeIn delay={0.05}>
        <div className="card-clean rounded-2xl p-5">
          <p className="text-xs font-semibold tracking-wider uppercase text-muted mb-3">Appearance</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => theme !== 'light' && toggleTheme()}
              className="flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-semibold transition-all duration-200"
              style={{
                background: theme === 'light' ? 'var(--accent)' : 'var(--surface-2)',
                color: theme === 'light' ? 'var(--highlight)' : 'var(--muted)',
              }}
            >
              <Sun className="h-4 w-4" />
              Light
            </button>
            <button
              onClick={() => theme !== 'dark' && toggleTheme()}
              className="flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-semibold transition-all duration-200"
              style={{
                background: theme === 'dark' ? 'var(--accent)' : 'var(--surface-2)',
                color: theme === 'dark' ? 'var(--highlight)' : 'var(--muted)',
              }}
            >
              <Moon className="h-4 w-4" />
              Dark
            </button>
          </div>
        </div>
      </FadeIn>

      {/* Workshops Link */}
      <FadeIn delay={0.07}>
        <Link href="/workshops" className="block card-clean rounded-2xl p-5 transition-opacity duration-150 active:opacity-80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: 'var(--accent)' }}>
                <Wrench className="h-5 w-5" style={{ color: 'var(--highlight)' }} />
              </div>
              <div>
                <p className="text-sm font-semibold">Workshops</p>
                <p className="text-xs text-muted mt-0.5">Book your hands-on sessions</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted" />
          </div>
        </Link>
      </FadeIn>

      {/* Edit Form */}
      <FadeIn delay={0.1}>
      <div className="space-y-5 card-clean rounded-2xl p-5">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted">First Name</label>
          <input
            type="text"
            value={form.first_name}
            onChange={(e) => setForm({ ...form, first_name: e.target.value })}
            className="w-full rounded-2xl px-4 py-3 text-sm input-field"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted">Last Name</label>
          <input
            type="text"
            value={form.last_name}
            onChange={(e) => setForm({ ...form, last_name: e.target.value })}
            className="w-full rounded-2xl px-4 py-3 text-sm input-field"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted">Age</label>
          <input
            type="number"
            value={form.age}
            onChange={(e) => setForm({ ...form, age: e.target.value })}
            min={1}
            max={120}
            className="w-full rounded-2xl px-4 py-3 text-sm input-field"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted">Role</label>
          <div className="grid grid-cols-3 gap-2">
            {([
              { value: 'student', label: 'Studierende/r' },
              { value: 'entrepreneur', label: 'Unternehmer' },
              { value: 'other', label: 'Sonstiges' },
            ] as const).map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setForm({ ...form, attendee_role: option.value })}
                className={`rounded-2xl px-3 py-3 text-sm font-medium transition-all duration-150 ${
                  form.attendee_role === option.value
                    ? 'selected-state'
                    : 'input-field'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted">University</label>
          <input
            type="text"
            value={form.university}
            onChange={(e) => setForm({ ...form, university: e.target.value })}
            className="w-full rounded-2xl px-4 py-3 text-sm input-field"
          />
        </div>

        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-muted">Afterparty RSVP</label>
          <button
            onClick={() => setForm({ ...form, afterparty_rsvp: !form.afterparty_rsvp })}
            className="h-7 w-12 rounded-full transition-colors duration-200"
            style={{ background: form.afterparty_rsvp ? 'var(--accent)' : 'var(--toggle-off)' }}
          >
            <div
              className={`h-5.5 w-5.5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
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
          <p className="text-xs text-muted mt-1">
            {profile?.cv_url ? 'Your CV has been uploaded' : 'Upload your CV (PDF recommended)'}
          </p>
        </div>

        {profile?.cv_url ? (
          <div className="flex items-center gap-2">
            <a
              href={profile.cv_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center gap-2 rounded-2xl bg-green-500/10 px-4 py-3 text-xs font-medium text-green-400 transition-colors duration-150"
            >
              <FileText className="h-4 w-4" />
              View CV
            </a>
            <button
              onClick={handleCvRemove}
              disabled={uploadingCv}
              className="rounded-2xl bg-red-500/10 px-3 py-3 text-xs font-medium text-red-400 disabled:opacity-50 transition-colors duration-150"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <label className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-dashed py-6 text-sm font-medium text-muted transition-colors duration-150" style={{ borderColor: 'var(--border)' }}>
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
              <p className="text-xs text-muted mt-1">
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
                <p className="text-xs text-muted mt-1">
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
