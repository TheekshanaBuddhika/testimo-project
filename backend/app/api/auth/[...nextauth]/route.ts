//  M.Theekshana Buddhika - 25021196
import { handlers } from '@/lib/auth';

/**
 * app/api/auth/[...nextauth]/route.ts
 * ------------------------------------
 * Mounts NextAuth.js v5 handlers on:
 *   GET  /api/auth/*  (e.g. /api/auth/session, /api/auth/providers)
 *   POST /api/auth/*  (e.g. /api/auth/signin, /api/auth/signout, /api/auth/callback/google)
 */
export const { GET, POST } = handlers;
