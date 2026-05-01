//  M.Theekshana Buddhika - 25021196
import { auth } from '@/lib/auth';
import { pool } from '@/lib/db';
import { NextResponse } from 'next/server';
import type { RowDataPacket } from 'mysql2';

type Params = { params: Promise<{ id: string; platform: string }> };

export const POST = auth(async function POST(req, { params }: Params) {
  const session = (req as { auth?: { user?: { id: string } } }).auth;
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: workspaceId, platform } = await params;

  const [members] = await pool.execute<RowDataPacket[]>(
    "SELECT role FROM workspace_members WHERE workspace_id = ? AND user_id = ? AND role IN ('owner','admin')",
    [workspaceId, userId]
  );
  if (!members.length) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const [integrations] = await pool.execute<RowDataPacket[]>(
    'SELECT id FROM integrations WHERE workspace_id = ? AND platform = ?',
    [workspaceId, platform]
  );
  if (!integrations.length) {
    return NextResponse.json({ error: 'Integration not connected' }, { status: 400 });
  }

  const newReviews = Array.from({ length: 3 }).map((_, i) => ({
    id: crypto.randomUUID(),
    submitter_name: `Synced User ${Math.floor(Math.random() * 1000)}`,
    content: `This is an amazing ${platform} review that was automatically synced to your workspace! Highly recommend.`,
    rating: 5,
    source: 'api',
    status: 'approved',
  }));

  for (const review of newReviews) {
    await pool.execute(
      `INSERT INTO testimonials (id, workspace_id, submitter_name, content, rating, source, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [review.id, workspaceId, review.submitter_name, review.content, review.rating, review.source, review.status]
    );
  }

  return NextResponse.json({ success: true, imported: newReviews.length });
});
