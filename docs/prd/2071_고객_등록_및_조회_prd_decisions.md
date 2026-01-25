<!-- Generated: 2026-01-25 23:50:00 KST -->

# Mediation Decisions: 고객 등록 및 조회 (CRM) PRD

문서번호: 2071
작성일: 2026-01-25
기준: 10개 Discussion Topics
상태: Final Decisions

---

## Executive Summary: Mediation Process

본 문서는 CRM PRD의 10개 Discussion Topics에 대한 **최종 중재 결정**을 기록한다.

**AI-Assisted Decision Making Process:**
- sunjin-erp 아키텍처 베스트 프랙티스 기준 적용
- Enterprise ERP 보안 및 데이터 무결성 우선
- Phase 1 (즉시 구현) vs Phase 2 (향후 고도화) 명확한 구분
- 원본 PRD와 Rebuttal의 균형 고려

**통계:**
- 총 결정: 10개
- HIGH 우선순위: 2개
- MEDIUM 우선순위: 6개
- LOW 우선순위: 2개
- Phase 1 적용: 9개
- Phase 2 연기/계획: 3개
- 변경 없음: 5개

---

## Decision 1: 고객 삭제 권한 (Delete Authority)

**Topic:** 고객 soft delete 권한 (USER, MANAGER, ADMIN 중 누가?)
**카테고리:** RBAC (Role-Based Access Control)
**우선순위:** HIGH
**원본 PRD 입장:** MANAGER 권한 (DELETE /api/customers/[id] - MANAGER)
**Discussion Topic 추천:** Option B (ADMIN 권한만)

### 최종 결정

**DELETE 권한은 ADMIN만 보유**

```
- USER: 조회 전용
- MANAGER: 고객 등록/수정, 담당자 관리 (DELETE 불가)
- ADMIN: 모든 권한 (DELETE 포함)
```

### 근거 (Rationale)

1. **Enterprise ERP 데이터 무결성:** 고객 soft delete는 프로젝트, 기술지원, 유지보수 등 여러 모듈과 연결된 핵심 데이터
2. **Principle of Least Privilege:** MANAGER 팀 규모 증가 시 보안 리스크 증가
3. **sunjin-erp 보안 정책:** 중요 데이터 삭제는 관리자만 승인 (기존 프로젝트 패턴 준수)
4. **의도치 않은 삭제 방지:** 확인 대화만으로는 부족 (특히 다중 팀 환경)

### 구현 영향 (Implementation Impact)

**코드 변경:**
- `DELETE /api/customers/[id]` Route Handler: 권한 검증 코드 수정
  ```typescript
  // 기존: if (!session || !['MANAGER', 'ADMIN'].includes(session.user.role))
  // 변경: if (!session || session.user.role !== 'ADMIN')
  ```
- 프론트엔드: MANAGER에게는 "삭제" 버튼 숨김 (또는 비활성화)

**API 명세 업데이트:**
- Section 5.2 테이블: `DELETE /api/customers/[id]` 권한 → ADMIN only

**테스트:**
- MANAGER DELETE 시도 → 403 Forbidden 응답 검증

### 영향 범위 (Affected Sections)

- Section 4.1 (In-Scope): "User Stories / Use Cases" 업데이트 필요
- Section 5.5 (Authentication & Authorization): API 권한 테이블 수정
- US-6 (User Story): 대상 사용자 "관리자(ADMIN)" 명시
- Section 8 (Security Considerations): ADMIN-only 삭제 정책 추가

### Phase

**Phase 1** (즉시 구현, 보안 필수)

---

## Decision 2: 부서별 권한 스코핑 (Department-Level RBAC)

**Topic:** MANAGER 권한 범위 (모든 고객 vs 부서별 제한)
**카테고리:** Architecture, RBAC
**우선순위:** HIGH
**원본 PRD 입장:** Phase 1은 전역 권한, Phase 2에서 부서별 제한 (Option A)
**Discussion Topic 추천:** Option C (혼합 접근) 또는 명확화 필요

