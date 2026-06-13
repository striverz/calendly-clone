const db = require('../config/db');
const AppError = require('../middleware/AppError');
const { DEFAULT_USER_ID } = require('../config/constants');

async function listEventTypes() {
  const [rows] = await db.query(
    'SELECT * FROM event_types WHERE user_id = ? AND is_active = 1 ORDER BY created_at ASC',
    [DEFAULT_USER_ID]
  );
  return rows;
}

async function getEventTypeById(id) {
  const [rows] = await db.query(
    'SELECT * FROM event_types WHERE id = ? AND user_id = ?',
    [id, DEFAULT_USER_ID]
  );
  if (!rows.length) throw new AppError('Event type not found', 404);
  return rows[0];
}

async function getEventTypeBySlug(slug) {
  const [rows] = await db.query(
    `SELECT et.*, u.name AS host_name, u.email AS host_email, u.timezone AS host_timezone,
            sch.timezone AS schedule_timezone
     FROM event_types et
     JOIN users u ON et.user_id = u.id
     LEFT JOIN availability_schedules sch ON sch.user_id = u.id AND sch.is_default = 1
     WHERE et.slug = ? AND et.user_id = ?`,
    [slug, DEFAULT_USER_ID]
  );
  if (!rows.length) throw new AppError('Event type not found', 404);
  return rows[0];
}

async function createEventType({ name, slug, duration, description, color, location }) {
  const [existing] = await db.query(
    'SELECT id FROM event_types WHERE user_id = ? AND slug = ?',
    [DEFAULT_USER_ID, slug]
  );
  if (existing.length) throw new AppError(`Slug "${slug}" is already in use`, 409);

  const [result] = await db.query(
    `INSERT INTO event_types (user_id, name, slug, duration, description, color, location)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [DEFAULT_USER_ID, name, slug, duration, description || null, color || '#006BFF', location || null]
  );

  return getEventTypeById(result.insertId);
}

async function updateEventType(id, fields) {
  const et = await getEventTypeById(id);

  if (fields.slug && fields.slug !== et.slug) {
    const [existing] = await db.query(
      'SELECT id FROM event_types WHERE user_id = ? AND slug = ? AND id != ?',
      [DEFAULT_USER_ID, fields.slug, id]
    );
    if (existing.length) throw new AppError(`Slug "${fields.slug}" is already in use`, 409);
  }

  const allowed = ['name', 'slug', 'duration', 'description', 'color', 'location'];
  const updates = {};
  for (const key of allowed) {
    if (fields[key] !== undefined) updates[key] = fields[key];
  }

  if (Object.keys(updates).length === 0) {
    throw new AppError('No valid fields to update', 400);
  }

  const setClauses = Object.keys(updates).map((k) => `${k} = ?`).join(', ');
  await db.query(
    `UPDATE event_types SET ${setClauses} WHERE id = ? AND user_id = ?`,
    [...Object.values(updates), id, DEFAULT_USER_ID]
  );

  return getEventTypeById(id);
}

async function deleteEventType(id) {
  await getEventTypeById(id);
  await db.query('DELETE FROM event_types WHERE id = ? AND user_id = ?', [id, DEFAULT_USER_ID]);
}

async function getQuestionsForEventType(eventTypeId) {
  const [rows] = await db.query(
    'SELECT * FROM booking_questions WHERE event_type_id = ? ORDER BY position ASC',
    [eventTypeId]
  );
  return rows;
}

module.exports = {
  listEventTypes,
  getEventTypeById,
  getEventTypeBySlug,
  createEventType,
  updateEventType,
  deleteEventType,
  getQuestionsForEventType,
};
