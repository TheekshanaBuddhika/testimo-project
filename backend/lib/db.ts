//  M.Theekshana Buddhika - 25021196
import mysql from 'mysql2/promise';

/**
 * lib/db.ts
 * ---------
 * Singleton MySQL2 connection pool.
 * Reads connection details from environment variables.
 *
 * Usage:
 *   import { pool } from '@/lib/db';
 *   const [rows] = await pool.execute('SELECT * FROM users WHERE id = ?', [id]);
 */

declare global {
  // Allows the pool to persist across Next.js hot-reloads in development
  // eslint-disable-next-line no-var
  var _mysqlPool: mysql.Pool | undefined;
}

import fs from 'fs';
import path from 'path';

function createPool(): mysql.Pool {
  let ssl: any = undefined;

  const localCaPath = path.join(process.cwd(), 'app', 'assets', 'ca.pem');

  // 1. Check if the ca.pem file exists in your assets folder
  if (fs.existsSync(localCaPath)) {
    ssl = {
      ca: fs.readFileSync(localCaPath),
      rejectUnauthorized: true,
    };
  }
  // 2. Or check for a custom path in env variables
  else if (process.env.DB_SSL_CA_PATH) {
    ssl = {
      ca: fs.readFileSync(process.env.DB_SSL_CA_PATH),
      rejectUnauthorized: true,
    };
  } 
  // For production (like Vercel) where you paste the certificate content into an env variable
  else if (process.env.DB_SSL_CA) {
    ssl = {
      ca: process.env.DB_SSL_CA,
      rejectUnauthorized: true,
    };
  }
  // Fallback: Aiven uses standard Let's Encrypt certificates which Node.js trusts out of the box.
  // We just need to tell mysql2 to require an SSL connection.
  else if ((process.env.DB_HOST || '').includes('aivencloud.com')) {
    ssl = {
      rejectUnauthorized: true,
    };
  }

  return mysql.createPool({
    host:     process.env.DB_HOST     || 'localhost',
    port:     parseInt(process.env.DB_PORT || '3306', 10),
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME     || 'testimo',
    waitForConnections: true,
    connectionLimit:    10,
    queueLimit:         0,
    charset:            'utf8mb4',
    ssl, // Inject the SSL options if they exist
  });
}

// In development, reuse the pool across hot-reloads to avoid exhausting connections.
// In production, always create a fresh pool per serverless function cold-start.
export const pool: mysql.Pool =
  process.env.NODE_ENV === 'production'
    ? createPool()
    : (global._mysqlPool ?? (global._mysqlPool = createPool()));
