//  M.Theekshana Buddhika - 25021196
import { auth } from '@/lib/auth';
import { pool } from '@/lib/db';
import { NextResponse } from 'next/server';
import type { RowDataPacket } from 'mysql2';

type Params = { params: Promise<{ id: string }> };

/**
 * GET /api/workspaces/[id]/integrations
 * Lists all connected integrations for a workspace.
 */
export const GET = auth(async function GET(req, { params }: Params) {
  const session = (req as { auth?: { user?: { id: string } } }).auth;
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: workspaceId } = await params;

  // Verify membership
  const [members] = await pool.execute<RowDataPacket[]>(
    'SELECT workspace_id FROM workspace_members WHERE workspace_id = ? AND user_id = ?',
    [workspaceId, userId]
  );
  if (!members.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT id, platform, external_account_id, external_account_name, created_at FROM integrations WHERE workspace_id = ?',
    [workspaceId]
  );

  return NextResponse.json({ integrations: rows });
});
