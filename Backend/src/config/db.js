const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client:', err.message);
});

// Convert MySQL-style ? placeholders to PostgreSQL $1, $2, ...
function convertPlaceholders(sql) {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
}

// Returns [rows, pgResult] — compatible with mysql2-style destructuring
async function query(sql, params = []) {
  const result = await pool.query(convertPlaceholders(sql), params);
  return [result.rows, result];
}

// Returns a client with mysql2-compatible transaction API
async function getConnection() {
  const client = await pool.connect();
  return {
    query: async (sql, params = []) => {
      const result = await client.query(convertPlaceholders(sql), params);
      return [result.rows, result];
    },
    beginTransaction: () => client.query('BEGIN'),
    commit: () => client.query('COMMIT'),
    rollback: () => client.query('ROLLBACK'),
    release: () => client.release(),
  };
}

module.exports = { query, getConnection, pool };
