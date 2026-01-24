---
name: imb
description: "Break down PRD into executable implementation tasks with detailed documentation and test strategies"
---

# IMB (Implementation Breakdown) Generator - v3.2

PRD(Product Requirement Document)를 실행 가능한 구현 태스크로 분해하고, 각 구현 항목별로 세부 계획 문서를 자동 생성합니다.

## 🚀 빠른 시작 (Quick Start)

```bash
# Mode 1: 새로운 PRD 분해 (질문 없이 즉시 문서 생성 시작 ⚡)
/imb --prd @docs/development/2342_feature_prd.md

# Mode 2: 기존 문서 범위 재작성
/imb --rewrite 2342_06~2342_10
```

**DEFAULT 동작**: 명령어 실행 시 **즉시 문서 분해 작업 시작**. 중요한 이슈가 없으면 질문하지 않고 바로 진행합니다.

---

## 📋 공통 지시사항 (Global Guidelines)

**모든 구현 단계에서 다음 규칙을 준수하세요:**

### 1️⃣ 기술 스택 표준 (Technology Stack)
- **Frontend**: React 18.3 + TypeScript 5.6 + Vite
- **Backend**: Node.js + Express + TypeScript 5.6
- **Database**: Oracle XE (XEPDB1) - Oracle-Only
- **Architecture**: Hybrid Architecture
  - **Conversion Stage** (Premium Workspace, Upload, Admin): Thin Client (모든 비즈니스 로직 = Backend)
  - **Shared Pages** (/flipbook/share, /webview/share, /article/share): Rich Client (애니메이션, 검색, 북마크 허용)
- **Module System**: ES Modules Only

### 2️⃣ 데이터베이스 마이그레이션 규칙 (Database)
**문서 위치**: `docs/development/0001_01_스테이징서버_접속_및_마이그레이션_작성규칙.md`

**마이그레이션 파일**: `shared/database/migrations/{NNN}_description.sql`
```sql
-- Generated: YYYY-MM-DD HH:MM:SS KST
-- Migration: Brief description
-- Task: 2342_NN - Feature Name

SET ECHO ON
SET FEEDBACK ON
SET SERVEROUTPUT ON SIZE 30000

-- ========================================
-- Step N: Section Title
-- ========================================
PROMPT Step N: Section Title

[SQL 명령어]

COMMIT;
EXIT;
```

**필수 요소**:
- ✅ 파일 헤더 (Generated date, Task reference)
- ✅ SET 명령어 (ECHO, FEEDBACK, SERVEROUTPUT)
- ✅ 각 섹션을 PROMPT로 구분
- ✅ 마지막에 COMMIT; EXIT;
- ✅ 테스트 파일: `shared/database/tests/test_migration_{NNN}.sql`

**금지사항**:
- ❌ CASCADE DELETE 절대 금지
- ❌ ON DELETE CASCADE 절대 금지
- ❌ 소프트 삭제만 사용 (deleted_at column)

**Oracle 호환성 규칙** (🔴 필수):
- ❌ `ON DELETE RESTRICT` 사용 금지 (Oracle 미지원 - ORA-00905)
  - **해결책**: BEFORE DELETE 트리거로 DELETE RESTRICT 동작 구현
  ```sql
  CREATE OR REPLACE TRIGGER prevent_parent_delete
  BEFORE DELETE ON parent_table
  FOR EACH ROW
  DECLARE
      v_child_count NUMBER;
  BEGIN
      SELECT COUNT(*) INTO v_child_count FROM child_table WHERE parent_id = :OLD.id;
      IF v_child_count > 0 THEN
          RAISE_APPLICATION_ERROR(-20101, 'Cannot delete parent - child records exist');
      END IF;
  END;
  /
  ```
- ✅ Foreign Key 컬럼의 데이터 타입을 **반드시 참조 테이블과 일치**시킬 것 (ORA-02267 방지)
  ```sql
  -- ❌ 잘못된 예 (magazines.id = NUMBER, user_id = VARCHAR2)
  CREATE TABLE retry_history (
      user_id VARCHAR2(50) NOT NULL,
      CONSTRAINT retry_history_user_fk FOREIGN KEY (user_id) REFERENCES users(id)
  );

  -- ✅ 올바른 예 (users.id와 데이터 타입 일치)
  CREATE TABLE retry_history (
      user_id VARCHAR2(50) NOT NULL,  -- users.id는 VARCHAR2(50)
      CONSTRAINT retry_history_user_fk FOREIGN KEY (user_id) REFERENCES users(id)
  );
  ```
