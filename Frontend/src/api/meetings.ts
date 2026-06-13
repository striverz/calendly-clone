import { api } from './client';
import type { Meeting, Pagination } from '../types';

interface MeetingsResponse {
  success: boolean;
  data: Meeting[];
  pagination: Pagination;
}
interface MeetingResponse { success: boolean; data: Meeting; }

export type MeetingType = 'upcoming' | 'past' | 'all' | 'cancelled';

export const getMeetings = (type: MeetingType = 'all', page = 1, limit = 20) =>
  api.get<MeetingsResponse>(`/meetings?type=${type}&page=${page}&limit=${limit}`);

export const cancelMeeting = (id: number, reason?: string) =>
  api.patch<MeetingResponse>(`/meetings/${id}/cancel`, reason ? { reason } : {}).then(r => r.data);
