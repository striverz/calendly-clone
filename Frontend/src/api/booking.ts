import { api } from './client';
import type { BookingEventType, TimeSlot, Meeting } from '../types';

interface EventTypeResponse { success: boolean; data: BookingEventType; }
interface SlotsResponse { success: boolean; slots: TimeSlot[]; timezone: string; }
interface BookingResponse { success: boolean; data: Meeting; }

export const getBookingEventType = (slug: string) =>
  api.get<EventTypeResponse>(`/booking/${slug}`).then(r => r.data);

export const getBookingSlots = (slug: string, date: string) =>
  api.get<SlotsResponse>(`/booking/${slug}/slots?date=${date}`);

export interface BookingPayload {
  start_time: string;
  invitee_name: string;
  invitee_email: string;
  notes?: string;
  answers?: { question_id: number; answer: string }[];
}

export const createBooking = (slug: string, payload: BookingPayload) =>
  api.post<BookingResponse>(`/booking/${slug}`, payload).then(r => r.data);

export const getBookingConfirmation = (token: string) =>
  api.get<BookingResponse>(`/booking/confirmation/${token}`).then(r => r.data);