### 최종 결정

**Phase 1: 명확한 단계별 권한 정책 정의**

```
Phase 1 (현재):
- USER: 모든 고객 조회 (read-only)
- MANAGER: 모든 고객 CRUD (제약 없음, 2071_01_entity 구현 시점에서는 department 미포함)
- ADMIN: 모든 권한 + DELETE

Phase 2 (향후 - 별도 PRD):
- MANAGER: 자신의 부서 또는 자신이 등록한 고객만 수정
  * 읽기: 여전히 전체 조회 가능 (정보 공유)
  * 쓰기: department_id 또는 created_by_id 필터 적용
```

### 근거 (Rationale)

1. **Phase 1 포커스:** 초기 팀 규모 작음 (협업 용이), 기본 CRM 기능 완성 우선
2. **Phase 2 마이그레이션 계획:** 부서 엔티티 구현 후 권한 로직 추가 (독립적 변경)
3. **Data Model 순서:** Department 엔티티가 먼저 정의되어야 MANAGER 스코핑 가능
4. **명확성:** 모호한 "Phase 2에서 정의"보다 구체적 단계별 정의

### 구현 영향 (Implementation Impact)

**Phase 1:**
- API 권한 검증: 기존대로 (MANAGER는 모든 고객 CRUD 가능)
- 테스트: 권한 검증 통과

**Phase 2 (별도 PRD에서):**
- API 수정: 권한 필터 추가
  ```typescript
  // Phase 2에서 추가될 로직
  const canUpdateCustomer = (userId, customerId) => {
    const customer = await getCustomer(customerId);
    const user = await getUser(userId);
    return user.departmentId === customer.departmentId ||
           customer.createdById === userId;
  };
  ```
- Database: customer 테이블에 department_id 필드 추가 (선택사항)
- 마이그레이션: 기존 MANAGER의 department 자동 할당 정책

### 영향 범위 (Affected Sections)

- Section 5.5 (Authentication & Authorization): Phase 1/2 명확한 구분 추가
- Section 5.6 (부서 권한 스코핑): "Phase 2 이후" → "Phase 2 PRD 별도 정의" 명시
- Section 9 (Open Questions): "부서별 권한 스코핑 방식" → 제거 (결정됨)

### Phase

**Phase 1** (정책 명시) / **Phase 2** (구현)

---

## Decision 3: CustomerHistory 추적 범위 (Audit Log Scope)

**Topic:** 어떤 필드 변경을 추적할 것인가
**카테고리:** Database, Audit Trail
**우선순위:** MEDIUM
**원본 PRD 입장:** 모든 필드 추적 (Option A)
**Discussion Topic 추천:** Option A 유지 (타당)

### 최종 결정

**모든 필드 변경을 JSON으로 기록 (Option A 유지)**

```json
{
  "change_type": "UPDATE",
  "changed_fields": {
    "name": { "before": "삼성전자", "after": "삼성전자 서울" },
    "classification": { "before": "END_USER", "after": "RESELLER" },
    "memo": { "before": "...", "after": "새로운 메모" }
  },
  "changed_by_id": 5,
  "changed_at": "2026-01-25T15:30:00Z"
}
```

### 근거 (Rationale)

1. **Enterprise Audit 요구사항:** 모든 필드 변경 기록은 규제/규정 준수 필수
2. **저장소 영향 최소:** 고객 100개 × 이력 10개 = 1MB 정도 (무시할 수 있는 수준)
3. **분석 가능성:** 미래 고객 분석/BI 시 완전한 감사 추적 필요
4. **필터링 유연성:** 필요시 UI에서 "주요 필드만 표시" 가능

### 구현 영향 (Implementation Impact)

**Entity 정의:**
```typescript
interface CustomerHistory {
  id: number;
  customerId: number;
  changeType: 'CREATE' | 'UPDATE' | 'DELETE' | 'CONTACT_ADD' | 'CONTACT_DELETE';
  changedFields: Record<string, { before: any; after: any }>;
  changedById: number;
  changedAt: Date;
}
```

