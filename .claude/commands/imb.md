---
name: imb
description: "Break down PRD into executable implementation tasks with detailed documentation and test strategies"
---

# IMB (Implementation Breakdown) Generator - v4.0 (sunjin-erp)

PRD(Product Requirement Document)를 실행 가능한 구현 태스크로 분해하고, 각 구현 항목별로 세부 계획 문서를 자동 생성합니다.

## 빠른 시작 (Quick Start)

```bash
# Mode 1: 새로운 PRD 분해 (질문 없이 즉시 문서 생성 시작)
/imb --prd docs/prd/2001_전체_레이아웃_설정_prd_v2.md

# Mode 2: 기존 문서 범위 재작성
/imb --rewrite 2001_06~2001_10
```

**DEFAULT 동작**: 명령어 실행 시 **즉시 문서 분해 작업 시작**. 중요한 이슈가 없으면 질문하지 않고 바로 진행합니다.

---

## 공통 지시사항 (Global Guidelines)

**모든 구현 단계에서 다음 규칙을 준수하세요:**

### 1. 기술 스택 표준 (Technology Stack)
- **Framework**: Next.js 14 (App Router) — Full-stack single project
- **Language**: TypeScript (strict mode)
- **Database**: Oracle XE 21c (XEPDB1) + TypeORM
- **Auth**: NextAuth.js (Auth.js v5) — RBAC (ADMIN/MANAGER/USER)
- **Server State**: TanStack Query (@tanstack/react-query)
- **Client State**: Zustand (UI 상태만)
- **UI**: shadcn/ui + Tailwind CSS + Lucide React Icons
- **Testing**: Jest/Vitest + React Testing Library + Playwright

### 2. Next.js App Router 규칙
- **Server Component (SC)**: 기본값. 데이터 fetching, 세션 조회, 정적 렌더링
- **Client Component (CC)**: `'use client'` 선언 필수. 인터랙션, useState, Zustand, TanStack Query
- **Composition Pattern**: SC에서 CC를 children/props로 전달
- **API Route Handlers**: `src/app/api/[module]/route.ts` (REST 패턴)

### 3. 데이터베이스 규칙 (Oracle XE 21c + TypeORM)

**TypeORM Entity**: `src/entities/[EntityName].ts`
- ✅ `VARCHAR2` (VARCHAR 금지), `NUMBER`, `CLOB` (TEXT 금지)
- ✅ Sequence objects for auto-increment IDs
- ✅ `deleted_at`, `created_at`, `updated_at` column 필수
- ✅ Foreign Key: `ON DELETE RESTRICT`

**TypeORM Migration**: `src/migrations/`
```bash
npx typeorm migration:generate -n MigrationName   # 생성
npx typeorm migration:run                          # 실행
npx typeorm migration:revert                       # 롤백
```

**금지사항**:
- ❌ CASCADE DELETE 절대 금지
- ❌ ON DELETE CASCADE 절대 금지
- ❌ Physical DELETE 금지 (soft delete only — `deleted_at` 설정)
- ❌ Fallback DB 금지 (Oracle 실패 시 SQLite 등 대체 금지 → HTTP 500 반환)
- ✅ 목록 조회 시 `WHERE deleted_at IS NULL` (또는 TypeORM `{ deletedAt: IsNull() }`)
- ✅ 삭제 전 의존성 확인 (관련 레코드 존재 여부 검증)

### 4. 테스트 전략 (Testing Strategy)

**각 구현 단계마다 필수**:

```bash
# TypeScript & Lint
npm run build             # Next.js 빌드 (TypeScript 컴파일 포함)
npm run type-check        # TypeScript strict mode 검증
npm run lint              # ESLint 검사
npm run lint -- --fix     # 자동 수정
npm run format            # Prettier 포맷팅

# 단위 테스트
npm run test              # 테스트 실행
npm run test -- --coverage  # 커버리지 확인 (80%+ 라인, 75%+ 브랜치)
```

**테스트 원칙**:
- ✅ Coverage 목표: 라인 80%+, 브랜치 75%+, Critical Path 100%
- ✅ Testing Pyramid: Unit 70%, Integration 20%, E2E 10%
- ✅ React Testing Library 쿼리 우선순위: getByRole > getByLabelText > getByText > getByTestId
- ✅ User Event 사용 (fireEvent 금지)

