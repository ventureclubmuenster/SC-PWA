'use client';

import PageHeader from '@/components/PageHeader';
import { FadeIn } from '@/components/motion';
import { Map } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';

export default function LageplanPage() {
  const { t } = useLanguage();
  return (
    <div className="space-y-6">
      <PageHeader title={t.floorPlan.title} accent={t.floorPlan.title} subtitle={t.floorPlan.subtitle} />
      <FadeIn>
        <div className="card-clean rounded-2xl p-8 flex flex-col items-center justify-center gap-4 py-16">
          <Map className="h-12 w-12 text-muted" strokeWidth={1.2} />
          <p className="text-sm text-muted text-center">{t.floorPlan.comingSoon}</p>
        </div>
      </FadeIn>
    </div>
  );
}
