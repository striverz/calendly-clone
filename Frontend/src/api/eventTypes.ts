import { api } from './client';
import type { EventType, EventTypeFormData } from '../types';

interface ListResponse { success: boolean; data: EventType[]; }
interface SingleResponse { success: boolean; data: EventType; }
interface DeleteResponse { success: boolean; message: string; }

export const getEventTypes = () =>
  api.get<ListResponse>('/event-types').then(r => r.data);

export const createEventType = (payload: EventTypeFormData) =>
  api.post<SingleResponse>('/event-types', payload).then(r => r.data);

export const updateEventType = (id: number, payload: Partial<EventTypeFormData>) =>
  api.put<SingleResponse>(`/event-types/${id}`, payload).then(r => r.data);

export const deleteEventType = (id: number) =>
  api.delete<DeleteResponse>(`/event-types/${id}`);
