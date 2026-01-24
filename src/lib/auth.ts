// Generated: 2026-01-24 21:30:00 KST

import type { NextAuthOptions } from 'next-auth';

/**
 * NextAuth 설정 (Phase 1 Auth 모듈에서 완성)
 */
export const authOptions: NextAuthOptions = {
  providers: [],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role || 'USER';
        (session.user as any).department = token.department;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.department = (user as any).department;
      }
      return token;
    },
  },
};
