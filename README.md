# ScheduleFlow — Calendly Clone

[![Node.js](https://img.shields.io/badge/Node.js-22.x-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-5.x-000000?logo=express&logoColor=white)](https://expressjs.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-4169E1?logo=postgresql&logoColor=white)](https://neon.tech)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?logo=vite&logoColor=white)](https://vite.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.x-38BDF8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-000000?logo=vercel&logoColor=white)](https://vercel.com)

A full-stack scheduling application inspired by Calendly. Hosts create event types and share unique booking links; invitees pick available time slots and receive confirmation emails — all without any back-and-forth.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Features](#2-features)
3. [Tech Stack](#3-tech-stack)
4. [Architecture Overview](#4-architecture-overview)
5. [Folder Structure](#5-folder-structure)
6. [Installation & Setup](#6-installation--setup)
7. [Environment Variables](#7-environment-variables)
8. [Database Setup & Migrations](#8-database-setup--migrations)
9. [Backend API Documentation](#9-backend-api-documentation)
10. [Frontend Pages & Workflows](#10-frontend-pages--workflows)
11. [Booking & Scheduling Workflow](#11-booking--scheduling-workflow)
12. [Screenshots](#12-screenshots)
13. [Deployment](#13-deployment)
14. [Error Handling & Validation](#14-error-handling--validation)
15. [Security Considerations](#15-security-considerations)
16. [Future Improvements](#16-future-improvements)
17. [Contributing](#17-contributing)
18. [License](#18-license)

---

## 1. Project Overview

ScheduleFlow is a production-ready scheduling platform that replicates the core Calendly experience. A host configures their availability, creates event types (e.g. "30 Minute Meeting"), and shares a public booking link. Anyone with the link can browse open time slots and book instantly — no account required.

**Live URLs**

| Service  | URL |
|----------|-----|
| Frontend | `https://calendly-clone-phi-seven.vercel.app` *(placeholder — update after deploy)* |
| Backend  | `https://latest-backend1.vercel.app` |

> **Authentication note:** This application operates as a single-host system. All admin routes act on the default user (`id = 1`). Booking routes are fully public and require no credentials.

---

## 2. Features

### Admin (Host) Side
- **Event Types** — Create, edit, and delete meeting types with a name, slug, duration (5–480 min), description, color, and location.
- **Availability Scheduling** — Set working hours per day of the week and configure a timezone.
- **Date Overrides** — Mark specific dates as unavailable (e.g. holidays) or available with custom hours.
- **Meetings Dashboard** — View upcoming, past, and cancelled bookings with pagination.
- **Cancel Meetings** — Cancel any upcoming meeting with an optional reason.

### Invitee (Public Booking) Side
- **Public Booking Page** — Each event type has a unique URL (`/book/:slug`) accessible without login.
- **Interactive Calendar** — Browse dates up to 60 days ahead; unavailable days are greyed out.
- **Real-Time Slot Generation** — Available time slots are computed live, excluding booked and past slots.
- **Booking Form** — Invitees enter their name, email, optional notes, and answers to custom questions.
- **Confirmation Page** — Displays booking details with a "Add to Google Calendar" link.
- **Email Notifications** — Transactional emails sent on booking, cancellation, and reschedule (requires SMTP config).

### Platform
- Timezone-aware slot generation and display (via Luxon)
- Double-booking prevention via conflict detection
- Minimum booking notice (30 minutes) and maximum advance booking (60 days)
- Global and per-route rate limiting
- Responsive, mobile-friendly UI

---

## 3. Tech Stack

### Backend
| Layer | Technology |
|-------|-----------|
| Runtime | Node.js |
| Framework | Express 5 |
| Database | PostgreSQL (Neon serverless) via `pg` |
| Time handling | Luxon 3 |
| Email | Nodemailer |
| Validation | express-validator |
| Security | Helmet, CORS, express-rate-limit |
| Dev server | Nodemon |

### Frontend
| Layer | Technology |
|-------|-----------|
| Framework | React 19 |
| Language | TypeScript 6 |
| Build tool | Vite 8 |
| Routing | React Router DOM 7 |
| Styling | Tailwind CSS 3 |
| UI primitives | Radix UI (Dialog, Switch, Tabs) |
| Icons | Lucide React |
| Toast notifications | react-hot-toast |
| Date utilities | date-fns 4 |

### Infrastructure
| Concern | Solution |
|---------|---------|
| Frontend hosting | Vercel (static SPA) |
| Backend hosting | Vercel (serverless Node.js function) |
| Database | Neon PostgreSQL (serverless, SSL) |

---

## 4. Architecture Overview

```
┌─────────────────────────────────┐
│         React SPA (Vite)        │  ← Vercel CDN
│  src/api/ → fetch() calls       │
└────────────────┬────────────────┘
                 │ HTTPS  /api/*
┌────────────────▼────────────────┐
│     Express 5 (Vercel Fn)       │  ← Vercel Serverless
│  routes → controllers           │
│         → services              │
│         → validators            │
└────────────────┬────────────────┘
                 │ SSL / pg pool
┌────────────────▼────────────────┐
│    PostgreSQL (Neon Serverless)  │
│  7 tables, auto-updated_at      │
└─────────────────────────────────┘
```

**Request lifecycle (backend)**

```
Request
  → Helmet (security headers)
  → CORS check (allowlist)
  → Rate limiter
  → Body parser (10 kb limit)
  → Route → Validator → asyncHandler
      → Controller → Service → DB
  → JSON Response / AppError → errorHandler
```

---

## 5. Folder Structure

```
Calendly/
├── Backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── constants.js        # App-wide constants (booking rules, defaults)
│   │   │   └── db.js               # pg Pool wrapper with ? → $N placeholder conversion
│   │   ├── controllers/
│   │   │   ├── availabilityController.js
│   │   │   ├── bookingController.js
│   │   │   ├── eventTypeController.js
│   │   │   └── meetingController.js
│   │   ├── database/
│   │   │   └── migrate.js          # Schema creation + seed data
│   │   ├── middleware/
│   │   │   ├── AppError.js         # Operational error class
│   │   │   ├── asyncHandler.js     # Wraps async route handlers
│   │   │   ├── errorHandler.js     # Global Express error handler
│   │   │   └── validate.js         # express-validator result extractor
│   │   ├── routes/
│   │   │   ├── index.js            # Mounts all sub-routers under /api
│   │   │   ├── availabilityRoutes.js
│   │   │   ├── bookingRoutes.js
│   │   │   ├── eventTypeRoutes.js
│   │   │   └── meetingRoutes.js
│   │   ├── services/
│   │   │   ├── availabilityService.js
│   │   │   ├── bookingService.js
│   │   │   ├── emailService.js     # Nodemailer transactional emails
│   │   │   ├── eventTypeService.js
│   │   │   └── slotService.js      # Core slot generation & conflict detection
│   │   ├── validators/
│   │   │   ├── availabilityValidator.js
│   │   │   ├── bookingValidator.js
│   │   │   ├── eventTypeValidator.js
│   │   │   └── meetingValidator.js
│   │   └── index.js                # Express app entry point
│   ├── .env                        # Local environment variables (git-ignored)
│   ├── package.json
│   ├── vercel.json                 # Vercel serverless config
│   └── API_REFERENCE.md
│
└── Frontend/
    ├── src/
    │   ├── api/
    │   │   ├── client.ts           # Base fetch wrapper with typed helpers
    │   │   ├── availability.ts
    │   │   ├── booking.ts
    │   │   ├── eventTypes.ts
    │   │   └── meetings.ts
    │   ├── components/
    │   │   ├── availability/
    │   │   │   └── DayRuleRow.tsx  # Toggle + time inputs for one weekday
    │   │   ├── booking/
    │   │   │   ├── BookingCalendar.tsx
    │   │   │   ├── BookingFormPanel.tsx
    │   │   │   └── TimeSlotList.tsx
    │   │   ├── event-types/
    │   │   │   ├── EventTypeCard.tsx
    │   │   │   └── EventTypeFormModal.tsx
    │   │   ├── layout/
    │   │   │   ├── AdminLayout.tsx  # Outlet wrapper with sidebar
    │   │   │   └── Sidebar.tsx
    │   │   ├── meetings/
    │   │   │   ├── CancelModal.tsx
    │   │   │   └── MeetingCard.tsx
    │   │   ├── shared/
    │   │   │   ├── EmptyState.tsx
    │   │   │   ├── LoadingSpinner.tsx
    │   │   │   └── PageHeader.tsx
    │   │   └── ui/                 # Radix-based primitives (button, dialog, etc.)
    │   ├── pages/
    │   │   ├── LandingPage.tsx
    │   │   ├── EventTypesPage.tsx
    │   │   ├── AvailabilityPage.tsx
    │   │   ├── MeetingsPage.tsx
    │   │   ├── BookingPage.tsx
    │   │   ├── ConfirmationPage.tsx
    │   │   └── NotFoundPage.tsx
    │   ├── types/index.ts           # Shared TypeScript interfaces
    │   ├── utils/format.ts          # Date formatters, slug generator, timezone list
    │   ├── App.tsx                  # Route definitions
    │   ├── main.tsx
    │   └── index.css
    ├── package.json
    ├── vite.config.ts
    ├── tailwind.config.js
    └── vercel.json                  # SPA rewrite rule
```

---

## 6. Installation & Setup

### Prerequisites

- **Node.js** 18+ (LTS recommended)
- **npm** 9+ (comes with Node.js)
- A **PostgreSQL** database — [Neon](https://neon.tech) (free tier) is the tested provider; any PostgreSQL 14+ instance works

### Clone the repository

```bash
git clone https://github.com/<your-username>/calendly-clone.git
cd calendly-clone
```

### Backend setup

```bash
cd Backend
npm install
cp .env.example .env   # create from the template below
# Edit .env with your values
npm run migrate        # create schema and seed demo data
npm run dev            # starts on http://localhost:8080
```

### Frontend setup

```bash
cd Frontend
npm install
# Set VITE_API_BASE_URL if needed (see Environment Variables)
npm run dev            # starts on http://localhost:3000
```

Open `http://localhost:3000` in your browser.

---

## 7. Environment Variables

### Backend (`Backend/.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `8080` | HTTP port the server listens on |
| `NODE_ENV` | No | `development` | `development` or `production` |
| `DATABASE_URL` | **Yes** | — | Full PostgreSQL connection string with `?sslmode=require` |
| `FRONTEND_URL` | No | — | Comma-separated allowed CORS origins for local dev |
| `FRONTEND_URL_PROD` | No | — | Single production frontend URL added to the CORS allowlist |
| `SMTP_HOST` | No | — | SMTP server hostname — omit to disable email sending |
| `SMTP_PORT` | No | `587` | SMTP port |
| `SMTP_SECURE` | No | `false` | Set to `true` to use TLS (port 465) |
| `SMTP_USER` | No | — | SMTP auth username |
| `SMTP_PASS` | No | — | SMTP auth password |
| `SMTP_FROM` | No | `noreply@calendly-clone.com` | From address in outgoing emails |

**Example `Backend/.env`**

```dotenv
PORT=8080
NODE_ENV=development

# PostgreSQL — Neon example
DATABASE_URL=postgresql://user:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require

# CORS
FRONTEND_URL=http://localhost:3000,http://localhost:5173
FRONTEND_URL_PROD=https://your-frontend.vercel.app

# Optional SMTP (leave blank to skip emails)
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=postmaster@mg.yourdomain.com
SMTP_PASS=your-smtp-password
SMTP_FROM=noreply@yourdomain.com
```

### Frontend

The frontend reads the backend URL from `src/api/client.ts`. To configure it without modifying source, set a Vite environment variable:

```dotenv
# Frontend/.env.local
VITE_API_BASE_URL=http://localhost:8080/api
```

Then update `src/api/client.ts`:

```ts
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api';
```

---

## 8. Database Setup & Migrations

The migration script (`Backend/src/database/migrate.js`) creates all tables, triggers, and indexes, then seeds demo data if the `users` table is empty.

### Commands

```bash
# Run migrations (idempotent — safe to run multiple times)
npm run migrate

# Wipe everything and start fresh
npm run migrate:reset
```

### Schema Overview

```
users
  id, name, email, timezone, avatar_url, created_at, updated_at

event_types
  id, user_id (FK→users), name, slug (unique per user),
  duration, description, color, location, is_active,
  created_at, updated_at

availability_schedules
  id, user_id (FK→users), name, timezone, is_default,
  created_at, updated_at

availability_rules          ← one row per day of week (0–6)
  id, schedule_id (FK→schedules), day_of_week, is_available,
  start_time, end_time, created_at, updated_at
  UNIQUE (schedule_id, day_of_week)

date_overrides              ← holiday / special hours
  id, schedule_id (FK→schedules), override_date, is_available,
  start_time, end_time, note, created_at, updated_at
  UNIQUE (schedule_id, override_date)

bookings
  id, event_type_id (FK→event_types), invitee_name,
  invitee_email, start_time, end_time,
  status (confirmed|cancelled|rescheduled),
  cancel_reason, notes, confirmation_token (unique),
  created_at, updated_at

booking_questions           ← custom intake form per event type
  id, event_type_id (FK→event_types), question,
  question_type (text|textarea|select), is_required,
  options (JSONB), position, created_at

booking_answers
  id, booking_id (FK→bookings), question_id (FK→questions),
  answer, created_at
```

All timestamp columns are auto-maintained by a PostgreSQL trigger (`update_updated_at_column`).

### Seed Data

On first migration, the script inserts:

- **1 user** — Alex Johnson, `America/New_York`, Mon–Fri 9 AM–5 PM
- **3 event types** — 30-min, 60-min, 15-min (Quick Chat)
- **4 demo bookings** — 2 upcoming, 2 past

---

## 9. Backend API Documentation

**Base URL:** `http://localhost:8080/api`

All responses are JSON. Successful responses: `{ "success": true, "data": ... }`. Errors: `{ "success": false, "message": "..." }`.

> No authentication required. All admin routes operate on the default user (ID = 1).

---

### Health Check

```
GET /health
```

```json
{ "success": true, "status": "ok", "timestamp": "2026-06-13T10:00:00.000Z" }
```

---

### Event Types — `/api/event-types`

#### `GET /api/event-types`
List all active event types.

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

#### `POST /api/event-types`
Create an event type.

**Request body**

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `name` | string | Yes | max 255 chars |
| `slug` | string | Yes | lowercase alphanumeric + hyphens, max 100, unique per user |
| `duration` | integer | Yes | 5–480 minutes |
| `description` | string | No | max 1000 chars |
| `color` | string | No | hex `#RRGGBB`, default `#006BFF` |
| `location` | string | No | max 500 chars |

**Response:** 201 with the created object.

#### `PUT /api/event-types/:id`
Update an event type (all fields optional).

#### `DELETE /api/event-types/:id`
Delete an event type.

```json
{ "success": true, "message": "Event type deleted successfully" }
```

---

### Availability — `/api/availability`

#### `GET /api/availability`
Get the default schedule with all 7 day rules.

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
      { "day_of_week": 0, "is_available": 0, "start_time": null, "end_time": null },
      { "day_of_week": 1, "is_available": 1, "start_time": "09:00:00", "end_time": "17:00:00" }
    ]
  }
}
```

> `day_of_week`: 0 = Sunday … 6 = Saturday

#### `PUT /api/availability`
Update schedule name or timezone.

#### `PUT /api/availability/rules`
Replace all 7 day rules atomically.

```json
{
  "rules": [
    { "day_of_week": 0, "is_available": false, "start_time": null, "end_time": null },
    { "day_of_week": 1, "is_available": true, "start_time": "09:00", "end_time": "17:00" }
  ]
}
```

#### `GET /api/availability/overrides`
List date overrides. Optional query params: `from=YYYY-MM-DD`, `to=YYYY-MM-DD`.

#### `POST /api/availability/overrides`
Create a date override (e.g. holiday).

| Field | Type | Required |
|-------|------|----------|
| `override_date` | `YYYY-MM-DD` | Yes |
| `is_available` | boolean | Yes |
| `start_time` | `HH:MM` | No |
| `end_time` | `HH:MM` | No |
| `note` | string | No, max 500 |

**Response:** 201.

#### `PUT /api/availability/overrides/:id` / `DELETE /api/availability/overrides/:id`
Update or delete a date override.

---

### Booking (Public) — `/api/booking`

#### `GET /api/booking/:slug`
Get public event type details by slug. Includes host info and custom questions.

#### `GET /api/booking/:slug/slots?date=YYYY-MM-DD`
Get available slots for a date.

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

> All `start_time` / `end_time` values are UTC ISO 8601. `display` is pre-formatted local time for the UI.

#### `POST /api/booking/:slug`
Book a slot. **Rate-limited: 10 bookings per IP per 15 minutes.**

```json
{
  "start_time": "2026-06-20T13:00:00.000Z",
  "invitee_name": "Jane Smith",
  "invitee_email": "jane@example.com",
  "notes": "Looking forward to it!",
  "answers": [
    { "question_id": 1, "answer": "Discuss Q3 roadmap" }
  ]
}
```

**Response:** 201 with the full booking object including `confirmation_token`.

#### `GET /api/booking/confirmation/:token`
Retrieve a booking by its confirmation token (used by the confirmation page).

---

### Meetings (Admin) — `/api/meetings`

#### `GET /api/meetings`
List all meetings with filtering and pagination.

| Param | Default | Options |
|-------|---------|---------|
| `type` | `all` | `upcoming`, `past`, `cancelled`, `all` |
| `page` | `1` | integer ≥ 1 |
| `limit` | `20` | 1–100 |

```json
{
  "success": true,
  "data": [ { "id": 1, "invitee_name": "Jane", "status": "confirmed", ... } ],
  "pagination": { "total": 42, "page": 1, "limit": 10, "pages": 5 }
}
```

#### `GET /api/meetings/:id`
Get a single meeting by ID.

#### `PATCH /api/meetings/:id/cancel`
Cancel a meeting with an optional reason (max 1000 chars).

```json
{ "reason": "Scheduling conflict" }
```

#### `PATCH /api/meetings/:id/reschedule`
Reschedule a meeting. `start_time` must be a valid available slot.

```json
{ "start_time": "2026-06-21T14:00:00.000Z" }
```

---

### Error Responses

```json
{ "success": false, "message": "Human-readable error" }
```

| Code | Meaning |
|------|---------|
| 400 | Bad request / business rule violation |
| 404 | Resource not found |
| 409 | Conflict (duplicate slug, slot already taken) |
| 422 | Validation failure — `errors[]` array present |
| 429 | Rate limit exceeded |
| 500 | Unexpected server error |

---

## 10. Frontend Pages & Workflows

| Route | Page | Access |
|-------|------|--------|
| `/` | `LandingPage` | Public |
| `/event-types` | `EventTypesPage` | Admin |
| `/availability` | `AvailabilityPage` | Admin |
| `/meetings` | `MeetingsPage` | Admin |
| `/book/:slug` | `BookingPage` | Public |
| `/booking/confirmation/:token` | `ConfirmationPage` | Public |
| `*` | `NotFoundPage` | — |

### Admin pages (with sidebar)

**Event Types** — Card grid of all event types. Each card shows name, duration, color accent, slug, and copy-link action. "New Event Type" opens a modal form. Edit and delete actions are available per card.

**Availability** — Timezone selector followed by a row for each day of the week. Each row has an enable/disable toggle and, when enabled, start/end time selectors. Changes are saved atomically (schedule + rules in parallel).

**Meetings** — Tabbed view (Upcoming / Past / Cancelled) with pagination. Each meeting card shows invitee details, event name, time, status badge, and a cancel button on upcoming meetings. Cancel opens a modal that accepts an optional reason.

### Public pages (no sidebar)

**Booking Page** — Two-step flow: ① pick a date on the calendar and select a time slot; ② fill in name, email, notes, and any custom questions. The left panel always shows host info, event name, duration, location, and timezone.

**Confirmation Page** — Displays full booking summary (event name, date/time range, host, invitee) and provides buttons to add the event to Google Calendar or book another time.

---

## 11. Booking & Scheduling Workflow

```
Invitee opens /book/:slug
      │
      ▼
GET /api/booking/:slug          ← load event type + host info
      │
      ▼
Invitee selects a date
      │
      ▼
GET /api/booking/:slug/slots?date=YYYY-MM-DD
      │
      ├─ Backend: fetch default availability schedule
      ├─ Check date_overrides (takes priority over weekly rules)
      ├─ Fall back to availability_rules for that day_of_week
      ├─ Generate slots every [duration] minutes within window
      └─ Exclude:
            • slots in the past
            • slots < 30 min from now
            • slots with a confirmed booking conflict
      │
      ▼
Invitee selects a slot → fills form → submits
      │
      ▼
POST /api/booking/:slug
      │
      ├─ Re-validate slot still available
      ├─ Insert booking row (status = 'confirmed')
      ├─ Generate unique confirmation_token (64 chars)
      ├─ Send confirmation email (if SMTP configured)
      └─ Return booking + token
      │
      ▼
Frontend redirects to /booking/confirmation/:token
      │
      ▼
GET /api/booking/confirmation/:token  ← display booking details
```

**Booking constraints enforced by the backend:**

- Slot must be at least **30 minutes** in the future
- Slot must be no more than **60 days** ahead
- Slot must fall within the host's configured availability window
- Slot start must align with duration-sized intervals from window start
- No confirmed booking may overlap (checked with `start_time < end AND end_time > start`)

---

## 12. Screenshots

> *Replace the placeholders below with actual screenshots after running the app.*

| Page | Preview |
|------|---------|
| Landing Page | `<!-- screenshot: landing-page.png -->` |
| Event Types Dashboard | `<!-- screenshot: event-types.png -->` |
| Availability Settings | `<!-- screenshot: availability.png -->` |
| Meetings List | `<!-- screenshot: meetings.png -->` |
| Public Booking — Calendar | `<!-- screenshot: booking-calendar.png -->` |
| Public Booking — Form | `<!-- screenshot: booking-form.png -->` |
| Confirmation Page | `<!-- screenshot: confirmation.png -->` |

---

## 13. Deployment

### Database (Neon PostgreSQL)

1. Create a free project at [neon.tech](https://neon.tech).
2. Copy the connection string from the Neon dashboard.
3. Run the migration against Neon:

```bash
cd Backend
DATABASE_URL="postgresql://..." npm run migrate
```

### Backend (Vercel)

1. Install the [Vercel CLI](https://vercel.com/docs/cli): `npm i -g vercel`
2. From the `Backend/` directory:

```bash
cd Backend
vercel --prod
```

3. Set environment variables in the Vercel dashboard (or via `vercel env add`):

```
DATABASE_URL
FRONTEND_URL_PROD
NODE_ENV=production
# Optional SMTP variables
```

The `Backend/vercel.json` routes all traffic to `src/index.js` as a serverless function:

```json
{
  "builds": [{ "src": "src/index.js", "use": "@vercel/node" }],
  "routes": [{ "src": "/(.*)", "dest": "src/index.js" }]
}
```

### Frontend (Vercel)

1. From the `Frontend/` directory:

```bash
cd Frontend
vercel --prod
```

2. The `Frontend/vercel.json` rewrites all paths to `index.html` to support client-side routing:

```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```

3. Update `src/api/client.ts` to point `BASE_URL` at your deployed backend URL before building.

### Build commands

| Service | Build command | Output directory |
|---------|--------------|-----------------|
| Frontend | `npm run build` | `dist/` |
| Backend | *(no build — Node.js source)* | `src/` |

---

## 14. Error Handling & Validation

### Backend

**Operational errors** are represented by `AppError(message, statusCode)` and returned as structured JSON. Non-operational (programming) errors fall through to the global error handler, which returns 500 and exposes `detail`/`stack` in development.

**Validation** is performed using `express-validator` chains before route handlers execute. On failure the middleware extracts errors and throws with `type: 'validation'`, producing a 422 response:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "field": "slug", "message": "Slug must be lowercase alphanumeric with hyphens" }
  ]
}
```

**Database conflicts** (duplicate unique key → 409) and foreign-key violations are normalised by `errorHandler.js`.

### Frontend

API errors are caught by the typed `ApiError` class in `src/api/client.ts` and surfaced via `react-hot-toast` notifications. Page-level loading and error states are handled individually per page with dedicated UI (loading spinners and error messages).

---

## 15. Security Considerations

| Concern | Implementation |
|---------|---------------|
| Security headers | `helmet` middleware (CSP, HSTS, X-Frame-Options, etc.) |
| CORS | Explicit origin allowlist; `credentials: true` |
| Rate limiting | Global: 300 req / 15 min. Booking creation: 10 req / 15 min per IP |
| Request body size | Hard limit of 10 kb via Express body parser |
| SQL injection | Parameterised queries via `pg` — no string interpolation |
| Input validation | `express-validator` on every mutating endpoint |
| Database transport | SSL (`rejectUnauthorized: false` for Neon's pooler endpoint) |
| Error leakage | Stack traces only exposed in `NODE_ENV=development` |
| Confirmation tokens | 64-character unique token generated per booking; stored with `UNIQUE` constraint |

**Known limitations** (see [Future Improvements](#16-future-improvements)):

- No user authentication — any request can access admin endpoints.
- `rejectUnauthorized: false` is required for Neon's pooler; in a private network this can be hardened.
- SMTP credentials should be rotated regularly and never committed to the repository.

---

## 16. Future Improvements

- **Authentication** — Add JWT or session-based auth so the admin dashboard is protected.
- **Multi-user support** — Allow multiple hosts with isolated event types and availability.
- **Calendar integrations** — Two-way sync with Google Calendar / Outlook to auto-block booked time.
- **Automated reminders** — Send reminder emails 24 h and 1 h before a meeting using a job queue (e.g. BullMQ).
- **Webhook support** — Emit events on booking/cancel to integrate with Zapier, Slack, etc.
- **Recurring availability** — Support buffer time between meetings and minimum scheduling notice per event type.
- **Rescheduling by invitee** — Let the invitee self-reschedule via their confirmation token.
- **Custom branding** — Per-user logo, accent colour, and custom domain for the booking page.
- **Analytics** — Booking conversion rates, peak-hour charts, and no-show tracking.
- **Testing** — Unit tests for `slotService.js` (conflict detection, edge cases) and integration tests for booking endpoints.
- **Dark mode** — Extend Tailwind config and component themes.

---

## 17. Contributing

Contributions are welcome! Please follow these steps:

1. **Fork** the repository and create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Install dependencies** for both Backend and Frontend (see [Installation & Setup](#6-installation--setup)).

3. **Develop** your changes. Keep the backend service–controller–route pattern. Keep frontend components small and co-located with their page.

4. **Test** manually:
   - Start both servers locally.
   - Run through the full booking flow end-to-end.
   - Verify admin CRUD for event types and availability.

5. **Commit** with a clear message:
   ```bash
   git commit -m "feat: add reschedule by invitee via confirmation token"
   ```

6. **Open a Pull Request** against `main`. Include a description of the change and how to test it.

### Code style

- Backend: CommonJS modules, no transpilation.
- Frontend: TypeScript strict mode, functional components, hooks only.
- No `console.log` in production paths.
- No comments that restate what the code already says.

---

## 18. License

This project is licensed under the **ISC License**.

```
ISC License

Copyright (c) 2026

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
```