- ✅ Foreign Key 컬럼 정의 전에 참조 테이블의 컬럼 타입을 반드시 확인
  ```sql
  -- 확인 방법
  SELECT column_name, data_type, data_length
  FROM user_tab_columns
  WHERE table_name = 'MAGAZINES' AND column_name = 'ID';
  ```

### 3️⃣ 테스트 전략 (Testing Strategy)

**각 구현 단계마다 필수**:

#### 3-1. TypeScript 검사
```bash
# Backend
cd backend && npm run build

# Frontend
cd frontend && npm run type-check
```

#### 3-2. Lint 검사
```bash
# 전체 체크
npm run lint

# 자동 수정 (가능한 경우)
npm run lint -- --fix
```

#### 3-3. 단위 테스트 (Staging Server 실제 데이터)
```bash
# Backend: 실제 Oracle DB 데이터 사용
JWT_SECRET="test-secret" npm run test

# Frontend: Mock은 최소화, API 실제 호출 우선
npm run test
```

#### 3-4. Mock 데이터 테스트는 제거
- ❌ Mock 데이터 생성 테스트 삭제
- ❌ Faker.js 등으로 생성한 테스트 데이터 사용 금지
- ✅ 스테이징 서버의 실제 데이터로만 검증

### 4️⃣ PRD 참조 규칙 (PRD Reference)

**모든 구현 문서에서**:
- 문서 상단에 원본 PRD 파일명 명시
- 각 섹션마다 PRD의 해당 요구사항 참조
- "원본 PRD의 'XX' 섹션 참조" 형식으로 기술

### 5️⃣ 완료 체크리스트 (Completion Checklist)

```markdown
## 완료 체크리스트

### TypeScript/Lint
- [ ] TypeScript build 성공
- [ ] ESLint 통과
- [ ] Prettier 형식 적용

### 테스트
- [ ] 단위 테스트 작성 (실제 데이터 기반)
- [ ] 단위 테스트 통과
- [ ] 테스트 커버리지 80%+ (라인), 75%+ (브랜치)
- [ ] E2E 테스트 성공 (Playwright)

### 코드 리뷰
- [ ] JSDoc/주석 완성
- [ ] 에러 핸들링 완성
- [ ] Edge case 처리 완성

### 배포
- [ ] 스테이징 서버 배포 완료
- [ ] 실제 데이터로 검증 완료
```

---

## 역할 (Role)

당신은 PRD를 실행 가능한 구현 태스크로 분해하는 전문가입니다. 복잡한 기능을 최소 단위로 쪼개고, 각 단위별로 구현 가능한 상세 계획을 작성합니다.

---

## 사용법 (Usage)

### ✅ Mode 1: 새로운 PRD 분해 (NEW PRD BREAKDOWN)

#### 방법 1-1: --prd 플래그 사용 (권장)
```bash
/imb --prd @docs/development/2342_변환_이력_페이지_통합_prd.md
```

#### 방법 1-2: 파일 경로 직접 지정
```bash
/imb --prd docs/development/2342_변환_이력_페이지_통합_prd.md
```

#### 방법 1-3: 문서 번호만 지정
```bash
/imb 2342
```
→ 자동으로 `docs/development/2342_*.md` 패턴의 PRD 파일을 찾습니다.

#### 방법 1-4: 대화형 파일 선택
```bash
/imb
```
→ `docs/development/` 디렉토리에서 PRD 파일 목록을 보여줍니다.

---

### 🔄 Mode 2: 세부 문서 범위 재작성 (DOCUMENT RANGE REWRITE)

#### 방법 2-1: 범위 지정
```bash
/imb --rewrite 2342_06~2342_10
```

#### 방법 2-2: 단일 문서 재작성
```bash
/imb --rewrite 2342_06
```

#### 방법 2-3: 전체 프로젝트 재작성
```bash
/imb --rewrite 2342
```

---

## 입력 (Input)

**자동 인식 패턴**:
- `docs/development/{DOC_NUM}_*.md` 형식의 PRD 파일
- 파일명에서 문서 번호(예: `2342`) 자동 추출
- `_prd.md`, `_통합_prd.md` 등의 접미사 지원

**예제 파일명**:
- ✅ `2342_변환_이력_페이지_통합_prd.md`
- ✅ `2342_취소기능_통합_prd.md`
- ❌ `README.md` (문서 번호 없음)
- ❌ `implementation_plan.md` (문서 번호 없음)