**API 구현:**
- `GET /api/customers/[id]/history` → 변경 이력 반환
- 필터링: 선택적 필드만 보기 (프론트엔드에서 구현)

### 영향 범위 (Affected Sections)

- Section 5.3 (Database): CUSTOMER_HISTORY 스키마 명시 (이미 포함)
- Section 4.1 (In-Scope): "모든 필드 추적" 명시

### Phase

**Phase 1** (core feature)

---

## Decision 4: CustomerContact와 Employee 별도 관리

**Topic:** CustomerContact를 Employee와 동기화할 것인가
**카테고리:** Architecture, Data Model
**우선순위:** MEDIUM
**원본 PRD 입장:** 완전히 독립적 (Option A)
**Discussion Topic 추천:** Option B (Phase 2에서 검토)

### 최종 결정

**Phase 1: 완전히 독립적인 엔티티로 유지 (Option A)**

- CustomerContact와 Employee는 FK 없음
- 고객사 담당자는 시스템 직원과 무관하게 관리
- Phase 2에서 선택적으로 employee_id (nullable FK) 추가 검토

### 근거 (Rationale)

1. **도메인 분리:** 고객사 담당자 ≠ 시스템 직원 (다른 생명주기)
2. **유연성:** 외부 담당자도 자유롭게 등록 가능
3. **Phase 1 복잡도 감소:** 동기화 로직 불필요
4. **Phase 2 확장성:** 나중에 employee_id 추가 가능 (마이그레이션 용이)

### 구현 영향 (Implementation Impact)

**Entity 정의 (변경 없음):**
```typescript
interface CustomerContact {
  id: number;
  customerId: number; // FK → CUSTOMER (ON DELETE RESTRICT)
  name: string;
  title: string;
  department: string;
  email: string;
  phone: string;
  description: string;
  primaryContact: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null; // soft delete
  // 추가 예정 (Phase 2):
  // employeeId?: number; // nullable FK → EMPLOYEE
}
```

**API (변경 없음):**
- POST/PUT /api/customers/[id]/contacts → 직접 입력

### 영향 범위 (Affected Sections)

- Section 5.3 (Database): 현재 정의 유지
- 변경 없음

### Phase

**Phase 1** / **Phase 2** (선택적 확장)

---

## Decision 5: 고객 코드 생성 전략 (Customer Code Generation)

**Topic:** 고객 코드 자동 생성 방식 (Oracle SEQUENCE vs 애플리케이션)
**카테고리:** Database, Architecture
**우선순위:** MEDIUM
**원본 PRD 입장:** Oracle SEQUENCE (Option A)
**Discussion Topic 추천:** Option A 유지 (타당)

### 최종 결정

**Oracle SEQUENCE 사용 (Option A 유지)**

```sql
CREATE SEQUENCE cust_code_seq
  INCREMENT BY 1
  START WITH 1
  CACHE 20
  NOCYCLE;
```

코드 생성: `CUST-{5자리 zero-padded seq}`
예: CUST-00001, CUST-00002, ...

### 근거 (Rationale)

1. **동시성 보장:** 데이터베이스 레벨의 원자적 일관성
2. **sunjin-erp 표준:** Oracle XE 사용 (다른 모듈과 일관성)
3. **구현 표준:** TypeORM migration에서 raw SQL로 처리 가능
4. **운영 편의성:** DBA가 시퀀스 값 관리 가능

### 구현 영향 (Implementation Impact)

**TypeORM Migration:**
```typescript
// src/database/migrations/[timestamp]-CreateCustomerTable.ts
await queryRunner.query(`
  CREATE SEQUENCE cust_code_seq
  INCREMENT BY 1
  START WITH 1
  CACHE 20
  NOCYCLE
`);

// INSERT 시
INSERT INTO customer (code, ...)
VALUES ('CUST-' || LPAD(cust_code_seq.nextval, 5, '0'), ...);
```

