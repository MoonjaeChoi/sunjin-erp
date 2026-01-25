// Generated: 2026-01-24 21:25:00 KST

import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // 인증된 사용자가 /login 접근 시 → /dashboard 리다이렉트
    if (pathname === '/login' && token) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // /login 경로는 미인증 허용
        if (pathname === '/login') return true;

        // API 경로 중 auth, public 관련은 미인증 허용
        if (pathname.startsWith('/api/auth')) return true;
        if (pathname.startsWith('/api/public')) return true;

        // 그 외 모든 경로는 인증 필요
        return !!token;
      },
    },
    pages: {
      signIn: '/login',
    },
  }
);

export const config = {
  matcher: [
    // 루트 경로
    '/',
    // (main) 그룹 경로들
    '/dashboard/:path*',
    '/tasks/:path*',
    '/support/:path*',
    '/projects/:path*',
    '/issues/:path*',
    '/inventory/:path*',
    '/maintenance/:path*',
    '/customers/:path*',
    '/employees/:path*',
    '/notices/:path*',
    // 로그인 페이지 (인증 사용자 리다이렉트용)
    '/login',
    // API 경로 (auth 제외)
    '/api/:path*',
  ],
};
