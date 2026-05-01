//  M.Theekshana Buddhika - 25021196
import { auth } from '@/lib/auth';
import { pool } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import type { RowDataPacket } from 'mysql2';

type Params = { params: Promise<{ id: string; tid: string }> };

async function assertAccess(userId: string, workspaceId: string, tid: string) {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT t.id FROM testimonials t
     JOIN workspace_members wm ON wm.workspace_id = t.workspace_id
     WHERE t.id = ? AND t.workspace_id = ? AND wm.user_id = ?`,
    [tid, workspaceId, userId]
  );
  return rows.length > 0;
}

const patchSchema = z.object({
  status:     z.enum(['pending', 'approved', 'rejected']).optional(),
  is_featured: z.boolean().optional(),
  tags:        z.array(z.string()).optional(),
});

/**
 * PATCH /api/workspaces/[id]/testimonials/[tid]
 * Update status, featured flag, or tags.
 */
export const PATCH = auth(async function PATCH(req: NextRequest, { params }: Params) {
  const session = (req as { auth?: { user?: { id: string } } }).auth;
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: workspaceId, tid } = await params;
  if (!(await assertAccess(userId, workspaceId, tid)))
    return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const { status, is_featured, tags } = parsed.data;
  const sets:   string[]  = [];
  const values: unknown[] = [];

  if (status !== undefined) {
    sets.push('status = ?');
    values.push(status);
    if (status === 'approved') {
      sets.push('approved_at = NOW()');
    }
  }
  if (is_featured !== undefined) { sets.push('is_featured = ?'); values.push(is_featured ? 1 : 0); }
  if (tags !== undefined)        { sets.push('tags = ?');        values.push(JSON.stringify(tags)); }

  if (!sets.length) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });

  values.push(tid);
  await pool.execute(`UPDATE testimonials SET ${sets.join(', ')} WHERE id = ?`, values);

  return NextResponse.json({ success: true });
});

/**
 * DELETE /api/workspaces/[id]/testimonials/[tid]
 */
export const DELETE = auth(async function DELETE(req, { params }: Params) {
  const session = (req as { auth?: { user?: { id: string } } }).auth;
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: workspaceId, tid } = await params;
  if (!(await assertAccess(userId, workspaceId, tid)))
    return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await pool.execute('DELETE FROM testimonials WHERE id = ?', [tid]);
  return NextResponse.json({ success: true });
});