**TypeORM Entity:**
```typescript
@Column('varchar2')
code: string; // 자동 생성, unique
```

**Service Layer:**
```typescript
async createCustomer(data) {
  // code는 데이터베이스에서 자동 생성
  const result = await this.customerRepository.save({
    ...data,
    // code 필드는 INSERT에서 SEQUENCE 사용
  });
  return result;
}
```

### 영향 범위 (Affected Sections)

- Section 5.3 (Database): 현재 정의 유지 (SEQUENCE 명시)
- Section 4.1 (In-Scope): "코드 생성 규칙" 명시
- 변경 없음

### Phase

**Phase 1**

---

## Decision 6: 부분 고유 인덱스 (Partial Unique Index)

**Topic:** 고객명 중복 방지 방식 (soft delete 제외)
**카테고리:** Database
**우선순위:** MEDIUM
**원본 PRD 입장:** Partial Unique Index (Option A)
**Discussion Topic 추천:** Option A 유지 (타당)

### 최종 결정

**Partial Unique Index 사용 (Option A 유지)**

```sql
CREATE UNIQUE INDEX idx_customer_name_active
ON CUSTOMER(name)
WHERE deleted_at IS NULL;
```

효과: 활성 고객 중에서만 고객명 유일성 보장 (삭제된 고객명 재사용 가능)

### 근거 (Rationale)

1. **데이터베이스 무결성:** 애플리케이션 검증보다 확실 (race condition 방지)
2. **Oracle 표준:** Oracle 21c에서 완전 지원
3. **동시성 안정성:** 동시 다중 등록 시 고객명 중복 불가능
4. **복구 유연성:** soft delete 고객과 같은 이름 재등록 가능

### 구현 영향 (Implementation Impact)

**TypeORM Migration:**
```typescript
await queryRunner.query(`
  CREATE UNIQUE INDEX idx_customer_name_active
  ON CUSTOMER(name)
  WHERE deleted_at IS NULL
`);
```

**애플리케이션 검증 (보조):**
- 데이터베이스 제약으로 일차 보호
- 중복 입력 시 → 데이터베이스 오류 → HTTP 409 응답
- 사용자 메시지: "고객명이 이미 존재합니다"

### 영향 범위 (Affected Sections)

- Section 5.3 (Database): 현재 정의 유지 (partial index 명시)
- 변경 없음

### Phase

**Phase 1**

---

## Decision 7: 캐시 전략 (Caching Strategy)

**Topic:** TanStack Query staleTime/gcTime 설정
**카테고리:** Performance, State Management
**우선순위:** MEDIUM
**원본 PRD 입장:** 보수적 캐싱 (Option A)
**Discussion Topic 추천:** Option A 유지 (타당)

### 최종 결정

**보수적 캐싱 정책 유지 (Option A)**

```typescript
const customerQueryOptions = {
  'customers-list': {
    staleTime: 5 * 60 * 1000,  // 5분
    gcTime: 30 * 60 * 1000     // 30분
  },
  'customers-detail': {
    staleTime: 10 * 60 * 1000,   // 10분
    gcTime: 30 * 60 * 1000       // 30분
  },
  'customers-search': {
    staleTime: 1 * 60 * 1000,    // 1분
    gcTime: 10 * 60 * 1000       // 10분
  }
};
```

### 근거 (Rationale)

1. **데이터 신선도 우선:** 초기 구현은 보수적으로 (성능은 측정 후 최적화)
2. **협업 환경:** 여러 사용자가 동시 작업 시 최신 데이터 중요
3. **운영 부하 수용:** 초기 팀 규모 작음 (API 호출 증가 감당 가능)
4. **Phase 2 최적화:** 성능 메트릭 기반 adaptive caching 도입 검토

### 구현 영향 (Implementation Impact)

**TanStack Query Hook:**
```typescript
export const useCustomers = (options?) => {
  return useQuery({
    queryKey: ['customers', 'list'],
    queryFn: () => fetch('/api/customers'),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    ...options
  });
};
```

