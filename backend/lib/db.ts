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

function createPool(): mysql.Pool {
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
  });
}

// In development, reuse the pool across hot-reloads to avoid exhausting connections.
// In production, always create a fresh pool per serverless function cold-start.
export const pool: mysql.Pool =
  process.env.NODE_ENV === 'production'
    ? createPool()
    : (global._mysqlPool ?? (global._mysqlPool = createPool()));
