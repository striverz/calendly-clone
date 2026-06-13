import { useState } from 'react';
import {
  format, addMonths, subMonths, startOfMonth, getDay,
  getDaysInMonth, isSameDay, isBefore, isAfter, startOfDay,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface Props {
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
}

export default function BookingCalendar({ selectedDate, onSelectDate, minDate, maxDate }: Props) {
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()));
  const today = startOfDay(new Date());
  const effectiveMin = minDate ? startOfDay(minDate) : today;
  const effectiveMax = maxDate ?? addMonths(today, 3);

  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDayOfWeek = getDay(startOfMonth(currentMonth));

  const cells: (Date | null)[] = [
    ...Array<null>(firstDayOfWeek).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => {
      const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i + 1);
      return d;
    }),
  ];

  const canGoPrev = isAfter(currentMonth, startOfMonth(effectiveMin));
  const canGoNext = isBefore(addMonths(currentMonth, 0), startOfMonth(effectiveMax));

  return (
    <div className="select-none">
      {/* Month header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setCurrentMonth(m => subMonths(m, 1))}
          disabled={!canGoPrev}
          className="p-1.5 rounded-md hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-semibold text-gray-900">
          {format(currentMonth, 'MMMM yyyy')}
        </span>
        <button
          onClick={() => setCurrentMonth(m => addMonths(m, 1))}
          disabled={!canGoNext}
          className="p-1.5 rounded-md hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map(d => (
          <div key={d} className="text-center text-xs font-medium text-gray-500 py-1">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, idx) => {
          if (!day) return <div key={`empty-${idx}`} />;

          const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
          const isDisabled =
            isBefore(startOfDay(day), effectiveMin) ||
            isAfter(startOfDay(day), startOfDay(effectiveMax));
          const isToday_ = isSameDay(day, today);

          return (
            <div key={day.toISOString()} className="flex justify-center">
              <button
                onClick={() => !isDisabled && onSelectDate(day)}
                disabled={isDisabled}
                className={cn(
                  'w-9 h-9 rounded-full text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1',
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : isDisabled
                    ? 'text-gray-300 cursor-not-allowed'
                    : isToday_
                    ? 'text-indigo-600 font-bold hover:bg-indigo-50'
                    : 'text-gray-700 hover:bg-gray-100'
                )}
              >
                {format(day, 'd')}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
