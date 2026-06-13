export interface EventType {
  id: number;
  user_id: number;
  name: string;
  slug: string;
  duration: number;
  description: string | null;
  color: string;
  location: string | null;
  is_active: number;
  created_at: string;
}

export interface AvailabilityRule {
  id: number;
  schedule_id: number;
  day_of_week: number;
  is_available: number;
  start_time: string | null;
  end_time: string | null;
}

export interface AvailabilitySchedule {
  id: number;
  user_id: number;
  name: string;
  timezone: string;
  is_default: number;
  rules: AvailabilityRule[];
}

export interface BookingQuestion {
  id: number;
  event_type_id: number;
  label: string;
  is_required: number;
  position: number;
}

export interface BookingEventType {
  id: number;
  name: string;
  slug: string;
  duration: number;
  description: string | null;
  color: string;
  location: string | null;
  is_active: number;
  host_name: string;
  host_email: string;
  schedule_timezone: string;
  questions: BookingQuestion[];
}

export interface TimeSlot {
  start_time: string;
  end_time: string;
  start_time_local: string;
  end_time_local: string;
  display: string;
}

export interface Meeting {
  id: number;
  event_type_id: number;
  invitee_name: string;
  invitee_email: string;
  start_time: string;
  end_time: string;
  status: 'confirmed' | 'cancelled';
  notes: string | null;
  cancel_reason: string | null;
  confirmation_token: string;
  created_at: string;
  event_type_name: string;
  event_type_slug: string;
  duration: number;
  color: string;
  event_description: string | null;
  location: string | null;
  host_name: string;
  host_email: string;
  timezone: string;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface EventTypeFormData {
  name: string;
  slug: string;
  duration: number;
  description: string;
  color: string;
  location: string;
}
