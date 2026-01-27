/**
 * Database Configuration
 * Manages PostgreSQL connection pool for the KYC application
 */

const { Pool } = require('pg');
require('dotenv').config();

/**
 * PostgreSQL Connection Pool
 * Reuses connections for better performance
 */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Required for Neon DB
  },
  max: 5, // Reduced from 20 (Neon free tier has limits)
  idleTimeoutMillis: 30000, // Close idle connections after 30s
  connectionTimeoutMillis: 10000, // Increased from 2s to 10s for slow connections
});

/**
 * Test the database connection
 */
pool.on('connect', () => {
  console.log('✓ Database connection established');
});

pool.on('error', (err) => {
  console.error('✗ Unexpected error on idle client', err);
});

/**
 * Execute a SQL query and return full result
 */
const executeQuery = async (sql, params = []) => {
  const start = Date.now();
  try {
    const result = await pool.query(sql, params);
    const duration = Date.now() - start;
    console.log(`✓ Query executed in ${duration}ms`);
    return result;
  } catch (error) {
    console.error('❌ Database query error:', error.message);
    throw error;
  }
};

/**
 * Get a single row from database
 */
const queryOne = async (sql, params = []) => {
  const result = await executeQuery(sql, params);
  return result.rows[0];
};

/**
 * Get multiple rows from database
 */
const queryAll = async (sql, params = []) => {
  const result = await executeQuery(sql, params);
  return result.rows;
};

/**
 * Execute a transaction
 */
const transaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  pool,
  query: executeQuery,
  queryOne,
  queryAll,
  transaction,
};