### 5. PRD 참조 규칙 (PRD Reference)

**모든 구현 문서에서**:
- 문서 상단에 원본 PRD 파일명 명시
- 각 섹션마다 PRD의 해당 요구사항 참조
- "원본 PRD의 'Section X' 참조" 형식으로 기술

### 6. 코딩 표준 참조

**구현 시 다음 문서를 참조**:
- **체크리스트**: `docs/standard/FRONTEND_CODING_STANDARDS_IMPLEMENTATION_CHECKLIST.md`
- **빠른 참조**: `docs/standard/FRONTEND_CODING_STANDARDS_QUICK_REFERENCE.md`

### 7. 완료 체크리스트 (Completion Checklist)

```markdown
## 완료 체크리스트

### TypeScript/Lint
- [ ] `npm run build` 성공 (Next.js 빌드)
- [ ] `npm run type-check` 통과
- [ ] `npm run lint` 통과
- [ ] `npm run format` 적용

### 테스트
- [ ] 단위 테스트 작성 및 통과
- [ ] 커버리지 80%+ (라인), 75%+ (브랜치)
- [ ] E2E 테스트 통과 (필요 시)

### 코드 리뷰
- [ ] SC/CC 분리 패턴 준수
- [ ] 에러 핸들링 완성
- [ ] RBAC 권한 검증 (서버 + 클라이언트)
- [ ] Soft delete 적용

### 배포 준비
- [ ] 스테이징 서버 배포 완료
- [ ] 실제 환경에서 기능 검증
```

---

## 역할 (Role)

당신은 PRD를 실행 가능한 구현 태스크로 분해하는 전문가입니다. 복잡한 기능을 최소 단위로 쪼개고, 각 단위별로 구현 가능한 상세 계획을 작성합니다.

---

## 사용법 (Usage)

### Mode 1: 새로운 PRD 분해 (NEW PRD BREAKDOWN)

#### 방법 1-1: --prd 플래그 사용 (권장)
```bash
/imb --prd docs/prd/2001_전체_레이아웃_설정_prd_v2.md
```

#### 방법 1-2: 문서 번호만 지정
```bash
/imb 2001
```
→ 자동으로 `docs/prd/2001_*_prd*.md` 패턴의 PRD 파일을 찾습니다.

#### 방법 1-3: 대화형 파일 선택
```bash
/imb
```
→ `docs/prd/` 디렉토리에서 PRD 파일 목록을 보여줍니다.

---

### Mode 2: 세부 문서 범위 재작성 (DOCUMENT RANGE REWRITE)

#### 방법 2-1: 범위 지정
```bash
/imb --rewrite 2001_03~2001_07
```

#### 방법 2-2: 단일 문서 재작성
```bash
/imb --rewrite 2001_03
```

#### 방법 2-3: 전체 프로젝트 재작성
```bash
/imb --rewrite 2001
```

---

## 입력 (Input)

**자동 인식 패턴**:
- `docs/prd/{DOC_NUM}_*_prd*.md` 형식의 PRD 파일
- 파일명에서 문서 번호(예: `2001`) 자동 추출
- `_prd.md`, `_prd_v2.md` 등의 접미사 지원

**예제 파일명**:
- ✅ `2001_전체_레이아웃_설정_prd_v2.md`
- ✅ `1020_기술지원_관리_prd.md`
- ❌ `README.md` (문서 번호 없음)
- ❌ `2001_전체_레이아웃_설정_prd_critical_review.md` (리뷰 산출물)

---

## 출력 (Output)

**자동 생성되는 파일들** (원본 PRD와 같은 디렉토리에 저장):

1. **개요 문서**: `{DOC_NUM}_00_구현_개요.md`
   - 전체 구현 항목 목록
   - 각 항목의 간단한 설명 (1-2줄)
   - 구현 순서 및 의존성

2. **세부 계획 문서들**: `{DOC_NUM}_01_*.md`, `{DOC_NUM}_02_*.md`, ...
   - 구현 항목별로 하나씩 생성
   - 최소 단위 유지 (1개 파일 = 1개 기능/컴포넌트)

