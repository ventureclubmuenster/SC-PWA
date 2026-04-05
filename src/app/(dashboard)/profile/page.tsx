'use client';

import PageHeader from '@/components/PageHeader';
import ProfileContent from '@/components/ProfileContent';
import { useLanguage } from '@/lib/i18n';

export default function ProfilePage() {
  const { t } = useLanguage();
  return (
    <div className="space-y-5">
      <PageHeader title={t.profile.title} accent={t.profile.title} subtitle={t.profile.subtitle} />
      <ProfileContent />
    </div>
  );
}
