//  M.Theekshana Buddhika - 25021196
import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('STRIPE_SECRET_KEY is not set in environment variables.');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock', {
  apiVersion: '2025-01-27' as any, // Using latest stable
  typescript: true,
});
