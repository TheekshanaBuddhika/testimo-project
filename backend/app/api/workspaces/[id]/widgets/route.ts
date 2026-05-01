import { auth } from '@/lib/auth';
import { pool } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import type { RowDataPacket } from 'mysql2';

type Params = { params: Promise<{ id: string }> };

async function assertMember(userId: string, workspaceId: string): Promise<boolean> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT workspace_id FROM workspace_members WHERE workspace_id = ? AND user_id = ?',
    [workspaceId, userId]
  );
  return rows.length > 0;
}

export const GET = auth(async function GET(req: NextRequest, { params }: Params) {
  const session = (req as { auth?: { user?: { id: string } } }).auth;
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: workspaceId } = await params;

  if (!(await assertMember(userId, workspaceId)))
    return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT id, name, config, created_at FROM widgets WHERE workspace_id = ? ORDER BY created_at DESC',
    [workspaceId]
  );

  return NextResponse.json({ widgets: rows });
});

export const POST = auth(async function POST(req: NextRequest, { params }: Params) {
  const session = (req as { auth?: { user?: { id: string } } }).auth;
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: workspaceId } = await params;

  if (!(await assertMember(userId, workspaceId)))
    return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json();
  const { name, config } = body;

  const id = crypto.randomUUID();
  await pool.execute(
    'INSERT INTO widgets (id, workspace_id, name, config) VALUES (?, ?, ?, ?)',
    [id, workspaceId, name, JSON.stringify(config)]
  );

  return NextResponse.json({ widget: { id, name, config } }, { status: 201 });
});
