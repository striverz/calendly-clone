import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { CheckCircle2, Clock, MapPin, Mail, User, Calendar, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getBookingConfirmation } from '@/api/booking';
import { formatDuration, getGoogleCalendarLink } from '@/utils/format';
import type { Meeting } from '@/types';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

export default function ConfirmationPage() {
  const { token } = useParams<{ token: string }>();
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    getBookingConfirmation(token)
      .then(setMeeting)
      .catch(() => setError('Booking not found.'))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !meeting) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <h1 className="text-xl font-bold text-gray-900 mb-2">Booking not found</h1>
          <p className="text-gray-500 mb-6">{error}</p>
          <Link to="/">
            <Button variant="outline">Go to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  const startDate = parseISO(meeting.start_time);
  const endDate = parseISO(meeting.end_time);
  const gcalLink = getGoogleCalendarLink(meeting);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-lg mx-auto">
        {/* Success card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Top color bar */}
          <div className="h-2 w-full" style={{ backgroundColor: meeting.color }} />

          <div className="p-8">
            {/* Success icon */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <CheckCircle2 className="w-9 h-9 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">You are scheduled!</h1>
              <p className="text-gray-500 mt-2 text-sm">
                A calendar invitation has been sent to your email address.
              </p>
            </div>

            {/* Meeting details */}
            <div className="bg-gray-50 rounded-xl p-5 space-y-3">
              <h2 className="font-semibold text-gray-900 text-base border-b border-gray-200 pb-2 mb-3">
                {meeting.event_type_name}
              </h2>

              <div className="flex items-start gap-3 text-sm text-gray-700">
                <Calendar className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">{format(startDate, 'EEEE, MMMM d, yyyy')}</p>
                  <p className="text-gray-500">
                    {format(startDate, 'h:mm a')} – {format(endDate, 'h:mm a')}
                    {' '}· {formatDuration(meeting.duration)}
                  </p>
                </div>
              </div>

              {meeting.location && (
                <div className="flex items-center gap-3 text-sm text-gray-700">
                  <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                  <span>{meeting.location}</span>
                </div>
              )}

              <div className="flex items-center gap-3 text-sm text-gray-700">
                <User className="w-4 h-4 text-gray-400 shrink-0" />
                <span><span className="text-gray-500">With:</span> {meeting.host_name}</span>
              </div>

              <div className="flex items-center gap-3 text-sm text-gray-700">
                <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                <span><span className="text-gray-500">You:</span> {meeting.invitee_name} ({meeting.invitee_email})</span>
              </div>

              <div className="flex items-center gap-3 text-sm text-gray-700">
                <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="text-gray-500">{meeting.timezone}</span>
              </div>

              {meeting.notes && (
                <div className="pt-2 border-t border-gray-200">
                  <p className="text-xs text-gray-500 font-medium mb-1">Notes</p>
                  <p className="text-sm text-gray-700">{meeting.notes}</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <a href={gcalLink} target="_blank" rel="noopener noreferrer" className="flex-1">
                <Button variant="outline" className="w-full gap-2">
                  <ExternalLink className="w-4 h-4" />
                  Add to Google Calendar
                </Button>
              </a>
              <Link to={`/book/${meeting.event_type_slug}`} className="flex-1">
                <Button variant="outline" className="w-full">
                  Book another time
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Powered by Calendly Clone · Need help? Contact {meeting.host_email}
        </p>
      </div>
    </div>
  );
}
