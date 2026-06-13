# Calendly Clone — Backend API Reference

**Base URL:** `http://localhost:8080`  
**API prefix:** `/api`  
**Full base:** `http://localhost:8080/api`

All responses are JSON. All successful responses wrap data in `{ success: true, data: ... }`.  
Errors return `{ success: false, message: "..." }`.

> **No authentication required.** All admin routes operate on the default user (ID = 1).  
> Booking routes are fully public.

---

## Health Check

```
GET /health
```

**Response**
```json
{ "success": true, "status": "ok", "timestamp": "2026-06-13T10:00:00.000Z" }
```

---

## User — `/api/user`

### GET `/api/user`
Get the default user's profile.

**Response**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "timezone": "America/New_York",
    "avatar_url": null,
    "created_at": "2026-06-01T00:00:00.000Z"
  }
}
```

---

### PUT `/api/user`
Update the default user's profile. All fields are optional.

**Request body** (all optional)
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "timezone": "America/Chicago",
  "avatar_url": "https://example.com/avatar.png"
}
```

**Response** — same shape as GET `/api/user`

---

## Event Types — `/api/event-types`

### GET `/api/event-types`
List all active event types for the default user.

**Response**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "user_id": 1,
      "name": "30 Minute Meeting",
      "slug": "30-minute-meeting",
      "duration": 30,
      "description": "A quick sync call",
      "color": "#006BFF",
      "location": "Zoom",
      "is_active": 1,
      "created_at": "2026-06-01T00:00:00.000Z"
    }
  ]
}
```

---

### POST `/api/event-types`
Create a new event type.

**Request body**
```json
{
  "name": "60 Minute Deep Dive",
  "slug": "60-minute-deep-dive",
  "duration": 60,
  "description": "Optional description",
  "color": "#8B5CF6",
  "location": "Google Meet"
}
```

| Field | Type | Required | Constraints |
|---|---|---|---|
| `name` | string | yes | max 255 chars |
| `slug` | string | yes | lowercase, alphanumeric + hyphens, max 100, must be unique |
| `duration` | integer | yes | 5–480 minutes |
| `description` | string | no | max 1000 chars |
| `color` | string | no | hex `#RRGGBB`, default `#006BFF` |
| `location` | string | no | max 500 chars |

**Response** — 201, same shape as one item in the list response.

---

### PUT `/api/event-types/:id`
Update an existing event type. All body fields are optional.

**URL param:** `id` — integer

**Request body** (all optional, same fields as POST)

**Response** — updated event type object

---

### DELETE `/api/event-types/:id`
Delete an event type.

**URL param:** `id` — integer

**Response**
```json
{ "success": true, "message": "Event type deleted successfully" }
```

---

## Availability — `/api/availability`

### GET `/api/availability`
Get the default schedule along with day-of-week rules.

**Response**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "user_id": 1,
    "name": "Working Hours",
    "timezone": "America/New_York",
    "is_default": 1,
    "rules": [
      { "id": 1, "schedule_id": 1, "day_of_week": 0, "is_available": 0, "start_time": null, "end_time": null },
      { "id": 2, "schedule_id": 1, "day_of_week": 1, "is_available": 1, "start_time": "09:00:00", "end_time": "17:00:00" },
      { "id": 3, "schedule_id": 1, "day_of_week": 2, "is_available": 1, "start_time": "09:00:00", "end_time": "17:00:00" },
      { "id": 4, "schedule_id": 1, "day_of_week": 3, "is_available": 1, "start_time": "09:00:00", "end_time": "17:00:00" },
      { "id": 5, "schedule_id": 1, "day_of_week": 4, "is_available": 1, "start_time": "09:00:00", "end_time": "17:00:00" },
      { "id": 6, "schedule_id": 1, "day_of_week": 5, "is_available": 1, "start_time": "09:00:00", "end_time": "17:00:00" },
      { "id": 7, "schedule_id": 1, "day_of_week": 6, "is_available": 0, "start_time": null, "end_time": null }
    ]
  }
}
```

> `day_of_week`: `0` = Sunday, `1` = Monday, ..., `6` = Saturday

---

### PUT `/api/availability`
Update the schedule's name or timezone (not the day rules — use `/rules` for that).

**Request body** (all optional)
```json
{
  "name": "My Working Hours",
  "timezone": "America/Los_Angeles"
}
```

**Response** — same shape as GET `/api/availability`

---

### PUT `/api/availability/rules`
Replace all 7 day-of-week availability rules at once. Must send all 7 days.

**Request body**
```json
{
  "rules": [
    { "day_of_week": 0, "is_available": false, "start_time": null, "end_time": null },
    { "day_of_week": 1, "is_available": true, "start_time": "09:00", "end_time": "17:00" },
    { "day_of_week": 2, "is_available": true, "start_time": "09:00", "end_time": "17:00" },
    { "day_of_week": 3, "is_available": true, "start_time": "09:00", "end_time": "17:00" },
    { "day_of_week": 4, "is_available": true, "start_time": "09:00", "end_time": "17:00" },
    { "day_of_week": 5, "is_available": true, "start_time": "09:00", "end_time": "17:00" },
    { "day_of_week": 6, "is_available": false, "start_time": null, "end_time": null }
  ]
}
```

| Field | Type | Notes |
|---|---|---|
| `day_of_week` | 0–6 | 0=Sun … 6=Sat |
| `is_available` | boolean | |
| `start_time` | `"HH:MM"` | required if `is_available` is true |
| `end_time` | `"HH:MM"` | required if `is_available` is true |

**Response** — same shape as GET `/api/availability`

---

### GET `/api/availability/overrides`
List date overrides, optionally filtered by date range.

**Query params** (all optional)

| Param | Type | Example |
|---|---|---|
| `from` | `YYYY-MM-DD` | `?from=2026-07-01` |
| `to` | `YYYY-MM-DD` | `?to=2026-07-31` |

**Response**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "schedule_id": 1,
      "override_date": "2026-07-04",
      "is_available": 0,
      "start_time": null,
      "end_time": null,
      "note": "Independence Day"
    }
  ]
}
```

