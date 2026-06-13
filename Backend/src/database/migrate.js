const mysql = require('mysql2/promise');
const { DateTime } = require('luxon');
require('dotenv').config();

const reset = process.argv.includes('--reset');

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  timezone: '+00:00',
  multipleStatements: true,
};

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  timezone VARCHAR(100) NOT NULL DEFAULT 'America/New_York',
  avatar_url VARCHAR(500),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS event_types (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  duration INT NOT NULL COMMENT 'Duration in minutes',
  description TEXT,
  color VARCHAR(7) NOT NULL DEFAULT '#006BFF',
  location VARCHAR(500),
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_user_slug (user_id, slug),
  KEY idx_user_id (user_id),
  CONSTRAINT fk_et_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS availability_schedules (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  name VARCHAR(255) NOT NULL DEFAULT 'Working Hours',
  timezone VARCHAR(100) NOT NULL DEFAULT 'America/New_York',
  is_default TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_user_id (user_id),
  CONSTRAINT fk_as_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS availability_rules (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  schedule_id INT UNSIGNED NOT NULL,
  day_of_week TINYINT UNSIGNED NOT NULL COMMENT '0=Sun,1=Mon,2=Tue,3=Wed,4=Thu,5=Fri,6=Sat',
  is_available TINYINT(1) NOT NULL DEFAULT 0,
  start_time TIME,
  end_time TIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_schedule_day (schedule_id, day_of_week),
  CONSTRAINT fk_ar_schedule FOREIGN KEY (schedule_id) REFERENCES availability_schedules(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS date_overrides (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  schedule_id INT UNSIGNED NOT NULL,
  override_date DATE NOT NULL,
  is_available TINYINT(1) NOT NULL DEFAULT 0,
  start_time TIME,
  end_time TIME,
  note VARCHAR(500),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_schedule_date (schedule_id, override_date),
  KEY idx_override_date (override_date),
  CONSTRAINT fk_do_schedule FOREIGN KEY (schedule_id) REFERENCES availability_schedules(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS bookings (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  event_type_id INT UNSIGNED NOT NULL,
  invitee_name VARCHAR(255) NOT NULL,
  invitee_email VARCHAR(255) NOT NULL,
  start_time DATETIME NOT NULL COMMENT 'Stored in UTC',
  end_time DATETIME NOT NULL COMMENT 'Stored in UTC',
  status ENUM('confirmed','cancelled','rescheduled') NOT NULL DEFAULT 'confirmed',
  cancel_reason TEXT,
  notes TEXT,
  confirmation_token VARCHAR(64) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_token (confirmation_token),
  KEY idx_event_type_id (event_type_id),
  KEY idx_start_time (start_time),
  KEY idx_status (status),
  KEY idx_invitee_email (invitee_email),
  CONSTRAINT fk_b_event_type FOREIGN KEY (event_type_id) REFERENCES event_types(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS booking_questions (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  event_type_id INT UNSIGNED NOT NULL,
  question TEXT NOT NULL,
  question_type ENUM('text','textarea','select') NOT NULL DEFAULT 'text',
  is_required TINYINT(1) NOT NULL DEFAULT 0,
  options JSON,
  position INT UNSIGNED NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_event_type_id (event_type_id),
  CONSTRAINT fk_bq_event_type FOREIGN KEY (event_type_id) REFERENCES event_types(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS booking_answers (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  booking_id INT UNSIGNED NOT NULL,
  question_id INT UNSIGNED NOT NULL,
  answer TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_booking_id (booking_id),
  CONSTRAINT fk_ba_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  CONSTRAINT fk_ba_question FOREIGN KEY (question_id) REFERENCES booking_questions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

const DROP_TABLES = `
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS booking_answers;
DROP TABLE IF EXISTS booking_questions;
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS date_overrides;
DROP TABLE IF EXISTS availability_rules;
DROP TABLE IF EXISTS availability_schedules;
DROP TABLE IF EXISTS event_types;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;
`;

function getNextWeekday(offsetDays, targetWeekday) {
  // targetWeekday: 0=Sun,1=Mon,...,6=Sat
  const d = DateTime.now().plus({ days: offsetDays }).setZone('America/New_York');
  let result = d;
  while (result.weekday % 7 !== targetWeekday) {
    result = result.plus({ days: 1 });
  }
  return result;
}

function getPastWeekday(offsetDays, targetWeekday) {
  const d = DateTime.now().minus({ days: offsetDays }).setZone('America/New_York');
  let result = d;
  while (result.weekday % 7 !== targetWeekday) {
    result = result.minus({ days: 1 });
  }
  return result;
}

async function seed(conn) {
  // Check if already seeded
  const [existingUsers] = await conn.query('SELECT id FROM users WHERE id = 1');
  if (existingUsers.length > 0) {
    console.log('Seed data already exists, skipping...');
    return;
  }

  // Default user
  await conn.query(
    `INSERT INTO users (id, name, email, timezone) VALUES (1, 'Alex Johnson', 'alex@example.com', 'America/New_York')`
  );

  // Default availability schedule
  await conn.query(
    `INSERT INTO availability_schedules (id, user_id, name, timezone, is_default) VALUES (1, 1, 'Working Hours', 'America/New_York', 1)`
  );

  // Availability rules: Mon-Fri 9am-5pm, Sat-Sun unavailable
  await conn.query(`
    INSERT INTO availability_rules (schedule_id, day_of_week, is_available, start_time, end_time) VALUES
      (1, 0, 0, NULL, NULL),
      (1, 1, 1, '09:00:00', '17:00:00'),
      (1, 2, 1, '09:00:00', '17:00:00'),
      (1, 3, 1, '09:00:00', '17:00:00'),
      (1, 4, 1, '09:00:00', '17:00:00'),
      (1, 5, 1, '09:00:00', '17:00:00'),
      (1, 6, 0, NULL, NULL)
  `);

  // Event types
  await conn.query(`
    INSERT INTO event_types (id, user_id, name, slug, duration, description, color) VALUES
      (1, 1, '30 Minute Meeting', '30-min-meeting', 30, 'A quick 30-minute catch-up or discussion. Perfect for introductions, quick syncs, or focused conversations.', '#006BFF'),
      (2, 1, '60 Minute Meeting', '60-min-meeting', 60, 'An in-depth 60-minute session for detailed project discussions, strategic planning, or deep dives.', '#FF6B00'),
      (3, 1, 'Quick Chat', 'quick-chat', 15, 'A brief 15-minute check-in for a quick question or a fast update.', '#00BFA5')
  `);

  // Sample bookings on future/past weekday Tuesdays
  const upcoming1 = getNextWeekday(3, 2); // next Tuesday ~3 days out
  const upcoming2 = getNextWeekday(10, 2); // Tuesday ~10 days out
  const past1 = getPastWeekday(4, 3);      // past Wednesday ~4 days ago
  const past2 = getPastWeekday(11, 3);     // past Wednesday ~11 days ago

  // Format a DateTime to UTC SQL string
  const toUTCSql = (dt) => dt.toUTC().toFormat('yyyy-MM-dd HH:mm:ss');

  // Set hour on a local date then convert to UTC
  const atHour = (dt, h) => dt.set({ hour: h, minute: 0, second: 0, millisecond: 0 });

  const u1Start  = atHour(upcoming1, 14);  // 10 AM EST
  const u1End    = u1Start.plus({ minutes: 30 });
  const u2Start  = atHour(upcoming2, 18);  // 2 PM EST
  const u2End    = u2Start.plus({ minutes: 60 });
  const p1Start  = atHour(past1, 14);
  const p1End    = p1Start.plus({ minutes: 15 });
  const p2Start  = atHour(past2, 19);
  const p2End    = p2Start.plus({ minutes: 30 });

  const tok = (n) => `seed-tok-${Date.now()}-${n}`;

  await conn.query(`
    INSERT INTO bookings (event_type_id, invitee_name, invitee_email, start_time, end_time, status, notes, confirmation_token) VALUES
      (1, 'John Smith', 'john.smith@example.com', ?, ?, 'confirmed', 'Looking forward to our chat!', ?),
      (2, 'Jane Doe', 'jane.doe@example.com', ?, ?, 'confirmed', 'Need to discuss Q3 roadmap.', ?),
      (3, 'Bob Wilson', 'bob.wilson@example.com', ?, ?, 'confirmed', '', ?),
      (1, 'Alice Brown', 'alice.brown@example.com', ?, ?, 'confirmed', 'Great meeting, very productive!', ?)
  `, [
    toUTCSql(u1Start), toUTCSql(u1End), tok(1),
    toUTCSql(u2Start), toUTCSql(u2End), tok(2),
    toUTCSql(p1Start), toUTCSql(p1End), tok(3),
    toUTCSql(p2Start), toUTCSql(p2End), tok(4),
  ]);

  console.log('Seed data inserted successfully.');
}

async function run() {
  const conn = await mysql.createConnection({ ...DB_CONFIG, database: process.env.DB_NAME });

  try {
    console.log('Connected to MySQL.');

    if (reset) {
      console.log('Resetting database...');
      await conn.query(DROP_TABLES);
      console.log('Tables dropped.');
    }

    console.log('Running schema migration...');
    await conn.query(SCHEMA);
    console.log('Schema applied.');

    await seed(conn);
    console.log('Migration complete.');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    await conn.end();
  }
}

run();