---

## 출력 (Output)

**자동 생성되는 파일들**:

1. **개요 문서**: `{DOC_NUM}_00_구현_개요.md`
   - 전체 구현 항목 목록
   - 각 항목의 간단한 설명 (1-2줄)
   - 구현 순서 및 의존성

2. **세부 계획 문서들**: `{DOC_NUM}_01_*.md`, `{DOC_NUM}_02_*.md`, ...
   - 구현 항목별로 하나씩 생성
   - 최소 단위 유지 (1개 파일 = 1개 기능/컴포넌트)

**파일명 규칙**:
```
입력: 2341_변환_이력_페이지_v2.md

출력:
- 2341_00_구현_개요.md
- 2341_01_데이터베이스_스키마_마이그레이션.md
- 2341_02_Backend_API_GET_conversions.md
- 2341_03_Frontend_Types_정의.md
- 2341_04_Frontend_useConversionHistory_Hook.md
- 2341_05_Frontend_ConversionHistoryPage_컴포넌트.md
- 2341_06_Unit_Tests_Backend.md
- 2341_07_E2E_Tests_Playwright.md
...
```

---

## 프로세스 (Process)

### Mode 1: 새로운 PRD 분해

**🚨 DEFAULT 동작: 질문 없이 즉시 문서 생성 시작 (MANDATORY)**

**IMPORTANT**: 다른 중요한 사항이 발견되지 않는 한, **디폴트 옵션으로 바로 문서 작성을 시작**하세요. 대안을 제시하지 말고, 문서번호 제안에 따라 즉시 분해 작업을 수행하세요.

**질문이 필요한 경우 (예외적인 상황만)**:
- ❗ PRD에 **치명적인 모순**이 있는 경우 (예: 데이터베이스 스키마와 API 스펙이 완전히 상충)
- ❗ PRD에 **핵심 정보가 누락**된 경우 (예: 필수 API 엔드포인트 정의 없음)
- ❗ PRD가 **기술 스택 표준 위반**을 명시하는 경우 (예: "PostgreSQL 사용", "Next.js 사용")

**질문이 불필요한 경우 (대부분의 상황)**:
- ✅ 일반적인 구현 방법 선택 (React Query vs useState 등) → 표준 패턴 사용하고 바로 진행
- ✅ 세부 구현 디테일 결정 (컴포넌트 이름, 파일 구조 등) → 코딩 스탠다드에 따라 바로 진행
- ✅ 테스트 전략 (단위/E2E 테스트 범위 등) → 표준 커버리지 목표로 바로 진행
- ✅ PRD에 명시되지 않은 작은 디테일 → 합리적 추론으로 바로 진행

**프로세스**:

1. **PRD 파일 자동 로드**
   - 입력된 경로에서 PRD 파일 읽기
   - 문서 번호 추출 (예: `2341`)

2. **구현 항목 자동 분해**
   - Database Layer
   - Backend API Layer
   - Frontend Layer
   - Testing Layer

