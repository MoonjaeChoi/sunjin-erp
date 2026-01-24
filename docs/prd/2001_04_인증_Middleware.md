<!-- Generated: 2026-01-24 21:00:00 KST -->

# 인증 Middleware

**문서 번호**: 2001_04
**원본 PRD**: 2001_전체_레이아웃_설정_prd_v2.md
**PRD 참조**: 원본 PRD의 'Section 5.1 Middleware, Section 8 Security' 참조
**구현 범위**: NextAuth 기반 인증 미들웨어 (경로 보호 + 리다이렉트)
**복잡도**: S
**의존성**: 2001_03 (NextAuth 설정)

---

## 구현 목표

NextAuth.js middleware를 사용하여 인증되지 않은 사용자의 `(main)` 경로 접근을 차단하고, 인증된 사용자의 로그인 페이지 접근을 대시보드로 리다이렉트한다.

---

## 구현 내용

### 파일 구조

```
src/
└── middleware.ts                   # NextAuth 인증 미들웨어
```

### 구현 상세

**`src/middleware.ts`**

```typescript
// Generated: YYYY-MM-DD HH:MM:SS KST

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

        // API 경로 중 auth 관련은 미인증 허용
        if (pathname.startsWith('/api/auth')) return true;

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
```

### 핵심 동작

| 상태 | 경로 | 결과 |
|------|------|------|
| 미인증 | `/dashboard` | → `/login` 리다이렉트 |
| 미인증 | `/login` | → 정상 접근 |
| 인증됨 | `/login` | → `/dashboard` 리다이렉트 |
| 인증됨 | `/dashboard` | → 정상 접근 |
| 미인증 | `/api/auth/*` | → 정상 접근 (NextAuth 엔드포인트) |
| 미인증 | `/api/customers` | → 401 응답 |

---

## Acceptance Criteria

- [ ] 미인증 사용자가 `(main)` 경로 접근 시 `/login`으로 리다이렉트
- [ ] 인증된 사용자가 `/login` 접근 시 `/dashboard`로 리다이렉트
- [ ] `/api/auth/*` 경로는 미인증 허용
- [ ] matcher에 모든 모듈 경로 포함
- [ ] `npm run build` 성공

---

## 테스트 전략

### TypeScript & Lint

```bash
npm run build
npm run type-check
npm run lint
```

### 검증 방법

1. `npm run dev`에서 로그아웃 상태로 `/dashboard` 접근 → `/login` 리다이렉트 확인
2. 로그인 상태로 `/login` 접근 → `/dashboard` 리다이렉트 확인
3. 로그아웃 상태로 `/api/auth/session` 접근 → 정상 응답 확인

---

## 완료 체크리스트

- [ ] TypeScript 빌드 성공
- [ ] ESLint/Prettier 통과
- [ ] 미인증 리다이렉트 동작 확인
- [ ] 인증 후 로그인 페이지 리다이렉트 동작 확인

---

**다음 문서**: 2001_05_Auth_Layout_및_Login_페이지.md
