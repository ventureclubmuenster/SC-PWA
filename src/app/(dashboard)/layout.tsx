import BottomBar from '@/components/BottomBar';
import TopBar from '@/components/TopBar';
import DemoBanner from '@/components/DemoBanner';
import { DataProvider } from '@/components/DataProvider';
import { ProfileOverlayProvider } from '@/components/ProfileOverlay';
import AddToHomeScreenPrompt from '@/components/AddToHomeScreenPrompt';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DataProvider>
      <ProfileOverlayProvider>
        {/* Fixed gradient background */}
        <div className="fixed top-0 left-0 right-0 z-0 h-32 top-bar-gradient" />

        {/* TopBar — between gradient (z-0) and content card (z-10) */}
        <TopBar />

        <DemoBanner />
        <AddToHomeScreenPrompt />

        {/* Main content card — scrolls over the TopBar */}
        <main
          className="relative z-10 mt-24 min-h-screen rounded-t-[36px] px-5 pt-8 pb-32"
          style={{ background: 'var(--background)' }}
        >
          <div className="mx-auto max-w-lg">
            {children}
          </div>
        </main>

        <BottomBar />
      </ProfileOverlayProvider>
    </DataProvider>
  );
}
