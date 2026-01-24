<!-- Generated: 2026-01-24 21:00:00 KST -->

# Auth Layout 및 Login 페이지

**문서 번호**: 2001_05
**원본 PRD**: 2001_전체_레이아웃_설정_prd_v2.md
**PRD 참조**: 원본 PRD의 'Section 5.1 Route Groups, US-2' 참조
**구현 범위**: (auth) Route Group 레이아웃 및 로그인 페이지 플레이스홀더
**복잡도**: S
**의존성**: 2001_03 (Root Layout)

---

## 구현 목표

비인증 사용자용 `(auth)` Route Group을 구성한다. 사이드바/헤더 없이 중앙 정렬된 단일 카드 레이아웃을 제공하며, 로그인 페이지의 기본 구조를 정의한다.

---

## 구현 내용

### 파일 구조

```
src/app/
└── (auth)/
    ├── layout.tsx                 # Auth Layout (SC) - 사이드바 없음
    └── login/
        └── page.tsx               # 로그인 페이지 (placeholder)
```

### 1. Auth Layout (`src/app/(auth)/layout.tsx`)

```typescript
// Generated: YYYY-MM-DD HH:MM:SS KST

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      {children}
    </div>
  );
}
```

### 2. Login 페이지 (`src/app/(auth)/login/page.tsx`)

```typescript
// Generated: YYYY-MM-DD HH:MM:SS KST

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '로그인 - Sunjin ERP',
};

export default function LoginPage() {
  return (
    <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-center mb-6">Sunjin ERP</h1>
      <p className="text-center text-gray-500">
        로그인 기능은 Auth 모듈에서 구현됩니다.
      </p>
    </div>
  );
}
```

### 핵심 설계 결정

1. **Server Component 유지**: Auth Layout과 Login Page 모두 SC
2. **최소 구현**: 실제 로그인 폼은 Phase 1 Auth 모듈에서 구현
3. **중앙 정렬**: flexbox로 화면 중앙에 카드 배치 (US-2 충족)
4. **사이드바/헤더 없음**: `(auth)` Route Group은 독립 레이아웃

---

## Acceptance Criteria

- [ ] `(auth)/layout.tsx`에 사이드바/헤더 없는 중앙 정렬 레이아웃
- [ ] `(auth)/login/page.tsx`에 카드 형태 플레이스홀더
- [ ] metadata에 페이지 제목 설정
- [ ] 두 파일 모두 Server Component 유지
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

1. `npm run dev`에서 `/login` 접근 시 중앙 정렬된 카드 표시 확인
2. 사이드바/헤더가 표시되지 않음 확인
3. 브라우저 탭 제목이 "로그인 - Sunjin ERP"로 표시됨 확인

---

## 완료 체크리스트

- [ ] TypeScript 빌드 성공
- [ ] ESLint/Prettier 통과
- [ ] 중앙 정렬 레이아웃 확인
- [ ] Server Component 유지

---

**다음 문서**: 2001_06_Main_Layout_및_MainShell.md
