const crypto = require('crypto');
const db = require('../config/db');
const AppError = require('../middleware/AppError');
const eventTypeService = require('./eventTypeService');
const slotService = require('./slotService');
const emailService = require('./emailService');
const { DEFAULT_USER_ID } = require('../config/constants');

const BOOKING_SELECT = `
  SELECT
    b.*,
    et.name        AS event_type_name,
    et.slug        AS event_type_slug,
    et.duration    AS duration,
    et.color       AS color,
    et.description AS event_description,
    et.location    AS location,
    u.name         AS host_name,
    u.email        AS host_email,
    sch.timezone   AS timezone
  FROM bookings b
  JOIN event_types et ON b.event_type_id = et.id
  JOIN users u ON et.user_id = u.id
  LEFT JOIN availability_schedules sch ON sch.user_id = u.id AND sch.is_default = 1
`;

async function getBookingById(id) {
  const [rows] = await db.query(`${BOOKING_SELECT} WHERE b.id = ?`, [id]);
  if (!rows.length) throw new AppError('Booking not found', 404);
  return rows[0];
}

async function getBookingByToken(token) {
  const [rows] = await db.query(`${BOOKING_SELECT} WHERE b.confirmation_token = ?`, [token]);
  if (!rows.length) throw new AppError('Booking not found', 404);
  return rows[0];
}

async function getSlots(slug, dateStr) {
  const eventType = await eventTypeService.getEventTypeBySlug(slug);
  if (!eventType.is_active) throw new AppError('This event type is not currently active', 400);
  return slotService.generateSlots(eventType, dateStr, eventType.user_id);
}

async function getPublicEventType(slug) {
  const et = await eventTypeService.getEventTypeBySlug(slug);
  if (!et.is_active) throw new AppError('This event type is not currently active', 404);

  const questions = await eventTypeService.getQuestionsForEventType(et.id);
  return { ...et, questions };
}

async function createBooking(slug, { invitee_name, invitee_email, start_time, notes, answers }) {
  const eventType = await eventTypeService.getEventTypeBySlug(slug);
  if (!eventType.is_active) throw new AppError('This event type is not currently active', 400);

  const { startUTCStr, endUTCStr } = await slotService.validateAndGetUTCTimes(
    eventType.user_id,
    eventType,
    start_time
  );

  const confirmationToken = crypto.randomBytes(32).toString('hex');

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [rows] = await conn.query(
      `INSERT INTO bookings
         (event_type_id, invitee_name, invitee_email, start_time, end_time, status, notes, confirmation_token)
       VALUES (?, ?, ?, ?, ?, 'confirmed', ?, ?) RETURNING id`,
      [eventType.id, invitee_name, invitee_email, startUTCStr, endUTCStr, notes || null, confirmationToken]
    );

    const bookingId = rows[0].id;

    if (Array.isArray(answers) && answers.length > 0) {
      for (const ans of answers) {
        if (ans.question_id && ans.answer !== undefined) {
          await conn.query(
            'INSERT INTO booking_answers (booking_id, question_id, answer) VALUES (?, ?, ?)',
            [bookingId, ans.question_id, ans.answer || null]
          );
        }
      }
    }

    await conn.commit();

    const booking = await getBookingById(bookingId);

    // Fire-and-forget email
    emailService.sendBookingConfirmation(booking, eventType).catch((err) =>
      console.error('[Email] Confirmation send failed:', err.message)
    );

    return booking;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

async function listMeetings({ type = 'all', page = 1, limit = 20, userId = DEFAULT_USER_ID } = {}) {
  const offset = (page - 1) * limit;
  const params = [userId];
  let condition = '';

  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

  if (type === 'upcoming') {
    condition = `AND b.status = 'confirmed' AND b.start_time >= ?`;
    params.push(now);
  } else if (type === 'past') {
    condition = `AND b.status = 'confirmed' AND b.end_time < ?`;
    params.push(now);
  } else if (type === 'cancelled') {
    condition = `AND b.status = 'cancelled'`;
  }

  const countQuery = `
    SELECT COUNT(*) AS total
    FROM bookings b
    JOIN event_types et ON b.event_type_id = et.id
    WHERE et.user_id = ? ${condition}
  `;
  const [countRows] = await db.query(countQuery, params);
  const total = parseInt(countRows[0].total, 10);

  const dataQuery = `
    ${BOOKING_SELECT}
    WHERE et.user_id = ? ${condition}
    ORDER BY b.start_time ${type === 'past' ? 'DESC' : 'ASC'}
    LIMIT ? OFFSET ?
  `;
  const [rows] = await db.query(dataQuery, [...params, limit, offset]);

  return {
    data: rows,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  };
}

async function cancelMeeting(id, { reason } = {}, userId = DEFAULT_USER_ID) {
  const booking = await getBookingById(id);

  if (booking.host_email !== (await db.query('SELECT email FROM users WHERE id = ?', [userId]))[0][0]?.email) {
    const [etRows] = await db.query(
      'SELECT user_id FROM event_types WHERE id = ?',
      [booking.event_type_id]
    );
    if (!etRows.length || etRows[0].user_id !== userId) {
      throw new AppError('Booking not found', 404);
    }
  }

  if (booking.status === 'cancelled') {
    throw new AppError('This booking is already cancelled', 400);
  }

  await db.query(
    `UPDATE bookings SET status = 'cancelled', cancel_reason = ? WHERE id = ?`,
    [reason || null, id]
  );

  const updated = await getBookingById(id);

  const eventType = await eventTypeService.getEventTypeById(booking.event_type_id);
  emailService.sendCancellationNotification(updated, eventType).catch((err) =>
    console.error('[Email] Cancellation send failed:', err.message)
  );

  return updated;
}

module.exports = {
  getPublicEventType,
  getSlots,
  createBooking,
  getBookingByToken,
  listMeetings,
  cancelMeeting,
};