3. **개요 문서 생성** (`{DOC_NUM}_00_구현_개요.md`)
   ```markdown
   # {기능명} 구현 개요

   **문서 번호**: {DOC_NUM}_00
   **생성일**: YYYY-MM-DD HH:MM:SS KST
   **원본 PRD**: {PRD 파일명}
   **PRD 참조**: docs/development/{PRD 파일명}

   ## 구현 항목 목록

   ### 1. Database Layer
   - [ ] {DOC_NUM}_01: 데이터베이스 스키마 마이그레이션

   ### 2. Backend API Layer
   - [ ] {DOC_NUM}_02: GET /api/v1/conversions 엔드포인트
   - [ ] {DOC_NUM}_03: DELETE /api/v1/conversion/:jobId/history 엔드포인트
   - [ ] {DOC_NUM}_04: POST /api/v1/conversion/:jobId/retry 엔드포인트

   ### 3. Frontend Layer
   - [ ] {DOC_NUM}_05: TypeScript 타입 정의
   - [ ] {DOC_NUM}_06: useConversionHistory 커스텀 훅
   - [ ] {DOC_NUM}_07: ConversionHistoryPage 컴포넌트
   - [ ] {DOC_NUM}_08: Frontend Coding Standards 준수 검증
     - **Implementation Breakdown 전용 체크리스트**: @zine-alpaca/frontend/docs/FRONTEND_CODING_STANDARDS_IMPLEMENTATION_CHECKLIST.md ⭐ 주 참조
     - **빠른 참조**: @zine-alpaca/frontend/docs/FRONTEND_CODING_STANDARDS_QUICK_REFERENCE.md
     - **검증 항목**:
       - ✅ React Query patterns compliance (Stale Time, Cache Invalidation)
       - ✅ Web Vitals monitoring implementation (INP, CLS, LCP, FCP, TTFB)
       - ✅ Error handling standardization (handleApiError, ErrorBoundary)
       - ✅ React 18 Concurrent Features usage (useTransition, useDeferredValue, Suspense)
       - ✅ Performance optimization (Code splitting, Lazy loading, Bundle size)
       - ✅ TypeScript strict mode compliance (noUnusedLocals, noFallthroughCasesInSwitch)
       - ✅ Testing standards (Coverage 80%+ 라인, 75%+ 브랜치)
       - ✅ ESLint/Prettier formatting
       - ✅ Docker 개발 환경 설정
     - **실행 명령어**:
       ```bash
       cd frontend
       npm run type-check    # TypeScript 검증
       npm run lint          # ESLint 검증
       npm run test          # 단위 테스트
       npm run test:coverage # 커버리지 확인 (80%+ 라인, 75%+ 브랜치)
       npm run e2e           # E2E 테스트 (스테이징)
       ```
     - **필수 조건**: 모든 frontend 개발 완료 후, 테스트 시작 전 실행

   ### 4. Testing Layer
   - [ ] {DOC_NUM}_09: 백엔드 API 유닛 테스트 (실제 DB 데이터)
   - [ ] {DOC_NUM}_10: E2E 테스트 (Playwright)

   ## 구현 순서

   1. Database (01)
   2. Backend API (02-04)
   3. Frontend Types (05)
   4. Frontend Logic (06)
   5. Frontend UI (07)
   6. Frontend Standards Check (08)
   7. Testing (09-10)

   ## 의존성

   - 02-04 depends on 01 (API needs DB schema)
   - 05-07 depends on 02-04 (Frontend needs API)
   - 08 depends on 05-07 (Standards check after frontend complete)
   - 09-10 depends on 08 (Tests validate standards-compliant code)
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
   **예상 공수**: {시간/일}
   **의존성**: {DOC_NUM}_{SEQ}, ...

   ---

   ## 📌 구현 목표

   {이 문서에서 구현할 내용을 1-2문장으로 명확히 정의}

   ---

   ## 🎯 구현 내용

   ### 파일 위치

   ```
   {파일 경로}
   ```

   ### 코드 구현

   ```typescript
   // 구현할 코드 예시 (주요 인터페이스/함수 시그니처)
   ```

   ### 주요 로직

   1. {단계별 구현 설명}
   2. ...

   ---

   ## ✅ 테스트 전략

   ### TypeScript & Lint (각 단계마다)

   ```bash
   # TypeScript 컴파일 확인
   npm run build

   # Lint 검사
   npm run lint

   # 자동 수정 (가능한 경우)
   npm run lint -- --fix
   ```

   ### 단위 테스트 (실제 데이터 기반)

   **테스트 파일 위치**:
   ```
   {테스트 파일 경로}
   ```

   **테스트 원칙**:
   - ✅ 스테이징 서버의 실제 Oracle DB 데이터 사용
   - ❌ Mock 데이터 생성 테스트는 제거
   - ❌ Faker, factory-boy 등의 Mock 데이터 사용 금지

   **테스트 케이스**:
   ```typescript
   describe('{테스트 대상}', () => {
     it('should {예상 동작} (실제 DB 데이터로)', async () => {
       // Given: 스테이징 DB의 실제 데이터
       // When: 함수 실행
       // Then: 결과 검증
     });

     it('should handle {에러 케이스} (실제 시나리오)', async () => {
       // ...
     });
   });
   ```

   **테스트 실행**:
   ```bash
   # 백엔드: 실제 Oracle DB 사용
   JWT_SECRET="test-secret" npm run test

   # 프론트엔드
   npm run test

   # 커버리지 확인
   npm run test:coverage
   ```

   ### E2E 테스트 (Playwright)

   **Playwright 테스트** (스테이징 서버):
   ```bash
   npm run e2e
   npm run e2e:ui  # UI mode
   ```

   ---

   ## 🔍 검증 방법

   ### 로컬 검증 (단계별)

   1. **코드 구현 후**:
      ```bash
      npm run build     # TypeScript 컴파일
      npm run lint      # 코드 스타일 확인
      ```

   2. **테스트 실행**:
      ```bash
      npm run test      # 단위 테스트
      npm run test:coverage  # 커버리지
      ```

   3. **수동 테스트**:
      - 스테이징 서버에서 실제 데이터로 검증
      - 브라우저 DevTools에서 네트워크/콘솔 확인

   ### 스테이징 서버 검증

   ```bash
   # 배포
   ./deploy-to-staging.sh

   # 헬스 체크
   curl http://192.168.75.194:3000     # Frontend
   curl http://192.168.75.194:3001/api/v1/health  # Backend

   # 실제 데이터로 기능 검증
   # (Mock 데이터 아님!)
   ```

   ---

   ## 📋 완료 체크리스트

   ### 코드 품질
   - [ ] TypeScript 컴파일 성공 (npm run build)
   - [ ] ESLint 통과 (npm run lint)
   - [ ] Prettier 형식 적용
   - [ ] JSDoc 주석 완성

   ### 테스트
   - [ ] 단위 테스트 작성 (실제 DB 데이터 기반)
   - [ ] 모든 단위 테스트 통과
   - [ ] 테스트 커버리지 80%+ (라인), 75%+ (브랜치)
   - [ ] E2E 테스트 통과 (스테이징)

   ### 에러 처리
   - [ ] 에러 케이스 처리 완성
   - [ ] 유효성 검사 구현
   - [ ] 사용자 친화적 에러 메시지

   ### 배포 준비
   - [ ] 스테이징 서버에 배포 완료
   - [ ] 실제 데이터로 end-to-end 검증
   - [ ] 성능 테스트 완료 (필요시)
   - [ ] 보안 검토 완료 (필요시)

   ---

   **다음 문서**: {DOC_NUM}_{SEQ+1}_{다음_항목명}.md
   ```

