import BottomBar from '@/components/BottomBar';
import DemoBanner from '@/components/DemoBanner';
import { DataProvider } from '@/components/DataProvider';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DataProvider>
      <div className="bg-mesh min-h-screen pb-24">
        <DemoBanner />
        <main className="relative z-10 mx-auto max-w-lg px-5 pt-8">
          {children}
        </main>
        <BottomBar />
      </div>
    </DataProvider>
  );
}
