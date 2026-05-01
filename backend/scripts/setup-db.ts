import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { loadEnvConfig } from '@next/env';

// Load .env.local manually since we are running outside of Next.js
loadEnvConfig(process.cwd());

/**
 * setup-db.ts
 * -----------
 * Run with: npm run setup
 *
 * 1. Connects to MySQL WITHOUT selecting a database.
 * 2. Creates the `testimo` database if it doesn't exist.
 * 3. Executes the full schema.sql (all statements are IF NOT EXISTS).
 */

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = parseInt(process.env.DB_PORT || '3306', 10);
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'testimo';

async function setup() {
  console.log('🔧 Testimo DB Setup');
  console.log(`   Host     : ${DB_HOST}:${DB_PORT}`);
  console.log(`   User     : ${DB_USER}`);
  console.log(`   Database : ${DB_NAME}`);
  console.log('');

  // Connect without specifying a database
  const conn = await mysql.createConnection({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    multipleStatements: true,
  });

  try {
    // Step 1: create the database
    await conn.execute(
      `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`
       CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    console.log(`✅ Database "${DB_NAME}" is ready.`);

    // Step 2: load and execute schema.sql
    const schemaPath = path.resolve(__dirname, '../../database/schema.sql');
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`schema.sql not found at: ${schemaPath}`);
    }

    const schema = fs.readFileSync(schemaPath, 'utf8');
    await conn.query(schema);
    console.log('✅ Schema applied successfully.');
    console.log('');
    console.log('🎉 Database setup complete!');
  } finally {
    await conn.end();
  }
}

setup().catch((err) => {
  console.error('❌ Setup failed:', err.message);
  process.exit(1);
});