---

### POST `/api/availability/overrides`
Create a date override (e.g. a holiday or an extended hours day).

**Request body**
```json
{
  "override_date": "2026-07-04",
  "is_available": false,
  "start_time": null,
  "end_time": null,
  "note": "Independence Day"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `override_date` | `YYYY-MM-DD` | yes | |
| `is_available` | boolean | yes | |
| `start_time` | `"HH:MM"` | no | only meaningful when `is_available` is true |
| `end_time` | `"HH:MM"` | no | only meaningful when `is_available` is true |
| `note` | string | no | max 500 chars |

**Response** — 201, the created override object

---

### PUT `/api/availability/overrides/:id`
Update a date override.

**URL param:** `id` — integer

**Request body** — same as POST (all fields now required, as it's a full replace)

**Response** — updated override object

---

### DELETE `/api/availability/overrides/:id`
Delete a date override.

**URL param:** `id` — integer

**Response**
```json
{ "success": true, "message": "Date override deleted" }
```

---

## Booking (Public) — `/api/booking`

These are the **public-facing** routes used by the invitee scheduling flow. No auth needed.

---

### GET `/api/booking/:slug`
Get public details of an event type by slug (for the booking page).

**URL param:** `slug` — e.g. `30-minute-meeting`

**Response**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "30 Minute Meeting",
    "slug": "30-minute-meeting",
    "duration": 30,
    "description": "A quick sync",
    "color": "#006BFF",
    "location": "Zoom",
    "is_active": 1,
    "host_name": "John Doe",
    "host_email": "john@example.com",
    "schedule_timezone": "America/New_York",
    "questions": [
      {
        "id": 1,
        "event_type_id": 1,
        "label": "What would you like to discuss?",
        "is_required": 1,
        "position": 1
      }
    ]
  }
}
```

---

### GET `/api/booking/:slug/slots`
Get available time slots for a given date.

**URL param:** `slug` — event type slug  
**Query param:** `date` (required) — `YYYY-MM-DD`

```
GET /api/booking/30-minute-meeting/slots?date=2026-06-20
```

**Response**
```json
{
  "success": true,
  "slots": [
    {
      "start_time": "2026-06-20T13:00:00.000Z",
      "end_time": "2026-06-20T13:30:00.000Z",
      "start_time_local": "2026-06-20T09:00:00.000-04:00",
      "end_time_local": "2026-06-20T09:30:00.000-04:00",
      "display": "9:00 AM"
    }
  ],
  "timezone": "America/New_York"
}
```

> `start_time` / `end_time` are always UTC ISO 8601.  
> `display` is a human-readable local time string (use for the UI).  
> Slots already booked, in the past, or within 30 minutes from now are excluded.

---

### POST `/api/booking/:slug`
Book a slot. Rate-limited to 10 bookings per 15 min per IP.

**URL param:** `slug` — event type slug

