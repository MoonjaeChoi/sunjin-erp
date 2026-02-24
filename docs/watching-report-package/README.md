<!-- Generated: 2026-02-24 22:00:00 KST -->

# watching 시스템 보고서 페이지 — 이식 가이드

엘리에셀 교회 관리 시스템 **watching** 의 기능 현황을 소개하는
인터랙티브 웹 리포트 페이지를 다른 Next.js 프로젝트에 복사·게시하는 가이드입니다.

---

## 패키지 구조

```
watching-report-package/
├── README.md                                ← 이 파일
├── src/
│   └── app/
│       └── watching-report/
│           ├── layout.tsx                   ← 인증 없는 최소 레이아웃
│           ├── page.tsx                     ← 서버 컴포넌트 진입점
│           └── _components/
│               ├── WatchingReportClient.tsx ← 메인 클라이언트 오케스트레이터
│               ├── ReportHero.tsx           ← 헤더 (시스템 소개 + 통계)
│               ├── ModuleGrid.tsx           ← 13개 모듈 카드 그리드
│               ├── ModuleCard.tsx           ← 개별 모듈 카드
│               ├── TableOfContents.tsx      ← 좌측 sticky 목차
│               ├── SectionDetail.tsx        ← 기능 상세 (Accordion + Markdown)
│               ├── ScreenshotViewer.tsx     ← 스크린샷 다이얼로그
│               └── _data/
│                   └── modules.ts           ← 13개 모듈 · 65개 기능 데이터
└── public/
    └── watching-screenshots/                ← 65개 PNG 스크린샷
        ├── auth/
        ├── home/
        ├── person/
        ├── attendance/
        ├── report/
        ├── visit/
        ├── education/
        ├── serve/
        ├── statistics/
        ├── batch/
        ├── sms/
        ├── board/
        ├── mokjang/
        └── setting/
```

---

## 전제 조건

| 항목 | 요구사항 |
|------|----------|
| Next.js | 14+ (App Router) |
| TypeScript | 5+ |
| Tailwind CSS | 3.4+ |
| shadcn/ui | 설치되어 있어야 함 |
| Node.js | 18+ |

---

## Step 1 — npm 패키지 설치

```bash
npm install react-markdown@^10.1.0 remark-gfm@^4.0.1
```

shadcn/ui가 아직 설정되지 않은 경우:

```bash
npx shadcn-ui@latest init
```

---

## Step 2 — shadcn/ui 컴포넌트 설치

이 페이지는 아래 4개의 shadcn/ui 컴포넌트를 사용합니다.

```bash
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add dialog
```

설치 후 `src/components/ui/` 에 아래 파일이 생성되어 있어야 합니다.

```
src/components/ui/
├── badge.tsx
├── button.tsx
├── card.tsx
└── dialog.tsx
```

---

## Step 3 — `cn` 유틸리티 확인

`src/lib/utils.ts` 에 `cn` 함수가 있어야 합니다.
없으면 아래 내용으로 파일을 생성하세요.

```bash
npm install clsx tailwind-merge
```

```typescript
// src/lib/utils.ts
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

---

## Step 4 — 소스 파일 복사

패키지의 `src/app/watching-report/` 폴더 전체를
대상 프로젝트의 `src/app/` 아래에 복사합니다.

```bash
# 패키지 디렉토리에서 실행
cp -r src/app/watching-report  /path/to/your-project/src/app/
```

결과:

```
your-project/src/app/
└── watching-report/          ← 새로 추가
    ├── layout.tsx
    ├── page.tsx
    └── _components/
        └── ...
```

---

## Step 5 — 스크린샷 복사

패키지의 `public/watching-screenshots/` 폴더를
대상 프로젝트의 `public/` 아래에 복사합니다.

```bash
cp -r public/watching-screenshots  /path/to/your-project/public/
```

> **주의:** `public/watching-screenshots/` 경로가 반드시 일치해야 합니다.
> `ScreenshotViewer.tsx` 가 `/watching-screenshots/[경로]` 를 정적으로 참조합니다.

---

## Step 6 — `next.config.js` 이미지 도메인 설정 (외부 호스팅 시)

로컬 `public/` 이미지만 사용하므로 별도 도메인 설정은 불필요합니다.
단, CDN이나 외부 스토리지로 스크린샷을 이동하는 경우 `next.config.js` 에 추가:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'your-cdn-hostname.com',
      },
    ],
  },
};

module.exports = nextConfig;
```

