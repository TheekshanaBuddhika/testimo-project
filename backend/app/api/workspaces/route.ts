//  M.Theekshana Buddhika - 25021196
import { auth } from '@/lib/auth';
import { pool } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import type { RowDataPacket } from 'mysql2';

const createWorkspaceSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z
    .string()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens only'),
});

/**
 * GET /api/workspaces
 * Lists all workspaces owned by the authenticated user.
 */
export const GET = auth(async function GET(req) {
  const session = (req as { auth?: { user?: { id: string } } }).auth;
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT w.id, w.name, w.slug, w.logo_url, w.created_at,
            (SELECT COUNT(*) FROM testimonials t WHERE t.workspace_id = w.id) AS testimonial_count
     FROM workspaces w
     WHERE w.owner_id = ?
     ORDER BY w.created_at DESC`,
    [userId]
  );

  return NextResponse.json({ workspaces: rows });
});

/**
 * POST /api/workspaces
 * Creates a new workspace owned by the authenticated user.
 */
export const POST = auth(async function POST(req: NextRequest) {
  const session = (req as { auth?: { user?: { id: string } } }).auth;
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const parsed = createWorkspaceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const { name, slug } = parsed.data;
  const id = crypto.randomUUID();

  try {
    await pool.execute(
      'INSERT INTO workspaces (id, owner_id, name, slug) VALUES (?, ?, ?, ?)',
      [id, userId, name, slug]
    );
    // Also add owner as a member
    await pool.execute(
      "INSERT INTO workspace_members (workspace_id, user_id, role) VALUES (?, ?, 'owner')",
      [id, userId]
    );
  } catch (err: unknown) {
    if ((err as { code?: string }).code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ error: 'Slug is already taken' }, { status: 409 });
    }
    throw err;
  }

  return NextResponse.json({ workspace: { id, name, slug } }, { status: 201 });
});
