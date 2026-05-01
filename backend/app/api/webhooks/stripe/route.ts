//  M.Theekshana Buddhika - 25021196
import { stripe } from '@/lib/stripe';
import { pool } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/webhooks/stripe
 * Listens for Stripe events to sync subscription status.
 */
export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature') as string;

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ error: 'Webhook Error' }, { status: 400 });
  }

  const session = event.data.object as any;

  switch (event.type) {
    case 'checkout.session.completed':
      const workspaceId = session.metadata?.workspaceId;
      const customerId = session.customer;
      if (workspaceId) {
        await pool.execute(
          'UPDATE workspaces SET stripe_customer_id = ?, subscription_status = ? WHERE id = ?',
          [customerId, 'pro', workspaceId]
        );
      }
      break;

    case 'customer.subscription.deleted':
      const customerIdDel = session.customer;
      await pool.execute(
        'UPDATE workspaces SET subscription_status = ? WHERE stripe_customer_id = ?',
        ['canceled', customerIdDel]
      );
      break;

    // Handle other events like invoice.paid, invoice.payment_failed, etc.
  }

  return NextResponse.json({ received: true });
}
