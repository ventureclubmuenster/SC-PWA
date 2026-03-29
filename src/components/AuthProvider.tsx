'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { isDemoMode } from '@/lib/demo';

const AUTH_CHANNEL = 'sc-auth-sync';
const REFRESH_BEFORE_EXPIRY_MS = 60 * 1000; // refresh 60s before token expires

/**
 * AuthProvider — PWA-optimized auth lifecycle manager.
 *
 * Responsibilities:
 *  1. Listens to onAuthStateChange for token refresh / sign-out
 *  2. Proactively refreshes session when PWA returns from background
 *  3. Syncs sign-out across browser tabs via BroadcastChannel
 *  4. Schedules token refresh before expiry (belt-and-suspenders with middleware)
 */
export default function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    // Demo mode bypasses Supabase auth entirely
    if (isDemoMode()) return;

    const supabase = createClient();

    // ── BroadcastChannel for cross-tab auth sync ──
    try {
      const channel = new BroadcastChannel(AUTH_CHANNEL);
      channelRef.current = channel;
      channel.onmessage = (event) => {
        if (event.data === 'SIGNED_OUT') {
          // Another tab signed out — redirect to login
          window.location.href = '/';
        }
      };
    } catch {
      // BroadcastChannel not supported (older browsers) — graceful degradation
    }

    // ── Schedule proactive token refresh ──
    function scheduleRefresh(expiresAt: number) {
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
      const now = Math.floor(Date.now() / 1000);
      const delay = Math.max((expiresAt - now) * 1000 - REFRESH_BEFORE_EXPIRY_MS, 0);
      refreshTimer.current = setTimeout(async () => {
        const { error } = await supabase.auth.refreshSession();
        if (error) {
          console.warn('[Auth] Proactive refresh failed:', error.message);
        }
      }, delay);
    }

    // ── Auth state change listener ──
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT') {
          // Broadcast sign-out to other tabs
          channelRef.current?.postMessage('SIGNED_OUT');
          if (refreshTimer.current) clearTimeout(refreshTimer.current);
          // Clear SW caches on sign-out
          if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({ type: 'SIGN_OUT' });
          }
          return;
        }

        if (
          session?.expires_at &&
          (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION')
        ) {
          scheduleRefresh(session.expires_at);
        }
      },
    );

    // ── Visibility-based refresh (PWA wake from background) ──
    function handleVisibilityChange() {
      if (document.visibilityState !== 'visible') return;
      // PWA just became visible — refresh session in case tokens are stale
      supabase.auth.getUser().then(({ error }) => {
        if (error) {
          // Session expired while in background — try refresh
          supabase.auth.refreshSession().then(({ error: refreshError }) => {
            if (refreshError) {
              // Refresh token also expired — redirect to login
              const isProtectedRoute = pathname !== '/' && !pathname.startsWith('/auth') && !pathname.startsWith('/claim');
              if (isProtectedRoute) {
                window.location.href = '/';
              }
            }
          });
        }
      });
    }
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // ── Online recovery ──
    function handleOnline() {
      // Device came back online — validate and refresh session
      supabase.auth.refreshSession();
    }
    window.addEventListener('online', handleOnline);

    // ── Cleanup ──
    return () => {
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
      channelRef.current?.close();
    };
  }, [router, pathname]);

  return <>{children}</>;
}