**부분 무효화:**
```typescript
// 고객 1 수정 후
queryClient.invalidateQueries({
  queryKey: ['customers', 'detail', customerId],
  exact: true,  // 해당 고객만 무효화
});

// 또는 전체 목록도 재페치
queryClient.invalidateQueries({
  queryKey: ['customers', 'list'],
  refetchType: 'stale',  // 백그라운드에서 리페치
});
```

### 영향 범위 (Affected Sections)

- Section 5.4 (State Management): 현재 정의 유지
- 변경 없음

### Phase

**Phase 1** (Phase 2에서 최적화 검토)

---

## Decision 8: MANAGER 권한 범위 재검토 (MANAGER Scope)

**Topic:** MANAGER별 작업 권한 분리 필요성
**카테고리:** RBAC, Architecture
**우선순위:** HIGH
**원본 PRD 입장:** 균등한 MANAGER 권한 (모든 POST/PUT/DELETE)
**Discussion Topic 추천:** Option B (작업별 권한 분리 - DELETE 제외)

### 최종 결정

**DELETE 권한 분리: ADMIN만**

```
USER: 조회 전용
MANAGER:
  ✓ GET /api/customers (모두)
  ✓ POST /api/customers (고객 등록)
  ✓ PUT /api/customers/[id] (고객 수정)
  ✓ POST /api/customers/[id]/contacts (담당자 추가)
  ✓ PUT /api/customers/[id]/contacts/[contactId] (담당자 수정)
  ✓ DELETE /api/customers/[id]/contacts/[contactId] (담당자 삭제)
  ✗ DELETE /api/customers/[id] (고객 삭제 - 불가)

ADMIN: 모두 가능 + DELETE /api/customers/[id]
```

### 근거 (Rationale)

1. **Decision 1과 일관성:** 고객 삭제는 ADMIN만 (이미 결정)
2. **담당자 삭제는 허용:** 담당자는 고객과 달리 임시 정보 (프로젝트와 직접 연결 없음)
3. **권한 세분화:** 등록/수정/삭제 권한 구분으로 실수 방지

### 구현 영향 (Implementation Impact)

**API Route Handlers:**
```typescript
// DELETE /api/customers/[id] - 고객 삭제
export async function DELETE(req: Request, { params }: RouteContext) {
  const session = await getServerSession();

  // 권한 검증: ADMIN만
  if (!session || session.user.role !== 'ADMIN') {
    return new Response('Forbidden', { status: 403 });
  }

  // soft delete 처리
  const customerId = params.id;
  await customerRepository.softDelete(customerId);

  return new Response(JSON.stringify({ success: true }), { status: 200 });
}

// DELETE /api/customers/[id]/contacts/[contactId] - 담당자 삭제 (MANAGER 가능)
export async function DELETE(req: Request, { params }: RouteContext) {
  const session = await getServerSession();

  // 권한 검증: MANAGER 이상
  if (!session || !['MANAGER', 'ADMIN'].includes(session.user.role)) {
    return new Response('Forbidden', { status: 403 });
  }

  // soft delete 처리
  const { id: customerId, contactId } = params;
  await customerContactRepository.softDelete(contactId);

  return new Response(JSON.stringify({ success: true }), { status: 200 });
}
```

**프론트엔드:**
```typescript
// 버튼 표시 제어
{session?.user.role === 'ADMIN' && (
  <Button onClick={handleDelete} variant="destructive">
    고객 삭제
  </Button>
)}
```

### 영향 범위 (Affected Sections)

- Section 5.2 (API Route Handlers): 테이블 업데이트
  - `DELETE /api/customers/[id]` 권한 → ADMIN only
  - `DELETE /api/customers/[id]/contacts/[contactId]` 권한 → MANAGER (유지)
- Section 4.1 (In-Scope): RBAC 권한 명시 정확화
- Section 8 (Security Considerations): 권한 정책 추가

### Phase

