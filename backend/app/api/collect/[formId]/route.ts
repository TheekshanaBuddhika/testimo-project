import { pool } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import type { RowDataPacket } from 'mysql2';

type Params = { params: Promise<{ formId: string }> };

const submitSchema = z.object({
  submitter_name:    z.string().min(1).max(255),
  submitter_email:   z.string().email().optional(),
  submitter_title:   z.string().max(255).optional(),
  submitter_company: z.string().max(255).optional(),
  content:           z.string().min(1),
  rating:            z.number().int().min(1).max(5).optional(),
});

/**
 * GET /api/collect/[formId]
 * PUBLIC — returns the form definition so the frontend can render it.
 */
export async function GET(_req: NextRequest, { params }: Params) {
  const { formId } = await params;

  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT f.id, f.title, f.description, f.questions,
            w.name AS workspace_name, w.logo_url AS workspace_logo
     FROM collection_forms f
     JOIN workspaces w ON w.id = f.workspace_id
     WHERE f.id = ? AND f.is_active = 1`,
    [formId]
  );

  if (!rows.length) {
    return NextResponse.json({ error: 'Form not found or inactive' }, { status: 404 });
  }

  return NextResponse.json({ form: rows[0] });
}

/**
 * POST /api/collect/[formId]
 * PUBLIC — accepts a testimonial submission from the collection form.
 * No authentication required.
 */
export async function POST(req: NextRequest, { params }: Params) {
  const { formId } = await params;

  // Verify form exists and is active, and get its workspace_id
  const [formRows] = await pool.execute<RowDataPacket[]>(
    'SELECT id, workspace_id FROM collection_forms WHERE id = ? AND is_active = 1',
    [formId]
  );

  if (!formRows.length) {
    return NextResponse.json({ error: 'Form not found or inactive' }, { status: 404 });
  }

  const workspaceId = formRows[0].workspace_id as string;

  const body = await req.json().catch(() => ({}));
  const parsed = submitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const d  = parsed.data;
  const id = crypto.randomUUID();

  await pool.execute(
    `INSERT INTO testimonials
       (id, workspace_id, form_id, submitter_name, submitter_email, submitter_title,
        submitter_company, content, rating, source, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'form', 'pending')`,
    [
      id, workspaceId, formId,
      d.submitter_name, d.submitter_email ?? null, d.submitter_title ?? null,
      d.submitter_company ?? null, d.content, d.rating ?? null,
    ]
  );

  return NextResponse.json(
    { message: 'Thank you! Your testimonial has been submitted for review.' },
    { status: 201 }
  );
}
