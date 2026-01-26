// Generated: 2026-01-25 20:00:00 KST

import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  debug: false,
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: '아이디', type: 'text' },
        password: { label: '비밀번호', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        try {
          // Use database directly via DataSource
          const { getDataSource } = await import('@/lib/db');

          const ds = await getDataSource();
          if (!ds.isInitialized) {
            return null;
          }

          // Use raw SQL to query employee (avoids ORM metadata issues)
          const queryRunner = ds.createQueryRunner();
          try {
            const result = await queryRunner.query(
              `SELECT id, name, username, password_hash, role, department_id
               FROM EMPLOYEE
               WHERE username = :username AND deleted_at IS NULL`,
              [credentials.username]
            );

            if (!result || result.length === 0) {
              return null;
            }

            const employee = result[0];

            const isValid = await bcrypt.compare(
              credentials.password,
              employee.password_hash
            );

            if (!isValid) {
              return null;
            }

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
