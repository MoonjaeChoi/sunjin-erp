<!-- Generated: 2026-01-24 22:50:00 KST -->

# TypeScript 타입 정의 + 시간 변환 유틸리티

**문서 번호**: 2011_08
**원본 PRD**: 2011_대시보드_및_일정관리_prd_v2.md
**PRD 참조**: 원본 PRD의 'Section 5.3 시간 변환 유틸리티', 'Section 5.4 State Management' 참조
**구현 범위**: 공유 타입 정의, API 요청/응답 DTO, 시간 변환 유틸리티 함수
**복잡도**: S
**의존성**: 2011_03~07 (API 응답 구조 기반)

---

## 구현 목표

프론트엔드에서 사용하는 공유 타입 정의와 시간 변환 유틸리티 함수를 구현한다. API 요청/응답 DTO, 컴포넌트 Props 타입, 시간(분↔HH:MM) 변환 함수를 포함한다.

---

## 구현 내용

### 파일 구조

```
src/
├── types/
│   ├── task.ts             # Enum + Entity 타입 (이미 2011_01에서 생성, 확장)
│   └── dashboard.ts        # Dashboard 전용 타입 (API 응답, DTO)
└── lib/
    └── utils/
        └── time.ts         # 시간 변환 유틸리티
```

### 구현 상세

**1. 타입 정의 (src/types/dashboard.ts)**

```typescript
import { TaskType, WorkType, TaskStatus } from './task';

// === API Request DTOs ===
export interface CreateTaskDto {
  title: string;
  description?: string;
  task_date: string;          // ISO date
  start_time?: number;        // 분 단위 0~1439
  end_time?: number;
  task_type: TaskType;
  work_type: WorkType;
  status?: TaskStatus;
  customer_id?: number;
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  task_date?: string;
  start_time?: number | null;
  end_time?: number | null;
  task_type?: TaskType;
  work_type?: WorkType;
  status?: TaskStatus;
  customer_id?: number | null;
}

export interface TaskFilters {
  date_from: string;
  date_to: string;
  employee_id?: number;
  type?: TaskType;
  status?: TaskStatus;
}

// === API Response Types ===
export interface TaskListItem {
  id: number;
  title: string;
  description: string | null;
  task_date: string;
  start_time: number | null;
  end_time: number | null;
  task_type: TaskType;
  work_type: WorkType;
  status: TaskStatus;
  employee_id: number;
  employee_name: string;
  customer_id: number | null;
  customer_name: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskListResponse {
  tasks: TaskListItem[];
  total: number;
}

export interface DailySummaryResponse {
  date: string;
  tasks: TaskSummaryItem[];
  techSupports: TechSupportSummaryItem[];
}

export interface TaskSummaryItem {
  id: number;
  title: string;
  task_type: TaskType;
  work_type: WorkType;
  status: TaskStatus;
  start_time: number | null;
  end_time: number | null;
  customer_name: string | null;
}

export interface TechSupportSummaryItem {
  id: number;
  title: string;
  customer_name: string;
  status: string;
  support_date: string;
}

export interface TeamCalendarResponse {
  employees: TeamEmployeeData[];
}

export interface TeamEmployeeData {
  employee_id: number;
  employee_name: string;
  tasks: TeamTaskItem[];
}

export interface TeamTaskItem {
  id: number;
  title: string;
  task_date: string;
  start_time: number | null;
  end_time: number | null;
  task_type: TaskType;
  work_type: WorkType;
  status: TaskStatus;
}

// === UI Types ===
export type CalendarView = 'month' | 'week' | 'day';
```

**2. 시간 변환 유틸리티 (src/lib/utils/time.ts)**

```typescript
/**
 * 분 단위 숫자를 HH:MM 문자열로 변환
 * @param minutes 0~1439 범위의 분 단위 숫자
 * @returns "HH:MM" 형식 문자열
 */
export function minutesToTimeString(minutes: number): string {
  if (minutes < 0 || minutes > 1439) throw new RangeError('minutes must be 0~1439');
  const h = Math.floor(minutes / 60).toString().padStart(2, '0');
  const m = (minutes % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

/**
 * HH:MM 문자열을 분 단위 숫자로 변환
 * @param time "HH:MM" 형식 문자열
 * @returns 0~1439 범위의 분 단위 숫자
 */
export function timeStringToMinutes(time: string): number {
  const match = time.match(/^(\d{2}):(\d{2})$/);
  if (!match) throw new Error('Invalid time format. Expected HH:MM');
  const h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  if (h < 0 || h > 23 || m < 0 || m > 59) throw new RangeError('Invalid time value');
  return h * 60 + m;
}

/**
 * 시간 겹침 여부 확인
 * @returns true if time ranges overlap
 */
export function isTimeOverlap(
  aStart: number, aEnd: number,
  bStart: number, bEnd: number
): boolean {
  return aStart < bEnd && bStart < aEnd;
}
```

---

## Acceptance Criteria

- [ ] `src/types/dashboard.ts` 생성 (API DTO + Response + UI 타입)
- [ ] `src/lib/utils/time.ts` 생성 (minutesToTimeString, timeStringToMinutes, isTimeOverlap)
- [ ] 모든 타입이 API 응답 구조와 일치
- [ ] 시간 변환 함수의 범위 검증 (0~1439)
- [ ] CalendarView 타입 정의
- [ ] `npm run type-check` 통과

---

## 테스트 전략

### 단위 테스트

**테스트 파일 위치**: `src/__tests__/lib/utils/time.test.ts`

```typescript
describe('minutesToTimeString', () => {
  it('should convert 0 to "00:00"', () => {});
  it('should convert 540 to "09:00"', () => {});
  it('should convert 1439 to "23:59"', () => {});
  it('should throw RangeError for negative input', () => {});
  it('should throw RangeError for input > 1439', () => {});
});

describe('timeStringToMinutes', () => {
  it('should convert "09:00" to 540', () => {});
  it('should convert "00:00" to 0', () => {});
  it('should convert "23:59" to 1439', () => {});
  it('should throw for invalid format', () => {});
  it('should throw for invalid hour (25:00)', () => {});
});

describe('isTimeOverlap', () => {
  it('should return true for overlapping ranges', () => {});
  it('should return false for non-overlapping ranges', () => {});
  it('should return false for adjacent ranges (end === start)', () => {});
});
```

---

## 완료 체크리스트

- [ ] TypeScript 빌드 성공
- [ ] ESLint/Prettier 통과
- [ ] 타입 파일 생성 완료
- [ ] 유틸리티 함수 구현 + 에러 처리
- [ ] 단위 테스트 통과 (커버리지 100%)

---

**다음 문서**: 2011_09_TanStack_Query_Hooks.md
