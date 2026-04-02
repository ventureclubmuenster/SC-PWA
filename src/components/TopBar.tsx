'use client';

import { Bell, User } from 'lucide-react';
import { useProfileOverlay } from '@/components/ProfileOverlay';

export default function TopBar() {
  const { isOpen, open, close } = useProfileOverlay();
  const toggleProfile = isOpen ? close : open;

  return (
    <div className="fixed top-0 left-0 right-0 z-[5] h-20">
      <div className="mx-auto max-w-lg px-5 h-full flex items-center justify-between">
        {/* Logo with dark backdrop */}
        <div className="flex items-center rounded-xl bg-black/30 backdrop-blur-sm px-3 py-1.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/SC Logo white.png"
            alt="Startup Contacts"
            className="h-20 object-contain"
          />
        </div>
        <div className="flex items-center gap-2">
          <button className="flex h-11 w-11 items-center justify-center rounded-full bg-black/35 backdrop-blur-md transition-colors duration-150 active:bg-black/50">
            <Bell className="h-5.5 w-5.5 text-white" strokeWidth={2.5} />
          </button>
          <button
            onClick={toggleProfile}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-black/35 backdrop-blur-md transition-colors duration-150 active:bg-black/50"
          >
            <User className="h-5.5 w-5.5 text-white" strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
}
