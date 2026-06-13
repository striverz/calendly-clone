import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/shared/PageHeader';
import { PageLoader } from '@/components/shared/LoadingSpinner';
import DayRuleRow from '@/components/availability/DayRuleRow';
import { Separator } from '@/components/ui/separator';
import {
  getAvailability, updateAvailabilitySchedule, updateAvailabilityRules,
  type RulePayload,
} from '@/api/availability';
import type { AvailabilitySchedule } from '@/types';
import { COMMON_TIMEZONES } from '@/utils/format';
import toast from 'react-hot-toast';

export default function AvailabilityPage() {
  const [schedule, setSchedule] = useState<AvailabilitySchedule | null>(null);
  const [rules, setRules] = useState<RulePayload[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [timezone, setTimezone] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const sched = await getAvailability();
      setSchedule(sched);
      setTimezone(sched.timezone);
      setRules(sched.rules.map(r => ({
        day_of_week: r.day_of_week,
        is_available: !!r.is_available,
        start_time: r.start_time?.slice(0, 5) ?? null,
        end_time: r.end_time?.slice(0, 5) ?? null,
      })));
    } catch {
      toast.error('Failed to load availability');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSaveRules = async () => {
    setSaving(true);
    try {
      await Promise.all([
        updateAvailabilitySchedule({ timezone }),
        updateAvailabilityRules(rules),
      ]);
      toast.success('Availability saved!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleRuleChange = (dayOfWeek: number, updated: RulePayload) => {
    setRules(prev => prev.map(r => r.day_of_week === dayOfWeek ? updated : r));
  };

  if (loading) return <PageLoader />;

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <PageHeader
        title="Availability"
        description="Configure when you're available to accept meetings."
      />

      {/* Working Hours Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Working hours</h2>

        {/* Timezone */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
          <select
            value={timezone}
            onChange={e => setTimezone(e.target.value)}
            className="w-full h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent hover:border-gray-300 transition-all duration-150"
          >
            {COMMON_TIMEZONES.map(tz => (
              <option key={tz} value={tz}>{tz}</option>
            ))}
          </select>
        </div>

        <Separator className="mb-4" />

        {/* Day rules */}
        <div>
          {rules.map(rule => (
            <DayRuleRow
              key={rule.day_of_week}
              rule={rule}
              onChange={updated => handleRuleChange(rule.day_of_week, updated)}
            />
          ))}
        </div>

        <div className="mt-5 flex justify-end">
          <Button onClick={handleSaveRules} disabled={saving}>
            {saving ? 'Saving...' : 'Save changes'}
          </Button>
        </div>
      </div>

    </div>
  );
}
