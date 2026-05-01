import { auth } from '@/lib/auth';
import { pool } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import type { RowDataPacket } from 'mysql2';

type Params = { params: Promise<{ id: string }> };

async function assertMember(userId: string, workspaceId: string): Promise<boolean> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT workspace_id FROM workspace_members WHERE workspace_id = ? AND user_id = ?',
    [workspaceId, userId]
  );
  return rows.length > 0;
}

/**
 * GET /api/workspaces/[id]/testimonials
 * Lists testimonials for a workspace with optional filters.
 * Query params: status, source, featured, page, limit
 */
export const GET = auth(async function GET(req: NextRequest, { params }: Params) {
  const session = (req as { auth?: { user?: { id: string } } }).auth;
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: workspaceId } = await params;
  if (!(await assertMember(userId, workspaceId)))
    return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { searchParams } = req.nextUrl;
  const status   = searchParams.get('status');    // 'pending'|'approved'|'rejected'
  const featured = searchParams.get('featured');   // 'true'
  const page     = Math.max(1, parseInt(searchParams.get('page')  ?? '1',  10));
  const limit    = Math.min(100, parseInt(searchParams.get('limit') ?? '20', 10));
  const offset   = (page - 1) * limit;

  const conditions: string[] = ['workspace_id = ?'];
  const values: unknown[]    = [workspaceId];

  if (status)   { conditions.push('status = ?');      values.push(status); }
  if (featured === 'true') { conditions.push('is_featured = 1'); }

  const where = conditions.join(' AND ');

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, submitter_name, submitter_email, submitter_title,
            submitter_company, submitter_avatar, content, rating,
            source, status, is_featured, tags, submitted_at, approved_at
     FROM testimonials
     WHERE ${where}
     ORDER BY submitted_at DESC
     LIMIT ? OFFSET ?`,
    [...values, limit, offset]
  );

  const [[{ total }]] = await pool.execute<RowDataPacket[]>(
    `SELECT COUNT(*) AS total FROM testimonials WHERE ${where}`,
    values
  );

  return NextResponse.json({ testimonials: rows, total, page, limit });
});

const createTestimonialSchema = z.object({
  submitter_name:    z.string().min(1).max(255),
  submitter_email:   z.string().email().optional(),
  submitter_title:   z.string().max(255).optional(),
  submitter_company: z.string().max(255).optional(),
  submitter_avatar:  z.string().url().optional(),
  content:           z.string().min(1),
  rating:            z.number().int().min(1).max(5).optional(),
  source:            z.enum(['manual', 'csv_import', 'api']).default('manual'),
  tags:              z.array(z.string()).optional(),
});

/**
 * POST /api/workspaces/[id]/testimonials
 * Manually adds a testimonial to a workspace.
 */
export const POST = auth(async function POST(req: NextRequest, { params }: Params) {
  const session = (req as { auth?: { user?: { id: string } } }).auth;
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: workspaceId } = await params;
  if (!(await assertMember(userId, workspaceId)))
    return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const parsed = createTestimonialSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const d  = parsed.data;
  const id = crypto.randomUUID();

  await pool.execute(
    `INSERT INTO testimonials
       (id, workspace_id, submitter_name, submitter_email, submitter_title,
        submitter_company, submitter_avatar, content, rating, source, tags)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id, workspaceId,
      d.submitter_name, d.submitter_email ?? null, d.submitter_title ?? null,
      d.submitter_company ?? null, d.submitter_avatar ?? null,
      d.content, d.rating ?? null, d.source,
      d.tags ? JSON.stringify(d.tags) : null,
    ]
  );

  return NextResponse.json({ testimonial: { id, ...d } }, { status: 201 });
});
