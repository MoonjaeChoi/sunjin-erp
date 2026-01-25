<!-- Generated: 2026-01-25 22:15:00 KST -->

# Critical Review: 유지보수 고객 관리 (2061 PRD)

**Review Date:** 2026-01-25
**Reviewed Against:** sunjin-erp Architecture Standards (CLAUDE.md)
**Document Version:** v1.0

---

## Executive Summary

The 2061 PRD (Maintenance Customer Management) is well-structured and comprehensive, covering core CRUD operations, file management, and lifecycle tracking for maintenance contracts. However, several critical issues require resolution before implementation can proceed.

**Overall Assessment:**
- ✓ Good alignment with Next.js App Router patterns
- ✓ Proper database schema design (Oracle XE 21c compliant)
- ✓ Clear authentication/authorization framework
- ⚠ Several ambiguities in edge cases and state management
- ✗ Missing critical UI/UX specifications and API response contracts

**Critical Issues Found:** 11
**High Priority:** 6
**Medium Priority:** 3
**Low Priority:** 2

---

## Critical Issues Summary Table

| # | Issue | Category | Priority | Status |
|---|-------|----------|----------|--------|
| 1 | Ambiguous contract status transition rules | Clarity | HIGH | Needs Clarification |
| 2 | Missing API response contracts and error handling | API Design | HIGH | Not Specified |
| 3 | Unclear file upload & disk storage strategy | Architecture | HIGH | Incomplete |
| 4 | No pagination strategy for history/attachments | Performance | HIGH | Missing |
| 5 | Contract renewal logic undefined | Business Logic | HIGH | Out-of-Scope Gap |
| 6 | Missing conflict handling for concurrent updates | Data Integrity | HIGH | Not Addressed |
| 7 | Attachment deletion cascading not clarified | Database Design | MEDIUM | Incomplete |
| 8 | Query filtering performance optimization missing | Performance | MEDIUM | Not Addressed |
| 9 | File download authorization not specified | Security | MEDIUM | Incomplete |
| 10 | Zustand vs useState state management unclear | State Management | MEDIUM | Ambiguous |
| 11 | Testing strategy not defined | QA | LOW | Missing |

---

## Detailed Critical Review

### 1. Clarity & Ambiguity

#### Issue 1.1: Ambiguous Contract Status Transition Rules (HIGH)

**Problem:**
Section 7 defines state transitions but leaves several scenarios undefined:

```
User Story 7 defines:
- 활성 → 종료 (contract expiration)
- 활성 → 갱신예정 (3 months before expiration)
- 갱신예정 → 활성 (renewal complete)
- 종료 → 활성 (re-contract)
```

**Ambiguities:**
1. **Automatic vs Manual Status Changes**: Are status transitions automatic (scheduled job) or manual only? PRD doesn't specify.
   - If automatic: Need scheduled job implementation
   - If manual: Who triggers "갱신예정" state? Business logic timing?

2. **"갱신예정" Entry Point**: The PRD states "갱신예정 (3개월 전)" but doesn't clarify:
   - Is this system-triggered on contract load?
   - Is this a MANAGER action?
   - What happens if contract hits 3-month mark with no state change?

3. **Invalid Transitions Not Defined**:
   - Can "종료" go directly to "종료"? (idempotent?)
   - Can "갱신예정" go to "종료"? (renewal failed?)
   - What state represents "suspended" vs "expired"?

4. **State Change Audit**: User Story 7 states "사유 필수" (reason required) but:
   - No reason validation (min/max length)
   - Reason stored but not queried in detail view

**Recommendation:**
Add explicit state machine diagram:

```
활성 --(3개월 전)--> 갱신예정
  |
  +---(만료 시)--> 종료
  |
  +---(수동 변경)--> 종료

갱신예정 --(갱신 완료)--> 활성
         --(갱신 미완료)--> 종료

종료 --(재계약)--> 활성
```

**Priority:** HIGH - Blocker for renewal feature implementation

---

#### Issue 1.2: "담당자" (Assigned Employee) Ambiguity (HIGH)

**Problem:**
- `assigned_employee_id` is defined as sales employee, but no constraints or validation
- No specification on:
  - Can employee be deleted after contract assignment? (FK ON DELETE RESTRICT prevents this, but not mentioned)
  - What happens if assigned employee leaves company?
  - Can MANAGER change assigned employee for another MANAGER's contracts?

**Recommendation:**
Clarify RBAC: "MANAGER can only modify contracts assigned to them or their department"

**Priority:** HIGH - Authorization gap

