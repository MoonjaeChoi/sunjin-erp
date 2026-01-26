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
        console.log('[Auth] authorize() called with username:', credentials?.username);
        if (!credentials?.username || !credentials?.password) {
          console.log('[Auth] Missing credentials');
          return null;
        }

        try {
          console.log('[Auth] Attempting direct oracledb connection...');
          // Use oracledb directly to bypass TypeORM DataSource initialization issues
          // @ts-ignore - oracledb doesn't have type definitions
          const oracledb = await import('oracledb');

          let connection: any;
          try {
            connection = await oracledb.getConnection({
              user: process.env.ORACLE_USERNAME || 'sunjin_admin',
              password: process.env.ORACLE_PASSWORD || '',
              connectionString: `${process.env.ORACLE_HOST || 'localhost'}:${process.env.ORACLE_PORT || 1521}/${process.env.ORACLE_SERVICE_NAME || 'XEPDB1'}`,
            });

            const result = await connection.execute(
              `SELECT "id", "name", "username", "password_hash", "role", "department_id"
               FROM EMPLOYEE
               WHERE "username" = :username AND "deleted_at" IS NULL`,
              { username: credentials.username }
            );

            if (!result.rows || result.rows.length === 0) {
              return null;
            }

            const [id, name, username_col, password_hash, role, department_id] = result.rows[0];

            const isValid = await bcrypt.compare(
              credentials.password,
              password_hash
            );

            if (!isValid) {
              return null;
            }

            return {
              id: String(id),
              name: name,
              role: role,
              department: department_id,
            };
          } finally {
            if (connection) {
              try {
                await connection.close();
              } catch (err) {
                // Ignore close errors
              }
            }
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
