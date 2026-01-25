// Generated: 2026-01-25 20:00:00 KST

import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';

// Enable NextAuth debug logging
console.log('[Auth] Initializing NextAuth with debug enabled');

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
        console.log('[Auth] authorize called with credentials:', {
          hasUsername: !!credentials?.username,
          hasPassword: !!credentials?.password,
          credentialsKeys: credentials ? Object.keys(credentials) : []
        });

        if (!credentials?.username || !credentials?.password) {
          console.log('[Auth] Missing credentials');
          return null;
        }

        try {
          console.log(`[Auth] Attempting login for: ${credentials.username}`);
          // Use database directly via DataSource
          const { getDataSource } = await import('@/lib/db');

          const ds = await getDataSource();
          if (!ds.isInitialized) {
            console.error('[Auth] Database not initialized');
            return null;
          }

          // Use raw SQL to query employee (avoids ORM metadata issues)
          const queryRunner = ds.createQueryRunner();
          try {
            const result = await queryRunner.query(
              `SELECT "id", "name", "username", "password_hash", "role", "department_id"
               FROM EMPLOYEE
               WHERE "username" = :username AND "deleted_at" IS NULL`,
              [credentials.username]
            );

            if (!result || result.length === 0) {
              console.log(`[Auth] Employee not found: ${credentials.username}`);
              return null;
            }

            const employee = result[0];
            console.log(`[Auth] Employee found: ${employee.username}`);

            const isValid = await bcrypt.compare(
              credentials.password,
              employee.password_hash
            );

            if (!isValid) {
              console.log(`[Auth] Invalid password for: ${credentials.username}`);
              return null;
            }

            console.log(`[Auth] Login successful: ${credentials.username}`);
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
          if (error instanceof Error) {
            console.error('[Auth] Error message:', error.message);
          }
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