**Phase 1** (즉시 구현, Decision 1과 함께)

---

## Decision 9: 담당자 주요 담당자 플래그 (Primary Contact Flag)

**Topic:** 고객당 primary_contact 관리 방식
**카테고리:** Database, UX
**우선순위:** LOW
**원본 PRD 입장:** 하나의 primary contact (Option A)
**Discussion Topic 추천:** Option A 유지 (타당)

### 최종 결정

**고객당 최대 1명 primary contact (Option A 유지)**

```typescript
interface CustomerContact {
  id: number;
  customerId: number;
  name: string;
  title: string;
  primaryContact: boolean;  // 고객당 최대 1명만 true
  // ...
}
```

규칙:
- 새 담당자를 primary로 설정 → 기존 primary 자동 false
- 고객 목록에서 primary 담당자 표시 가능

### 근거 (Rationale)

1. **명확성:** "대표 담당자" 개념 일관성
2. **단순성:** 구현/유지보수 용이
3. **UX:** 고객 목록에서 한 명만 표시 가능
4. **확장성:** Phase 2에서 여러 primary 필요 시 변경 가능

### 구현 영향 (Implementation Impact)

**Entity:**
```typescript
@Column('boolean', { default: false })
primaryContact: boolean;

// Unique constraint (고객당 최대 1명만 true)
@Index('idx_customer_primary_contact',
  { where: 'primary_contact = true AND deleted_at IS NULL' }
)
```

**Validation Logic:**
```typescript
async updateContactAsPrimary(customerId: number, contactId: number) {
  // 기존 primary 해제
  await customerContactRepository.update(
    { customerId, primaryContact: true },
    { primaryContact: false }
  );

  // 새로운 primary 설정
  await customerContactRepository.update(
    { id: contactId },
    { primaryContact: true }
  );
}
```

### 영향 범위 (Affected Sections)

- Section 5.3 (Database): 현재 정의 유지
- 변경 없음

### Phase

**Phase 1**

---

## Decision 10: 메모 히스토리 추적 (Memo History)

**Topic:** 고객 메모 변경 이력 추적 방식
**카테고리:** Audit Trail, Database
**우선순위:** LOW
**원본 PRD 입장:** CustomerHistory에 포함 (Phase 2)
**Discussion Topic 추천:** Option A 유지 (타당)

### 최종 결정

**Phase 1: 메모 필드만, 이력은 기본적으로만 추적**
**Phase 2: 상세한 메모 이력 추적 검토**

```
Phase 1:
- 메모: 최신 버전만 저장 (CLOB)
- 감사: CustomerHistory에서 memo 필드 포함 (변경 기록)
  * 하지만 memo 업데이트 시 이력 자동 기록 (별도 처리 불필요)

Phase 2 (선택사항):
- 별도 CUSTOMER_MEMO_HISTORY 테이블 고려
- "메모 변경 이력 조회" 기능 추가 시 검토
```

### 근거 (Rationale)

1. **Phase 1 범위 최소화:** 메모는 자유 텍스트 (감사 우선순위 낮음)
2. **통합 감사 로그:** CustomerHistory에서 메모 변경도 기록 (기본 감사 충족)
3. **성능:** 별도 테이블 불필요 (초기 구현 간단)
4. **유연성:** Phase 2에서 필요 시 추가 가능

### 구현 영향 (Implementation Impact)

**Phase 1:**
```typescript
// 메모 수정 시
async updateCustomer(id: number, data: UpdateCustomerDto) {
  const existingCustomer = await this.customerRepository.findOne(id);

  // CustomerHistory에 모든 변경 기록 (메모 포함)
  if (data.memo !== existingCustomer.memo) {
    await this.customerHistoryRepository.save({
      customerId: id,
      changeType: 'UPDATE',
      changedFields: {
        memo: {
          before: existingCustomer.memo,
          after: data.memo
        }
      },
      changedById: userId,
      changedAt: new Date()
    });
  }

  // 메모 업데이트
  await this.customerRepository.update(id, { memo: data.memo });
}
```