---

## Step 7 — 접속 확인

개발 서버를 시작하고 브라우저에서 확인합니다.

```bash
npm run dev
```

브라우저에서 `http://localhost:3000/watching-report` 접속.

> **인증 없이** 바로 표시됩니다. `layout.tsx` 에 세션 체크가 없기 때문입니다.

---

## Step 8 — 네비게이션 메뉴 추가 (선택)

사이드바나 헤더에 링크를 추가하려면 각 프로젝트의 네비게이션 설정 파일에 항목을 추가합니다.

```typescript
// 예시 (lucide-react 사용 시)
import { BookOpen } from 'lucide-react';

const navItems = [
  // ...
  { label: 'watching 보고서', href: '/watching-report', icon: BookOpen },
];
```

---

## 인증 보호가 필요한 경우

현재 `layout.tsx` 는 인증 없이 공개 접근을 허용합니다.
로그인이 필요하도록 변경하려면 `layout.tsx` 를 아래와 같이 수정하세요.

```typescript
// src/app/watching-report/layout.tsx (인증 추가 예시 — NextAuth v5)
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

export default async function WatchingReportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();
  if (!session) redirect('/login');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {children}
    </div>
  );
}
```

---

## 정적 사이트(SSG)로 내보내기

Vercel, Netlify, GitHub Pages 등 정적 호스팅에 배포할 경우:

```javascript
// next.config.js
const nextConfig = {
  output: 'export',   // 정적 HTML 내보내기
};
module.exports = nextConfig;
```

```bash
npm run build        # out/ 디렉토리에 정적 파일 생성
```

> `output: 'export'` 사용 시 `next/image` 의 자동 최적화가 비활성화됩니다.
> `ScreenshotViewer.tsx` 의 `<Image unoptimized>` 속성이 이미 설정되어 있으므로 추가 조치 불필요.

---

## 파일별 의존성 요약

| 파일 | 외부 의존성 |
|------|------------|
| `layout.tsx` | 없음 |
| `page.tsx` | `WatchingReportClient` |
| `WatchingReportClient.tsx` | `modules.ts`, 4개 컴포넌트 |
| `ReportHero.tsx` | `shadcn/ui: Badge, Card` |
| `ModuleGrid.tsx` | `ModuleCard` |
| `ModuleCard.tsx` | `shadcn/ui: Badge, Card`, `lucide-react` |
| `TableOfContents.tsx` | `@/lib/utils (cn)` |
| `SectionDetail.tsx` | `shadcn/ui: Badge, Button, Card`, `react-markdown`, `remark-gfm`, `lucide-react` |
| `ScreenshotViewer.tsx` | `shadcn/ui: Dialog`, `next/image`, `lucide-react` |
| `modules.ts` | 없음 (순수 TypeScript 데이터) |

---

## 데이터 수정 방법

`_components/_data/modules.ts` 를 수정하면 페이지 내용이 변경됩니다.

```typescript
// modules.ts 구조
export interface WatchingSection {
  id: string;           // "1-1", "2-3" 형식
  title: string;
  description: string;  // Markdown 사용 가능
  screenshotPath?: string; // "home/01_home.png" 형식 (public/watching-screenshots/ 기준)
  isBeta?: boolean;
}

export interface WatchingModule {
  id: string;           // "home", "person" 등
  number: number;       // 1~13
  title: string;
  icon: string;         // lucide-react 아이콘 이름
  color: string;        // Tailwind 배경색 클래스 (예: "bg-indigo-500")
  summary: string;
  sections: WatchingSection[];
  isBeta?: boolean;
}
```

---

## 체크리스트

```
□ npm install react-markdown remark-gfm
□ npx shadcn-ui@latest add badge button card dialog
□ src/lib/utils.ts 에 cn 함수 존재 확인
□ src/app/watching-report/ 폴더 복사
□ public/watching-screenshots/ 폴더 복사
□ http://localhost:3000/watching-report 접속 확인
□ 스크린샷 이미지 정상 표시 확인
```