**파일명 규칙**:
```
입력: docs/prd/2001_전체_레이아웃_설정_prd_v2.md

출력:
- docs/prd/2001_00_구현_개요.md
- docs/prd/2001_01_TypeORM_Entity_정의.md
- docs/prd/2001_02_API_Route_Handlers.md
- docs/prd/2001_03_Zustand_Store_사이드바.md
- docs/prd/2001_04_MainShell_컴포넌트.md
- docs/prd/2001_05_Sidebar_컴포넌트.md
- docs/prd/2001_06_Header_컴포넌트.md
- docs/prd/2001_07_Breadcrumb_컴포넌트.md
- docs/prd/2001_08_Middleware_인증.md
- docs/prd/2001_09_Unit_Tests.md
- docs/prd/2001_10_E2E_Tests.md
```

---

## 프로세스 (Process)

### Mode 1: 새로운 PRD 분해

**DEFAULT 동작: 질문 없이 즉시 문서 생성 시작 (MANDATORY)**

**IMPORTANT**: 다른 중요한 사항이 발견되지 않는 한, **디폴트 옵션으로 바로 문서 작성을 시작**하세요.

**질문이 필요한 경우 (예외적인 상황만)**:
- PRD에 **치명적인 모순**이 있는 경우
- PRD에 **핵심 정보가 누락**된 경우
- PRD가 **기술 스택 표준 위반**을 명시하는 경우

**질문이 불필요한 경우 (대부분의 상황)**:
- ✅ SC/CC 분리 결정 → 표준 패턴 적용하고 바로 진행
- ✅ 세부 구현 디테일 → CLAUDE.md + 코딩 스탠다드에 따라 진행
- ✅ 테스트 전략 → 표준 커버리지 목표로 진행
- ✅ PRD에 명시되지 않은 작은 디테일 → 합리적 추론으로 진행

**프로세스**:

1. **PRD 파일 자동 로드**
   - 입력된 경로에서 PRD 파일 읽기
   - 문서 번호 추출 (예: `2001`)

2. **구현 항목 자동 분해** (sunjin-erp 레이어 구조)
   - Database Layer (TypeORM Entity + Migration)
   - API Layer (Next.js Route Handlers)
   - Frontend Layer (Components + Hooks + Stores)
   - Testing Layer (Unit + E2E)

3. **개요 문서 생성** (`{DOC_NUM}_00_구현_개요.md`)
   ```markdown
   <!-- Generated: YYYY-MM-DD HH:MM:SS KST -->

   # {기능명} 구현 개요

   **문서 번호**: {DOC_NUM}_00
   **생성일**: YYYY-MM-DD HH:MM:SS KST
   **원본 PRD**: {PRD 파일명}
   **PRD 참조**: docs/prd/{PRD 파일명}

   ## 구현 항목 목록

   ### 1. Database Layer
   - [ ] {DOC_NUM}_01: TypeORM Entity 정의
   - [ ] {DOC_NUM}_02: Migration 생성 및 실행

   ### 2. API Layer (Next.js Route Handlers)
   - [ ] {DOC_NUM}_03: GET /api/[module] — 목록 조회
   - [ ] {DOC_NUM}_04: POST /api/[module] — 생성
   - [ ] {DOC_NUM}_05: PUT/DELETE /api/[module]/[id] — 수정/삭제

   ### 3. Frontend Layer
   - [ ] {DOC_NUM}_06: TypeScript 타입 정의
   - [ ] {DOC_NUM}_07: TanStack Query Hooks (useQuery, useMutation)
   - [ ] {DOC_NUM}_08: Zustand Store (필요 시)
   - [ ] {DOC_NUM}_09: 페이지 컴포넌트 (SC + CC 분리)
   - [ ] {DOC_NUM}_10: Feature 컴포넌트 (목록, 폼, 상세)
   - [ ] {DOC_NUM}_11: Coding Standards 준수 검증
     - **체크리스트**: docs/standard/FRONTEND_CODING_STANDARDS_IMPLEMENTATION_CHECKLIST.md
     - **빠른 참조**: docs/standard/FRONTEND_CODING_STANDARDS_QUICK_REFERENCE.md
     - **검증 항목**:
       - ✅ SC/CC 분리 패턴 준수
       - ✅ TanStack Query 패턴 (Stale Time, Cache Invalidation)
       - ✅ Zustand 사용 범위 (UI 상태만)
       - ✅ shadcn/ui + Tailwind CSS 사용
       - ✅ TypeScript strict mode 통과
       - ✅ RBAC 권한 검증 (서버 + 클라이언트)
       - ✅ Error handling 표준화 (error.tsx, toast)
       - ✅ ESLint/Prettier 통과
     - **실행 명령어**:
       ```bash
       npm run build         # Next.js 빌드 + TypeScript
       npm run type-check    # TypeScript 검증
       npm run lint          # ESLint 검증
       npm run format        # Prettier 검증
       ```

   ### 4. Testing Layer
   - [ ] {DOC_NUM}_12: 단위 테스트 (API Route + Hooks + Components)
   - [ ] {DOC_NUM}_13: E2E 테스트 (Playwright)

   ## 구현 순서

   1. Database Entity + Migration (01-02)
   2. API Route Handlers (03-05)
   3. Frontend Types (06)
   4. Frontend Logic (07-08)
   5. Frontend UI (09-10)
   6. Standards Check (11)
   7. Testing (12-13)

   ## 의존성

   - 03-05 depends on 01-02 (API needs DB schema)
   - 06-10 depends on 03-05 (Frontend needs API)
   - 11 depends on 06-10 (Standards check after frontend complete)
   - 12-13 depends on 11 (Tests validate standards-compliant code)
   ```

