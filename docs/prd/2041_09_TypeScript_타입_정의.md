<!-- Generated: 2026-01-25 KST -->

# TypeScript 타입 정의

**문서 번호**: 2041_09
**원본 PRD**: 2041_프로젝트_관리_prd_v2.md
**구현 범위**: src/types/project.ts - 프로젝트 모듈 전체 타입/인터페이스 정의
**복잡도**: S
**의존성**: 2041_04~08

---

## 구현 목표

프로젝트 관리 모듈에서 사용되는 모든 TypeScript 타입, 인터페이스, 상수를 하나의 파일에 정의한다. API 요청/응답, 컴포넌트 props, TanStack Query hooks에서 공통으로 참조하는 타입 시스템을 구축한다.

---

## 구현 내용

### 파일 구조

```
src/types/
└── project.ts          # 프로젝트 모듈 타입 정의
```

### 구현 상세

#### 1. 기본 Union Types

```typescript
// 프로젝트 상태
export type ProjectStatus = 'PREPARING' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD';

// Sales Pipeline 8단계
export type ProjectStage =
  | 'MEETING'
  | 'PROPOSAL'
  | 'QUOTATION'
  | 'CONTRACT'
  | 'KICKOFF'
  | 'DEVELOPMENT'
  | 'DELIVERY'
  | 'HANDOVER';

// 첨부파일 카테고리
export type AttachmentCategory = 'CONTRACT' | 'PROPOSAL' | 'QUOTATION' | 'REPORT' | 'OTHER';
```

#### 2. Label 상수 (한글 매핑)

```typescript
// 상태 한글 라벨
export const ProjectStatusLabel: Record<ProjectStatus, string> = {
  PREPARING: '준비',
  IN_PROGRESS: '진행중',
  COMPLETED: '완료',
  ON_HOLD: '보류',
};

// 단계 한글 라벨
export const ProjectStageLabel: Record<ProjectStage, string> = {
  MEETING: '회의',
  PROPOSAL: '제안',
  QUOTATION: '견적',
  CONTRACT: '계약',
  KICKOFF: '착수',
  DEVELOPMENT: '진행',
  DELIVERY: '납품',
  HANDOVER: '인수인계',
};

// 첨부파일 카테고리 한글 라벨
export const AttachmentCategoryLabel: Record<AttachmentCategory, string> = {
  CONTRACT: '계약서',
  PROPOSAL: '제안서',
  QUOTATION: '견적서',
  REPORT: '보고서',
  OTHER: '기타',
};
```

#### 3. Stage-Column 매핑

```typescript
// ProjectStage → DB 컬럼명 매핑
export const ProjectStageColumnMap: Record<ProjectStage, string> = {
  MEETING: 'stage_meeting_at',
  PROPOSAL: 'stage_proposal_at',
  QUOTATION: 'stage_quotation_at',
  CONTRACT: 'stage_contract_at',
  KICKOFF: 'stage_kickoff_at',
  DEVELOPMENT: 'stage_development_at',
  DELIVERY: 'stage_delivery_at',
  HANDOVER: 'stage_handover_at',
};
```

#### 4. 단계 순서 배열

```typescript
// 체크리스트 순서 (UI 렌더링 및 하이라이트 계산용)
export const PROJECT_STAGES_ORDER: ProjectStage[] = [
  'MEETING',
  'PROPOSAL',
  'QUOTATION',
  'CONTRACT',
  'KICKOFF',
  'DEVELOPMENT',
  'DELIVERY',
  'HANDOVER',
];
```

#### 5. 목록 아이템 인터페이스

```typescript
// 프로젝트 목록 테이블 표시용
export interface ProjectListItem {
  id: number;
  project_code: string | null;     // null이면 "-"로 표시
  project_name: string;
  customer_id: number;
  customer_name: string;
  employee_id: number;
  employee_name: string;
  status: ProjectStatus;
  start_date: string | null;       // ISO 8601 date
  end_date: string | null;         // ISO 8601 date
  contract_amount: number | null;
  created_at: string;              // ISO 8601 timestamp
  updated_at: string;              // ISO 8601 timestamp
}
```

#### 6. 상세 인터페이스

```typescript
// 체크리스트 항목
export interface ProjectChecklistItem {
  stage: ProjectStage;
  label: string;                   // 한글 라벨
  completed_at: string | null;     // ISO 8601 timestamp or null
}

// 프로젝트 상세 (체크리스트 + 첨부파일 포함)
export interface ProjectDetail {
  id: number;
  project_code: string | null;
  project_name: string;
  customer_id: number;
  customer_name: string;
  employee_id: number;
  employee_name: string;
  department_name: string;
  status: ProjectStatus;
  start_date: string | null;
  end_date: string | null;
  contract_amount: number | null;
  description: string | null;
  checklist: ProjectChecklistItem[];   // 8개 항목 배열
  attachments: ProjectAttachment[];
  created_at: string;
  updated_at: string;
}
```

#### 7. 첨부파일 인터페이스

```typescript
export interface ProjectAttachment {
  id: number;
  file_name: string;               // 원본 파일명
  file_size: number;               // bytes
  category: AttachmentCategory;
  created_at: string;              // ISO 8601 timestamp
}
```

