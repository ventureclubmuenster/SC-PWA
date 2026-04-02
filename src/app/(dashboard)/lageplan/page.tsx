'use client';

import PageHeader from '@/components/PageHeader';
import { FadeIn } from '@/components/motion';
import { Map } from 'lucide-react';

export default function LageplanPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Lageplan" accent="Lageplan" subtitle="Finde deinen Weg" />
      <FadeIn>
        <div className="card-clean rounded-2xl p-8 flex flex-col items-center justify-center gap-4 py-16">
          <Map className="h-12 w-12 text-muted" strokeWidth={1.2} />
          <p className="text-sm text-muted text-center">Lageplan kommt bald.</p>
        </div>
      </FadeIn>
    </div>
  );
}
