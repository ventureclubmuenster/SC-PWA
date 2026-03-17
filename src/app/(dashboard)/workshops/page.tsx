'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Clock, MapPin, Users, Check } from 'lucide-react';
import type { ContentWorkshop, WorkshopBooking } from '@/types';

export default function WorkshopsPage() {
  const [workshops, setWorkshops] = useState<ContentWorkshop[]>([]);
  const [bookings, setBookings] = useState<WorkshopBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingInProgress, setBookingInProgress] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const [{ data: workshopData }, { data: bookingData }] = await Promise.all([
        supabase.from('workshops').select('*').order('time'),
        supabase.from('workshop_bookings').select('*'),
      ]);
      setWorkshops(workshopData || []);
      setBookings(bookingData || []);
      setLoading(false);
    };
    load();
  }, []);

  const isBooked = (workshopId: string) =>
    bookings.some((b) => b.workshop_id === workshopId);

  const handleBook = async (workshopId: string) => {
    setBookingInProgress(workshopId);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (isBooked(workshopId)) {
      // Cancel booking
      await supabase
        .from('workshop_bookings')
        .delete()
        .eq('user_id', user.id)
        .eq('workshop_id', workshopId);
      setBookings((prev) => prev.filter((b) => b.workshop_id !== workshopId));
    } else {
      // Create booking
      const { data } = await supabase
        .from('workshop_bookings')
        .insert({ user_id: user.id, workshop_id: workshopId })
        .select()
        .single();
      if (data) {
        setBookings((prev) => [...prev, data]);
      }
    }
    setBookingInProgress(null);
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold tracking-tight">Workshops</h1>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-[#E8E8ED]" />
          ))}
        </div>
      ) : workshops.length === 0 ? (
        <p className="text-center text-sm text-[#86868B] py-12">
          No workshops available.
        </p>
      ) : (
        <div className="space-y-3">
          {workshops.map((ws) => {
            const booked = isBooked(ws.id);
            return (
              <div
                key={ws.id}
                className="noise-panel rounded-2xl p-4 space-y-3 border border-[#E8E8ED] shadow-sm"
              >
                <div className="relative z-10 space-y-1">
                  <h3 className="font-semibold text-sm">{ws.title}</h3>
                  <p className="text-xs font-medium text-[#FF754B]">{ws.host}</p>
                </div>

                <div className="relative z-10 flex items-center gap-4 text-xs text-[#86868B]">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatTime(ws.time)}
                    {ws.end_time && ` – ${formatTime(ws.end_time)}`}
                  </span>
                  {ws.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {ws.location}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {ws.capacity} spots
                  </span>
                </div>

                {ws.description && (
                  <p className="relative z-10 text-xs text-[#86868B] line-clamp-2">{ws.description}</p>
                )}

                <button
                  onClick={() => handleBook(ws.id)}
                  disabled={bookingInProgress === ws.id}
                  className={`relative z-10 w-full rounded-xl py-2.5 text-xs font-semibold transition-all ${
                    booked
                      ? 'bg-green-50 text-green-600 hover:bg-red-50 hover:text-red-600'
                      : 'noise-panel-dark text-white hover:opacity-90'
                  } disabled:opacity-50`}
                >
                  {bookingInProgress === ws.id ? (
                    'Processing...'
                  ) : booked ? (
                    <span className="flex items-center justify-center gap-1">
                      <Check className="h-3 w-3" /> Booked — tap to cancel
                    </span>
                  ) : (
                    <span className="relative z-10">Book Workshop</span>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
