import { auth } from '@/lib/auth';
import { pool } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

type Params = { params: Promise<{ id: string; widgetId: string }> };

export const PATCH = auth(async function PATCH(req: NextRequest, { params }: Params) {
  const session = (req as { auth?: { user?: { id: string } } }).auth;
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: workspaceId, widgetId } = await params;
  const body = await req.json();
  const { name, config } = body;

  const sets: string[] = [];
  const values: any[] = [];

  if (name) { sets.push('name = ?'); values.push(name); }
  if (config) { sets.push('config = ?'); values.push(JSON.stringify(config)); }

  if (sets.length === 0) return NextResponse.json({ error: 'No fields to update' }, { status: 400 });

  values.push(widgetId, workspaceId);
  await pool.execute(
    `UPDATE widgets SET ${sets.join(', ')} WHERE id = ? AND workspace_id = ?`,
    values
  );

  return NextResponse.json({ success: true });
});

export const DELETE = auth(async function DELETE(req: NextRequest, { params }: Params) {
  const session = (req as { auth?: { user?: { id: string } } }).auth;
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: workspaceId, widgetId } = await params;

  await pool.execute(
    'DELETE FROM widgets WHERE id = ? AND workspace_id = ?',
    [widgetId, workspaceId]
  );

  return NextResponse.json({ success: true });
});
