const { Client } = require('pg');
const { DateTime } = require('luxon');
require('dotenv').config();

const reset = process.argv.includes('--reset');

async function dropTables(client) {
  await client.query(`
    DROP TABLE IF EXISTS booking_answers CASCADE;
    DROP TABLE IF EXISTS booking_questions CASCADE;
    DROP TABLE IF EXISTS bookings CASCADE;
    DROP TABLE IF EXISTS date_overrides CASCADE;
    DROP TABLE IF EXISTS availability_rules CASCADE;
    DROP TABLE IF EXISTS availability_schedules CASCADE;
    DROP TABLE IF EXISTS event_types CASCADE;
    DROP TABLE IF EXISTS users CASCADE;
    DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
  `);
}

async function createSchema(client) {
  // Trigger function to auto-update updated_at on every UPDATE
  await client.query(`
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS users (
      id         SERIAL PRIMARY KEY,
      name       VARCHAR(255) NOT NULL,
      email      VARCHAR(255) NOT NULL UNIQUE,
      timezone   VARCHAR(100) NOT NULL DEFAULT 'America/New_York',
      avatar_url VARCHAR(500),
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
  await client.query(`
    CREATE OR REPLACE TRIGGER update_users_updated_at
      BEFORE UPDATE ON users
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS event_types (
      id          SERIAL PRIMARY KEY,
      user_id     INTEGER NOT NULL,
      name        VARCHAR(255) NOT NULL,
      slug        VARCHAR(255) NOT NULL,
      duration    INTEGER NOT NULL,
      description TEXT,
      color       VARCHAR(7) NOT NULL DEFAULT '#006BFF',
      location    VARCHAR(500),
      is_active   SMALLINT NOT NULL DEFAULT 1,
      created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at  TIMESTAMP NOT NULL DEFAULT NOW(),
      UNIQUE (user_id, slug),
      CONSTRAINT fk_et_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  await client.query(`CREATE INDEX IF NOT EXISTS idx_event_types_user_id ON event_types(user_id)`);
  await client.query(`
    CREATE OR REPLACE TRIGGER update_event_types_updated_at
      BEFORE UPDATE ON event_types
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS availability_schedules (
      id         SERIAL PRIMARY KEY,
      user_id    INTEGER NOT NULL,
      name       VARCHAR(255) NOT NULL DEFAULT 'Working Hours',
      timezone   VARCHAR(100) NOT NULL DEFAULT 'America/New_York',
      is_default SMALLINT NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
      CONSTRAINT fk_as_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  await client.query(`CREATE INDEX IF NOT EXISTS idx_availability_schedules_user_id ON availability_schedules(user_id)`);
  await client.query(`
    CREATE OR REPLACE TRIGGER update_availability_schedules_updated_at
      BEFORE UPDATE ON availability_schedules
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS availability_rules (
      id           SERIAL PRIMARY KEY,
      schedule_id  INTEGER NOT NULL,
      day_of_week  SMALLINT NOT NULL,
      is_available SMALLINT NOT NULL DEFAULT 0,
      start_time   TIME,
      end_time     TIME,
      created_at   TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at   TIMESTAMP NOT NULL DEFAULT NOW(),
      UNIQUE (schedule_id, day_of_week),
      CONSTRAINT fk_ar_schedule FOREIGN KEY (schedule_id) REFERENCES availability_schedules(id) ON DELETE CASCADE
    )
  `);
  await client.query(`
    CREATE OR REPLACE TRIGGER update_availability_rules_updated_at
      BEFORE UPDATE ON availability_rules
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS date_overrides (
      id            SERIAL PRIMARY KEY,
      schedule_id   INTEGER NOT NULL,
      override_date DATE NOT NULL,
      is_available  SMALLINT NOT NULL DEFAULT 0,
      start_time    TIME,
      end_time      TIME,
      note          VARCHAR(500),
      created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at    TIMESTAMP NOT NULL DEFAULT NOW(),
      UNIQUE (schedule_id, override_date),
      CONSTRAINT fk_do_schedule FOREIGN KEY (schedule_id) REFERENCES availability_schedules(id) ON DELETE CASCADE
    )
  `);
  await client.query(`CREATE INDEX IF NOT EXISTS idx_date_overrides_date ON date_overrides(override_date)`);
  await client.query(`
    CREATE OR REPLACE TRIGGER update_date_overrides_updated_at
      BEFORE UPDATE ON date_overrides
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS bookings (
      id                 SERIAL PRIMARY KEY,
      event_type_id      INTEGER NOT NULL,
      invitee_name       VARCHAR(255) NOT NULL,
      invitee_email      VARCHAR(255) NOT NULL,
      start_time         TIMESTAMP NOT NULL,
      end_time           TIMESTAMP NOT NULL,
      status             VARCHAR(20) NOT NULL DEFAULT 'confirmed'
                           CHECK (status IN ('confirmed', 'cancelled', 'rescheduled')),
      cancel_reason      TEXT,
      notes              TEXT,
      confirmation_token VARCHAR(64) NOT NULL UNIQUE,
      created_at         TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at         TIMESTAMP NOT NULL DEFAULT NOW(),
      CONSTRAINT fk_b_event_type FOREIGN KEY (event_type_id) REFERENCES event_types(id) ON DELETE CASCADE
    )
  `);
  await client.query(`CREATE INDEX IF NOT EXISTS idx_bookings_event_type_id ON bookings(event_type_id)`);
  await client.query(`CREATE INDEX IF NOT EXISTS idx_bookings_start_time    ON bookings(start_time)`);
  await client.query(`CREATE INDEX IF NOT EXISTS idx_bookings_status        ON bookings(status)`);
  await client.query(`CREATE INDEX IF NOT EXISTS idx_bookings_invitee_email ON bookings(invitee_email)`);
  await client.query(`
    CREATE OR REPLACE TRIGGER update_bookings_updated_at
      BEFORE UPDATE ON bookings
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS booking_questions (
      id             SERIAL PRIMARY KEY,
      event_type_id  INTEGER NOT NULL,
      question       TEXT NOT NULL,
      question_type  VARCHAR(20) NOT NULL DEFAULT 'text'
                       CHECK (question_type IN ('text', 'textarea', 'select')),
      is_required    SMALLINT NOT NULL DEFAULT 0,
      options        JSONB,
      position       INTEGER NOT NULL DEFAULT 0,
      created_at     TIMESTAMP NOT NULL DEFAULT NOW(),
      CONSTRAINT fk_bq_event_type FOREIGN KEY (event_type_id) REFERENCES event_types(id) ON DELETE CASCADE
    )
  `);
  await client.query(`CREATE INDEX IF NOT EXISTS idx_booking_questions_event_type_id ON booking_questions(event_type_id)`);

  await client.query(`
    CREATE TABLE IF NOT EXISTS booking_answers (
      id          SERIAL PRIMARY KEY,
      booking_id  INTEGER NOT NULL,
      question_id INTEGER NOT NULL,
      answer      TEXT,
      created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
      CONSTRAINT fk_ba_booking  FOREIGN KEY (booking_id)  REFERENCES bookings(id) ON DELETE CASCADE,
      CONSTRAINT fk_ba_question FOREIGN KEY (question_id) REFERENCES booking_questions(id) ON DELETE CASCADE
    )
  `);
  await client.query(`CREATE INDEX IF NOT EXISTS idx_booking_answers_booking_id ON booking_answers(booking_id)`);
}

function getNextWeekday(offsetDays, targetWeekday) {
  const d = DateTime.now().plus({ days: offsetDays }).setZone('America/New_York');
  let result = d;
  while (result.weekday % 7 !== targetWeekday) result = result.plus({ days: 1 });
  return result;
}

function getPastWeekday(offsetDays, targetWeekday) {
  const d = DateTime.now().minus({ days: offsetDays }).setZone('America/New_York');
  let result = d;
  while (result.weekday % 7 !== targetWeekday) result = result.minus({ days: 1 });
  return result;
}

async function seed(client) {
  const check = await client.query('SELECT id FROM users LIMIT 1');
  if (check.rows.length > 0) {
    console.log('Seed data already exists, skipping...');
    return;
  }

  const userRes = await client.query(
    `INSERT INTO users (name, email, timezone) VALUES ($1, $2, $3) RETURNING id`,
    ['Alex Johnson', 'alex@example.com', 'America/New_York']
  );
  const userId = userRes.rows[0].id;

  const schedRes = await client.query(
    `INSERT INTO availability_schedules (user_id, name, timezone, is_default) VALUES ($1, $2, $3, $4) RETURNING id`,
    [userId, 'Working Hours', 'America/New_York', 1]
  );
  const scheduleId = schedRes.rows[0].id;

  const rules = [
    [scheduleId, 0, 0, null, null],
    [scheduleId, 1, 1, '09:00:00', '17:00:00'],
    [scheduleId, 2, 1, '09:00:00', '17:00:00'],
    [scheduleId, 3, 1, '09:00:00', '17:00:00'],
    [scheduleId, 4, 1, '09:00:00', '17:00:00'],
    [scheduleId, 5, 1, '09:00:00', '17:00:00'],
    [scheduleId, 6, 0, null, null],
  ];
  for (const rule of rules) {
    await client.query(
      `INSERT INTO availability_rules (schedule_id, day_of_week, is_available, start_time, end_time) VALUES ($1, $2, $3, $4, $5)`,
      rule
    );
  }

  const etDefs = [
    [userId, '30 Minute Meeting', '30-min-meeting', 30, 'A quick 30-minute catch-up or discussion. Perfect for introductions, quick syncs, or focused conversations.', '#006BFF'],
    [userId, '60 Minute Meeting', '60-min-meeting', 60, 'An in-depth 60-minute session for detailed project discussions, strategic planning, or deep dives.', '#FF6B00'],
    [userId, 'Quick Chat',        'quick-chat',      15, 'A brief 15-minute check-in for a quick question or a fast update.',                                          '#00BFA5'],
  ];
  const etIds = [];
  for (const et of etDefs) {
    const etRes = await client.query(
      `INSERT INTO event_types (user_id, name, slug, duration, description, color) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      et
    );
    etIds.push(etRes.rows[0].id);
  }

  const toUTCSql = (dt) => dt.toUTC().toFormat("yyyy-MM-dd HH:mm:ss");
  const atHour   = (dt, h) => dt.set({ hour: h, minute: 0, second: 0, millisecond: 0 });
  const tok      = (n) => `seed-tok-${Date.now()}-${n}`;

  const upcoming1 = getNextWeekday(3, 2);
  const upcoming2 = getNextWeekday(10, 2);
  const past1     = getPastWeekday(4, 3);
  const past2     = getPastWeekday(11, 3);

  const bookings = [
    [etIds[0], 'John Smith',  'john.smith@example.com',  toUTCSql(atHour(upcoming1, 14)), toUTCSql(atHour(upcoming1, 14).plus({ minutes: 30 })), 'confirmed', 'Looking forward to our chat!',        tok(1)],
    [etIds[1], 'Jane Doe',    'jane.doe@example.com',    toUTCSql(atHour(upcoming2, 18)), toUTCSql(atHour(upcoming2, 18).plus({ minutes: 60 })), 'confirmed', 'Need to discuss Q3 roadmap.',          tok(2)],
    [etIds[2], 'Bob Wilson',  'bob.wilson@example.com',  toUTCSql(atHour(past1, 14)),     toUTCSql(atHour(past1, 14).plus({ minutes: 15 })),     'confirmed', '',                                    tok(3)],
    [etIds[0], 'Alice Brown', 'alice.brown@example.com', toUTCSql(atHour(past2, 19)),     toUTCSql(atHour(past2, 19).plus({ minutes: 30 })),     'confirmed', 'Great meeting, very productive!',     tok(4)],
  ];
  for (const b of bookings) {
    await client.query(
      `INSERT INTO bookings (event_type_id, invitee_name, invitee_email, start_time, end_time, status, notes, confirmation_token)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      b
    );
  }

  console.log('Seed data inserted successfully.');
}

async function run() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();

  try {
    console.log('Connected to PostgreSQL (Neon).');

    if (reset) {
      console.log('Dropping existing tables...');
      await dropTables(client);
      console.log('Tables dropped.');
    }

    console.log('Running schema migration...');
    await createSchema(client);
    console.log('Schema applied.');

    await seed(client);
    console.log('Migration complete.');
  } catch (err) {
    console.error('Migration failed:', err.message);
    console.error(err.stack);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