---

### 2. Completeness & Edge Cases

#### Issue 2.1: Missing Pagination Strategy for Nested Resources (HIGH)

**Problem:**
- `MaintenanceContractHistory` and `MaintenanceContractAttachment` have no pagination defined
- User Story 3 shows "첨부 문서 목록" and "갱신 이력" but:
  - No limit mentioned (user could have 100+ attachments)
  - No API response contract defined
  - Detail page loading could be slow

**Current Spec:**
```
GET /api/maintenance/[id]/history — Returns all history
GET /api/maintenance/[id]/attachments — Returns all attachments (via GET /api/maintenance/[id])
```

**Issue:**
- Violates pagination best practice
- Large history/attachment lists could cause N+1 query problems

**Recommendation:**
- Add limit: 10 attachments per contract, latest first
- Add limit: 20 history records per page
- Return paginated response: `{ items: [], total, hasMore }`

**Priority:** HIGH - Performance & UX impact

---

#### Issue 2.2: No Duplicate Contract Detection (MEDIUM)

**Problem:**
- No validation to prevent duplicate contracts for same customer + date range
- User could accidentally create duplicate contracts
- No mention in acceptance criteria

**Edge Case:**
```
Contract 1: Customer A, 2026-01-01 to 2026-12-31 (ACTIVE)
Contract 2: Customer A, 2026-01-01 to 2026-12-31 (Attempted create - should reject?)
```

**Recommendation:**
- Add business logic: "One active contract per customer per date range"
- Or clarify: Multiple concurrent contracts allowed (e.g., different maintenance types)

**Priority:** MEDIUM - Data quality

---

#### Issue 2.3: Contract Renewal Edge Cases Not Addressed (HIGH)

**Problem:**
- "갱신" is out-of-scope (Section 4.2)
- But User Story 9 tracks renewal history
- And User Story 7 mentions "갱신예정" state
- Contradiction: How do you reach "갱신예정" without renewal logic?

**Current Gap:**
- No API endpoint for renewal
- No form to renew contract
- History `change_type='갱신'` possible but creation path unknown

**Recommendation:**
- Either: Move renewal to Phase 1 scope (POST /api/maintenance/[id]/renew)
- Or: Clarify that "갱신" means manual contract re-creation + linked history

**Priority:** HIGH - Scope gap

---

#### Issue 2.4: File Upload Edge Cases Missing (MEDIUM)

**Problem:**
User Story 6 states: "최대 10MB, 파일당 5개 한정" (max 10MB each, 5 files limit)

**Missing Specs:**
1. **What if file exists with same name?** (overwrite? versioning?)
2. **What triggers cleanup of failed uploads?** (orphaned files in disk)
3. **What happens if upload fails mid-stream?** (user retries?)
4. **File format validation**: "PDF, DOCX, DOC" — but no MIME type detection spec
5. **Duplicate file handling**: Same file uploaded twice?

**Recommendation:**
- Add file versioning strategy
- Add MIME type + magic byte validation
- Add cleanup strategy for orphaned uploads

**Priority:** MEDIUM - Security & data quality

---

### 3. Architecture Compliance

#### Issue 3.1: Server Component Data Fetching Strategy Not Specified (HIGH)

**Problem:**
PRD states:
- `maintenance/page.tsx`: Server Component
- `maintenance/[id]/page.tsx`: Server Component

But doesn't specify:
1. **Data Fetching Pattern**: Direct DB query or API call?
2. **Error Handling**: What if DB connection fails?
3. **Authorization**: Where is role check performed? Server component or API?

**Current CLAUDE.md says:**
- Server components should fetch data directly (no API call)
- Client components use TanStack Query

**Gap in PRD:**
- No mention of `getServerSession()` in server components
- No error boundary strategy
- No fallback UI

**Recommendation:**
Clarify Server Component pattern:

```typescript
// src/app/(main)/maintenance/page.tsx
export default async function MaintenancePage() {
  const session = await getServerSession(); // Auth check
  if (!session || !['MANAGER', 'ADMIN'].includes(session.user.role)) {
    redirect('/'); // Or render read-only
  }

  const contracts = await db.query(...); // Direct DB
  return <MaintenanceListView contracts={contracts} />;
}
```

**Priority:** HIGH - Architecture clarity

---

#### Issue 3.2: Client vs Server Component Boundary Unclear (MEDIUM)

**Problem:**
Component file structure (Section 10) lists:

```
MaintenanceContractDetailView.tsx (SC/CC)  ← Hybrid?
MaintenanceContractAttachments.tsx (CC)
MaintenanceContractHistory.tsx (CC)
```

**Ambiguity:**
- "SC/CC" in MaintenanceContractDetailView is confusing
- Should be either:
  - SC: Fetch data, pass to CC children
  - CC: Use TanStack Query only

**Current CLAUDE.md:**
- Avoid mixing Server & Client components
- Server: Fetch + pass data
- Client: React state + TanStack Query

**Recommendation:**
Clarify file structure:

```typescript
// SC - Fetches data
// mainenance/[id]/page.tsx (Server Component)
const contracts = await fetchContractDetail(id);
return <MaintenanceContractDetailView contract={contracts} />;

// CC - Receives data, handles mutations
// MaintenanceContractDetailView.tsx (Client Component)
'use client';
export default function MaintenanceContractDetailView({ contract }) {
  const mutation = useUpdateMaintenanceContractMutation();
  // ...
}
```

**Priority:** MEDIUM - Architecture clarity

---

### 4. Database Design

#### Issue 4.1: Attachment Cascade Deletion Not Addressed (MEDIUM)

**Problem:**
`MaintenanceContractAttachment` FK:
```
maintenance_contract_id → MaintenanceContract.id (ON DELETE RESTRICT)
```

**Current Behavior:**
- Cannot delete MaintenanceContract if attachments exist
- But User Story 10 allows deletion

**Gap:**
- No mention of handling cascade for attachments
- Should attachments be soft-deleted when contract is deleted?
- Or should deletion fail if attachments exist?

**Recommendation:**
Add rule:
1. Option A: "When contract deleted, soft-delete all attachments too"
   - Add trigger in migration
2. Option B: "Prevent deletion if attachments exist"
   - Add validation in API handler

**Priority:** MEDIUM - Data integrity

---

#### Issue 4.2: Missing Index Strategy for Query Performance (HIGH)

**Problem:**
Section 7 mentions performance goals:
- API Response Time: p95 < 200ms
- File Upload: < 5 seconds

But no index strategy defined for:
- `MaintenanceContract.customer_id` (filter by customer)
- `MaintenanceContract.assigned_employee_id` (filter by manager)
- `MaintenanceContract.contract_status` (filter by status)
- `MaintenanceContract.end_date` (sort by expiration)
- `MaintenanceContract.deleted_at` (exclude soft-deleted)

**Oracle Index Requirements:**
```sql
CREATE INDEX idx_maintenance_contract_customer_id
  ON MaintenanceContract(customer_id, deleted_at);

CREATE INDEX idx_maintenance_contract_end_date
  ON MaintenanceContract(end_date DESC, deleted_at);

CREATE INDEX idx_maintenance_contract_status
  ON MaintenanceContract(contract_status, deleted_at);
```

**Recommendation:**
Add index specification to migration. Include composite indices for common filter combinations.

**Priority:** HIGH - Performance requirement

---

#### Issue 4.3: History Table Design - Missing Immutability Specification (MEDIUM)

**Problem:**
`MaintenanceContractHistory` includes `deleted_at` but history records should be immutable.

**Ambiguity:**
- Should history ever be deleted? (audit trail)
- If yes, why soft-delete instead of just refusing delete?

**Recommendation:**
Add DB constraint: History cannot be deleted (no UPDATE/DELETE allowed on `MaintenanceContractHistory`)

Or clarify: History is immutable, `deleted_at` is just for consistency (never used)

**Priority:** MEDIUM - Data integrity

---

### 5. Authentication & Authorization

#### Issue 5.1: Authorization Granularity Not Sufficient (HIGH)

**Problem:**
Current RBAC (Section 5.5):
- USER: Read-only (GET)
- MANAGER: CRUD on contracts (but which ones?)
- ADMIN: All operations

