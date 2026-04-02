'use client';

import PageHeader from '@/components/PageHeader';
import ProfileContent from '@/components/ProfileContent';

export default function ProfilePage() {
  return (
    <div className="space-y-5">
      <PageHeader title="Profile" accent="Profile" subtitle="Manage your account" />
      <ProfileContent />
    </div>
  );
}
