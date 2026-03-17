'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import PageHeader from '@/components/PageHeader';
import DetailModal from '@/components/DetailModal';
import { Clock, MapPin, Users, Check } from 'lucide-react';
import type { ContentWorkshop, WorkshopBooking } from '@/types';

export default function WorkshopsPage() {
  const [workshops, setWorkshops] = useState<ContentWorkshop[]>([]);
  const [bookings, setBookings] = useState<WorkshopBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingInProgress, setBookingInProgress] = useState<string | null>(null);
  const [selected, setSelected] = useState<ContentWorkshop | null>(null);

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

  const handleBook = async (e: React.MouseEvent, workshopId: string) => {
    e.stopPropagation();
    setBookingInProgress(workshopId);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (isBooked(workshopId)) {
      await supabase
        .from('workshop_bookings')
        .delete()
        .eq('user_id', user.id)
        .eq('workshop_id', workshopId);
      setBookings((prev) => prev.filter((b) => b.workshop_id !== workshopId));
    } else {
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
      <PageHeader title="Workshops" subtitle="Book your hands-on sessions" />

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
                onClick={() => setSelected(ws)}
                className="noise-panel rounded-2xl p-4 space-y-3 border border-[#E8E8ED] shadow-sm cursor-pointer active:scale-[0.98] transition-transform"
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
                  onClick={(e) => handleBook(e, ws.id)}
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

      {/* Detail Modal */}
      <DetailModal open={!!selected} onClose={() => setSelected(null)}>
        {selected && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-[#1D1D1F]">{selected.title}</h2>
              <p className="text-sm font-medium text-[#FF754B] mt-1">{selected.host}</p>
            </div>

            <div className="flex flex-wrap gap-3 text-sm text-[#86868B]">
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {formatTime(selected.time)}
                {selected.end_time && ` – ${formatTime(selected.end_time)}`}
              </span>
              {selected.location && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  {selected.location}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                {selected.capacity} spots
              </span>
            </div>

            {selected.description && (
              <p className="text-sm text-[#86868B] leading-relaxed">{selected.description}</p>
            )}

            <button
              onClick={(e) => handleBook(e, selected.id)}
              disabled={bookingInProgress === selected.id}
              className={`relative z-10 w-full rounded-xl py-3 text-sm font-semibold transition-all ${
                isBooked(selected.id)
                  ? 'bg-green-50 text-green-600 hover:bg-red-50 hover:text-red-600'
                  : 'noise-panel-dark text-white hover:opacity-90'
              } disabled:opacity-50`}
            >
              {bookingInProgress === selected.id ? (
                'Processing...'
              ) : isBooked(selected.id) ? (
                <span className="flex items-center justify-center gap-1">
                  <Check className="h-4 w-4" /> Booked — tap to cancel
                </span>
              ) : (
                <span className="relative z-10">Book Workshop</span>
              )}
            </button>
          </div>
        )}
      </DetailModal>
    </div>
  );
}