**Gaps:**
1. Can MANAGER modify contracts assigned to other MANAGERs?
2. Can MANAGER delete contracts (User Story 10 is ADMIN only, but PRD doesn't enforce)?
3. Can USER upload files? (PRD says "파일 첨부: MANAGER/ADMIN" but needs enforcement)

**Current Spec Issue:**
User Story 6: "역할: MANAGER / ADMIN"
But API implementation must enforce:
- File upload: MANAGER+ only (not USER)
- File deletion: ADMIN only

**Recommendation:**
Add explicit authorization rules to each API endpoint:

```
GET /api/maintenance — USER+ (all roles)
POST /api/maintenance — MANAGER+
PUT /api/maintenance/[id] — MANAGER+ (+ ownership check?)
DELETE /api/maintenance/[id] — ADMIN only
POST /api/maintenance/[id]/attachments — MANAGER+
DELETE /api/maintenance/[id]/attachments/[id] — ADMIN only
POST /api/maintenance/[id]/status — MANAGER+
```

**Priority:** HIGH - Security requirement

---

#### Issue 5.2: File Download Authorization Not Specified (MEDIUM)

**Problem:**
User Story 6: "다운로드, 삭제(ADMIN만) 가능"

**Ambiguity:**
- Who can download files? All authenticated users? Only contract participants?
- Should there be row-level access control? (Can USER see all contracts?)

**Recommendation:**
Clarify: "File download allowed for any authenticated user with VIEW permission on contract"

**Priority:** MEDIUM - Security specification

---

### 6. State Management

#### Issue 6.1: Zustand vs useState Pattern Unclear (MEDIUM)

**Problem:**
Section 5.4 states:
- Client State: Zustand OR React useState (unclear which)
- "폼 입력 상태", "필터 선택값", "페이지네이션 상태"

**Current CLAUDE.md Philosophy:**
- Zustand: Client-only UI state (sidebar open/close)
- React Hook Form: Form state (not Zustand)
- TanStack Query: Server state (filters, pagination, data)

**Gap:**
- Should filters be in Zustand or TanStack Query?
- Should pagination state be in URL query params (recommended) or Zustand?

**Recommendation:**
Clarify state management:
```
✓ Form inputs → React Hook Form (local)
✓ Filters → URL query params (shared via TanStack Query)
✓ Pagination → URL query params (page=1&size=20)
✗ Zustand for contracts list (TanStack Query is source of truth)
```

**Priority:** MEDIUM - Architecture clarity

---

#### Issue 6.2: Optimistic Updates Not Specified (MEDIUM)

**Problem:**
PRD mentions file upload but doesn't specify:
- Should file appear in list immediately (optimistic)?
- Or wait for server confirmation?
- What if upload fails? (rollback UI)

**Recommendation:**
Add pattern for mutations:
```typescript
// Optimistic update pattern
useMutation({
  mutationFn: uploadAttachment,
  onMutate: async (newFile) => {
    // Add to list immediately
    queryClient.setQueryData(
      ['maintenance', id, 'attachments'],
      (old) => [...old, newFile]
    );
  },
  onError: (err, vars, context) => {
    // Rollback on error
    queryClient.setQueryData(
      ['maintenance', id, 'attachments'],
      context.previousData
    );
  },
});
```

**Priority:** MEDIUM - UX specification

---

### 7. API Design

#### Issue 7.1: Missing API Response Contracts (HIGH)

**Problem:**
Section 5.2 defines endpoints but no request/response schemas:

```
GET /api/maintenance — No response structure defined
POST /api/maintenance — No response structure defined
PUT /api/maintenance/[id] — No response structure defined
```

**Missing Specs:**
1. **GET /api/maintenance** response:
   - How are filters passed? (query params?)
   - What's pagination format? (offset/limit? page/size?)
   - Response: `{ items: [], total, hasMore }` or `{ data: [] }`?

2. **POST /api/maintenance** response:
   - Full contract object returned? Or just { id }?
   - Success status code: 200 or 201?

3. **Error responses:**
   - Validation errors: what format?
   - Authorization errors: 403 or 401?
   - Server errors: 500 or custom code?

**Recommendation:**
Add API contract spec:

```typescript
// GET /api/maintenance?status=active&page=1&limit=20&sort=end_date
Response 200:
{
  data: [
    {
      id: 1,
      customer: { id: 1, name: "ABC Corp" },
      contractName: "Maintenance 2026",
      startDate: "2026-01-01",
      endDate: "2026-12-31",
      status: "ACTIVE",
      daysToExpire: 340,
      assignedEmployee: { id: 1, name: "Kim" }
    }
  ],
  pagination: { page: 1, limit: 20, total: 100, hasMore: true }
}

// Error
Response 400: { error: "VALIDATION_ERROR", details: [...] }
Response 401: { error: "UNAUTHORIZED" }
Response 500: { error: "INTERNAL_SERVER_ERROR" }
```

**Priority:** HIGH - API clarity

---

#### Issue 7.2: Query Parameter Specifications Missing (HIGH)

**Problem:**
User Story 2: "필터 적용 시 URL query parameter 업데이트"

But no spec for parameter names:

```
Should it be:
?status=ACTIVE&manager=1&customer=1&startDate=2026-01-01&endDate=2026-12-31

Or:
?contractStatus=ACTIVE&assignedEmployeeId=1&customerId=1&startDate=...

Or:
?filters[status]=ACTIVE&filters[manager]=1&...
```

**Recommendation:**
Define query params:
```
GET /api/maintenance
  ?status=ACTIVE|COMPLETED|RENEWAL_PENDING (comma-separated)
  &assignedEmployeeId=1 (single)
  &customerId=1 (single or comma-separated?)
  &contractNameSearch=ABC (wildcard)
  &startDateFrom=2026-01-01
  &startDateTo=2026-12-31
  &endDateFrom=...
  &endDateTo=...
  &sort=endDate:desc|contractName:asc
  &page=1&limit=20
```

**Priority:** HIGH - API clarity

---

#### Issue 7.3: No Batch Operations Defined (LOW)

**Problem:**
PRD doesn't mention bulk operations:
- Bulk delete contracts (by ID array)?
- Bulk status change?
- Bulk download contracts?

**Note:** Might be out-of-scope but worth noting for later enhancement

**Priority:** LOW - Future enhancement

---

### 8. UI/UX & Responsive Design

#### Issue 8.1: Missing Loading States for Attachments/History (MEDIUM)

**Problem:**
Section 6.2 mentions skeleton UI but doesn't specify:
- When loading attachment list?
- When loading history?
- When uploading file (progress)?

**Recommendation:**
Define loading states for each view:

```
Contract Detail View:
1. Load contract info → Skeleton Card
2. Load attachments list → Skeleton Table
3. Load history → Skeleton List
4. Upload file → Progress bar + spinner
5. Delete file → Confirmation + Loading
```

**Priority:** MEDIUM - UX completeness

---

#### Issue 8.2: Date Range Picker UI Not Specified (MEDIUM)

**Problem:**
Section 6 doesn't mention UI for date range filters:
- Should be dropdown, date picker, or both?
- Calendar picker (shadcn/ui Popover)?
- Preset ranges? (Last 30 days, Last Year, etc.)

**Recommendation:**
Use shadcn/ui DatePicker + Popover for range selection

**Priority:** MEDIUM - UI specification

---

#### Issue 8.3: File Download Security UI Concern (LOW)

**Problem:**
User Story 6: "다운로드 가능"

But PRD doesn't mention:
- Should download open in browser or force download?
- Should filename be sanitized?
- Should there be download audit log?

**Recommendation:**
Add spec: "Downloaded files should use Content-Disposition: attachment to force download, prevent XSS from PDF"

**Priority:** LOW - Security hardening

---

### 9. Security Considerations

#### Issue 9.1: File Path Traversal Prevention Missing (MEDIUM)

**Problem:**
Section 8 mentions: "파일명: UUID + 원본 파일명으로 저장 (경로 탈출 방지)"

But implementation details missing:
- Where are files stored? `/uploads/maintenance/[uuid]-[filename]`?
- How is symbolic link attack prevented?
- How is temp file cleanup handled?

**Recommendation:**
Add migration spec:
```sql
-- Validate file storage strategy
-- 1. Files stored outside web root: /uploads/maintenance/
-- 2. Filenames: UUID prefix (UUID-v4 + sanitized original name)
-- 3. Only admin can read raw filesystem (no direct download URL)
-- 4. Download through /api/maintenance/[id]/attachments/[id]/download handler
```

**Priority:** MEDIUM - Security hardening

---

#### Issue 9.2: Input Validation Rules Incomplete (MEDIUM)

**Problem:**
Section 8 lists input validation but incomplete:

**Current:**
- 계약명: 길이 제약 (1-255자)
- 날짜: 유효한 날짜 형식, start_date ≤ end_date
- 금액: 숫자 형식, 양수 (nullable)
- 파일: MIME 타입 검증 (PDF, DOCX), 크기 제약 (10MB)

**Missing:**
- Contract name: Allowed characters? (SQL injection risk if stored in CLOB)
- Notes field: Max length? (CLOB can be huge)
- File extension: Just check MIME type? Or also extension?
- Date format: ISO8601? ("2026-01-01" or "01/01/2026"?)
- Currency amount: Decimal places? (10.00 vs 10.5?)

**Recommendation:**
Add comprehensive validation schema (Zod or similar):

```typescript
const createContractSchema = z.object({
  customerId: z.number().int().positive(),
  contractName: z.string().min(1).max(255),
  contractType: z.string().min(1).max(50),
  startDate: z.date(),
  endDate: z.date(),
  contractAmount: z.number().positive().optional(),
  assignedEmployeeId: z.number().int().positive(),
  notes: z.string().max(4000).optional(),
}).refine(
  (data) => data.startDate <= data.endDate,
  { message: "startDate must be before endDate" }
);
```

**Priority:** MEDIUM - Security & data quality

---

#### Issue 9.3: Soft Delete Query Enforcement Not Specified (HIGH)

**Problem:**
PRD states: "소프트 삭제: `deleted_at` 설정, 목록에서 제외"

But doesn't clarify:
- Is `deleted_at IS NULL` automatically applied in all queries?
- What if developer forgets to add this filter?
- How to ensure data integrity?

**Recommendation:**
Add implementation requirement: "Use repository pattern with default scope filter"

```typescript
// All queries must exclude soft-deleted records
// Option 1: Query builder default filter
export async function findAllContracts(skip, take) {
  return db.maintenanceContract
    .find({
      where: { deletedAt: null },
      skip,
      take,
    });
}

// Option 2: Database view (preferred)
CREATE VIEW v_maintenance_contract AS
  SELECT * FROM maintenance_contract WHERE deleted_at IS NULL;
```

**Priority:** HIGH - Data integrity requirement

---

### 10. Performance & Scalability

#### Issue 10.1: No N+1 Query Prevention Strategy (HIGH)

**Problem:**
GET /api/maintenance endpoint fetches contracts with:
- customer (JOIN needed)
- assignedEmployee (JOIN needed)
- might need attachmentCount, historyCount

But no mention of:
- Eager loading strategy
- SELECT fields specification (avoid SELECT *)
- Query optimization

**Recommendation:**
Define query strategy:

```typescript
// GET /api/maintenance should use optimized query
SELECT
  c.id, c.contract_name, c.start_date, c.end_date,
  c.contract_status, c.contract_amount,
  cust.id as customer_id, cust.name as customer_name,
  emp.id as employee_id, emp.name as employee_name,
  COUNT(DISTINCT a.id) as attachment_count,
  COUNT(DISTINCT h.id) as history_count
FROM maintenance_contract c
LEFT JOIN customer cust ON c.customer_id = cust.id
LEFT JOIN employee emp ON c.assigned_employee_id = emp.id
LEFT JOIN maintenance_contract_attachment a ON c.id = a.maintenance_contract_id AND a.deleted_at IS NULL
LEFT JOIN maintenance_contract_history h ON c.id = h.maintenance_contract_id
WHERE c.deleted_at IS NULL
GROUP BY c.id, cust.id, emp.id
ORDER BY c.end_date DESC
LIMIT 20 OFFSET 0
```

**Priority:** HIGH - Performance requirement

---

#### Issue 10.2: Caching Strategy Not Defined (MEDIUM)

**Problem:**
Section 7 mentions performance goals (p95 < 200ms) but no caching strategy:
- Should contract list be cached? (How long? 5 min? 30 min?)
- Should stats be cached?
- Should attachment list be cached?

**Recommendation:**
Add TanStack Query config:
```typescript
// Suggested cache times
useMaintenanceContractList: {
  staleTime: 5 * 60 * 1000, // 5 min
  gcTime: 30 * 60 * 1000, // 30 min (formerly cacheTime)
}

useMaintenanceContractDetail: {
  staleTime: 10 * 60 * 1000, // 10 min
  gcTime: 60 * 60 * 1000, // 1 hour
}

useMaintenanceContractStats: {
  staleTime: 15 * 60 * 1000, // 15 min
  gcTime: 60 * 60 * 1000, // 1 hour
}
```

**Priority:** MEDIUM - Performance specification

---

#### Issue 10.3: Pagination Defaults May Be Too Large (MEDIUM)

**Problem:**
Section 3 (User Story 1): "기본 20개 항목/페이지, 최대 100개 항목/페이지"

**Concern:**
- 100 items per page on 100KB items = 10MB payload
- Might exceed network timeout or browser memory

**Recommendation:**
- Default: 20 items ✓
- Max: 50 items (not 100)
- Add UI warning if requesting > 50

**Priority:** MEDIUM - UX/Performance

---

### 11. ERP Module Dependencies

#### Issue 11.1: Dependency on Customer & Employee Not Fully Specified (HIGH)

**Problem:**
Section 9 lists dependencies but doesn't clarify requirements:

```
Dependency 1: Customer 엔티티 및 API 구현 필수 (Phase 1)
Dependency 2: Employee 엔티티의 역할(role) 정의 필수 (Phase 1)
```

**Missing Specifications:**
1. **Customer API**: What fields required? (name, contact info, status?)
2. **Employee API**: What fields required? (name, role, department?)
3. **Validation**: Must selected employee have role="MANAGER"? Or any employee?
4. **Cascading**: If customer/employee is deleted, what happens?

**Recommendation:**
Add explicit validation rules:
```
- Customer must exist and not be deleted (FK constraint)
- Employee must exist and be active (FK constraint + business rule check)
- Employee should have role IN ('MANAGER', 'ADMIN')? Or any role?
```

**Priority:** HIGH - Integration requirement

---

#### Issue 11.2: No Reference to Dashboard Integration (MEDIUM)

**Problem:**
PRD mentions "계약 현황 시각화" and "통계 대시보드" in goals but no integration spec:
- Should maintenance dashboard show on main dashboard?
- What widgets? (contracts by status, expiring soon, etc.)
- Should stats API be used by dashboard?

**Recommendation:**
Add to PRD: "Dashboard integration via GET /api/maintenance/stats, showing contract summary"

**Priority:** MEDIUM - Feature integration

---

#### Issue 11.3: No Mention of Customer 모듈 Dependencies (LOW)

**Problem:**
CLAUDE.md shows entity relationships:
```
[Customer] ──── [MaintenanceContract]
            ├── [CustomerContact]
            └── [Attachment]
```

But PRD doesn't address:
- Can contact/notes be updated through this module? (No, customer module responsibility)
- Should customer sidebar show linked contracts?

**Recommendation:**
Clarify: "Maintenance module is customer-oriented view. Customer relationship management (contacts, primary info) handled by Customer module"

**Priority:** LOW - Module responsibility clarification

---

### 12. Testing Strategy

#### Issue 12.1: Testing Requirements Not Defined (LOW)

**Problem:**
Section 7 states: "API 테스트 커버리지 ≥ 80%" but:
- No unit test specs
- No integration test specs
- No E2E test specs
- No mock data strategy

**Recommendation:**
Add testing strategy document or section with:
1. Unit tests: Entity validation, service logic
2. Integration tests: API endpoints with real DB
3. E2E tests: User workflows (create, update, delete)

**Priority:** LOW - QA planning

---

### 13. Documentation Gaps

#### Issue 13.1: No Developer Implementation Guide (LOW)

**Problem:**
PRD is comprehensive but lacks implementation guide:
- Step-by-step for developers
- Common pitfalls
- Code examples

**Recommendation:**
Add supplementary docs:
- `2061_00_구현_가이드.md` — Implementation walkthrough
- `2061_01_데이터베이스_마이그레이션.md` — Migration details
- `2061_02_API_테스트.md` — API testing guide

**Priority:** LOW - Developer support

---

### 14. Out-of-Scope Clarifications

#### Issue 14.1: Renewal Workflow Contradiction (HIGH)

**Problem:**
Section 4.2 states auto-renewal is out-of-scope (2단계):
- ✓ "자동 계약 갱신 (2단계)" — Out-of-scope
- ✗ But "계약 갱신 이력 추적" is in-scope (User Story 9)
- ✗ And "갱신예정" status is in-scope (User Story 7)

**Contradiction:**
- If renewal is out-of-scope, how do contracts reach "갱신예정" state?
- How do renewal history records get created?

**Recommendation:**
Clarify in Phase 1:
- Option A: "갱신예정" is MANAGER-set manual state (no auto-trigger)
- Option B: Move renewal to Phase 1 scope

**Current Impact:** Blocks implementation of renewal feature

**Priority:** HIGH - Scope clarification

---

## Summary of Required Clarifications

### Before Implementation (Blockers)

1. **State Transition Automation**: Define auto vs manual status changes
2. **API Response Contracts**: Specify all endpoint req/resp schemas
3. **File Storage Strategy**: Clarify disk storage, security, versioning
4. **Pagination for Nested Resources**: Define limits for attachments/history
5. **Authorization Enforcement**: Add RBAC to each API endpoint
6. **Soft Delete Enforcement**: Ensure all queries filter deleted_at IS NULL
7. **Renewal Logic**: Clarify Phase 1 vs Phase 2 for renewal workflow

### Before Testing (High Priority)

8. **Index Strategy**: Define performance indices for major queries
9. **Query Optimization**: N+1 prevention, SELECT field specification
10. **Error Response Format**: Standardize API error responses
11. **Input Validation**: Complete validation schema with min/max/format

### Can Proceed (Medium Priority)

12. **Caching Strategy**: Define TanStack Query stale/gc times
13. **Duplicate Detection**: Clarify contract uniqueness rules
14. **File Edge Cases**: Versioning, orphan cleanup, conflict resolution
15. **State Management**: Finalize Zustand vs useState pattern

### Nice-to-Have (Low Priority)

16. **Testing Strategy**: Add unit/integration/E2E test specs
17. **Developer Guide**: Supplementary implementation docs
18. **Dashboard Integration**: Define stats widget for main dashboard

---

## Recommendations by Priority

### HIGH PRIORITY ACTIONS

1. **Action 1: Create State Machine Diagram**
   - Visual representation of contract status transitions
   - Document auto-trigger vs manual paths
   - Define invalid transitions

2. **Action 2: Define API Response Contracts**
   - Create OpenAPI/Swagger spec
   - Include all query parameters, request/response bodies
   - Error response formats

3. **Action 3: Clarify File Storage & Upload**
   - Define upload directory structure
   - File naming strategy (UUID format)
   - Upload failure handling & rollback

4. **Action 4: Add Pagination for Detail View**
   - Limit attachments: 10 per page
   - Limit history: 20 per page
   - Return pagination metadata

5. **Action 5: Strengthen Authorization Rules**
   - Document RBAC matrix (role vs operation)
   - Add authorization checks to all API routes
   - Include row-level access control (if needed)

6. **Action 6: Ensure Soft Delete Enforcement**
   - Add default query filter: `deleted_at IS NULL`
   - Use repository pattern or database views
   - Test soft delete enforcement

### MEDIUM PRIORITY ACTIONS

7. **Action 7: Index Strategy**
   - Define indices for filtering/sorting columns
   - Include composite indices for common queries
   - Add to migration file

8. **Action 8: Clarify Renewal Workflow**
   - Decide: Manual renewal vs auto-trigger
   - Define renewal form/API endpoint
   - Update Phase 1/2 scope

9. **Action 9: Complete Input Validation**
   - Create Zod/Yup schema for all inputs
   - Include business rule validation
   - Document validation error messages

10. **Action 10: Finalize State Management Pattern**
    - Decide: Zustand for filters or URL query params
    - Define TanStack Query hook structure
    - Document cache invalidation strategy

### LOW PRIORITY ACTIONS

11. **Action 11: Testing Strategy**
    - Define unit/integration/E2E test coverage
    - Add mock data generators
    - Document test database setup

12. **Action 12: Supplementary Documentation**
    - Implementation walkthrough
    - Common pitfalls guide
    - Code examples

---

## Compliance Checklist

| Requirement | Status | Notes |
|------------|--------|-------|
| CLAUDE.md Architecture Alignment | ✓ Mostly | Some clarifications needed |
| Next.js App Router Pattern | ✓ Yes | Follows conventions |
| Server/Client Component Separation | ⚠ Needs Detail | Clarify SC data fetching |
| Oracle XE 21c Compliance | ✓ Yes | Proper schema design |
| ON DELETE RESTRICT | ✓ Yes | Correctly applied |
| Soft Delete Enforcement | ⚠ Incomplete | Need query filters defined |
| TanStack Query Integration | ⚠ Incomplete | Cache strategy missing |
| Zustand Pattern | ⚠ Unclear | Should use URL params instead |
| Authentication/Authorization | ⚠ Incomplete | RBAC enforcement missing |
| API Response Contracts | ✗ Missing | Critical gap |
| Error Handling | ✗ Missing | Need standard format |
| Input Validation | ⚠ Incomplete | Need detailed schema |
| Performance Optimization | ⚠ Incomplete | Index & query optimization missing |
| Security Considerations | ⚠ Incomplete | File security needs detail |

---

## Conclusion

The 2061 PRD for "유지보수 고객 관리" is well-structured and covers most requirements comprehensively. However, **six HIGH-priority issues must be resolved before implementation can begin**, particularly around:

1. State transition automation rules
2. API response contracts
3. File upload strategy
4. Pagination for nested resources
5. Authorization enforcement
6. Soft delete enforcement

Additionally, **several MEDIUM-priority clarifications** are needed for performance optimization, query strategy, and state management patterns.

**Recommendation: Create supplementary specification document addressing all 14 clarifications before assigning to development team.**

**Estimated Resolution Effort:** 4-6 hours for technical lead to create clarification documents + API specs

---

**Review Completed:** 2026-01-25 22:30:00 KST
**Next Steps:** Rebuttal phase and decision mediation
