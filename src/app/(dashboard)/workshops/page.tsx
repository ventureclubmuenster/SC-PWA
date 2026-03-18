'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useWorkshops } from '@/components/DataProvider';
import PageHeader from '@/components/PageHeader';
import DetailModal from '@/components/DetailModal';
import { StaggerList, StaggerItem, TapButton, FadeIn } from '@/components/motion';
import { Clock, MapPin, Users, Check, AlertCircle, FileText } from 'lucide-react';
import type { ContentWorkshop, WorkshopBooking } from '@/types';

export default function WorkshopsPage() {
  const { workshops, bookings: cachedBookings, profile, loading, refreshBookings } = useWorkshops();
  const [localBookings, setLocalBookings] = useState<WorkshopBooking[]>([]);
  const [bookingInProgress, setBookingInProgress] = useState<string | null>(null);
  const [selected, setSelected] = useState<ContentWorkshop | null>(null);
  const [cvError, setCvError] = useState<string | null>(null);

  // Merge cached bookings with optimistic local updates
  const bookings = localBookings.length > 0 ? localBookings : cachedBookings;

  const getBooking = (workshopId: string) =>
    bookings.find((b) => b.workshop_id === workshopId);

  const isBooked = (workshopId: string) => !!getBooking(workshopId);

  const handleBook = async (e: React.MouseEvent, workshopId: string) => {
    e.stopPropagation();
    setCvError(null);
    const workshop = workshops.find((w) => w.id === workshopId);
    if (!workshop) return;

    // Check CV requirement
    if (workshop.cv_required && !profile?.cv_url && !isBooked(workshopId)) {
      setCvError('Please upload your CV in your profile before applying to this workshop.');
      return;
    }

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
      setLocalBookings(bookings.filter((b) => b.workshop_id !== workshopId));
    } else {
      const status = workshop.has_waiting_list ? 'pending' : 'approved';
      const { data } = await supabase
        .from('workshop_bookings')
        .insert({ user_id: user.id, workshop_id: workshopId, status })
        .select()
        .single();
      if (data) {
        setLocalBookings([...bookings, data]);
      }
    }
    // Sync cache in background
    refreshBookings();
    setBookingInProgress(null);
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  };

  const bookingStatusLabel = (booking: WorkshopBooking | undefined) => {
    if (!booking) return null;
    switch (booking.status) {
      case 'pending': return { text: 'Applied — pending review', color: 'bg-amber-50 text-amber-600' };
      case 'accepted': return { text: 'Accepted', color: 'bg-green-50 text-green-600' };
      case 'rejected': return { text: 'Rejected', color: 'bg-red-50 text-red-600' };
      default: return { text: 'Booked — tap to cancel', color: 'bg-green-50 text-green-600' };
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Workshops" subtitle="Book your hands-on sessions" />

      {cvError && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs text-red-600">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {cvError}
        </div>
      )}

      {loading ? null : workshops.length === 0 ? (
        <FadeIn>
          <p className="text-center text-sm text-[#86868B] py-12">
            No workshops available.
          </p>
        </FadeIn>
      ) : (
        <StaggerList className="space-y-3">
          {workshops.map((ws) => {
            const booking = getBooking(ws.id);
            const booked = !!booking;
            const status = bookingStatusLabel(booking);
            return (
              <StaggerItem key={ws.id}>
                <div
                  onClick={() => { setSelected(ws); setCvError(null); }}
                  className="noise-panel rounded-2xl p-4 space-y-3 border border-[#E8E8ED] shadow-sm cursor-pointer active:scale-[0.98] transition-transform"
                >
                <div className="relative z-10 space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm">{ws.title}</h3>
                    {ws.has_waiting_list && <span className="shrink-0 rounded-full bg-amber-100 text-amber-700 px-2 py-0.5 text-[10px] font-medium">Waiting List</span>}
                    {ws.cv_required && <span className="shrink-0 rounded-full bg-blue-100 text-blue-700 px-2 py-0.5 text-[10px] font-medium flex items-center gap-0.5"><FileText className="h-2.5 w-2.5" />CV</span>}
                  </div>
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

                <TapButton
                  onClick={(e) => handleBook(e, ws.id)}
                  disabled={bookingInProgress === ws.id || (booked && booking?.status !== 'approved')}
                  className={`relative z-10 w-full rounded-xl py-2.5 text-xs font-semibold transition-all ${
                    booked
                      ? (status?.color || 'bg-green-50 text-green-600') + ' hover:bg-red-50 hover:text-red-600'
                      : 'noise-panel-dark text-white hover:opacity-90'
                  } disabled:opacity-50`}
                >
                  {bookingInProgress === ws.id ? (
                    'Processing...'
                  ) : booked ? (
                    <span className="flex items-center justify-center gap-1">
                      <Check className="h-3 w-3" /> {status?.text}
                    </span>
                  ) : ws.has_waiting_list ? (
                    <span className="relative z-10">Apply for Workshop</span>
                  ) : (
                    <span className="relative z-10">Book Workshop</span>
                  )}
                </TapButton>
                </div>
              </StaggerItem>
            );
          })}
        </StaggerList>
      )}

      {/* Detail Modal */}
      <DetailModal open={!!selected} onClose={() => setSelected(null)}>
        {selected && (
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-bold tracking-tight text-[#1D1D1F]">{selected.title}</h2>
              </div>
              <p className="text-sm font-medium text-[#FF754B] mt-1">{selected.host}</p>
              <div className="flex gap-2 mt-2">
                {selected.has_waiting_list && <span className="rounded-full bg-amber-100 text-amber-700 px-2.5 py-0.5 text-[10px] font-medium">Waiting List</span>}
                {selected.cv_required && <span className="rounded-full bg-blue-100 text-blue-700 px-2.5 py-0.5 text-[10px] font-medium flex items-center gap-0.5"><FileText className="h-2.5 w-2.5" />CV Required</span>}
              </div>
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

            {selected.cv_required && !profile?.cv_url && !isBooked(selected.id) && (
              <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs text-red-600">
                <AlertCircle className="h-4 w-4 shrink-0" />
                Upload your CV in your profile to apply for this workshop.
              </div>
            )}

            {(() => {
              const booking = getBooking(selected.id);
              const booked = !!booking;
              const status = bookingStatusLabel(booking);
              return (
                <button
                  onClick={(e) => handleBook(e, selected.id)}
                  disabled={bookingInProgress === selected.id || (booked && booking?.status !== 'approved') || (selected.cv_required && !profile?.cv_url && !booked)}
                  className={`relative z-10 w-full rounded-xl py-3 text-sm font-semibold transition-all ${
                    booked
                      ? (status?.color || 'bg-green-50 text-green-600') + ' hover:bg-red-50 hover:text-red-600'
                      : 'noise-panel-dark text-white hover:opacity-90'
                  } disabled:opacity-50`}
                >
                  {bookingInProgress === selected.id ? (
                    'Processing...'
                  ) : booked ? (
                    <span className="flex items-center justify-center gap-1">
                      <Check className="h-4 w-4" /> {status?.text}
                    </span>
                  ) : selected.has_waiting_list ? (
                    <span className="relative z-10">Apply for Workshop</span>
                  ) : (
                    <span className="relative z-10">Book Workshop</span>
                  )}
                </button>
              );
            })()}
          </div>
        )}
      </DetailModal>
    </div>
  );
}
