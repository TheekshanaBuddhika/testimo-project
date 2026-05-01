import { auth } from '@/lib/auth';
import { pool } from '@/lib/db';
import { NextResponse } from 'next/server';
import type { RowDataPacket } from 'mysql2';

/**
 * GET /api/me
 * Returns the authenticated user's profile from the database.
 */
export const GET = auth(async function GET(req) {
  const session = (req as { auth?: { user?: { id: string } } }).auth;
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT id, email, name, avatar_url, created_at FROM users WHERE id = ?',
    [userId]
  );

  if (!rows.length) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({ user: rows[0] });
});
