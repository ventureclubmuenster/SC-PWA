'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useProfile as useCachedProfile } from '@/components/DataProvider';
import { useTheme } from '@/components/ThemeProvider';
import Link from 'next/link';
import { User, LogOut, Bell, BellOff, Upload, FileText, Trash2, Sun, Moon, Mail, Wrench, ChevronRight } from 'lucide-react';
import { FadeIn, TapButton } from '@/components/motion';
import type { Profile } from '@/types';
import PushNotificationManager from '@/components/push/PushNotificationManager';
import { useLanguage } from '@/lib/i18n';

export default function ProfileContent() {
  const { t } = useLanguage();
  const { profile: cachedProfile, loading: cacheLoading, refreshProfile } = useCachedProfile();
  const { theme, toggleTheme } = useTheme();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingCv, setUploadingCv] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [afterpartyRsvp, setAfterpartyRsvp] = useState(false);

  useEffect(() => {
    const p = cachedProfile;
    if (p) {
      setProfile(p);
      setAfterpartyRsvp(p.afterparty_rsvp || false);
      setLoading(false);
    } else if (!cacheLoading) {
      setLoading(false);
    }
  }, [cachedProfile, cacheLoading]);

  const handleAfterpartyToggle = async () => {
    if (!profile) return;
    const newVal = !afterpartyRsvp;
    setAfterpartyRsvp(newVal);
    const supabase = createClient();
    await supabase
      .from('profiles')
      .update({ afterparty_rsvp: newVal, updated_at: new Date().toISOString() })
      .eq('id', profile.id);
    refreshProfile();
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
      alert(t.profile.emailSendFailed);
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
            <p className="font-semibold text-sm">{profile?.full_name || t.profile.noName}</p>
            <p className="text-xs text-muted mt-0.5">{profile?.email}</p>
            <p className="text-[10px] text-muted mt-1 capitalize font-medium">{profile?.role}</p>
          </div>
        </div>
      </FadeIn>

      {/* Theme Toggle */}
      <FadeIn delay={0.05}>
        <div className="card-clean rounded-2xl p-5">
          <p className="text-xs font-semibold tracking-wider uppercase text-muted mb-3">{t.profile.appearance}</p>
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
              {t.profile.light}
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
              {t.profile.dark}
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
                <p className="text-sm font-semibold">{t.profile.workshopsSection}</p>
                <p className="text-xs text-muted mt-0.5">{t.profile.workshopsDesc}</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted" />
          </div>
        </Link>
      </FadeIn>

      {/* Afterparty RSVP */}
      <FadeIn delay={0.1}>
        <div className="card-clean rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{t.profile.afterpartyRsvp}</label>
            <button
              onClick={handleAfterpartyToggle}
              className="h-7 w-12 rounded-full transition-colors duration-200"
              style={{ background: afterpartyRsvp ? 'var(--accent)' : 'var(--toggle-off)' }}
            >
              <div
                className={`h-5.5 w-5.5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                  afterpartyRsvp ? 'translate-x-5.5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        </div>
      </FadeIn>

      {/* CV Upload */}
      <FadeIn delay={0.2}>
      <div className="card-clean rounded-2xl p-5 space-y-4">
        <div>
          <p className="text-sm font-semibold">{t.profile.cvResume}</p>
          <p className="text-xs text-muted mt-1">
            {profile?.cv_url ? t.profile.cvUploaded : t.profile.uploadCv}
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
              {t.profile.viewCv}
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
            {uploadingCv ? t.profile.uploading : t.profile.uploadCvButton}
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
              <p className="text-sm font-semibold">{t.profile.sendEmail}</p>
              <p className="text-xs text-muted mt-1">
                {sendingEmail ? t.profile.sendingEmail : t.profile.sendEmailDesc}
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
                <p className="text-sm font-semibold">{t.profile.pushNotifications}</p>
                <p className="text-xs text-muted mt-1">
                  {isLoading ? t.profile.enablingNotifications : isSubscribed ? t.profile.notificationsEnabled : t.profile.enableNotifications}
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
        {t.profile.logout}
      </TapButton>
      </FadeIn>
    </div>
  );
}
