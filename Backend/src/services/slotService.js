const { DateTime } = require('luxon');
const db = require('../config/db');
const AppError = require('../middleware/AppError');
const { MIN_BOOKING_NOTICE_MINUTES, MAX_BOOKING_DAYS_AHEAD } = require('../config/constants');

async function getDefaultSchedule(userId) {
  const [rows] = await db.query(
    'SELECT * FROM availability_schedules WHERE user_id = ? AND is_default = 1',
    [userId]
  );
  if (!rows.length) throw new AppError('No availability schedule configured', 500);
  return rows[0];
}

async function getAvailabilityRule(scheduleId, dayOfWeek) {
  const [rows] = await db.query(
    'SELECT * FROM availability_rules WHERE schedule_id = ? AND day_of_week = ?',
    [scheduleId, dayOfWeek]
  );
  return rows[0] || null;
}

async function getDateOverride(scheduleId, dateStr) {
  const [rows] = await db.query(
    'SELECT * FROM date_overrides WHERE schedule_id = ? AND override_date = ?',
    [scheduleId, dateStr]
  );
  return rows[0] || null;
}

async function hasConflict(userId, startUTCStr, endUTCStr, excludeBookingId = null) {
  let query = `
    SELECT b.id
    FROM bookings b
    JOIN event_types et ON b.event_type_id = et.id
    WHERE et.user_id = ?
      AND b.status = 'confirmed'
      AND b.start_time < ?
      AND b.end_time > ?
  `;
  const params = [userId, endUTCStr, startUTCStr];

  if (excludeBookingId) {
    query += ' AND b.id != ?';
    params.push(excludeBookingId);
  }

  query += ' LIMIT 1';
  const [rows] = await db.query(query, params);
  return rows.length > 0;
}

function parseDayOfWeek(luxonDt) {
  // luxon weekday: 1=Mon, 7=Sun -> convert to 0=Sun, 1=Mon, ..., 6=Sat
  return luxonDt.weekday === 7 ? 0 : luxonDt.weekday;
}

function parseTimeStr(timeStr) {
  // Handles 'HH:MM' or 'HH:MM:SS' from DB
  const parts = timeStr.split(':');
  return { hour: parseInt(parts[0], 10), minute: parseInt(parts[1], 10) };
}

async function generateSlots(eventType, dateStr, userId) {
  const schedule = await getDefaultSchedule(userId);
  const tz = schedule.timezone;

  const requestedDate = DateTime.fromISO(dateStr, { zone: tz });
  if (!requestedDate.isValid) throw new AppError('Invalid date format', 400);

  // Prevent booking too far in advance
  const maxDate = DateTime.now().setZone(tz).plus({ days: MAX_BOOKING_DAYS_AHEAD });
  if (requestedDate > maxDate) {
    return { slots: [], timezone: tz };
  }

  const dayOfWeek = parseDayOfWeek(requestedDate);

  // Date override takes priority over regular rules
  const override = await getDateOverride(schedule.id, dateStr);
  let isAvailable, windowStartStr, windowEndStr;

  if (override) {
    isAvailable = !!override.is_available;
    windowStartStr = override.start_time;
    windowEndStr = override.end_time;
  } else {
    const rule = await getAvailabilityRule(schedule.id, dayOfWeek);
    if (!rule) return { slots: [], timezone: tz };
    isAvailable = !!rule.is_available;
    windowStartStr = rule.start_time;
    windowEndStr = rule.end_time;
  }

  if (!isAvailable || !windowStartStr || !windowEndStr) {
    return { slots: [], timezone: tz };
  }

  const { hour: wStartH, minute: wStartM } = parseTimeStr(windowStartStr);
  const { hour: wEndH, minute: wEndM } = parseTimeStr(windowEndStr);

  const windowStart = requestedDate.set({ hour: wStartH, minute: wStartM, second: 0, millisecond: 0 });
  const windowEnd = requestedDate.set({ hour: wEndH, minute: wEndM, second: 0, millisecond: 0 });

  const duration = eventType.duration;
  const now = DateTime.now();
  const minBookingTime = now.plus({ minutes: MIN_BOOKING_NOTICE_MINUTES });
  const slots = [];

  let current = windowStart;

  while (current.plus({ minutes: duration }) <= windowEnd) {
    const slotEnd = current.plus({ minutes: duration });

    // Skip slots that are in the past or within the notice window
    if (current >= minBookingTime) {
      const startUTCStr = current.toUTC().toFormat('yyyy-MM-dd HH:mm:ss');
      const endUTCStr = slotEnd.toUTC().toFormat('yyyy-MM-dd HH:mm:ss');

      const booked = await hasConflict(userId, startUTCStr, endUTCStr);

      if (!booked) {
        slots.push({
          start_time: current.toUTC().toISO(),
          end_time: slotEnd.toUTC().toISO(),
          start_time_local: current.toISO(),
          end_time_local: slotEnd.toISO(),
          display: current.toFormat('h:mm a'),
        });
      }
    }

    current = slotEnd;
  }

  return { slots, timezone: tz };
}

