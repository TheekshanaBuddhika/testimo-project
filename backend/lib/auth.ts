import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { pool } from '@/lib/db';
import type { RowDataPacket } from 'mysql2';

/**
 * lib/auth.ts
 * -----------
 * NextAuth.js v5 (Auth.js) configuration.
 * Uses JWT strategy with a DB user lookup/upsert on sign-in.
 *
 * On first sign-in with Google:
 *   - Creates a user row in `users`
 *   - Creates an account row in `accounts`
 *
 * The session JWT contains: { id, email, name, avatar }
 */

import { authConfig } from './auth.config';

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Google({
      clientId:     process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      if (account?.provider !== 'google') return false;

      const googleId         = account.providerAccountId;
      const email            = user.email!;
      const name             = user.name  ?? null;
      const avatar           = user.image ?? null;
      const accessToken      = account.access_token  ?? null;
      const refreshToken     = account.refresh_token ?? null;
      const expiresAt        = account.expires_at    ?? null;

      // Upsert user row
      await pool.execute(
        `INSERT INTO users (email, name, avatar_url, google_id)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           name       = VALUES(name),
           avatar_url = VALUES(avatar_url),
           google_id  = VALUES(google_id)`,
        [email, name, avatar, googleId]
      );

      // Fetch the canonical user id (could be existing or newly inserted)
      const [rows] = await pool.execute<RowDataPacket[]>(
        'SELECT id FROM users WHERE email = ?',
        [email]
      );
      const userId = rows[0]?.id as string;

      // Upsert OAuth account tokens
      await pool.execute(
        `INSERT INTO accounts
           (user_id, provider, provider_account_id, access_token, refresh_token, expires_at)
         VALUES (?, 'google', ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           access_token  = VALUES(access_token),
           refresh_token = VALUES(refresh_token),
           expires_at    = VALUES(expires_at)`,
        [userId, googleId, accessToken, refreshToken, expiresAt]
      );

      // Attach our DB id to the user object so jwt() can pick it up
      (user as { dbId?: string }).dbId = userId;
      return true;
    },
  },
});

// Augment the built-in Session / JWT types
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?:  string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}
