//  M.Theekshana Buddhika - 25021196
import type { NextAuthConfig } from 'next-auth';

/**
 * lib/auth.config.ts
 * ------------------
 * This file contains NextAuth configuration that is Edge-compatible.
 * It is imported by both middleware.ts (which runs on the Edge) and auth.ts (which runs in Node).
 * DB adapters and Node.js specific modules MUST NOT be imported here.
 */

export const authConfig = {
  providers: [], // Providers are added in auth.ts since they might require Node.js APIs
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, user }) {
      // On first sign-in `user` is populated; attach our DB id to the token
      if (user && (user as { dbId?: string }).dbId) {
        token.id = (user as { dbId?: string }).dbId;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
