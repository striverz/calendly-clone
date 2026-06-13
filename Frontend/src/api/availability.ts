import { api } from './client';
import type { AvailabilitySchedule } from '../types';

interface ScheduleResponse { success: boolean; data: AvailabilitySchedule; }

export const getAvailability = () =>
  api.get<ScheduleResponse>('/availability').then(r => r.data);

export const updateAvailabilitySchedule = (payload: { name?: string; timezone?: string }) =>
  api.put<ScheduleResponse>('/availability', payload).then(r => r.data);

export interface RulePayload {
  day_of_week: number;
  is_available: boolean;
  start_time: string | null;
  end_time: string | null;
}

export const updateAvailabilityRules = (rules: RulePayload[]) =>
  api.put<ScheduleResponse>('/availability/rules', { rules }).then(r => r.data);
