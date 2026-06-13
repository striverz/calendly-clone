const db = require('../config/db');
const AppError = require('../middleware/AppError');
const { DEFAULT_USER_ID, DEFAULT_SCHEDULE_ID } = require('../config/constants');

async function getDefaultSchedule(userId = DEFAULT_USER_ID) {
  const [rows] = await db.query(
    'SELECT * FROM availability_schedules WHERE user_id = ? AND is_default = 1',
    [userId]
  );
  if (!rows.length) throw new AppError('No availability schedule found. Run migrations.', 500);
  return rows[0];
}

async function getScheduleWithRules(userId = DEFAULT_USER_ID) {
  const schedule = await getDefaultSchedule(userId);

  const [rules] = await db.query(
    'SELECT * FROM availability_rules WHERE schedule_id = ? ORDER BY day_of_week ASC',
    [schedule.id]
  );

  return { ...schedule, rules };
}

async function updateSchedule(fields, userId = DEFAULT_USER_ID) {
  const schedule = await getDefaultSchedule(userId);

  const allowed = ['name', 'timezone'];
  const updates = {};
  for (const key of allowed) {
    if (fields[key] !== undefined) updates[key] = fields[key];
  }

  if (Object.keys(updates).length === 0) return getScheduleWithRules(userId);

  const setClauses = Object.keys(updates).map((k) => `${k} = ?`).join(', ');
  await db.query(
    `UPDATE availability_schedules SET ${setClauses} WHERE id = ?`,
    [...Object.values(updates), schedule.id]
  );

  return getScheduleWithRules(userId);
}

async function updateRules(rules, userId = DEFAULT_USER_ID) {
  const schedule = await getDefaultSchedule(userId);

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    for (const rule of rules) {
      const { day_of_week, is_available, start_time, end_time } = rule;

      const startTime = is_available && start_time ? start_time + ':00' : null;
      const endTime = is_available && end_time ? end_time + ':00' : null;

      await conn.query(
        `INSERT INTO availability_rules (schedule_id, day_of_week, is_available, start_time, end_time)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           is_available = VALUES(is_available),
           start_time = VALUES(start_time),
           end_time = VALUES(end_time)`,
        [schedule.id, day_of_week, is_available ? 1 : 0, startTime, endTime]
      );
    }

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }

  return getScheduleWithRules(userId);
}

module.exports = {
  getDefaultSchedule,
  getScheduleWithRules,
  updateSchedule,
  updateRules,
};