#### 8. 검색 파라미터 인터페이스

```typescript
export interface ProjectSearchParams {
  page: number;                    // 1-based
  page_size: number;               // default 20
  sort_by: string;                 // default 'created_at'
  sort_order: 'ASC' | 'DESC';     // default 'DESC'
  customer_id?: number;
  status?: ProjectStatus[];        // 복수 선택 가능
  employee_id?: number;
  keyword?: string;                // 프로젝트명, 코드 검색 (2자 이상)
}
```

#### 9. 요청/응답 인터페이스

```typescript
// 프로젝트 등록 요청
export interface CreateProjectRequest {
  project_name: string;            // 필수, max 200
  customer_id: number;             // 필수
  employee_id: number;             // 필수
  project_code?: string | null;    // 선택, PJT-YYYYMMDD-NNN 형식 or null
  start_date?: string | null;      // ISO 8601 date
  end_date?: string | null;        // ISO 8601 date
  contract_amount?: number | null;
  description?: string | null;
}

// 프로젝트 수정 요청
export interface UpdateProjectRequest {
  project_name?: string;
  customer_id?: number;
  employee_id?: number;
  project_code?: string | null;
  status?: ProjectStatus;
  start_date?: string | null;
  end_date?: string | null;
  contract_amount?: number | null;
  description?: string | null;
}

// 체크리스트 토글 요청
export interface ProjectChecklistToggleRequest {
  stage: ProjectStage;
  completed: boolean;
}

// 체크리스트 토글 응답
export interface ProjectChecklistToggleResponse {
  stage: string;
  completed_at: string | null;
}

// Summary 응답
export interface ProjectSummary {
  preparing: number;
  in_progress: number;
  completed: number;
  on_hold: number;
}

// 목록 조회 응답
export interface ProjectListResponse {
  projects: ProjectListItem[];
  total: number;
  page: number;
  page_size: number;
}

// 코드 생성 응답
export interface GenerateProjectCodeResponse {
  code: string;
}
```

#### 10. 상태 색상 매핑 (UI용)

```typescript
// Tailwind CSS 클래스 매핑
export const ProjectStatusColor: Record<ProjectStatus, { bg: string; text: string }> = {
  PREPARING: { bg: 'bg-blue-100', text: 'text-blue-800' },
  IN_PROGRESS: { bg: 'bg-amber-100', text: 'text-amber-800' },
  COMPLETED: { bg: 'bg-green-100', text: 'text-green-800' },
  ON_HOLD: { bg: 'bg-gray-100', text: 'text-gray-800' },
};
```

### 핵심 인터페이스

위 구현 상세에 정의된 전체 타입이 핵심 인터페이스이다. 주요 export 항목:

- Types: `ProjectStatus`, `ProjectStage`, `AttachmentCategory`
- Labels: `ProjectStatusLabel`, `ProjectStageLabel`, `AttachmentCategoryLabel`
- Maps: `ProjectStageColumnMap`, `ProjectStatusColor`
- Constants: `PROJECT_STAGES_ORDER`
- Interfaces: `ProjectListItem`, `ProjectDetail`, `ProjectAttachment`, `ProjectSearchParams`, `CreateProjectRequest`, `UpdateProjectRequest`, `ProjectChecklistToggleRequest`, `ProjectSummary`

---

## Acceptance Criteria

- [ ] src/types/project.ts 파일이 생성된다
- [ ] ProjectStatus, ProjectStage, AttachmentCategory union type이 정의된다
- [ ] 각 type에 대한 한글 Label Record가 정의된다
- [ ] ProjectStageColumnMap이 8개 stage를 DB 컬럼명에 정확히 매핑한다
- [ ] PROJECT_STAGES_ORDER 배열이 올바른 순서로 정의된다
- [ ] ProjectListItem이 목록 테이블에 필요한 모든 필드를 포함한다
- [ ] ProjectDetail이 checklist(8개 항목 배열)와 attachments를 포함한다
- [ ] ProjectSearchParams가 page, page_size, sort, filters를 포함한다
- [ ] CreateProjectRequest에 필수/선택 필드가 올바르게 구분된다
- [ ] UpdateProjectRequest가 partial update를 지원한다 (모든 필드 optional)
- [ ] ProjectChecklistToggleRequest가 stage와 completed를 포함한다
- [ ] ProjectSummary가 4개 상태별 count를 포함한다
- [ ] ProjectStatusColor가 4개 상태에 Tailwind 클래스를 매핑한다
- [ ] 모든 타입이 정상적으로 export된다
- [ ] TypeScript 컴파일 에러가 없다

---

## 테스트 전략

**타입 검증:**
- TypeScript 컴파일 시 타입 에러 없음 확인 (`npm run type-check`)
- 타입 정의를 import하여 사용하는 더미 파일로 호환성 검증

**상수 검증:**
- ProjectStageColumnMap의 모든 값이 실제 Entity 컬럼명과 일치하는지 단위 테스트
- PROJECT_STAGES_ORDER 배열 길이가 8인지 확인
- Label Record의 모든 키가 해당 union type을 커버하는지 확인

---

**다음 문서**: 2041_10_TanStack_Query_Hooks.md
