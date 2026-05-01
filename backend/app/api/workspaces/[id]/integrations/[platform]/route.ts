//  M.Theekshana Buddhika - 25021196
import { auth } from '@/lib/auth';
import { pool } from '@/lib/db';
import { NextResponse } from 'next/server';
import type { RowDataPacket } from 'mysql2';

type Params = { params: Promise<{ id: string; platform: string }> };

/**
 * DELETE /api/workspaces/[id]/integrations/[platform]
 * Deletes an integration record.
 */
export const DELETE = auth(async function DELETE(req, { params }: Params) {
  const session = (req as { auth?: { user?: { id: string } } }).auth;
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Note: The [platform] route param is used by the frontend to pass the integration ID
  // for deletion. The param name is 'platform' due to shared folder with /auth and /sync routes.
  const { id: workspaceId, platform: integrationId } = await params;

  // Verify membership (owner/admin)
  const [members] = await pool.execute<RowDataPacket[]>(
    "SELECT role FROM workspace_members WHERE workspace_id = ? AND user_id = ? AND role IN ('owner','admin')",
    [workspaceId, userId]
  );
  if (!members.length) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  await pool.execute(
    'DELETE FROM integrations WHERE id = ? AND workspace_id = ?',
    [integrationId, workspaceId]
  );

  return NextResponse.json({ success: true });
});
