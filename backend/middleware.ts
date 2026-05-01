import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth.config';
import { NextRequest, NextResponse } from 'next/server';

const { auth } = NextAuth(authConfig);

const ALLOWED_ORIGINS = [
  'http://localhost:5174',                   // Vite dev server (port 5174)
  'http://localhost:5173',                   // Vite dev server (fallback)
  process.env.FRONTEND_URL ?? '',            // set in Vercel env
].filter(Boolean);

function setCorsHeaders(res: NextResponse, origin: string | null) {
  const allow = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  res.headers.set('Access-Control-Allow-Origin',      allow);
  res.headers.set('Access-Control-Allow-Credentials', 'true');
  res.headers.set('Access-Control-Allow-Methods',     'GET,POST,PATCH,DELETE,OPTIONS');
  res.headers.set('Access-Control-Allow-Headers',     'Content-Type, Authorization');
  return res;
}

export default auth(async function middleware(req: NextRequest) {
  const origin = req.headers.get('origin');

  // Handle pre-flight CORS requests
  if (req.method === 'OPTIONS') {
    return setCorsHeaders(new NextResponse(null, { status: 204 }), origin);
  }

  const path = req.nextUrl.pathname;
  const isAuthRoute    = path.startsWith('/api/auth');
  const isPublicCollect = path.startsWith('/api/collect'); // public form submissions
  const isPublicWidget  = path.match(/^\/api\/workspaces\/[^\/]+\/widget$/); // public embed widget
  const isStripeWebhook = path === '/api/webhooks/stripe';

  if (!isAuthRoute && !isPublicCollect && !isPublicWidget && !isStripeWebhook) {
    const session = (req as { auth?: { user?: { id: string } } }).auth;
    if (!session?.user?.id) {
      return setCorsHeaders(
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
        origin
      );
    }
  }

  const res = NextResponse.next();
  return setCorsHeaders(res, origin);
});

export const config = {
  matcher: ['/api/:path*'],
};
