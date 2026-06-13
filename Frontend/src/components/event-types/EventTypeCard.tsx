import { useState } from 'react';
import { Clock, MapPin, Link2, Pencil, Trash2, Eye, Copy, Check } from 'lucide-react';
import { formatDuration } from '@/utils/format';
import type { EventType } from '@/types';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

interface Props {
  eventType: EventType;
  onEdit: (et: EventType) => void;
  onDelete: (et: EventType) => void;
}

export default function EventTypeCard({ eventType, onEdit, onDelete }: Props) {
  const [copied, setCopied] = useState(false);
  const bookingUrl = `${window.location.origin}/book/${eventType.slug}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(bookingUrl);
    setCopied(true);
    toast.success('Link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group relative bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 overflow-hidden flex flex-col">
      {/* Color accent bar */}
      <div className="h-1.5 w-full" style={{ backgroundColor: eventType.color || '#4F46E5' }} />

      <div className="flex flex-col flex-1 p-5">
        {/* Title + color dot */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 text-[15px] leading-snug truncate">
              {eventType.name}
            </h3>
            {eventType.description && (
              <p className="mt-1 text-xs text-gray-500 line-clamp-2 leading-relaxed">
                {eventType.description}
              </p>
            )}
          </div>
          <div
            className="w-3 h-3 rounded-full shrink-0 mt-1 ring-2 ring-white shadow-sm"
            style={{ backgroundColor: eventType.color || '#4F46E5' }}
          />
        </div>

        {/* Meta chips */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-50 border border-gray-100 text-xs font-medium text-gray-600">
            <Clock className="w-3 h-3 text-gray-400" />
            {formatDuration(eventType.duration)}
          </span>
          {eventType.location && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-50 border border-gray-100 text-xs font-medium text-gray-600 max-w-[180px]">
              <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
              <span className="truncate">{eventType.location}</span>
            </span>
          )}
        </div>

        {/* Booking URL row */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 border border-gray-100 mb-4">
          <Link2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <span className="flex-1 text-xs text-gray-500 truncate font-mono">
            /book/{eventType.slug}
          </span>
          <button
            onClick={handleCopy}
            className={cn(
              'shrink-0 p-1 rounded-lg transition-all duration-150',
              copied
                ? 'text-emerald-600 bg-emerald-50'
                : 'text-gray-400 hover:text-indigo-600 hover:bg-indigo-50'
            )}
            title="Copy booking link"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>

        <div className="flex-1" />

        {/* Actions */}
        <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
          <a
            href={bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 hover:text-gray-900 border border-gray-200 transition-all duration-150"
          >
            <Eye className="w-3.5 h-3.5" />
            View
          </a>
          <button
            onClick={() => onEdit(eventType)}
            className="flex-1 inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 transition-all duration-150"
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit
          </button>
          <button
            onClick={() => onDelete(eventType)}
            className="flex-1 inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium text-red-500 bg-red-50 hover:bg-red-100 border border-red-100 transition-all duration-150"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
