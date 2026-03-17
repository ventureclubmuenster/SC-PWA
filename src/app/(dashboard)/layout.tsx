import BottomBar from '@/components/BottomBar';
import DemoBanner from '@/components/DemoBanner';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen pb-28">
      <DemoBanner />
      <main className="mx-auto max-w-lg px-5 pt-8 pb-4">{children}</main>
      <BottomBar />
    </div>
  );
}
