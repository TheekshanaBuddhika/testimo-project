import { auth } from '@/lib/auth';
import { pool } from '@/lib/db';
import { NextResponse } from 'next/server';

type Params = { params: Promise<{ id: string; platform: string }> };

export const GET = auth(async function GET(req, { params }: Params) {
  const session = (req as { auth?: { user?: { id: string } } }).auth;
  const userId = session?.user?.id;
  if (!userId) return NextResponse.redirect(new URL('/login', req.url));

  const { id: workspaceId, platform } = await params;
  
  if (!['google', 'facebook', 'instagram'].includes(platform)) {
    return NextResponse.json({ error: 'Unsupported platform' }, { status: 400 });
  }

  const fakeAccountId = Math.floor(Math.random() * 1000000000).toString();
  const fakeAccountName = `Mock ${platform.charAt(0).toUpperCase() + platform.slice(1)} Page`;
  const fakeAccessToken = `mock_token_${crypto.randomUUID()}`;

  try {
    await pool.execute(
      `INSERT INTO integrations (workspace_id, platform, access_token, external_account_id, external_account_name)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         access_token = VALUES(access_token),
         external_account_id = VALUES(external_account_id),
         external_account_name = VALUES(external_account_name)`,
      [workspaceId, platform, fakeAccessToken, fakeAccountId, fakeAccountName]
    );

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    return NextResponse.redirect(`${frontendUrl}/workspaces/${workspaceId}/integrations`);
  } catch (error) {
    console.error('Failed to mock integration:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
});
