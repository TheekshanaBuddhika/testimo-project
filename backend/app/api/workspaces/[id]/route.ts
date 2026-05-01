//  M.Theekshana Buddhika - 25021196
import { auth } from '@/lib/auth';
import { pool } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import type { RowDataPacket } from 'mysql2';

type Params = { params: Promise<{ id: string }> };

async function assertOwner(userId: string, workspaceId: string): Promise<boolean> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT id FROM workspaces WHERE id = ? AND owner_id = ?',
    [workspaceId, userId]
  );
  return rows.length > 0;
}

/**
 * GET /api/workspaces/[id]
 */
export const GET = auth(async function GET(req, { params }: Params) {
  const session = (req as { auth?: { user?: { id: string } } }).auth;
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT id, name, slug, logo_url, created_at FROM workspaces WHERE id = ? AND owner_id = ?',
    [id, userId]
  );
  if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({ workspace: rows[0] });
});

const patchSchema = z.object({
  name:     z.string().min(1).max(255).optional(),
  logo_url: z.string().url().nullable().optional(),
});

/**
 * PATCH /api/workspaces/[id]
 */
export const PATCH = auth(async function PATCH(req: NextRequest, { params }: Params) {
  const session = (req as { auth?: { user?: { id: string } } }).auth;
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  if (!(await assertOwner(userId, id)))
    return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const updates = parsed.data;
  if (!Object.keys(updates).length)
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });

  // Explicit allowlist to prevent SQL injection from dynamic field names
  const ALLOWED_FIELDS = ['name', 'logo_url'] as const;
  const sets: string[] = [];
  const values: (string | null)[] = [];

  for (const field of ALLOWED_FIELDS) {
    if (field in updates) {
      sets.push(`\`${field}\` = ?`);
      values.push(updates[field as keyof typeof updates] ?? null);
    }
  }

  if (!sets.length)
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });

  values.push(id);
  await pool.execute(`UPDATE workspaces SET ${sets.join(', ')} WHERE id = ?`, values);

  return NextResponse.json({ success: true });
});

/**
 * DELETE /api/workspaces/[id]
 */
export const DELETE = auth(async function DELETE(req, { params }: Params) {
  const session = (req as { auth?: { user?: { id: string } } }).auth;
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  if (!(await assertOwner(userId, id)))
    return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await pool.execute('DELETE FROM workspaces WHERE id = ?', [id]);
  return NextResponse.json({ success: true });
});