4. **세부 계획 문서 생성** (각 항목별로)

   **템플릿 구조**:
   ```markdown
   <!-- Generated: YYYY-MM-DD HH:MM:SS KST -->

   # {항목명}

   **문서 번호**: {DOC_NUM}_{SEQ}
   **원본 PRD**: {PRD 파일명}
   **PRD 참조**: 원본 PRD의 '{해당 섹션}' 참조
   **구현 범위**: {간단한 설명}
   **복잡도**: S/M/L
   **의존성**: {DOC_NUM}_{SEQ}, ...

   ---

   ## 구현 목표

   {이 문서에서 구현할 내용을 1-2문장으로 명확히 정의}

   ---

   ## 구현 내용

   ### 파일 구조

   ```
   src/
   ├── {생성/수정할 파일 경로}
   └── ...
   ```

   ### 구현 상세

   {기술적 구현 명세 — 동작 설명 중심}

   ### 핵심 인터페이스

   ```typescript
   // 주요 타입/인터페이스 정의
   interface Example {
     id: number;
     name: string;
   }
   ```

   ---

   ## Acceptance Criteria

   - [ ] {검증 가능한 완료 조건 1}
   - [ ] {검증 가능한 완료 조건 2}
   - [ ] ...

   ---

   ## 테스트 전략

   ### TypeScript & Lint

   ```bash
   npm run build         # Next.js 빌드
   npm run type-check    # TypeScript strict
   npm run lint          # ESLint
   ```

   ### 단위 테스트

   **테스트 파일 위치**: `src/__tests__/{테스트_파일}.test.ts`

   ```typescript
   describe('{테스트 대상}', () => {
     it('should {예상 동작}', async () => {
       // Given
       // When
       // Then
     });
   });
   ```

   ### 검증 방법

   1. `npm run build` 성공
   2. `npm run test` 통과
   3. `npm run dev`에서 수동 검증

   ---

   ## 완료 체크리스트

   - [ ] TypeScript 빌드 성공
   - [ ] ESLint/Prettier 통과
   - [ ] 단위 테스트 통과 (커버리지 80%+)
   - [ ] SC/CC 분리 준수
   - [ ] RBAC 권한 검증 완료
   - [ ] Soft delete 적용
   - [ ] 스테이징 서버 검증

   ---

   **다음 문서**: {DOC_NUM}_{SEQ+1}_{다음_항목명}.md
   ```

5. **파일 저장**
   - 모든 문서를 `docs/prd/` 디렉토리에 저장

6. **완료 메시지**
   ```
   ✅ Implementation Breakdown Complete!

   Generated Files:
   - docs/prd/2001_00_구현_개요.md
   - docs/prd/2001_01_TypeORM_Entity_정의.md
   - docs/prd/2001_02_Migration_생성.md
   ...

   Total: {N} files generated

   Breakdown Summary:
   - Database: {N} tasks
   - API: {N} tasks
   - Frontend: {N} tasks
   - Testing: {N} tasks

   Start with: {DOC_NUM}_01_{첫번째_항목명}.md
   ```

---

### Mode 2: 세부 문서 범위 재작성