**Request body**
```json
{
  "start_time": "2026-06-20T13:00:00.000Z",
  "invitee_name": "Jane Smith",
  "invitee_email": "jane@example.com",
  "notes": "Looking forward to it!",
  "answers": [
    { "question_id": 1, "answer": "I want to discuss the project roadmap" }
  ]
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `start_time` | ISO 8601 datetime | yes | must match an available slot exactly |
| `invitee_name` | string | yes | max 255 chars |
| `invitee_email` | email | yes | |
| `notes` | string | no | max 2000 chars |
| `answers` | array | no | answers to event type's custom questions |

**Response** — 201, full booking object (see Meetings section for shape)

---

### GET `/api/booking/confirmation/:token`
Look up a booking by its confirmation token (for the confirmation page after booking).

**URL param:** `token` — the token returned in the booking response

**Response** — same shape as a single meeting object

---

## Meetings (Admin) — `/api/meetings`

These are the **admin** routes for the host to manage their bookings.

---

### GET `/api/meetings`
List all meetings for the default user. Supports filtering and pagination.

**Query params** (all optional)

| Param | Type | Default | Options |
|---|---|---|---|
| `type` | string | `all` | `upcoming`, `past`, `all`, `cancelled` |
| `page` | integer | `1` | min 1 |
| `limit` | integer | `20` | 1–100 |

```
GET /api/meetings?type=upcoming&page=1&limit=10
```

**Response**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "event_type_id": 1,
      "invitee_name": "Jane Smith",
      "invitee_email": "jane@example.com",
      "start_time": "2026-06-20T13:00:00.000Z",
      "end_time": "2026-06-20T13:30:00.000Z",
      "status": "confirmed",
      "notes": null,
      "cancel_reason": null,
      "confirmation_token": "abc123...",
      "created_at": "2026-06-13T10:00:00.000Z",
      "event_type_name": "30 Minute Meeting",
      "event_type_slug": "30-minute-meeting",
      "duration": 30,
      "color": "#006BFF",
      "event_description": null,
      "location": "Zoom",
      "host_name": "John Doe",
      "host_email": "john@example.com",
      "timezone": "America/New_York"
    }
  ],
  "pagination": {
    "total": 42,
    "page": 1,
    "limit": 10,
    "pages": 5
  }
}
```

---

### GET `/api/meetings/:id`
Get a single meeting by ID.

**URL param:** `id` — integer

**Response**
```json
{ "success": true, "data": { /* same meeting object shape as above */ } }
```

---

### PATCH `/api/meetings/:id/cancel`
Cancel a meeting.

**URL param:** `id` — integer

**Request body** (optional)
```json
{ "reason": "Scheduling conflict" }
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `reason` | string | no | max 1000 chars, stored as `cancel_reason` |

**Response** — updated meeting object with `status: "cancelled"`

---

### PATCH `/api/meetings/:id/reschedule`
Reschedule a meeting to a new time slot.

**URL param:** `id` — integer

**Request body**
```json
{ "start_time": "2026-06-21T14:00:00.000Z" }
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `start_time` | ISO 8601 datetime | yes | must be a valid available slot |

**Response** — updated meeting object with the new `start_time` / `end_time`

---

## Error Responses

All errors follow this shape:

```json
{ "success": false, "message": "Human-readable error message" }
```

**Common HTTP status codes:**

| Code | Meaning |
|---|---|
| 400 | Bad request / validation failed |
| 404 | Resource not found |
| 409 | Conflict (e.g. slug already in use, slot no longer available) |
| 422 | Validation errors (body) — `errors` array may be present |
| 429 | Rate limit exceeded |
| 500 | Server error |

**Validation error example** (422):
```json
{
  "success": false,
  "errors": [
    { "field": "slug", "message": "Slug must be lowercase alphanumeric with hyphens" }
  ]
}
```

---

## Frontend Integration Notes

1. **CORS** — the server allows requests from `http://localhost:3000` by default. Change `FRONTEND_URL` in `.env` for other origins.
2. **Dates & times** — always send `start_time` as UTC ISO 8601 (e.g. `"2026-06-20T13:00:00.000Z"`). The `display` field in slots is pre-formatted for UI use.
3. **Booking flow (happy path):**
   1. `GET /api/booking/:slug` — load event type info
   2. `GET /api/booking/:slug/slots?date=YYYY-MM-DD` — fetch available slots for a date
   3. `POST /api/booking/:slug` — submit the booking form
   4. Redirect to confirmation page, use `GET /api/booking/confirmation/:token`
4. **Admin flow:**
   - Use `GET /api/meetings?type=upcoming` for the dashboard view
   - Use `PATCH /api/meetings/:id/cancel` and `PATCH /api/meetings/:id/reschedule` for actions
5. **Booking constraints:**
   - Slots must be booked at least **30 minutes** in advance
   - Cannot book more than **60 days** ahead