**UI (메모 편집자 정보):**
```typescript
// 상세 페이지에서 표시
<div>
  메모: {customer.memo}
  <small>마지막 편집: {customer.updatedAt} ({editor.name})</small>
</div>
```

**Phase 2 (구현 예정):**
```sql
-- CUSTOMER_MEMO_HISTORY 테이블 (선택)
CREATE TABLE CUSTOMER_MEMO_HISTORY (
  id NUMBER PRIMARY KEY,
  customer_id NUMBER NOT NULL,
  memo CLOB,
  changed_at TIMESTAMP,
  changed_by_id NUMBER
);
```

### 영향 범위 (Affected Sections)

- Section 4.1 (In-Scope): "메모 히스토리는 Phase 2" 명시
- Section 5.3 (Database): 현재 정의 유지
- Section 8 (Security Considerations): 감사 정책 명시

### Phase

**Phase 1** (기본) / **Phase 2** (선택적 확장)

---

## Summary: 변경 사항 정리

### Phase 1에 적용될 변경 (9개 결정)

**HIGH 우선순위 (즉시 구현):**
1. ✓ DELETE 권한 → ADMIN only (Decision 1)
2. ✓ 부서별 권한 정책 명확화 (Decision 2 - Phase 1 명시)
3. ✓ MANAGER 권한 분리: DELETE 제외 (Decision 8)

**MEDIUM 우선순위 (Phase 1 통합):**
4. ✓ CustomerHistory 모든 필드 추적 (Decision 3 - 유지)
5. ✓ CustomerContact 독립 엔티티 (Decision 4 - 유지)
6. ✓ Oracle SEQUENCE 고객 코드 (Decision 5 - 유지)
7. ✓ Partial Unique Index (Decision 6 - 유지)
8. ✓ 보수적 캐시 전략 (Decision 7 - 유지)
9. ✓ Primary contact 하나 제한 (Decision 9 - 유지)

**LOW 우선순위:**
10. ✓ 메모 히스토리 통합 기록 (Decision 10 - Phase 1 기본, Phase 2 확장)

### Phase 2에 연기되거나 계획된 항목

- **Department-level RBAC:** 부서 엔티티 구현 후 권한 필터 추가 (Decision 2)
- **Employee 참조 추가:** nullable FK 추가 검토 (Decision 4)
- **Adaptive Caching:** 성능 메트릭 기반 최적화 (Decision 7)
- **메모 별도 히스토리:** CUSTOMER_MEMO_HISTORY 테이블 (Decision 10)

### 원본 PRD에서 변경 없음 (5개)

- CustomerHistory 범위 (모든 필드) - 결정됨
- CustomerContact 독립성 - 확정됨
- 고객 코드 생성 (SEQUENCE) - 확정됨
- Partial Unique Index - 확정됨
- 캐시 전략 - 확정됨

---

## 영향 범위: PRD 섹션별 수정 필요

| 섹션 | 변경 내용 | 우선순위 |
|------|---------|---------|
| 3 (User Stories) | US-6: 대상 사용자 "ADMIN" 명시 | HIGH |
| 4.1 (In-Scope) | RBAC 권한 명시 정확화 (DELETE ADMIN) | HIGH |
| 5.2 (API Routes) | 권한 테이블: DELETE /api/customers/[id] → ADMIN | HIGH |
| 5.5 (Authentication) | Phase 1/2 권한 정책 명확화 | HIGH |
| 5.6 (부서 스코핑) | "Phase 2 이후" 명시 강화 | MEDIUM |
| 8 (Security) | ADMIN-only 삭제 정책, 권한 분리 | MEDIUM |
| 9 (Open Questions) | 부서 스코핑, 담당자 정의 제거 | MEDIUM |

---

**작성자:** Claude Code (Mediator Agent)
**완료일:** 2026-01-25 23:50:00 KST
**상태:** Ready for PRD v2 Update
