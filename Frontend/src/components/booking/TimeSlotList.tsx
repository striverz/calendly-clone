import { cn } from '@/lib/utils';
import type { TimeSlot } from '@/types';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

interface Props {
  slots: TimeSlot[];
  loading: boolean;
  selectedSlot: TimeSlot | null;
  onSelectSlot: (slot: TimeSlot) => void;
  color?: string;
}

export default function TimeSlotList({ slots, loading, selectedSlot, onSelectSlot, color = '#4F46E5' }: Props) {
  if (loading) {
    return <LoadingSpinner className="py-12" />;
  }

  if (slots.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 text-sm">No available times for this date.</p>
        <p className="text-gray-400 text-xs mt-1">Please select a different date.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 scrollbar-hide">
      {slots.map(slot => {
        const isSelected = selectedSlot?.start_time === slot.start_time;
        return (
          <button
            key={slot.start_time}
            onClick={() => onSelectSlot(slot)}
            className={cn(
              'w-full px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1',
              isSelected
                ? 'text-white border-transparent'
                : 'bg-white text-gray-700 border-gray-200 hover:border-opacity-70 hover:text-gray-900'
            )}
            style={
              isSelected
                ? { backgroundColor: color, borderColor: color }
                : { '--tw-ring-color': color } as React.CSSProperties
            }
            onMouseEnter={e => {
              if (!isSelected) {
                (e.currentTarget as HTMLButtonElement).style.borderColor = color;
                (e.currentTarget as HTMLButtonElement).style.color = color;
              }
            }}
            onMouseLeave={e => {
              if (!isSelected) {
                (e.currentTarget as HTMLButtonElement).style.borderColor = '#e5e7eb';
                (e.currentTarget as HTMLButtonElement).style.color = '#374151';
              }
            }}
          >
            {slot.display}
          </button>
        );
      })}
    </div>
  );
}
