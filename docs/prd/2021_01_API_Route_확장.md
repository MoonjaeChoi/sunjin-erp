<!-- Generated: 2026-01-25 03:00:00 KST -->

# GET /api/tasks 하위 호환 확장

**문서 번호**: 2021_01
**원본 PRD**: 2021_업무_검색_prd_v2.md
**PRD 참조**: 원본 PRD의 'Section 5.2 API Route Handlers' 참조
**구현 범위**: 기존 GET /api/tasks API에 페이지네이션, 정렬, 키워드, work_type 필터, 날짜 범위 검증 추가
**복잡도**: M
**의존성**: 없음 (기존 코드 확장)

---

## 구현 목표

기존 `GET /api/tasks` API를 하위 호환 방식으로 확장하여, `page` 파라미터 지정 시 페이지네이션된 결과를 반환하고, 미지정 시 기존 동작(전체 반환)을 유지한다.

---

## 구현 내용

### 파일 구조

```
src/app/api/tasks/
└── route.ts          # GET 함수 확장 (POST는 변경 없음)
```

### 구현 상세

#### 1. 추가 Query Parameters

| 파라미터 | 타입 | 기본값 | 설명 |
|---------|------|--------|------|
| `page` | number (1-based) | 미지정 | 지정 시 페이지네이션 모드 |
| `page_size` | 10\|20\|50 | 20 | 페이지당 건수 |
| `keyword` | string | - | 제목 LIKE 검색 (2자 이상, 100자 이하) |
| `work_type` | WorkType enum | - | 근무 형태 필터 |
| `sort_by` | task_date\|title\|status | task_date | 정렬 컬럼 |
| `sort_order` | ASC\|DESC | DESC | 정렬 방향 |

#### 2. 하위 호환 동작

- `page` 미지정: 기존 동작 유지 → `{ tasks, total }` (전체 반환, `task_date ASC`)
- `page` 지정: 페이지네이션 모드 → `{ tasks, total, page, page_size }` (동적 정렬)

#### 3. 날짜 범위 검증

- `date_to - date_from > 365일` → HTTP 400 에러
- 에러 메시지: "검색 기간은 최대 1년입니다."

#### 4. 키워드 검색

- `keyword` 길이 2자 미만 → 무시 (필터 미적용)
- `keyword` 길이 100자 초과 → HTTP 400 에러
- SQL: `task.title LIKE :keyword` (parameterized, `%keyword%`)

#### 5. RBAC (Phase 2-A)

- USER: `task.employee_id = session.user.id`
- MANAGER: `task.employee_id = session.user.id` (본인만)
- ADMIN: 전체 조회

### 핵심 인터페이스

```typescript
// 기존 응답 (page 미지정)
interface TaskListResponse {
  tasks: Task[];
  total: number;
}

// 페이지네이션 응답 (page 지정)
interface TaskSearchResponse {
  tasks: Task[];
  total: number;
  page: number;
  page_size: number;
}

// 유효한 sort_by 값
const VALID_SORT_BY = ['task_date', 'title', 'status'] as const;

// 유효한 page_size 값
const VALID_PAGE_SIZES = [10, 20, 50] as const;
```

### 수정할 코드 영역

`src/app/api/tasks/route.ts`의 `GET` 함수를 수정:

1. **Query param 추출 추가**: `page`, `page_size`, `keyword`, `work_type`, `sort_by`, `sort_order`
2. **날짜 범위 검증 추가**: 365일 초과 체크
3. **work_type 필터 추가**: enum 검증 + `andWhere`
4. **keyword 필터 추가**: 길이 검증 + `LIKE` 조건
5. **동적 정렬**: `sort_by`/`sort_order` 기반 `orderBy` 교체 (page 모드에서만)
6. **페이지네이션**: `skip()`/`take()` 적용 (page 모드에서만)
7. **응답 분기**: page 유무에 따라 응답 형태 변경

---

## Acceptance Criteria

- [ ] `page` 미지정 시 기존 동작 동일 (tasks 전체, task_date ASC)
- [ ] `page=1&page_size=20` 지정 시 첫 20건 반환 + `{ page: 1, page_size: 20 }` 포함
- [ ] `keyword=테스트` 시 제목에 "테스트" 포함된 업무만 반환
- [ ] `keyword=가` (1자) 시 keyword 필터 무시
- [ ] `work_type=OFFICE` 시 내근 업무만 반환
- [ ] `sort_by=title&sort_order=ASC` 시 제목 오름차순 정렬
- [ ] 날짜 범위 366일 이상 시 400 에러 반환
- [ ] USER/MANAGER는 본인 업무만, ADMIN은 전체 조회
- [ ] 기존 대시보드 API 호출이 정상 동작 (하위 호환)
- [ ] SQL Injection 방지 (parameterized query)

---

## 테스트 전략

### TypeScript & Lint

```bash
npm run build
npm run type-check
npm run lint
```

### 단위 테스트

**테스트 파일 위치**: `src/__tests__/api/tasks/route.test.ts`

```typescript
describe('GET /api/tasks', () => {
  describe('하위 호환 모드 (page 미지정)', () => {
    it('should return all tasks with { tasks, total }', async () => {});
    it('should sort by task_date ASC, start_time ASC', async () => {});
  });

  describe('페이지네이션 모드 (page 지정)', () => {
    it('should return paginated response with page/page_size', async () => {});
    it('should default page_size to 20', async () => {});
    it('should reject invalid page_size values', async () => {});
  });

  describe('필터링', () => {
    it('should filter by keyword (LIKE, min 2 chars)', async () => {});
    it('should ignore keyword shorter than 2 chars', async () => {});
    it('should reject keyword longer than 100 chars', async () => {});
    it('should filter by work_type', async () => {});
    it('should filter by type (task_type)', async () => {});
    it('should filter by status', async () => {});
  });

  describe('정렬', () => {
    it('should default sort to task_date DESC in pagination mode', async () => {});
    it('should sort by title when sort_by=title', async () => {});
    it('should reject invalid sort_by values', async () => {});
  });

  describe('날짜 범위 검증', () => {
    it('should reject date range > 365 days', async () => {});
    it('should accept date range <= 365 days', async () => {});
  });

  describe('RBAC', () => {
    it('should return only own tasks for USER role', async () => {});
    it('should return only own tasks for MANAGER role', async () => {});
    it('should return all tasks for ADMIN role', async () => {});
  });
});
```

### 검증 방법

1. `npm run build` 성공
2. `npm run test` 통과
3. `npm run dev` → Postman/curl로 수동 검증
4. 기존 대시보드 페이지에서 캘린더 동작 확인 (하위 호환)

---

## 완료 체크리스트

- [ ] TypeScript 빌드 성공
- [ ] ESLint/Prettier 통과
- [ ] 단위 테스트 통과
- [ ] 기존 대시보드 API 호출 정상 (하위 호환)
- [ ] RBAC 권한 검증 완료
- [ ] keyword SQL Injection 방지 확인
- [ ] 날짜 범위 365일 제한 동작
- [ ] 스테이징 서버 검증

---

**다음 문서**: 2021_02_TypeScript_타입_정의.md
