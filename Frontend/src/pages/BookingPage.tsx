import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format, addDays, startOfDay } from 'date-fns';
import { Clock, MapPin, Globe, Calendar, User } from 'lucide-react';
import { getBookingEventType, getBookingSlots, createBooking } from '@/api/booking';
import BookingCalendar from '@/components/booking/BookingCalendar';
import TimeSlotList from '@/components/booking/TimeSlotList';
import BookingFormPanel from '@/components/booking/BookingFormPanel';
import { formatDuration, formatDateForApi } from '@/utils/format';
import type { BookingEventType, TimeSlot } from '@/types';
import type { BookingPayload } from '@/api/booking';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import toast from 'react-hot-toast';

type Step = 'pick-time' | 'fill-form';

export default function BookingPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [eventType, setEventType] = useState<BookingEventType | null>(null);
  const [loadingEvent, setLoadingEvent] = useState(true);
  const [eventError, setEventError] = useState('');

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);

  const [step, setStep] = useState<Step>('pick-time');

  const today = startOfDay(new Date());
  const maxDate = addDays(today, 60);

  useEffect(() => {
    if (!slug) return;
    setLoadingEvent(true);
    getBookingEventType(slug)
      .then(setEventType)
      .catch(() => setEventError('Event type not found or unavailable.'))
      .finally(() => setLoadingEvent(false));
  }, [slug]);

  const handleDateSelect = useCallback(async (date: Date) => {
    if (!slug) return;
    setSelectedDate(date);
    setSelectedSlot(null);
    setStep('pick-time');
    setSlotsLoading(true);
    try {
      const res = await getBookingSlots(slug, formatDateForApi(date));
      setSlots(res.slots);
    } catch {
      setSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  }, [slug]);

  const handleSlotSelect = (slot: TimeSlot) => {
    setSelectedSlot(slot);
    setStep('fill-form');
  };

  const handleBack = () => {
    setStep('pick-time');
    setSelectedSlot(null);
  };

  const handleBookingSubmit = async (payload: BookingPayload) => {
    if (!slug) return;
    try {
      const meeting = await createBooking(slug, payload);
      navigate(`/booking/confirmation/${meeting.confirmation_token}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to book. Please try again.');
      throw err;
    }
  };

  if (loadingEvent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (eventError || !eventType) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Event not found</h1>
          <p className="text-gray-500">{eventError || 'This booking page is not available.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="flex flex-col lg:flex-row">
            {/* Left panel — Event Info */}
            <div
              className="lg:w-72 xl:w-80 p-6 lg:p-8 border-b lg:border-b-0 lg:border-r border-gray-100"
              style={{ borderTop: `4px solid ${eventType.color}` }}
            >
              {/* Host */}
              <div className="flex items-center gap-3 mb-6">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold shrink-0"
                  style={{ backgroundColor: eventType.color }}
                >
                  {eventType.host_name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-500 font-medium">Hosted by</p>
                  <p className="font-semibold text-gray-900 truncate">{eventType.host_name}</p>
                </div>
              </div>

              <h1 className="text-xl font-bold text-gray-900 mb-4">{eventType.name}</h1>

              <div className="space-y-3 mb-5">
                <div className="flex items-center gap-2.5 text-sm text-gray-600">
                  <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                  <span>{formatDuration(eventType.duration)}</span>
                </div>
                {eventType.location && (
                  <div className="flex items-center gap-2.5 text-sm text-gray-600">
                    <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                    <span className="truncate">{eventType.location}</span>
                  </div>
                )}
                <div className="flex items-center gap-2.5 text-sm text-gray-600">
                  <Globe className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className="truncate">{eventType.schedule_timezone}</span>
                </div>
                {selectedDate && selectedSlot && step === 'fill-form' && (
                  <div className="flex items-start gap-2.5 text-sm text-gray-700 bg-indigo-50 p-3 rounded-lg">
                    <Calendar className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">{selectedSlot.display}</p>
                      <p className="text-gray-500">{format(selectedDate, 'EEEE, MMMM d, yyyy')}</p>
                    </div>
                  </div>
                )}
              </div>

              {eventType.description && (
                <div className="border-t border-gray-100 pt-4">
                  <p className="text-sm text-gray-600 leading-relaxed">{eventType.description}</p>
                </div>
              )}
            </div>

            {/* Right panel */}
            <div className="flex-1 p-6 lg:p-8">
              {step === 'pick-time' ? (
                <div className="flex flex-col md:flex-row gap-8">
                  {/* Calendar */}
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-700 mb-4">Select a date</p>
                    <BookingCalendar
                      selectedDate={selectedDate}
                      onSelectDate={handleDateSelect}
                      minDate={today}
                      maxDate={maxDate}
                    />
                  </div>

                  {/* Time slots */}
                  {selectedDate && (
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-700 mb-4">
                        {format(selectedDate, 'EEEE, MMMM d')}
                      </p>
                      <p className="text-xs text-gray-400 mb-3 flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        Times in {eventType.schedule_timezone}
                      </p>
                      <TimeSlotList
                        slots={slots}
                        loading={slotsLoading}
                        selectedSlot={selectedSlot}
                        onSelectSlot={handleSlotSelect}
                        color={eventType.color}
                      />
                    </div>
                  )}

                  {!selectedDate && (
                    <div className="flex-1 flex items-center justify-center text-gray-400">
                      <div className="text-center">
                        <User className="w-10 h-10 mx-auto mb-2 opacity-40" />
                        <p className="text-sm">Select a date to see available times</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                selectedSlot && (
                  <BookingFormPanel
                    eventType={eventType}
                    selectedSlot={selectedSlot}
                    onBack={handleBack}
                    onSubmit={handleBookingSubmit}
                  />
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
