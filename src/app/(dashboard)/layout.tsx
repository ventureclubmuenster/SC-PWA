import BottomBar from '@/components/BottomBar';
import DemoBanner from '@/components/DemoBanner';
import HapticProvider from '@/components/HapticProvider';
import { DataProvider } from '@/components/DataProvider';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DataProvider>
      <HapticProvider>
        <div className="min-h-screen pb-20">
          <DemoBanner />
          <main className="mx-auto max-w-lg px-4 pt-6">{children}</main>
          <BottomBar />
        </div>
      </HapticProvider>
    </DataProvider>
  );
}
