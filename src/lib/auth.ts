// Generated: 2026-01-25 01:00:00 KST

import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { getDataSource } from '@/lib/db';
import { Employee } from '@/entities/Employee';
import { IsNull } from 'typeorm';

export const authOptions: NextAuthOptions = {
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
          const ds = await getDataSource();
          const repo = ds.getRepository(Employee);
          const employee = await repo.findOne({
            where: {
              username: credentials.username,
              deleted_at: IsNull(),
            },
          });

          if (!employee) return null;

          const isValid = await bcrypt.compare(
            credentials.password,
            employee.password_hash
          );
          if (!isValid) return null;

          return {
            id: String(employee.id),
            name: employee.name,
            role: employee.role,
            department: employee.department_id,
          };
        } catch (error) {
          console.error('[AUTH] authorize error:', error);
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
