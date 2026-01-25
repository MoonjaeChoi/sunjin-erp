<!-- Generated: 2026-01-25 21:27:00 KST -->

# TypeScript 타입 정의

**문서 번호**: 2051_12_Issue
**원본 PRD**: 2051_장애_현황_관리_prd_v2.md (Section 5.3, 5.2)
**PRD 참조**: enum, interface, status transition
**구현 범위**: API 요청/응답 타입, enum, 라벨, 상태 전이 규칙
**복잡도**: S
**의존성**: 없음

---

## 구현 목표

Issue 관련 모든 TypeScript 타입, enum, 상수를 정의한다.

---

## 구현 내용

### 파일: src/types/issue.ts

```typescript
// Generated: 2026-01-25 21:27:00 KST

// === Enum Types ===

export type IssueSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type IssueStatus = 'INTAKE' | 'IN_PROGRESS' | 'COMPLETED';
export type TreatmentMethod = 'REMOTE' | 'PHONE' | 'ONSITE';
export type HistoryChangeType = 
  | 'STATUS_CHANGE' 
  | 'ASSIGNEE_CHANGE' 
  | 'SEVERITY_CHANGE' 
  | 'STATUS_ROLLBACK' 
  | 'ATTACHMENT_UPLOADED' 
  | 'ATTACHMENT_DELETED' 
  | 'IS_PUBLIC_CHANGE';

// === Enum Labels ===

export const SeverityLabel: Record<IssueSeverity, string> = {
  CRITICAL: '심각',
  HIGH: '높음',
  MEDIUM: '보통',
  LOW: '낮음',
};

export const StatusLabel: Record<IssueStatus, string> = {
  INTAKE: '접수',
  IN_PROGRESS: '진행중',
  COMPLETED: '완료',
};

export const TreatmentMethodLabel: Record<TreatmentMethod, string> = {
  REMOTE: '원격 지원',
  PHONE: '전화 지원',
  ONSITE: '현장 방문',
};

// === Enum Options (Select용) ===

export const SEVERITY_OPTIONS = [
  { value: 'CRITICAL', label: '심각' },
  { value: 'HIGH', label: '높음' },
  { value: 'MEDIUM', label: '보통' },
  { value: 'LOW', label: '낮음' },
];

export const STATUS_OPTIONS = [
  { value: 'INTAKE', label: '접수' },
  { value: 'IN_PROGRESS', label: '진행중' },
  { value: 'COMPLETED', label: '완료' },
];

export const TREATMENT_METHOD_OPTIONS = [
  { value: 'REMOTE', label: '원격 지원' },
  { value: 'PHONE', label: '전화 지원' },
  { value: 'ONSITE', label: '현장 방문' },
];

// === Status Transition Matrix ===

export const STATUS_TRANSITIONS: Record<IssueStatus, IssueStatus[]> = {
  INTAKE: ['IN_PROGRESS'],
  IN_PROGRESS: ['COMPLETED'],
  COMPLETED: ['IN_PROGRESS'], // ADMIN만 가능
};

export function isValidStatusTransition(
  from: IssueStatus,
  to: IssueStatus,
  role: string
): boolean {
  if (role === 'ADMIN') return true;
  if (from === to) return true;
  return STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

// === API Request/Response Types ===

export interface IssueListParams {
  page?: number;
  page_size?: number;
  customer_id?: number;
  status?: string;
  severity?: string;
  assignee_id?: number;
  created_by_id?: number;
  date_from?: string;
  date_to?: string;
  keyword?: string;
  sort_by?: string;
  sort_order?: 'ASC' | 'DESC';
}

export interface IssueRecord {
  id: number;
  title: string;
  description: string | null;
  severity: IssueSeverity;
  status: IssueStatus;
  is_public: number;
  customer_id: number;
  customer_name?: string;
  created_by_id: number;
  assigned_to_id: number | null;
  assigned_to_name?: string;
  treatment_method: TreatmentMethod | null;
  treatment_time_minutes: number | null;
  treatment_result: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface IssueListResponse {
  issues: IssueRecord[];
  total: number;
  page: number;
  page_size: number;
}

export interface CreateIssueRequest {
  customer_id: number;
  title: string;
  description: string;
  severity: IssueSeverity;
  assigned_to_id?: number;
}

export interface UpdateIssueRequest {
  title?: string;
  description?: string;
  severity?: IssueSeverity;
  status?: IssueStatus;
  assigned_to_id?: number | null;
  is_public?: number;
  treatment_method?: TreatmentMethod | null;
  treatment_time_minutes?: number | null;
  treatment_result?: string | null;
}

export interface IssueSummaryResponse {
  total: number;
  intake: number;
  in_progress: number;
  completed: number;
}

export interface IssueHistoryRecord {
  id: number;
  issue_id: number;
  change_type: HistoryChangeType;
  old_value: string | null;
  new_value: string | null;
  changed_by_id: number;
  changed_by_name?: string;
  changed_at: string;
  remark: string | null;
}

export interface IssueAttachmentRecord {
  id: number;
  issue_id: number;
  file_name: string;
  file_path: string;
  file_size: number;
  uploaded_by_id: number;
  uploaded_by_name?: string;
  created_at: string;
}
```

---

## Acceptance Criteria

- [ ] types/issue.ts 생성 완료
- [ ] 모든 enum 정의
- [ ] 상태 전이 규칙 정의
- [ ] API 타입 정의
- [ ] `npm run type-check` 통과

---

**다음 문서**: 2051_13_Hooks_Issue.md
