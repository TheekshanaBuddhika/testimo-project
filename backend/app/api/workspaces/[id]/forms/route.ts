//  M.Theekshana Buddhika - 25021196
import { auth } from '@/lib/auth';
import { pool } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import type { RowDataPacket } from 'mysql2';

type Params = { params: Promise<{ id: string }> };

/**
 * GET /api/workspaces/[id]/forms
 * Lists all collection forms for a workspace.
 */
export const GET = auth(async function GET(req, { params }: Params) {
  const session = (req as { auth?: { user?: { id: string } } }).auth;
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: workspaceId } = await params;
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT f.id, f.title, f.description, f.questions, f.is_active, f.created_at,
            (SELECT COUNT(*) FROM testimonials t WHERE t.form_id = f.id) AS submission_count
     FROM collection_forms f
     JOIN workspace_members wm ON wm.workspace_id = f.workspace_id
     WHERE f.workspace_id = ? AND wm.user_id = ?
     ORDER BY f.created_at DESC`,
    [workspaceId, userId]
  );

  return NextResponse.json({ forms: rows });
});

const questionSchema = z.object({
  id:       z.string(),
  label:    z.string().min(1),
  type:     z.enum(['text', 'rating']),
  required: z.boolean().default(false),
});

const createFormSchema = z.object({
  title:       z.string().min(1).max(255),
  description: z.string().optional(),
  questions:   z.array(questionSchema).min(1),
});

/**
 * POST /api/workspaces/[id]/forms
 * Creates a new collection form for a workspace.
 */
export const POST = auth(async function POST(req: NextRequest, { params }: Params) {
  const session = (req as { auth?: { user?: { id: string } } }).auth;
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: workspaceId } = await params;

  // Verify membership
  const [members] = await pool.execute<RowDataPacket[]>(
    "SELECT role FROM workspace_members WHERE workspace_id = ? AND user_id = ? AND role IN ('owner','admin')",
    [workspaceId, userId]
  );
  if (!members.length) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const parsed = createFormSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const { title, description, questions } = parsed.data;
  const id = crypto.randomUUID();

  await pool.execute(
    'INSERT INTO collection_forms (id, workspace_id, title, description, questions) VALUES (?, ?, ?, ?, ?)',
    [id, workspaceId, title, description ?? null, JSON.stringify(questions)]
  );

  return NextResponse.json({ form: { id, title, description, questions, is_active: true, submission_count: 0 } }, { status: 201 });
});