#### 범위 파싱
- `2001_03~2001_07` → 3번부터 7번까지
- `2001_03` → 3번만 (단일 문서)
- `2001` → 모든 세부 문서

#### 실행 절차
1. 범위 파싱
2. 기존 문서 검색 및 로드
3. 최신 규칙으로 재작성
4. 파일 저장
5. 완료 보고

---

## 분해 원칙 (Breakdown Principles)

### 1. 최소 단위 원칙
- **1개 문서 = 1개 구현 단위**
- 1개 API Route = 1개 문서 (또는 관련 CRUD 묶음)
- 1개 컴포넌트 = 1개 문서
- 1개 Hook/Store = 1개 문서

### 2. 독립성 원칙
- 각 문서는 독립적으로 구현 가능해야 함
- 의존성은 명시하되, 순환 의존성 없도록
- 병렬 구현 가능한 항목은 의존성 없이

### 3. SC/CC 분리 원칙
- Page-level 컴포넌트 → SC 우선, 필요 시 CC 분리
- Layout → SC (session을 서버에서 가져와 CC에 props 전달)
- 인터랙티브 UI → CC 분리 (별도 파일)

### 4. sunjin-erp 레이어 순서
```
1. Database (TypeORM Entity + Migration)
2. API (Next.js Route Handlers + 세션/권한 검증)
3. Types (공유 타입 정의)
4. Hooks (TanStack Query + Zustand)
5. Components (SC Page + CC Feature)
6. Testing (Unit + E2E)
```

### 5. 파일 수 제한 없음
- 작은 단위로 쪼개는 것이 우선
- 명확하고 실행 가능한 것이 중요
- 복잡도 표시: S (0.5~1일), M (1~2일), L (2~3일)

---

## 언어 사용 가이드라인

- 문서 작성: **한글** (한국어)
- 기술 용어: **영어** 유지 (TypeScript, API, Component, Hook, etc.)
- 코드 예시: **영어** (변수명, 함수명)
- 파일명: **한글+영어** 혼용 (예: `2001_01_TypeORM_Entity_정의.md`)

---

## 금지 사항 (MANDATORY)

1. ❌ **CASCADE DELETE** — Soft delete + ON DELETE RESTRICT 사용
2. ❌ **Fallback DB** — Oracle 전용 (SQLite 등 대체 금지)
3. ❌ **Physical DELETE** — `deleted_at` column 사용
4. ❌ **SC에서 Client API** — useState, useEffect, Zustand 등 CC에서만
5. ❌ **Zustand에 서버 데이터** — TanStack Query 사용
6. ❌ **인라인 스타일** — Tailwind CSS 사용
7. ❌ **`any` 타입 무분별 사용** — strict mode 준수

---

## 파일 구조 참조

```
src/
├── app/
│   ├── layout.tsx                    # Root Layout (SC) - Providers
│   ├── (auth)/
│   │   ├── layout.tsx                # Auth Layout (사이드바 없음)
│   │   └── login/page.tsx
│   ├── (main)/
│   │   ├── layout.tsx                # Main Layout (SC) → MainShell (CC)
│   │   ├── loading.tsx               # 공통 스켈레톤
│   │   └── [module]/
│   │       ├── page.tsx              # 목록 페이지
│   │       ├── [id]/page.tsx         # 상세 페이지
│   │       └── new/page.tsx          # 등록 페이지
│   └── api/
│       └── [module]/
│           ├── route.ts              # GET (list), POST (create)
│           └── [id]/route.ts         # GET (detail), PUT, DELETE
├── components/
│   ├── layout/                       # App Shell (Sidebar, Header, Breadcrumb)
│   ├── ui/                           # shadcn/ui primitives
│   └── features/[module]/            # 도메인별 컴포넌트
├── entities/                         # TypeORM Entity 정의
├── lib/                              # 유틸리티, 설정
├── stores/                           # Zustand stores
├── types/                            # 공유 타입 정의
├── migrations/                       # TypeORM migrations
└── middleware.ts                     # NextAuth 인증 미들웨어
```

---

**마지막 업데이트**: 2026-01-24
**버전**: 4.0 (sunjin-erp Next.js App Router)
**주요 변경**: 이전 프로젝트(Vite+Express+Hybrid) → sunjin-erp(Next.js 14+TypeORM+NextAuth) 전면 재작성
