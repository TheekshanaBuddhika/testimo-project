//  M.Theekshana Buddhika - 25021196
import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { z } from 'zod';
import { auth } from '@/lib/auth';

const importSchema = z.object({
  testimonials: z.array(z.object({
    submitter_name:    z.string().min(1),
    submitter_email:   z.string().email().optional().or(z.literal('')),
    submitter_title:   z.string().optional().or(z.literal('')),
    submitter_company: z.string().optional().or(z.literal('')),
    content:           z.string().min(1),
    rating:            z.coerce.number().min(1).max(5).optional(),
  })).min(1).max(500), // Max 500 at a time to prevent payload/DB overload
});

export const POST = auth(async (req, { params }) => {
  if (!req.auth?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: workspaceId } = await params;

  try {
    const body = await req.json();
    const parsed = importSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid data', details: parsed.error.format() }, { status: 400 });
    }

    // Verify workspace ownership
    const [wsRows] = await pool.execute<any[]>(
      'SELECT id FROM workspaces WHERE id = ? AND owner_id = ?',
      [workspaceId, req.auth.user.id]
    );

    if (wsRows.length === 0) {
      return NextResponse.json({ error: 'Workspace not found or unauthorized' }, { status: 404 });
    }

    const testimonials = parsed.data.testimonials;
    
    // Generate UUIDs in Node for consistency and MySQL 5.7 compatibility
    const values = testimonials.map(t => [
      crypto.randomUUID(),
      workspaceId,
      t.submitter_name,
      t.submitter_email || null,
      t.submitter_title || null,
      t.submitter_company || null,
      t.content,
      t.rating || null,
      'csv_import',
      'approved', // Auto-approve imported testimonials
    ]);

    await pool.query(
      `INSERT INTO testimonials 
        (id, workspace_id, submitter_name, submitter_email, submitter_title, submitter_company, content, rating, source, status) 
       VALUES ?`,
      [values]
    );

    return NextResponse.json({ 
      success: true, 
      count: testimonials.length,
      message: `Successfully imported ${testimonials.length} testimonials.`
    });
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
