import { auth } from '@/lib/auth';
import { stripe } from '@/lib/stripe';
import { pool } from '@/lib/db';
import { NextResponse } from 'next/server';
import type { RowDataPacket } from 'mysql2';

/**
 * POST /api/billing/checkout
 * Generates a Stripe Checkout Session for a workspace.
 */
export const POST = auth(async function POST(req) {
  const session = (req as any).auth;
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { workspaceId, priceId } = await req.json();

  // Verify ownership
  const [workspaces] = await pool.execute<RowDataPacket[]>(
    'SELECT id, owner_id, stripe_customer_id FROM workspaces WHERE id = ? AND owner_id = ?',
    [workspaceId, userId]
  );
  if (!workspaces.length) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const workspace = workspaces[0];
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  try {
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: workspace.stripe_customer_id || undefined,
      customer_email: workspace.stripe_customer_id ? undefined : session.user.email,
      line_items: [
        {
          price: priceId || process.env.STRIPE_PRO_PRICE_ID, // Use env or provided price
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${frontendUrl}/workspaces/${workspaceId}?payment=success`,
      cancel_url: `${frontendUrl}/workspaces/${workspaceId}?payment=cancel`,
      metadata: {
        workspaceId,
        userId,
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error: any) {
    console.error('Stripe error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});
