// Generated: 2026-01-25 20:00:00 KST

import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  debug: true,
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: '아이디', type: 'text' },
        password: { label: '비밀번호', type: 'password' },
      },
      async authorize(credentials) {
        console.log('[Auth] Login attempt:', { username: credentials?.username });

        if (!credentials?.username || !credentials?.password) {
          console.log('[Auth] Missing credentials');
          return null;
        }

        try {
          // Use database directly via DataSource
          const { getDataSource } = await import('@/lib/db');

          const ds = await getDataSource();
          if (!ds.isInitialized) {
            console.log('[Auth] DataSource not initialized');
            return null;
          }

          // Use raw SQL to query employee (avoids ORM metadata issues)
          const queryRunner = ds.createQueryRunner();
          try {
            const result = await queryRunner.query(
              `SELECT "id", "name", "username", "password_hash", "role", "department_id"
               FROM EMPLOYEE
               WHERE "username" = :username AND "deleted_at" IS NULL`,
              { username: credentials.username }
            );

            console.log('[Auth] Query result:', { found: result?.length > 0 });

            if (!result || result.length === 0) {
              console.log('[Auth] Employee not found:', credentials.username);
              return null;
            }

            const employee = result[0];
            console.log('[Auth] Employee found:', {
              id: employee.id,
              username: employee.username,
              hasHash: !!employee.password_hash,
            });

            const isValid = await bcrypt.compare(
              credentials.password,
              employee.password_hash
            );

            console.log('[Auth] Password valid:', isValid);

            if (!isValid) {
              console.log('[Auth] Invalid password');
              return null;
            }

            console.log('[Auth] Authorization successful');
            return {
              id: String(employee.id),
              name: employee.name,
              role: employee.role,
              department: employee.department_id,
            };
          } finally {
            await queryRunner.release();
          }
        } catch (error) {
          console.error('[Auth] Error during authorization:', error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = Number(user.id);
        token.role = (user as any).role;
        token.department = (user as any).department;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role || 'USER';
        (session.user as any).department = token.department;
      }
      return session;
    },
  },
};