async function validateAndGetUTCTimes(userId, eventType, startTimeISO, excludeBookingId = null) {
  const schedule = await getDefaultSchedule(userId);
  const tz = schedule.timezone;

  const startUTC = DateTime.fromISO(startTimeISO, { zone: 'UTC' });
  if (!startUTC.isValid) throw new AppError('Invalid start_time format', 400);

  const startLocal = startUTC.setZone(tz);
  const endLocal = startLocal.plus({ minutes: eventType.duration });

  // Past check with booking notice
  const minBookingTime = DateTime.now().plus({ minutes: MIN_BOOKING_NOTICE_MINUTES });
  if (startLocal < minBookingTime) {
    throw new AppError(
      `Bookings must be made at least ${MIN_BOOKING_NOTICE_MINUTES} minutes in advance`,
      400
    );
  }

  // Max advance check
  const maxDate = DateTime.now().setZone(tz).plus({ days: MAX_BOOKING_DAYS_AHEAD });
  if (startLocal > maxDate) {
    throw new AppError(`Bookings cannot be made more than ${MAX_BOOKING_DAYS_AHEAD} days in advance`, 400);
  }

  const dateStr = startLocal.toFormat('yyyy-MM-dd');
  const dayOfWeek = parseDayOfWeek(startLocal);

  const override = await getDateOverride(schedule.id, dateStr);
  let isAvailable, windowStartStr, windowEndStr;

  if (override) {
    isAvailable = !!override.is_available;
    windowStartStr = override.start_time;
    windowEndStr = override.end_time;
  } else {
    const rule = await getAvailabilityRule(schedule.id, dayOfWeek);
    if (!rule || !rule.is_available) {
      throw new AppError('This day is not available for booking', 400);
    }
    isAvailable = true;
    windowStartStr = rule.start_time;
    windowEndStr = rule.end_time;
  }

  if (!isAvailable) throw new AppError('This date is not available for booking', 400);

  const { hour: wStartH, minute: wStartM } = parseTimeStr(windowStartStr);
  const { hour: wEndH, minute: wEndM } = parseTimeStr(windowEndStr);

  const windowStart = startLocal.set({ hour: wStartH, minute: wStartM, second: 0, millisecond: 0 });
  const windowEnd = startLocal.set({ hour: wEndH, minute: wEndM, second: 0, millisecond: 0 });

  // Slot must be within availability window
  if (startLocal < windowStart || endLocal > windowEnd) {
    throw new AppError('Requested time is outside the availability window', 400);
  }

  // Slot must align with duration intervals from window start
  const minutesOffset = startLocal.diff(windowStart, 'minutes').minutes;
  if (minutesOffset < 0 || minutesOffset % eventType.duration !== 0) {
    throw new AppError('Invalid time slot — does not align with schedule intervals', 400);
  }

  const startUTCStr = startLocal.toUTC().toFormat('yyyy-MM-dd HH:mm:ss');
  const endUTCStr = endLocal.toUTC().toFormat('yyyy-MM-dd HH:mm:ss');

  const conflict = await hasConflict(userId, startUTCStr, endUTCStr, excludeBookingId);
  if (conflict) throw new AppError('This time slot is no longer available', 409);

  return { startUTCStr, endUTCStr };
}

module.exports = { generateSlots, validateAndGetUTCTimes, hasConflict };
