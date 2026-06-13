import { Switch } from '@/components/ui/switch';
import { generateTimeOptions, formatTime12 } from '@/utils/format';
import type { RulePayload } from '@/api/availability';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIME_OPTIONS = generateTimeOptions();

interface Props {
  rule: RulePayload;
  onChange: (rule: RulePayload) => void;
}

export default function DayRuleRow({ rule, onChange }: Props) {
  const toggle = () => {
    if (!rule.is_available) {
      onChange({ ...rule, is_available: true, start_time: '09:00', end_time: '17:00' });
    } else {
      onChange({ ...rule, is_available: false, start_time: null, end_time: null });
    }
  };

  return (
    <div className="flex items-center gap-4 py-3 border-b border-gray-100 last:border-0">
      {/* Toggle + Day name */}
      <div className="flex items-center gap-3 w-36 shrink-0">
        <Switch checked={rule.is_available} onCheckedChange={toggle} />
        <span className={`text-sm font-medium ${rule.is_available ? 'text-gray-900' : 'text-gray-400'}`}>
          {DAY_NAMES[rule.day_of_week]}
        </span>
      </div>

      {/* Time range */}
      {rule.is_available ? (
        <div className="flex items-center gap-2 flex-1">
          <select
            value={rule.start_time || '09:00'}
            onChange={e => onChange({ ...rule, start_time: e.target.value })}
            className="flex-1 h-9 rounded-xl border border-gray-200 bg-white px-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent hover:border-gray-300 transition-all duration-150"
          >
            {TIME_OPTIONS.map(t => (
              <option key={t} value={t}>{formatTime12(t)}</option>
            ))}
          </select>
          <span className="text-gray-400 text-sm shrink-0">–</span>
          <select
            value={rule.end_time || '17:00'}
            onChange={e => onChange({ ...rule, end_time: e.target.value })}
            className="flex-1 h-9 rounded-xl border border-gray-200 bg-white px-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent hover:border-gray-300 transition-all duration-150"
          >
            {TIME_OPTIONS.map(t => (
              <option key={t} value={t}>{formatTime12(t)}</option>
            ))}
          </select>
        </div>
      ) : (
        <span className="text-sm text-gray-400 italic">Unavailable</span>
      )}
    </div>
  );
}
