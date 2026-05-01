//  M.Theekshana Buddhika - 25021196
import { pool } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import type { RowDataPacket } from 'mysql2';

type Params = { params: Promise<{ id: string }> };

/**
 * GET /api/workspaces/[id]/widget
 * Public route. Returns a list of approved, featured testimonials for a workspace.
 */
export async function GET(req: NextRequest, { params }: Params) {
  const { id: workspaceId } = await params;

  // Set broad CORS so any website can fetch the widget data or iframe it
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };

  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
         id, submitter_name, submitter_title, submitter_company, submitter_avatar, 
         content, rating, submitted_at
       FROM testimonials
       WHERE workspace_id = ? AND status = 'approved' AND is_featured = TRUE
       ORDER BY submitted_at DESC`,
      [workspaceId]
    );

    return NextResponse.json({ testimonials: rows }, { headers });
  } catch (error) {
    console.error('Widget error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers });
  }
}