5. **파일 저장**
   - 모든 문서를 원본 PRD와 같은 디렉토리에 저장

6. **완료 메시지**
   ```
   ✅ Implementation Breakdown Complete!

   📁 Generated Files:
   - docs/development/2341_00_구현_개요.md
   - docs/development/2341_01_데이터베이스_스키마_마이그레이션.md
   - docs/development/2341_02_Backend_API_GET_conversions.md
   ...

   Total: 9 files generated

   📊 Breakdown Summary:
   - Database: 1 task
   - Backend: 3 tasks
   - Frontend: 3 tasks
   - Testing: 2 tasks

   🎯 구현 팁:
   1. 공통 지시사항 (위의 Global Guidelines) 참조
   2. 각 단계마다 TypeScript 검사 + Lint 검사 필수
   3. Mock 데이터가 아닌 스테이징 서버의 실제 데이터로 테스트
   4. 각 문서의 "원본 PRD 참조" 섹션을 읽고 요구사항 확인

   🚀 Start with: 2341_01_데이터베이스_스키마_마이그레이션.md
   ```

---

### Mode 2: 세부 문서 범위 재작성

#### 범위 파싱
- `2342_06~2342_10` → 6번부터 10번까지
- `2342_06:2342_10` → 6번부터 10번까지
- `2342_06` → 6번만 (단일 문서)
- `2342` → 모든 세부 문서

#### 실행 절차
1. 범위 파싱
2. 기존 문서 검색 및 로드
3. 백업 생성 (자동)
4. 최신 규칙으로 재작성
5. 파일 저장
6. 완료 보고

#### 완료 메시지
```
✅ Document Rewrite Complete!

📋 Rewritten Files:
- docs/development/2342_06_JWT_Token_Renewal.md (재작성됨)
- docs/development/2342_07_BullMQ_Queue_Implementation.md (재작성됨)
- docs/development/2342_08_Filtering_Strategy.md (재작성됨)

📊 Rewrite Summary:
- Total Files: 3
- Format Updated: 3
- Backup Created: docs/development/.backup/20251026_120000/

✨ 적용된 개선사항:
- 공통 지시사항 강화 (Global Guidelines)
- PRD 참조 추가
- TypeScript/Lint 검사 단계 명시
- Mock 데이터 테스트 제거
- 실제 데이터 테스트 강조

📝 Next Steps:
1. Review: git diff docs/development/2342_06* ... 2342_08*
2. Commit: git add docs/development/2342_*.md && git commit -m "docs: Update implementation docs to v3.0 standards"
3. Test: npm run test -- {affected-files}
```

