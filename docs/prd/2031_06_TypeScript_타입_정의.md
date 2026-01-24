<!-- Generated: 2026-01-25 05:10:00 KST -->

# TypeScript 타입 정의

**문서 번호**: 2031_06
**원본 PRD**: 2031_기술지원_관리_prd_v2.md
**PRD 참조**: 원본 PRD의 'Section 5.3 — Enum 정의' 및 'Section 5.2 — API' 참조
**구현 범위**: 기술지원 관련 TypeScript 타입, enum 라벨, 상태 전이 규칙
**복잡도**: S
**의존성**: 없음 (API 명세 기반)

---

## 구현 목표

기술지원 모듈에서 사용하는 TypeScript 타입, enum 상수, 라벨 매핑, 상태 전이 규칙을 정의한다.

---

## 구현 내용

### 파일 구조

```
src/types/
└── tech-support.ts    # 기술지원 관련 전체 타입 정의
```

### 핵심 인터페이스

```typescript
// src/types/tech-support.ts

// === Enum Types ===

export type SupportType = 'INSTALL' | 'TEST' | 'TRAINING' | 'MAINTENANCE' | 'GENERAL';
export type SupportMethod = 'ONSITE' | 'REMOTE' | 'PHONE';
export type SupportStatus = 'RECEIVED' | 'IN_PROGRESS' | 'COMPLETED';

// === Enum Labels ===

export const SupportTypeLabel: Record<SupportType, string> = {
  INSTALL: '납품설치',
  TEST: '테스트',
  TRAINING: '교육지원',
  MAINTENANCE: '유지보수',
  GENERAL: '일반지원',
};

export const SupportMethodLabel: Record<SupportMethod, string> = {
  ONSITE: '현장',
  REMOTE: '원격',
  PHONE: '전화',
};

export const SupportStatusLabel: Record<SupportStatus, string> = {
  RECEIVED: '접수',
  IN_PROGRESS: '진행',
  COMPLETED: '완료',
};

// === Enum Options (Select/Filter용) ===

export const SUPPORT_TYPE_OPTIONS: { value: SupportType; label: string }[] = [
  { value: 'INSTALL', label: '납품설치' },
  { value: 'TEST', label: '테스트' },
  { value: 'TRAINING', label: '교육지원' },
  { value: 'MAINTENANCE', label: '유지보수' },
  { value: 'GENERAL', label: '일반지원' },
];

export const SUPPORT_METHOD_OPTIONS: { value: SupportMethod; label: string }[] = [
  { value: 'ONSITE', label: '현장' },
  { value: 'REMOTE', label: '원격' },
  { value: 'PHONE', label: '전화' },
];

export const SUPPORT_STATUS_OPTIONS: { value: SupportStatus; label: string }[] = [
  { value: 'RECEIVED', label: '접수' },
  { value: 'IN_PROGRESS', label: '진행' },
  { value: 'COMPLETED', label: '완료' },
];

// === Status Transition Matrix ===

export const STATUS_TRANSITIONS: Record<SupportStatus, SupportStatus[]> = {
  RECEIVED: ['IN_PROGRESS'],
  IN_PROGRESS: ['COMPLETED'],
  COMPLETED: ['IN_PROGRESS'],
};

export function isValidStatusTransition(
  from: SupportStatus,
  to: SupportStatus,
  role: string
): boolean {
  if (role === 'ADMIN') return true;
  if (from === to) return true;
  return STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

// === API Request/Response Types ===

export interface TechSupportSearchParams {
  date_from: string;
  date_to: string;
  customer_id?: number;
  support_type?: SupportType;
  support_method?: SupportMethod;
  status?: SupportStatus;
  keyword?: string;
  page: number;
  page_size: number;
  sort_by: string;
  sort_order: 'ASC' | 'DESC';
}

export interface TechSupportRecord {
  id: number;
  title: string;
  description: string | null;
  support_date: string;
  start_time: number | null;
  end_time: number | null;
  support_type: SupportType;
  support_method: SupportMethod | null;
  status: SupportStatus;
  employee_id: number;
  customer_id: number;
  customer_name?: string;
  customer_category?: string;
  attachment_path: string | null;
  attachment_name: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface TechSupportSearchResponse {
  supports: TechSupportRecord[];
  total: number;
  page: number;
  page_size: number;
}

export interface CreateTechSupportRequest {
  title: string;
  customer_id: number;
  support_type: SupportType;
  support_date: string;
  support_method?: SupportMethod;
  start_time?: number;
  end_time?: number;
  description?: string;
}

export interface UpdateTechSupportRequest {
  title?: string;
  customer_id?: number;
  support_type?: SupportType;
  support_date?: string;
  support_method?: SupportMethod | null;
  start_time?: number | null;
  end_time?: number | null;
  description?: string | null;
  status?: SupportStatus;
  employee_id?: number; // ADMIN 담당자 변경
}

// === Customer Types ===

export interface CustomerListItem {
  id: number;
  name: string;
  category: string;
}

export interface CustomerListResponse {
  customers: CustomerListItem[];
}

// === Badge Color Maps ===

export const SupportStatusColors: Record<SupportStatus, string> = {
  RECEIVED: 'bg-gray-100 text-gray-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-green-100 text-green-700',
};

export const SupportTypeColors: Record<SupportType, string> = {
  INSTALL: 'bg-indigo-100 text-indigo-700',
  TEST: 'bg-orange-100 text-orange-700',
  TRAINING: 'bg-cyan-100 text-cyan-700',
  MAINTENANCE: 'bg-yellow-100 text-yellow-700',
  GENERAL: 'bg-gray-100 text-gray-600',
};

export const SupportMethodColors: Record<SupportMethod, string> = {
  ONSITE: 'bg-emerald-100 text-emerald-700',
  REMOTE: 'bg-violet-100 text-violet-700',
  PHONE: 'bg-slate-100 text-slate-700',
};
```

---

## Acceptance Criteria

- [ ] 모든 enum 타입 정의 완료
- [ ] 라벨 매핑 완료 (한글)
- [ ] 상태 전이 매트릭스 함수 구현
- [ ] API 요청/응답 인터페이스 정의
- [ ] Badge 색상 매핑 정의
- [ ] `npm run type-check` 통과

---

## 테스트 전략

### TypeScript & Lint

```bash
npm run type-check
npm run lint
```

### 단위 테스트

```typescript
describe('isValidStatusTransition', () => {
  it('should allow RECEIVED → IN_PROGRESS for USER');
  it('should allow IN_PROGRESS → COMPLETED for USER');
  it('should allow COMPLETED → IN_PROGRESS for USER');
  it('should reject RECEIVED → COMPLETED for USER');
  it('should allow any transition for ADMIN');
  it('should allow same-status transition');
});
```

---

## 완료 체크리스트

- [ ] TypeScript 빌드 성공
- [ ] ESLint/Prettier 통과
- [ ] 모든 타입 export 확인

---

**다음 문서**: 2031_07_TanStack_Query_Hooks.md
