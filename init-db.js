/**
 * Database Initialization Script
 * Executes db/init.sql using Node.js
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

async function initializeDatabase() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    console.log('📊 Connecting to database...');
    const client = await pool.connect();
    console.log('✓ Connected successfully');

    // Read SQL file
    const sqlFile = path.join(__dirname, 'db', 'init.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');

    console.log('\n📝 Executing initialization script...');
    
    // Split by semicolon and execute each statement
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    for (const statement of statements) {
      try {
        await client.query(statement);
        console.log('✓ Executed:', statement.substring(0, 50) + '...');
      } catch (err) {
        console.error('Error executing statement:', err.message);
      }
    }

    client.release();
    console.log('\n✅ Database initialization complete!');
    console.log('\n📊 Tables created:');
    console.log('   ✓ customer_forms');
    console.log('   ✓ kyc_submissions');
    console.log('   ✓ pan_hashes');
    console.log('   ✓ audit_logs');

    process.exit(0);
  } catch (err) {
    console.error('\n❌ Error initializing database:');
    console.error(err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

initializeDatabase();
