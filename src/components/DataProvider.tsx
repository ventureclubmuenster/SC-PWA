'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
  type ReactNode,
} from 'react';
import { createClient } from '@/lib/supabase/client';
import type {
  Profile,
  ScheduleItem,
  ContentWorkshop,
  WorkshopBooking,
  Partner,
  Speaker,
  UserRole,
} from '@/types';

/* ------------------------------------------------------------------ */
/*  Demo profile for local development (no auth required)             */
/* ------------------------------------------------------------------ */

const DEMO_PROFILE: Profile = {
  id: 'demo-user-00000000-0000-0000-0000-000000000000',
  email: 'demo@startup-contacts.de',
  full_name: 'Demo User',
  first_name: 'Demo',
  last_name: 'User',
  age: null,
  attendee_role: 'student',
  ticket_id: 'DEMO-TICKET-001',
  role: 'visitor',
  university: 'Universität Münster',
  cv_url: null,
  afterparty_rsvp: false,
  company: null,
  booth_number: null,
  created_at: '2025-01-01T00:00:00.000Z',
  updated_at: '2025-01-01T00:00:00.000Z',
};

/* ------------------------------------------------------------------ */
/*  Cache store — lives outside React so it survives navigations      */
/* ------------------------------------------------------------------ */

interface CacheStore {
  profile: Profile | null;
  scheduleItems: ScheduleItem[];
  workshops: ContentWorkshop[];
  bookings: WorkshopBooking[];
  partners: Partner[];
  speakers: Speaker[];
  role: UserRole;
  ready: boolean;
  /** timestamp of last full prefetch */
  ts: number;
}

const EMPTY: CacheStore = {
  profile: null,
  scheduleItems: [],
  workshops: [],
  bookings: [],
  partners: [],
  speakers: [],
  role: 'visitor',
  ready: false,
  ts: 0,
};

let cache: CacheStore = { ...EMPTY };

/** Max age before background re-fetch (5 min) */
const STALE_MS = 5 * 60 * 1000;

/* ------------------------------------------------------------------ */
/*  Prefetch helper                                                    */
/* ------------------------------------------------------------------ */

async function prefetchAll(): Promise<CacheStore> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fire all reads in parallel
  const [scheduleRes, workshopsRes, bookingsRes, partnersRes, speakersRes, profileRes] =
    await Promise.all([
      supabase
        .from('schedule_items')
        .select('*, speaker:speaker_id(id, name, photo_url, linkedin, bio)')
        .order('time'),
      supabase.from('workshops').select('*').order('time'),
      user
        ? supabase.from('workshop_bookings').select('*')
        : Promise.resolve({ data: [] as WorkshopBooking[] }),
      supabase.from('partners').select('*').order('category').order('name'),
      supabase.from('speakers').select('*').order('name'),
      user
        ? supabase.from('profiles').select('*').eq('id', user.id).single()
        : Promise.resolve({ data: null as Profile | null }),
    ]);

  let profile = profileRes.data as Profile | null;

  // In development without auth, use the demo profile
  if (!profile && !user && process.env.NODE_ENV === 'development') {
    profile = DEMO_PROFILE;
  }

  return {
    profile,
    scheduleItems: (scheduleRes.data as ScheduleItem[]) || [],
    workshops: (workshopsRes.data as ContentWorkshop[]) || [],
    bookings: (bookingsRes.data as WorkshopBooking[]) || [],
    partners: (partnersRes.data as Partner[]) || [],
    speakers: (speakersRes.data as Speaker[]) || [],
    role: (profile?.role as UserRole) || 'visitor',
    ready: true,
    ts: Date.now(),
  };
}

/* ------------------------------------------------------------------ */
/*  React context                                                      */
/* ------------------------------------------------------------------ */

interface DataContextValue extends CacheStore {
  /** Force a full refresh of all data */
  refreshAll: () => Promise<void>;
  /** Refresh only bookings (after book/unbook) */
  refreshBookings: () => Promise<void>;
  /** Refresh only profile (after save) */
  refreshProfile: () => Promise<void>;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [store, setStore] = useState<CacheStore>(cache);
  const fetching = useRef(false);

  const applyCache = useCallback((next: CacheStore) => {
    cache = next;
    setStore(next);
  }, []);

  // Initial prefetch (or use existing cache)
  useEffect(() => {
    if (fetching.current) return;

    // Already cached and fresh — serve from cache
    if (cache.ready && Date.now() - cache.ts < STALE_MS) {
      setStore(cache);
      // Background refresh (stale-while-revalidate)
      prefetchAll().then(applyCache).catch(() => {});
      return;
    }

    fetching.current = true;
    prefetchAll()
      .then(applyCache)
      .catch(() => {})
      .finally(() => {
        fetching.current = false;
      });
  }, [applyCache]);

  const refreshAll = useCallback(async () => {
    const next = await prefetchAll();
    applyCache(next);
  }, [applyCache]);

  const refreshBookings = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.from('workshop_bookings').select('*');
    const next = { ...cache, bookings: (data as WorkshopBooking[]) || [], ts: Date.now() };
    applyCache(next);
  }, [applyCache]);

  const refreshProfile = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (data) {
      const next = { ...cache, profile: data as Profile, role: (data as Profile).role, ts: Date.now() };
      applyCache(next);
    }
  }, [applyCache]);

  const value = useMemo<DataContextValue>(() => ({
    ...store,
    refreshAll,
    refreshBookings,
    refreshProfile,
  }), [store, refreshAll, refreshBookings, refreshProfile]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

/* ------------------------------------------------------------------ */
/*  Hooks                                                              */
/* ------------------------------------------------------------------ */

function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within <DataProvider>');
  return ctx;
}

export function useSchedule() {
  const { scheduleItems, ready } = useData();
  return { items: scheduleItems, loading: !ready };
}

export function useWorkshops() {
  const { workshops, bookings, profile, ready, refreshBookings } = useData();
  return { workshops, bookings, profile, loading: !ready, refreshBookings };
}

export function usePartners() {
  const { partners, ready } = useData();
  return { partners, loading: !ready };
}

export function useSpeakers() {
  const { speakers, ready } = useData();
  return { speakers, loading: !ready };
}

export function useProfile() {
  const { profile, ready, refreshProfile } = useData();
  return { profile, loading: !ready, refreshProfile };
}

export function useRole(): UserRole {
  return useData().role;
}

export function useBookings() {
  const { bookings, refreshBookings } = useData();
  return { bookings, refreshBookings };
}
