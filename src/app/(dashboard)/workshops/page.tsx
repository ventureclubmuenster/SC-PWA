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

  const bookings = localBookings.length > 0 ? localBookings : cachedBookings;

  const getBooking = (workshopId: string) =>
    bookings.find((b) => b.workshop_id === workshopId);

  const isBooked = (workshopId: string) => !!getBooking(workshopId);

  const handleBook = async (e: React.MouseEvent, workshopId: string) => {
    e.stopPropagation();
    setCvError(null);
    const workshop = workshops.find((w) => w.id === workshopId);
    if (!workshop) return;

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
      case 'pending': return { text: 'Applied — pending review', color: 'bg-amber-500/15 text-amber-400' };
      case 'accepted': return { text: 'Accepted', color: 'bg-green-500/15 text-green-400' };
      case 'rejected': return { text: 'Rejected', color: 'bg-red-500/15 text-red-400' };
      default: return { text: 'Booked — tap to cancel', color: 'bg-green-500/15 text-green-400' };
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Workshops" subtitle="Book your hands-on sessions" />

      {cvError && (
        <div className="flex items-center gap-2 rounded-xl bg-red-500/15 p-3 text-xs text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {cvError}
        </div>
      )}

      {loading ? null : workshops.length === 0 ? (
        <FadeIn>
          <p className="text-center text-sm text-muted py-12">
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
                  className="card-clean rounded-2xl p-4 space-y-3 cursor-pointer active:scale-[0.98] transition-transform duration-150"
                >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm">{ws.title}</h3>
                    {ws.has_waiting_list && <span className="shrink-0 rounded-full bg-amber-500/15 text-amber-400 px-2 py-0.5 text-[10px] font-medium">Waiting List</span>}
                    {ws.cv_required && <span className="shrink-0 rounded-full bg-blue-500/15 text-blue-400 px-2 py-0.5 text-[10px] font-medium flex items-center gap-0.5"><FileText className="h-2.5 w-2.5" />CV</span>}
                  </div>
                  <p className="text-xs font-medium" style={{ color: 'var(--accent)' }}>{ws.host}</p>
                </div>

                <div className="flex items-center gap-4 text-xs text-muted">
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
                  <p className="text-xs text-muted line-clamp-2">{ws.description}</p>
                )}

                <TapButton
                  onClick={(e) => handleBook(e, ws.id)}
                  disabled={bookingInProgress === ws.id || (booked && booking?.status !== 'approved')}
                  className={`w-full rounded-xl py-2.5 text-xs font-semibold transition-colors duration-150 ${
                    booked
                      ? (status?.color || 'bg-green-500/15 text-green-400')
                      : 'btn-dark'
                  } disabled:opacity-50`}
                >
                  {bookingInProgress === ws.id ? (
                    'Processing...'
                  ) : booked ? (
                    <span className="flex items-center justify-center gap-1">
                      <Check className="h-3 w-3" /> {status?.text}
                    </span>
                  ) : ws.has_waiting_list ? (
                    'Apply for Workshop'
                  ) : (
                    'Book Workshop'
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
                <h2 className="text-xl font-bold tracking-tight">{selected.title}</h2>
              </div>
              <p className="text-sm font-medium mt-1" style={{ color: 'var(--accent)' }}>{selected.host}</p>
              <div className="flex gap-2 mt-2">
                {selected.has_waiting_list && <span className="rounded-full bg-amber-500/15 text-amber-400 px-2.5 py-0.5 text-[10px] font-medium">Waiting List</span>}
                {selected.cv_required && <span className="rounded-full bg-blue-500/15 text-blue-400 px-2.5 py-0.5 text-[10px] font-medium flex items-center gap-0.5"><FileText className="h-2.5 w-2.5" />CV Required</span>}
              </div>
            </div>

            <div className="flex flex-wrap gap-3 text-sm text-muted">
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
              <p className="text-sm text-muted leading-relaxed">{selected.description}</p>
            )}

            {selected.cv_required && !profile?.cv_url && !isBooked(selected.id) && (
              <div className="flex items-center gap-2 rounded-xl bg-red-500/15 p-3 text-xs text-red-400">
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
                  className={`w-full rounded-xl py-3 text-sm font-semibold transition-colors duration-150 ${
                    booked
                      ? (status?.color || 'bg-green-500/15 text-green-400')
                      : 'btn-dark'
                  } disabled:opacity-50`}
                >
                  {bookingInProgress === selected.id ? (
                    'Processing...'
                  ) : booked ? (
                    <span className="flex items-center justify-center gap-1">
                      <Check className="h-4 w-4" /> {status?.text}
                    </span>
                  ) : selected.has_waiting_list ? (
                    'Apply for Workshop'
                  ) : (
                    'Book Workshop'
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