---

## 분해 원칙 (Breakdown Principles)

### 1. 최소 단위 원칙
- **1개 문서 = 1개 구현 단위**
- 1개 API 엔드포인트 = 1개 문서
- 1개 컴포넌트 = 1개 문서
- 1개 Hook/Service = 1개 문서

### 2. 독립성 원칙
- 각 문서는 독립적으로 구현 가능해야 함
- 의존성은 명시하되, 순환 의존성 없도록
- 병렬 구현 가능한 항목은 의존성 없이

### 3. 테스트 포함 원칙
- **모든 구현 문서에 테스트 전략 포함**
- TypeScript/Lint 검사 필수
- 실제 데이터 기반 테스트
- Mock 데이터 테스트는 제외

### 4. 파일 수 제한 없음
- 작은 단위로 쪼개는 것이 우선
- 문서가 10개든 50개든 상관없음
- 명확하고 실행 가능한 것이 중요

---

## 언어 사용 가이드라인

- 문서 작성: **한글** (한국어)
- 기술 용어: **영어** 유지 (TypeScript, API, Component, Hook, etc.)
- 코드 예시: **영어** (변수명, 함수명, 주석)
- 파일명: **한글+영어** 혼용 (예: `2341_01_데이터베이스_스키마_마이그레이션.md`)

---

## 중요 사항

### ✅ 반드시 포함할 것

1. **공통 지시사항 참조** (상단의 Global Guidelines)
2. **원본 PRD 참조** (모든 문서에서)
3. **TypeScript & Lint 검사** (각 단계마다)
4. **실제 데이터 테스트** (Mock 데이터 제거)
5. **완료 체크리스트** (구현 진행 추적)

### ❌ 절대 금지

1. **Mock 데이터 테스트** 사용 금지
2. **Faker.js, factory-boy** 등의 테스트 데이터 생성 금지
3. **CASCADE DELETE** 사용 금지 (ON DELETE RESTRICT 트리거로 구현)
4. **CommonJS** 사용 금지 (ES Modules Only)
5. **중복된 설명** (일관성 있게 통일)
6. **ON DELETE RESTRICT SQL 구문** 사용 금지 (Oracle 미지원 - ORA-00905)
   - → 대신 BEFORE DELETE 트리거로 구현할 것
7. **Foreign Key 데이터 타입 불일치** (ORA-02267)
   - → 반드시 참조 테이블의 컬럼 타입과 일치시킬 것
   - → 마이그레이션 전에 `SELECT column_name, data_type FROM user_tab_columns` 확인

---

## 생성된 문서의 구조 (Generated Document Structure)

모든 생성된 문서는 다음 순서를 따릅니다:

```
1. <!-- Generated: YYYY-MM-DD HH:MM:SS KST -->
2. # 항목명 (제목)
3. **메타데이터** (문서 번호, 원본 PRD, 구현 범위 등)
4. ## 📌 구현 목표
5. ## 🎯 구현 내용
   - 파일 위치
   - 코드 구현
   - 주요 로직
6. ## ✅ 테스트 전략
   - TypeScript & Lint
   - 단위 테스트 (실제 데이터)
   - E2E 테스트
7. ## 🔍 검증 방법
8. ## 📋 완료 체크리스트
9. 다음 문서 링크
```

---

**마지막 업데이트**: 2025-12-11
**버전**: 3.2
**주요 개선사항**: --prd 플래그 명시화, Frontend Coding Standards 파일 읽기 최적화

**v3.2 변경사항** (2025-12-11):
- `--prd` 플래그 사용 의무화 (명시적 인터페이스)
- Frontend Coding Standards 파일 읽기 제한 (토큰 절약 최적화)
  - ✅ 읽기 허용: FRONTEND_CODING_STANDARDS_IMPLEMENTATION_CHECKLIST.md (주 참조)
  - ✅ 읽기 허용: FRONTEND_CODING_STANDARDS_QUICK_REFERENCE.md (보조 참조)
  - ❌ 읽기 금지: FRONTEND_CODING_STANDARDS.md (제거됨 - 너무 긴 문서)

**v3.1 변경사항** (2025-10-29):
- Oracle 호환성 규칙 추가 (ON DELETE RESTRICT 미지원)
- BEFORE DELETE 트리거 구현 가이드 추가
- Foreign Key 데이터 타입 검증 지시사항 추가 (ORA-02267 방지)
- 마이그레이션 전 스키마 확인 방법 문서화