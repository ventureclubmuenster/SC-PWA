'use client';

import { useEffect, useState } from 'react';
import { sanityClient } from '@/lib/sanity/client';
import { workshopsQuery } from '@/lib/sanity/queries';
import { createClient } from '@/lib/supabase/client';
import { Clock, MapPin, Users, Check } from 'lucide-react';
import type { SanityWorkshop, WorkshopBooking } from '@/types';

export default function WorkshopsPage() {
  const [workshops, setWorkshops] = useState<SanityWorkshop[]>([]);
  const [bookings, setBookings] = useState<WorkshopBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingInProgress, setBookingInProgress] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const [workshopData, { data: bookingData }] = await Promise.all([
        sanityClient.fetch(workshopsQuery).catch(() => []),
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
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Workshops</h1>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl bg-gray-800" />
          ))}
        </div>
      ) : workshops.length === 0 ? (
        <p className="text-center text-sm text-gray-500 py-12">
          No workshops available. Content will appear once published in Sanity.
        </p>
      ) : (
        <div className="space-y-3">
          {workshops.map((ws) => {
            const booked = isBooked(ws._id);
            return (
              <div
                key={ws._id}
                className="rounded-xl bg-gray-900 p-4 space-y-3 border border-gray-800"
              >
                <div className="space-y-1">
                  <h3 className="font-semibold text-sm">{ws.title}</h3>
                  <p className="text-xs text-indigo-400">{ws.host}</p>
                </div>

                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatTime(ws.time)}
                    {ws.endTime && ` – ${formatTime(ws.endTime)}`}
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
                  <p className="text-xs text-gray-500 line-clamp-2">{ws.description}</p>
                )}

                <button
                  onClick={() => handleBook(ws._id)}
                  disabled={bookingInProgress === ws._id}
                  className={`w-full rounded-lg py-2 text-xs font-semibold transition-colors ${
                    booked
                      ? 'bg-green-900/50 text-green-300 hover:bg-red-900/50 hover:text-red-300'
                      : 'bg-indigo-600 text-white hover:bg-indigo-500'
                  } disabled:opacity-50`}
                >
                  {bookingInProgress === ws._id ? (
                    'Processing...'
                  ) : booked ? (
                    <span className="flex items-center justify-center gap-1">
                      <Check className="h-3 w-3" /> Booked — tap to cancel
                    </span>
                  ) : (
                    'Book Workshop'
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
