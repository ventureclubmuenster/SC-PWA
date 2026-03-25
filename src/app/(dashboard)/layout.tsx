import BottomBar from '@/components/BottomBar';
import DemoBanner from '@/components/DemoBanner';
import HapticProvider from '@/components/HapticProvider';
import { DataProvider } from '@/components/DataProvider';
import AddToHomeScreenPrompt from '@/components/AddToHomeScreenPrompt';

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
          <AddToHomeScreenPrompt />
          <main className="mx-auto max-w-lg px-4 pt-6">
            {children}
          </main>
          <BottomBar />
        </div>
      </HapticProvider>
    </DataProvider>
  );
}
