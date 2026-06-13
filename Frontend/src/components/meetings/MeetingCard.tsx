import { format, parseISO } from 'date-fns';
import { Clock, MapPin, Mail, User, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDuration } from '@/utils/format';
import type { Meeting } from '@/types';

interface Props {
  meeting: Meeting;
  onCancel?: (meeting: Meeting) => void;
}

export default function MeetingCard({ meeting, onCancel }: Props) {
  const start = parseISO(meeting.start_time);
  const end = parseISO(meeting.end_time);
  const isUpcoming = meeting.status === 'confirmed';
  const isCancelled = meeting.status === 'cancelled';

  return (
    <div className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-shadow hover:shadow-md ${isCancelled ? 'opacity-70' : ''}`}>
      {/* Color accent */}
      <div className="h-1 w-full" style={{ backgroundColor: meeting.color }} />

      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-gray-900">{meeting.event_type_name}</h3>
              {isCancelled && <Badge variant="destructive">Cancelled</Badge>}
              {isUpcoming && <Badge variant="success">Confirmed</Badge>}
            </div>
            <p className="text-sm text-gray-500">
              {format(start, 'EEEE, MMMM d, yyyy')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="w-4 h-4 text-gray-400" />
            <span>
              {format(start, 'h:mm a')} – {format(end, 'h:mm a')}
              {' '}·{' '}{formatDuration(meeting.duration)}
            </span>
          </div>
          {meeting.location && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span>{meeting.location}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <User className="w-4 h-4 text-gray-400" />
            <span>{meeting.invitee_name}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Mail className="w-4 h-4 text-gray-400" />
            <a href={`mailto:${meeting.invitee_email}`} className="hover:text-indigo-600 transition-colors truncate">
              {meeting.invitee_email}
            </a>
          </div>
        </div>

        {meeting.cancel_reason && (
          <div className="mb-4 p-3 bg-red-50 rounded-lg border border-red-100">
            <p className="text-xs text-red-700 font-medium">Cancellation reason:</p>
            <p className="text-sm text-red-600">{meeting.cancel_reason}</p>
          </div>
        )}

        {meeting.notes && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
            <p className="text-xs text-gray-500 font-medium">Notes:</p>
            <p className="text-sm text-gray-700">{meeting.notes}</p>
          </div>
        )}

        {/* Actions */}
        {isUpcoming && onCancel && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onCancel(meeting)}
              className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50"
            >
              <XCircle className="w-3.5 h-3.5" />
              Cancel
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
