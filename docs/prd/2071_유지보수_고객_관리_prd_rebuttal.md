<!-- Generated: 2026-01-25 22:45:00 KST -->

# Rebuttal: 유지보수 고객 관리 (2071 PRD)

**Document Date:** 2026-01-25
**Response to:** 2071_유지보수_고객_관리_prd_critical_review.md
**Rebuttal Status:** Ready for Mediation Phase

---

## Executive Summary

This document provides point-by-point responses to the critical review's 11 major issues. The rebuttal acknowledges valid concerns while clarifying PRD intent and explaining design decisions. Issues are categorized as:

- **Valid Concerns** (5): Legitimate gaps that require Phase 1 resolution
- **Design Justifications** (4): Reviewer concerns addressed by intentional design choices
- **Out-of-Scope Clarifications** (2): Issues that belong to Phase 2 or other modules

---

## 1. Clarity & Ambiguity Issues

### Issue 1.1: Ambiguous Contract Status Transition Rules (HIGH)

#### PRD Position

Section 7 (User Story 7) and Section 4.1 (Scope) define the following status transitions:

```
활성 → 종료 (contract expiration or manual closure)
활성 → 갱신예정 (manual state change, typically 3 months before end_date)
갱신예정 → 활성 (manual renewal completion)
종료 → 활성 (re-contract)
```

Section 4.2 (Out-of-Scope) explicitly states: "자동 계약 갱신 (2단계)" — automatic renewal is Phase 2.

#### Rebuttal & Justification

**Valid Concern**: The PRD leaves automatic vs. manual status transitions ambiguous. This is intentional.

**Justification:**

1. **Phase 1 Design Decision**: Status transitions are MANAGER-initiated manual actions, not system-automatic.
   - PRD Section 4.1: "계약 상태 변경 (활성/종료/갱신예정)"
   - This indicates MANAGER capability, not automated scheduler
   - User Story 7: "MANAGER/ADMIN으로서, 계약의 상태를 변경하고 싶다" (manual action)

2. **Why Manual in Phase 1?**
   - Allows MANAGER flexibility to handle edge cases (contract renewal delays, early terminations)
   - Avoids complex automated business logic in Phase 1
   - Phase 2 can add automated triggers based on learnings

3. **"갱신예정" State Purpose**:
   - Is a manual state that MANAGER sets when ready to renew
   - Appears in filters/dashboards to highlight attention-needed contracts
   - NOT automatic on 3-month boundary (reviewer misunderstood)

4. **Why Not Auto-Trigger?**
   - Requires background job infrastructure (Phase 2 concern)
   - Risk of incorrect state changes (contracts cancelled, renegotiated)
   - Better to start manual, optimize in Phase 2

#### Clarification Needed

State transitions are MANAGER-manual, not system-automatic. However, the PRD should explicitly state:

**Proposed Addition to Section 7:**

> **State Transition Control**: All status changes are initiated by MANAGER or ADMIN users via the UI form (StatusChangeForm). The system does NOT automatically transition states. MANAGER manually sets "갱신예정" when approaching renewal.

#### Acknowledgment

✓ Reviewer's concern is valid: PRD needs explicit clarification that transitions are manual.
✓ Proposed addition in mediation phase.

---

### Issue 1.2: "담당자" (Assigned Employee) Ambiguity (HIGH)

#### PRD Position

Section 5.3 (Database) defines:
```
assigned_employee_id: number (FK → Employee.id, ON DELETE RESTRICT)
```

Section 5.5 (RBAC) states roles but doesn't specify employee ownership checks.

#### Rebuttal & Justification

**Ambiguity Type**: This is scope/phase ambiguity, not a design flaw.

**Current Design:**
- MANAGER can manage any contract (no ownership restriction)
- ADMIN can manage all contracts
- Reason: Small team deployment (< 50 employees) where all MANAGERs collaborate

**Reviewer's Concern**: Can MANAGER modify contracts assigned to other MANAGERs?

**Answer:**
- **Phase 1**: YES, by design. All MANAGERs can collaborate.
- **Phase 2**: Could add department-scoped RBAC (MANAGER can only modify own department's contracts)

**Employee Deletion Handling:**
- FK constraint `ON DELETE RESTRICT` prevents deletion of assigned employee
- This is correct per CLAUDE.md (no CASCADE DELETE)
- If employee leaves: MANAGER reassigns contract to new employee first, then employee can be deactivated

#### Clarification Needed

**Proposed Addition to Section 5.5:**

> **MANAGER Authorization**: In Phase 1, all MANAGER users can modify any contract regardless of assigned employee. This allows team collaboration. Phase 2 will add department-scoped access control if needed.
>
> **Employee Deletion**: If assigned employee is to be deactivated, MANAGER must reassign contract to new employee first (enforced by FK ON DELETE RESTRICT).

#### Acknowledgment

✓ Valid clarification gap: RBAC scope needs documentation.
✓ Clarification should be in Phase 1, not Phase 2.

---

## 2. Completeness & Edge Cases

### Issue 2.1: Missing Pagination Strategy for Nested Resources (HIGH)

#### PRD Position

Section 3 (User Story 3) mentions:
- "첨부 문서: 계약서 파일 목록 (파일명, 업로드일, 담당자)"
- "갱신 이력: 과거 계약 갱신 기록 (이전 계약 기간, 갱신일, 담당자)"

No pagination specified.

#### Rebuttal & Justification

**Reviewer's Concern**: Attachments and history could be unbounded (100+ records), causing performance issues.

**PRD Design Rationale:**

1. **Attachment Limit**: User Story 6 states "파일당 5개 한정" (max 5 files per contract)
   - This caps unbounded growth
   - 5 files = 50MB max (with 10MB limit per file)
   - Fits easily in one page load

2. **History Records**: Expected to be 1-3 records per contract (initial creation + updates)
   - Renewal history accumulates slowly over years
   - Unlikely to exceed 20 records in Phase 1
   - Can paginate in Phase 2 if needed

**Why Not Paginate in Phase 1?**
- Adds UI complexity (nested pagination)
- Expected dataset sizes don't warrant it
- Can add in Phase 2 with minimal code changes

#### Clarification Needed

**Proposed Addition to Section 3 (User Story 3):**

> **Nested Resource Limits**:
> - Attachments: Max 5 per contract (User Story 6), displayed on single page
> - History: Expected 1-3 records per contract initially, will paginate in Phase 2 if exceeds 20 records

#### Acknowledgment

✓ Valid performance consideration: Should document limits and phase 2 strategy.
✓ Current design is acceptable if limits are explicit.

---

### Issue 2.2: No Duplicate Contract Detection (MEDIUM)

#### PRD Position

No explicit check for duplicate contracts (same customer + date range).

#### Rebuttal & Justification

**Design Intent**: Intentionally allow duplicate contracts with clarification.

**Business Logic Rationale:**

1. **Multiple Contract Types**: Same customer can have:
   - "Product Maintenance" (2026-01-01 to 2026-12-31)
   - "Technical Support" (2026-01-01 to 2026-12-31)
   - Both are valid, different contracts

2. **No Business Rule Against Overlapping**: PRD doesn't define contract as "exclusive"
   - System should allow flexibility
   - MANAGER responsible for avoiding duplicates

3. **If Uniqueness Required**:
   - Business rule would be: "One active contract per customer per contract_type at a time"
   - Should be defined in business requirements, not assumed in technical spec

#### Clarification Needed

**Proposed Addition to Section 9 (Open Questions):**

> **Question 4**: Should contracts be unique per customer per date range, or can same customer have overlapping contracts?
> - **Decision**: Phase 1 allows overlapping contracts by design (supports multiple maintenance types). MANAGER responsible for avoiding duplicates. Phase 2 can add business rule validation if needed.

#### Acknowledgment

✓ Valid edge case: Should be explicitly documented.
✓ Not a flaw, but needs clarification.

---

### Issue 2.3: Contract Renewal Edge Cases Not Addressed (HIGH)

#### PRD Position

Section 4.2 (Out-of-Scope):
> "자동 계약 갱신 (2단계)"

But User Story 7 mentions "갱신예정" state and User Story 9 tracks renewal history.

#### Rebuttal & Justification

**Reviewer's Concern**: Contradiction between renewal being out-of-scope yet renewal history being in-scope.

**Clarification of "Out-of-Scope":**

"Automatic contract renewal" (자동 계약 갱신) means:
- Automatic end-of-life renewal (system-triggered)
- Automatic contract clone with new dates
- NOT manually creating renewal history

**What IS In-Scope (Phase 1):**

1. **Manual Renewal Recording**:
   - When MANAGER renews, they update end_date
   - Update creates history record via `MaintenanceContractHistory` (change_type='갱신')
   - This is manual contract extension, not automatic

2. **갱신예정 State**:
   - Manual state MANAGER sets when contract needs renewal attention
   - Is a flag/label, not automatic trigger

3. **History Tracking**:
   - Records every state change and field update
   - Renewal history = record of historical end_dates

**Renewal Workflow in Phase 1:**

```
MANAGER views contract → end_date approaching →
MANAGER sets status to "갱신예정" →
MANAGER updates end_date to new future date →
System creates MaintenanceContractHistory with change_type='갱신'
```

**Why This Satisfies User Stories 7 & 9:**
- User Story 7: Status changes (including갱신예정) are in-scope
- User Story 9: History records of status changes are in-scope
- Automatic renewal (system-triggered) is Phase 2

#### Clarification Needed

**Proposed Addition to Section 4.2:**

> **Renewal Scope Clarification**:
> - **Out-of-Scope (Phase 2)**: Automatic contract renewal triggered by system scheduler
> - **In-Scope (Phase 1)**: Manual renewal via MANAGER updating end_date + status. History recorded automatically.

#### Acknowledgment

✓ Valid clarification gap: Terminology "갱신" (renewal) needs definition.
✓ Proposed clarification resolves the contradiction.

---

### Issue 2.4: File Upload Edge Cases Missing (MEDIUM)

#### PRD Position

Section 3 (User Story 6) and Section 8 (Security) mention:
- "파일당 5개 한정" (max 5 files)
- "최대 10MB" per file
- "PDF, DOCX, DOC" formats
- File naming: "UUID + 원본 파일명"

Missing: Overwrite, versioning, failed upload cleanup, MIME detection.

#### Rebuttal & Justification

**Reviewer's Concern**: Valid but detailed implementation questions, not PRD-level requirements.

**Design Positioning:**

1. **File Versioning**: Intentionally not in Phase 1
   - Phase 1: Simple append (new file = new entry in MaintenanceContractAttachment)
   - If user uploads same filename, both versions kept (different UUID prefix)
   - Phase 2: Add versioning UI if needed

2. **Failed Upload Cleanup**: Application responsibility
   - File uploaded to `/uploads/maintenance/[UUID]-[filename]`
   - If database INSERT fails, file stays orphaned
   - Phase 2: Add background cleanup job
   - Phase 1: Document in admin runbook

3. **MIME Type Validation**: Covered in Section 8
   - "파일: MIME 타입 검증 (PDF, DOCX), 크기 제약 (10MB)"
   - Needs implementation detail (magic bytes + extension check)

4. **Duplicate File Handling**: Resolved by UUID naming
   - Different uploads of same file = different UUID prefix
   - Database allows duplicates (no constraint)
   - MANAGER responsible for not uploading same file twice

#### Clarification Needed

**Proposed Addition to Section 8 (Security):**

> **File Upload Implementation Details**:
> - MIME type validation: Check magic bytes + extension whitelist (not just extension)
> - File naming: `[UUIDv4]-[sanitized-original-filename]` (e.g., `a1b2c3d4-contract-2026.pdf`)
> - Failed uploads: Orphaned files cleaned up in Phase 2 background job
> - File versioning: Phase 2 feature. Phase 1 allows multiple versions with same name (different UUID)

#### Acknowledgment

✓ Valid implementation question but not PRD-blocking.
✓ Should be in implementation guide, not PRD.
✓ Can proceed with current specification.

---

## 3. Architecture Compliance

### Issue 3.1: Server Component Data Fetching Strategy Not Specified (HIGH)

#### PRD Position

Section 5.1 states:
```
maintenance/page.tsx: Server Component
maintenance/[id]/page.tsx: Server Component
```

But doesn't specify direct DB query vs API call.

#### Rebuttal & Justification

**Reviewer's Concern**: Valid gap. PRD should follow CLAUDE.md architecture.

**CLAUDE.md Standard**: Server components should fetch data directly (not via API).

**Why Not Specified in PRD?**
- PRD focuses on business requirements, not implementation patterns
- Architecture follows CLAUDE.md by default
- Assumes developers know CLAUDE.md

**Clarification Approach:**

1. **Direct DB Query is Correct**:
   - Server Component should fetch data via repository/ORM
   - NOT via fetch() to /api/maintenance
   - Avoids unnecessary API layer

2. **Authorization in Server Component**:
   - `const session = await getServerSession()`
   - Check `session.user.role` before fetching data
   - Return 401 or redirect if unauthorized

3. **Error Handling**:
   - If DB fails, let error bubble to error.tsx boundary
   - Next.js app router has error.tsx for error UI

#### Clarification Needed

**Proposed Addition to Section 5.1:**

> **Server Component Data Fetching**:
> - All Server Components fetch directly from database (no API calls)
> - Authorization checked first: `const session = await getServerSession()`
> - Role validation before data query
> - Errors caught by error.tsx boundary
> - Client Components use TanStack Query for mutations

#### Acknowledgment

✓ Valid gap: PRD should reference CLAUDE.md patterns.
✓ Not a design flaw, documentation issue.
✓ Clarification needed in Phase 1 implementation guide.

---

### Issue 3.2: Client vs Server Component Boundary Unclear (MEDIUM)

#### PRD Position

Section 10 marks MaintenanceContractDetailView as "SC/CC" (hybrid).

#### Rebuttal & Justification

**Interpretation**: "SC/CC" should mean:
- Server Component portion: Fetches initial data
- Client Component wrappers: Handle mutations and interactivity

**Better Terminology**: Should be "SC wrapper + CC children"

```typescript
// src/app/(main)/maintenance/[id]/page.tsx
// This is Server Component (SC)
export default async function DetailPage({ params }) {
  const contract = await db.query(...);
  return <MaintenanceContractDetailView contract={contract} />;
}

// src/components/features/maintenance/MaintenanceContractDetailView.tsx
// This is Client Component (CC) - receives data as prop, handles mutations
'use client';
export function MaintenanceContractDetailView({ contract }) {
  const updateMutation = useUpdateMaintenanceContract();
  // ...
}
```

**Why This Design:**
- Server gets initial data (fast, secure)
- Client handles interaction (forms, mutations, state)
- Clear separation per CLAUDE.md

#### Clarification Needed

**Proposed Addition to Section 5.1:**

> **Component Boundary**:
> - Page route (page.tsx) = Server Component (data fetching)
> - Feature components = Client Components (mutations)
> - Data passed via props from SC to CC
> - No data fetching in CC (use only in effects via TanStack Query)

#### Acknowledgment

✓ Valid terminology issue: Need clearer component naming.
✓ Design is correct, just poorly communicated.

---

## 4. Database Design

### Issue 4.1: Attachment Cascade Deletion Not Addressed (MEDIUM)

#### PRD Position

```
MaintenanceContractAttachment FK: maintenance_contract_id → MaintenanceContract.id (ON DELETE RESTRICT)
```

User Story 10 allows deletion but doesn't address attachments.

#### Rebuttal & Justification

**Current Design**: ON DELETE RESTRICT prevents cascade.

**Intended Behavior**:
- When contract is deleted (soft delete), attachments remain (logical child records)
- Both contract and attachments marked with deleted_at = NOW()
- Logical integrity maintained (history preserved)

**Why Not Cascade Delete?**
- CLAUDE.md rule: "CASCADE DELETE 금지" (no cascade delete allowed)
- Attachments may need to be referenced in audit/history
- Safer to soft-delete both

**Implementation Detail:**

When DELETE /api/maintenance/[id] is called:

```typescript
// Option A: Explicit soft-delete attachments first
UPDATE MaintenanceContractAttachment
SET deleted_at = NOW()
WHERE maintenance_contract_id = id AND deleted_at IS NULL;

// Then soft-delete contract
UPDATE MaintenanceContract
SET deleted_at = NOW()
WHERE id = id;
```

**Why Not RESTRICT Error?**
- FK RESTRICT prevents physical delete of MaintenanceContract if attachments exist
- But since we use soft delete (UPDATE deleted_at), RESTRICT doesn't apply
- Soft delete is just UPDATE, not DELETE, so FK doesn't trigger

#### Clarification Needed

**Proposed Addition to Section 5.3:**

> **Attachment Deletion Strategy**:
> - When contract is soft-deleted, all attachments are also soft-deleted (same transaction)
> - Soft delete = UPDATE deleted_at = NOW(), not physical DELETE
> - FK ON DELETE RESTRICT applies to physical deletes (doesn't happen in our system)
> - Orphaned files in /uploads/ cleaned up in Phase 2 maintenance job

#### Acknowledgment

✓ Valid concern: Cascade behavior should be documented.
✓ Design is correct but implementation detail needs clarity.
✓ Clarification needed for developer implementation.

---

### Issue 4.2: Missing Index Strategy for Query Performance (HIGH)

#### PRD Position

Section 7 (Success Metrics) mentions:
> "API Response Time: p95 < 200ms"

But no index strategy defined.

#### Rebuttal & Justification

**Valid Concern**: Index strategy is critical for performance. Reviewer is correct.

**Why Not in PRD?**
- PRD focuses on requirements, not query optimization details
- Index strategy belongs in migration file + implementation guide
- But should be referenced in PRD

**Proposed Indexes** (from Reviewer's suggestion):

```sql
-- Filter by customer
CREATE INDEX idx_mc_customer_deleted ON MaintenanceContract(customer_id, deleted_at);

-- Filter by assigned employee
CREATE INDEX idx_mc_employee_deleted ON MaintenanceContract(assigned_employee_id, deleted_at);

-- Filter by status
CREATE INDEX idx_mc_status_deleted ON MaintenanceContract(contract_status, deleted_at);

-- Sort by end_date (most common operation)
CREATE INDEX idx_mc_enddate_desc ON MaintenanceContract(end_date DESC, deleted_at);

-- Composite index for common queries
CREATE INDEX idx_mc_status_enddate ON MaintenanceContract(contract_status, end_date DESC) WHERE deleted_at IS NULL;
```

**Why These Indexes?**
- Filtering by customer, employee, status (User Story 2)
- Sorting by expiration date (default sort)
- Excluding soft-deleted records (deleted_at IS NULL in WHERE)

#### Clarification Needed

**Proposed Addition to Section 5.3 (Migration):**

> **Query Optimization Indexes**:
> - Create composite indices for common filter + sort combinations
> - Include deleted_at IS NULL condition in partial indices
> - Target performance: 200ms p95 for list queries with 1000+ records
> - Index specification in migration file: `1706300000000-create-maintenance-contract-table.ts`

**Also Add to Phase 1 Implementation Guide:**
- Query plans for major queries
- EXPLAIN PLAN analysis for optimization

#### Acknowledgment

✓ Valid requirement: Performance indices must be specified.
✓ Acknowledged as HIGH priority.
✓ Should be in migration file, referenced in PRD.

---

### Issue 4.3: History Table Design - Missing Immutability Specification (MEDIUM)

#### PRD Position

MaintenanceContractHistory includes deleted_at but no constraint preventing modification.

#### Rebuttal & Justification

**Design Intent**: History should be immutable.

**Current Implementation Gap**: No database constraint prevents UPDATE/DELETE on history.

**Why Soft Delete Flag Exists:**
- Consistency with other tables (all have deleted_at)
- Future flexibility (if we ever need to "hide" history records)
- Audit trail (deleted_at timestamps show record lifecycle)

**How to Enforce Immutability in Phase 1:**

Option 1: Application-level enforcement
```typescript
// In API handler - prevent UPDATE/DELETE
if (req.method === 'PUT' || req.method === 'DELETE') {
  throw new Error('History records are immutable');
}
```

Option 2: Database constraint (Oracle trigger or constraint)
```sql
-- Prevent updates to history after creation
CREATE TRIGGER tr_maintenance_history_immutable
BEFORE UPDATE ON MaintenanceContractHistory
BEGIN
  RAISE_APPLICATION_ERROR(-20001, 'History records are immutable');
END;
```

**Recommendation**: Application enforcement simpler in Phase 1, database constraint in Phase 2.

#### Clarification Needed

**Proposed Addition to Section 5.3:**

> **MaintenanceContractHistory Immutability**:
> - History records are immutable after creation (no UPDATE/DELETE allowed)
> - Application enforces: DELETE endpoint checks record type and rejects for history tables
> - deleted_at IS NOT used for history (included for schema consistency)
> - Phase 2: Add database trigger for enforcement

#### Acknowledgment

✓ Valid design gap: Immutability needs enforcement specification.
✓ Can be enforced at application level in Phase 1.
✓ Should be documented in implementation guide.

---

## 5. Authentication & Authorization

### Issue 5.1: Authorization Granularity Not Sufficient (HIGH)

#### PRD Position

Section 5.5 (RBAC) defines:
- USER: Read-only
- MANAGER: CRUD (no clarification on which contracts)
- ADMIN: All operations

#### Rebuttal & Justification

**Reviewer's Concern**: RBAC needs endpoint-level specification.

**Current Design**: Intentionally simple for Phase 1.

**Design Rationale for Phase 1:**

1. **Small Team Assumption**: sunjin-erp is for small ERP (< 50 employees)
   - All MANAGERs collaborate across contracts
   - No need for department-scoped access
   - Simplifies authorization logic

2. **RBAC is Sufficient**:
   - USER: GET only (read-only view)
   - MANAGER: GET/POST/PUT (can create/modify contracts)
   - ADMIN: GET/POST/PUT/DELETE (can delete)
   - File operations follow same pattern (MANAGER+ for upload, ADMIN only for delete)

3. **Where is RBAC Enforced?**
   - API routes: Check `session.user.role` at handler top
   - Server components: Check role and return 401/403 or render read-only
   - Client UI: Hide buttons based on role (secondary, not security)

#### Clarification Needed

**Proposed Addition to Section 5.5:**

> **Authorization by Endpoint**:
> ```
> GET /api/maintenance          — USER+ (all authenticated)
> POST /api/maintenance         — MANAGER+ only
> PUT /api/maintenance/[id]     — MANAGER+ only
> DELETE /api/maintenance/[id]  — ADMIN only
> POST /api/maintenance/[id]/attachments       — MANAGER+ only
> DELETE /api/maintenance/[id]/attachments/[id] — ADMIN only
> POST /api/maintenance/[id]/status            — MANAGER+ only
> GET /api/maintenance/[id]/history            — USER+ (read-only)
> ```
>
> **Enforcement**:
> - Each API route checks: `const role = session.user.role`
> - Return 403 (Forbidden) if user lacks required role
> - No row-level access control in Phase 1 (all MANAGERs see all contracts)
> - Phase 2: Can add department-scoped access if needed

#### Acknowledgment

✓ Valid clarification need: RBAC matrix should be explicit.
✓ Design is correct for Phase 1.
✓ Endpoint authorization specification in implementation guide.

---

### Issue 5.2: File Download Authorization Not Specified (MEDIUM)

#### PRD Position

User Story 6: "다운로드, 삭제(ADMIN만) 가능" (download possible, delete by ADMIN only)

But doesn't clarify who can download.

#### Rebuttal & Justification

**Implicit Design**: Same as contract read access.

**Clarification:**

1. **Download Permission**: USER+ (all authenticated users)
   - If USER can read contract, USER can download attachments
   - No additional check needed

2. **File Access URL**: Should NOT be direct
   - Do NOT expose `/uploads/maintenance/[uuid]-[filename]` directly
   - Use API endpoint: `GET /api/maintenance/[id]/attachments/[attachmentId]/download`
   - API checks authorization before serving file

3. **Why This Approach?**
   - Prevents direct URL manipulation
   - Auditable (API log shows who downloaded)
   - Consistent with security best practices

#### Clarification Needed

**Proposed Addition to Section 8 (Security):**

> **File Download Authorization**:
> - Download only via API endpoint: `GET /api/maintenance/[id]/attachments/[attachmentId]/download`
> - Authorization: USER+ (same as contract read access)
> - API checks contract exists and user can view it
> - Response: `Content-Disposition: attachment` (force download)
> - Do NOT expose `/uploads/maintenance/` directly to requests

#### Acknowledgment

✓ Valid security consideration: Download path should be specified.
✓ Design approach is correct.
✓ Implementation detail for API handlers.

---

## 6. State Management

### Issue 6.1: Zustand vs useState Pattern Unclear (MEDIUM)

#### PRD Position

Section 5.4 mentions:
- Zustand OR React useState for client state
- "폼 입력 상태", "필터 선택값", "페이지네이션 상태"

#### Rebuttal & Justification

**CLAUDE.md Standard** (from project instructions):

> State Management Philosophy:
> - **Zustand** — Client-only UI state (sidebar open/close, form drafts, filters)
> - **TanStack Query** — All server data (fetching, caching, mutations, optimistic updates)
> - Never duplicate server state in Zustand; TanStack Query is the single source of truth for DB data

**Proposed State Distribution for Maintenance Module:**

| State | Tool | Reason |
|-------|------|--------|
| Form inputs (create/update/status) | React Hook Form | Built-in form state management |
| Filters (status, employee, date range) | URL query params + TanStack Query | Shareable, bookmarkable |
| Pagination (page, limit) | URL query params + TanStack Query | Shareable, bookmarkable |
| Modal open/close | useState (local) | Simple boolean state |
| File upload progress | useState (local) | Upload-specific |
| List data (contracts) | TanStack Query | Source of truth |

**Why NOT Zustand for Filters?**
- PRD says filters are in URL params (User Story 2: "필터 적용 시 URL query parameter 업데이트")
- URL params = best practice for shareable state
- Zustand would duplicate URL state (wrong per CLAUDE.md)

**Why NOT Zustand for Pagination?**
- Same reason: pagination in URL params
- TanStack Query manages request/response with URL params

#### Clarification Needed

**Proposed Addition to Section 5.4:**

> **State Management Pattern**:
> ```
> ✓ Form inputs      → React Hook Form (local validation)
> ✓ Filters          → URL query params (shared via TanStack Query)
> ✓ Pagination       → URL query params (page, limit)
> ✓ Contract data    → TanStack Query (single source of truth)
> ✓ Modal state      → useState (open/close)
> ✗ Zustand NOT used (conflicts with URL param pattern)
> ```
>
> **Example URL**: `/maintenance?status=ACTIVE&assignedEmployeeId=1&page=1&limit=20`
> - TanStack Query extracts params and fetches data
> - User updates filters → URL updated → TanStack Query refetches

#### Acknowledgment

✓ Valid clarification: State management pattern should align with CLAUDE.md.
✓ Current PRD is ambiguous about Zustand usage.
✓ Clarification: Use URL params + TanStack Query, not Zustand.

---

### Issue 6.2: Optimistic Updates Not Specified (MEDIUM)

#### PRD Position

PRD doesn't mention optimistic updates for file uploads or contract mutations.

#### Rebuttal & Justification

**Not Specified = Intentional**: PRD defines WHAT is required, not HOW implementation works.

**Optimistic Updates are Implementation Detail:**

1. **File Upload Example**:
   - MANAGER clicks "Upload File"
   - UI shows file in list immediately (optimistic)
   - System sends to server
   - If fails, removes from list (rollback)
   - If succeeds, confirms

2. **Contract Update Example**:
   - MANAGER changes "담당자"
   - UI updates field immediately
   - Sends to server
   - If fails, reverts to original value

**Why Include in PRD?**
- Improves UX (faster feedback)
- Aligns with TanStack Query best practices
- Should be in implementation guide, not PRD

#### Clarification Needed

**Proposed Addition to Implementation Guide** (not PRD):

> **Optimistic Updates Pattern**:
> ```typescript
> // Example: Upload attachment
> const uploadMutation = useMutation({
>   mutationFn: uploadAttachment,
>   onMutate: async (file) => {
>     // Revert if mutation fails
>     await queryClient.cancelQueries(['maintenance', id, 'attachments']);
>
>     // Get previous data
>     const previousData = queryClient.getQueryData(['maintenance', id, 'attachments']);
>
>     // Add optimistically
>     queryClient.setQueryData(['maintenance', id, 'attachments'], (old) => [
>       ...old,
>       { ...file, id: Date.now() } // Temp ID
>     ]);
>
>     return { previousData };
>   },
>   onError: (err, vars, context) => {
>     // Rollback on error
>     queryClient.setQueryData(['maintenance', id, 'attachments'], context.previousData);
>   },
> });
> ```

#### Acknowledgment

✓ Valid UX consideration but not PRD-level requirement.
✓ Should be in implementation guide.
✓ Can proceed without this in PRD.

---

## 7. API Design

### Issue 7.1: Missing API Response Contracts (HIGH)

#### PRD Position

Section 5.2 defines endpoints but no request/response schemas.

#### Rebuttal & Justification

**Valid Concern**: API contracts are critical for implementation.

**Why Not in PRD?**
- PRD is business-focused, API spec is technical documentation
- Separate documents: PRD (WHAT) vs API Spec (HOW)

**Current Gap**: PRD should reference API spec document.

**Proposed Response Schema** (from Reviewer's suggestion):

```typescript
// GET /api/maintenance?status=ACTIVE&page=1&limit=20
Response 200: {
  data: [
    {
      id: 1,
      customer: { id: 1, name: "ABC Corp" },
      contractName: "Maintenance 2026",
      startDate: "2026-01-01",
      endDate: "2026-12-31",
      contractAmount: 1000000,
      status: "ACTIVE",
      daysToExpire: 340,
      assignedEmployee: { id: 1, name: "Kim" }
    }
  ],
  pagination: {
    page: 1,
    limit: 20,
    total: 100,
    hasMore: true
  }
}

// Error responses
Response 400: { error: "VALIDATION_ERROR", details: [...] }
Response 401: { error: "UNAUTHORIZED" }
Response 403: { error: "FORBIDDEN" }
Response 500: { error: "INTERNAL_SERVER_ERROR" }
```

#### Clarification Needed

**Proposed Addendum to PRD:**

> **API Response Contracts:**
> See separate document: `2071_01_API_명세.md` for complete request/response schemas
> Including:
> - GET /api/maintenance (list with filters)
> - POST /api/maintenance (create)
> - PUT /api/maintenance/[id] (update)
> - DELETE /api/maintenance/[id] (delete)
> - And all attachment/history/status endpoints

**Action**: Create `2071_01_API_명세.md` during implementation phase.

#### Acknowledgment

✓ Valid requirement: API contracts should be documented.
✓ Not PRD content but related technical spec.
✓ Should be created during Phase 1 implementation.

---

### Issue 7.2: Query Parameter Specifications Missing (HIGH)

#### PRD Position

User Story 2: "필터 적용 시 URL query parameter 업데이트" but no parameter names defined.

#### Rebuttal & Justification

**Valid Concern**: Query parameter naming convention should be defined.

**Proposed Standard** (from Reviewer's suggestion):

```
GET /api/maintenance
  ?status=ACTIVE|COMPLETED|RENEWAL_PENDING (comma-separated for multiple)
  &assignedEmployeeId=1 (single ID)
  &customerId=1 (single ID)
  &contractNameSearch=ABC (partial match, case-insensitive)
  &startDateFrom=2026-01-01 (ISO8601)
  &startDateTo=2026-12-31
  &endDateFrom=2026-01-01
  &endDateTo=2026-12-31
  &sort=endDate:desc (or contractName:asc)
  &page=1&limit=20
```

**Naming Conventions:**
- camelCase for field names (JavaScript convention)
- :asc/:desc for sort direction
- Filters optional (all default to no filter)
- Date format: ISO8601 (YYYY-MM-DD)

#### Clarification Needed

**Proposed Addition to Section 5.2:**

> **Query Parameter Specification**:
> All filter parameters are optional. Examples:
> ```
> GET /api/maintenance
>   ?status=ACTIVE
>   &assignedEmployeeId=5
>   &endDateFrom=2026-02-01&endDateTo=2026-12-31
>   &sort=endDate:desc
>   &page=1&limit=20
> ```
>
> **Parameter Details**:
> - `status`: One of ACTIVE, COMPLETED, RENEWAL_PENDING (separate by comma for multiple)
> - `assignedEmployeeId`: Single employee ID filter
> - `customerId`: Single customer ID filter
> - `contractNameSearch`: Partial match (case-insensitive)
> - `startDateFrom/To`: Date range filter (YYYY-MM-DD)
> - `endDateFrom/To`: Date range filter (YYYY-MM-DD)
> - `sort`: Field and direction (e.g., endDate:desc)
> - `page`: Current page (1-based)
> - `limit`: Items per page (20-100, default 20)

**Also See**: Implementation document `2071_01_API_명세.md` for request/response schemas.

#### Acknowledgment

✓ Valid requirement: Parameter naming should be standardized.
✓ Should be in API spec document, referenced in PRD.
✓ Clear naming convention needed for developer implementation.

---

### Issue 7.3: No Batch Operations Defined (LOW)

#### PRD Position

No batch delete, batch status change, or bulk operations mentioned.

#### Rebuttal & Justification

**Design Decision**: Intentionally out of scope for Phase 1.

**Why Not in Phase 1?**
- Adds complexity to UI (multi-select, bulk actions)
- Lower priority than core CRUD
- Can be added in Phase 2 with minimal changes
- Focus on single-record operations first

**Future Enhancement Path:**
- Phase 2: Add `POST /api/maintenance/bulk-delete?ids=1,2,3`
- Phase 2: Add UI for multi-select + bulk actions
- Minimal database changes needed

#### Acknowledgment

✓ Valid observation: Batch ops are useful.
✓ Intentionally out-of-scope for Phase 1 (simplicity).
✓ Can be added in Phase 2 without design changes.

---

## 8. UI/UX & Responsive Design

### Issue 8.1: Missing Loading States for Attachments/History (MEDIUM)

#### PRD Position

Section 6.2 mentions skeleton UI but doesn't specify which components.

#### Rebuttal & Justification

**Partial Specification**: PRD covers UI library (shadcn/ui Skeleton) but not detailed component breakdown.

**Component Loading States Should Include:**

```
Detail Page:
  1. Contract info → Skeleton Card (while loading)
  2. Attachments tab → Skeleton Table (while loading)
  3. History tab → Skeleton List (while loading)
  4. File upload → Progress bar + cancel button
  5. Delete file → Confirmation modal + loading state

Form Pages:
  1. Create/Update form → Disable button during submission
  2. Status change → Disable button during submission
```

**Why Not Specify in PRD?**
- Detailed UI states belong in design spec or component documentation
- PRD should focus on WHAT is shown, not HOW it animates
- Developer responsibility to implement proper loading states per design

#### Clarification Needed

**Proposed Addition to Section 6.4:**

> **Loading State Details**:
> - List page: Show skeleton table until data loads
> - Detail page: Show skeleton card for contract info, skeleton table for attachments, skeleton list for history
> - File upload: Show progress bar with percentage (0-100%)
> - Form submission: Disable button + show spinner
> - File delete: Confirmation modal + loading spinner on delete button

#### Acknowledgment

✓ Valid UX consideration: Loading states improve perceived performance.
✓ Not a PRD gap, implementation detail.
✓ Reference in implementation guide for component library usage.

---

### Issue 8.2: Date Range Picker UI Not Specified (MEDIUM)

#### PRD Position

User Story 2 mentions date range filter but doesn't specify UI widget.

#### Rebuttal & Justification

**Design Recommendation**: Use shadcn/ui DatePicker + Popover.

**Implementation Approach:**

```typescript
// Suggested UI for date range filter
<Popover>
  <PopoverTrigger>
    <Button>Date Range Filter</Button>
  </PopoverTrigger>
  <PopoverContent>
    <div className="flex gap-2">
      <DatePicker
        label="From"
        value={filters.startDateFrom}
        onChange={(date) => setFilters({ ...filters, startDateFrom: date })}
      />
      <DatePicker
        label="To"
        value={filters.startDateTo}
        onChange={(date) => setFilters({ ...filters, startDateTo: date })}
      />
    </div>
  </PopoverContent>
</Popover>
```

**Why Not in PRD?**
- Component choice is implementation detail
- PRD should define requirement (date range filter), not widget
- Developer can choose shadcn/ui DatePicker, Recharts, or other library

#### Clarification Needed

**Proposed Addition to Section 6:**

> **Date Range Filter UI**:
> - Use shadcn/ui DatePicker component (or equivalent date picker library)
> - Placed in filter panel alongside other filters
> - Both "from" and "to" dates optional
> - Applies filter immediately on date selection (or "Apply" button)

#### Acknowledgment

✓ Valid UX consideration but not PRD-level specification.
✓ Implementation detail for UI component selection.
✓ Can proceed with current specification.

---

### Issue 8.3: File Download Security UI Concern (LOW)

#### PRD Position

User Story 6 mentions download but doesn't specify download behavior (open vs download, filename sanitization).

#### Rebuttal & Justification

**Security Best Practice**: Files should be force-downloaded, not opened in browser.

**Implementation Detail**:

```typescript
// API handler for file download
export async function handleDownloadAttachment(req, res) {
  const { id, attachmentId } = req.params;

  // 1. Check authorization
  const session = await getServerSession();
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  // 2. Fetch attachment metadata
  const attachment = await db.maintenanceContractAttachment.findOne(attachmentId);
  if (!attachment) return res.status(404).json({ error: 'Not found' });

  // 3. Read file
  const filePath = path.join(process.cwd(), 'uploads/maintenance', attachment.file_path);
  const fileStream = fs.createReadStream(filePath);

  // 4. Set headers to force download
  res.setHeader('Content-Disposition', `attachment; filename="${sanitizeFilename(attachment.file_name)}"`);
  res.setHeader('Content-Type', 'application/octet-stream');

  // 5. Stream file to client
  fileStream.pipe(res);
}
```

**Why This Approach?**
- `Content-Disposition: attachment` forces browser to download, not open
- Prevents XSS from embedded PDF/docx
- Filename sanitized to prevent path traversal in filename

#### Clarification Needed

**Proposed Addition to Section 8 (Security):**

> **File Download Security**:
> - API endpoint: `GET /api/maintenance/[id]/attachments/[attachmentId]/download`
> - Response header: `Content-Disposition: attachment; filename="..."` (force download)
> - Filename sanitized: Remove path traversal characters (/, \, ..)
> - File served directly from disk, not browser cache
> - Audit: Log download event (optional Phase 2)

#### Acknowledgment

✓ Valid security hardening: Download behavior should be specified.
✓ Prevents XSS attacks from embedded content.
✓ Should be in Security section (Section 8).

---

## 9. Security Considerations

### Issue 9.1: File Path Traversal Prevention Missing (MEDIUM)

#### PRD Position

Section 8: "파일명: UUID + 원본 파일명으로 저장 (경로 탈출 방지)"

But implementation details incomplete.

#### Rebuttal & Justification

**Design Intent**: UUID prefix prevents path traversal.

**How It Works:**

```typescript
// File upload handler
export async function handleUploadAttachment(req, res) {
  const { id } = req.params;
  const file = req.file;

  // 1. Validate file type/size
  if (!['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.mimetype)) {
    return res.status(400).json({ error: 'Invalid file type' });
  }
  if (file.size > 10 * 1024 * 1024) {
    return res.status(400).json({ error: 'File too large' });
  }

  // 2. Generate safe filename
  const uuid = uuidv4();
  const sanitizedName = file.originalname
    .replace(/[^a-zA-Z0-9.-]/g, '_') // Remove special chars
    .slice(0, 255); // Max length
  const safeFileName = `${uuid}-${sanitizedName}`;

  // 3. Save to disk
  const filePath = path.join(process.cwd(), 'uploads/maintenance', safeFileName);
  // NOTE: path.join prevents path traversal, but double-check
  if (!filePath.startsWith(path.join(process.cwd(), 'uploads/maintenance'))) {
    throw new Error('Path traversal attempt detected');
  }

  await fs.promises.writeFile(filePath, file.buffer);

  // 4. Save metadata to DB
  await db.maintenanceContractAttachment.create({
    maintenance_contract_id: id,
    file_name: file.originalname,
    file_path: safeFileName,
    file_size: file.size,
    uploaded_by_id: session.user.id,
  });
}
```

**Why UUID Works:**
- UUID format (e.g., "a1b2c3d4-e5f6-7890-abcd-ef1234567890-contract.pdf")
- Contains no path separators (/, \)
- Even if user tries "../../../etc/passwd", filename is just "uuid-etc-passwd"
- Directory structure: `/uploads/maintenance/[uuid]-[name]` is fixed

#### Clarification Needed

**Proposed Addition to Section 8:**

> **File Storage Implementation**:
> - Directory: `/uploads/maintenance/` (outside public web root)
> - Filename format: `[UUIDv4]-[sanitized-original-name]`
> - Sanitization: Remove special characters except ., -, _
> - Original filename stored in DB, UUID name on disk
> - Path validation: Double-check path.join() result starts with expected directory
> - Files served only through API endpoint (not direct `/uploads/` URL)

**Also Add Implementation Detail:**

```typescript
// Validation to prevent path traversal
const filePath = path.join(process.cwd(), 'uploads/maintenance', uuid_filename);
const uploadDir = path.join(process.cwd(), 'uploads/maintenance');
if (!filePath.startsWith(uploadDir)) {
  throw new Error('Invalid file path');
}
```

#### Acknowledgment

✓ Valid security concern: Path traversal should be prevented.
✓ Current design (UUID) is sound but needs implementation detail.
✓ Clarification needed for developer implementation.

---

### Issue 9.2: Input Validation Rules Incomplete (MEDIUM)

#### PRD Position

Section 8 lists validation rules but incomplete (missing character constraints, decimal places, etc.).

#### Rebuttal & Justification

**Valid Concern**: Validation schema should be comprehensive.

**Proposed Validation Schema** (Zod):

```typescript
import { z } from 'zod';

const createMaintenanceContractSchema = z.object({
  customerId: z.number().int().positive('Customer required'),
  contractName: z.string()
    .min(1, 'Contract name required')
    .max(255, 'Contract name max 255 characters'),
  contractType: z.string()
    .min(1, 'Contract type required')
    .max(50, 'Contract type max 50 characters'),
  startDate: z.date('Valid start date required'),
  endDate: z.date('Valid end date required'),
  contractAmount: z.number().positive('Amount must be positive').optional(),
  assignedEmployeeId: z.number().int().positive('Employee required'),
  notes: z.string().max(4000, 'Notes max 4000 characters').optional(),
}).refine(
  (data) => data.startDate <= data.endDate,
  {
    message: 'Start date must be before or equal to end date',
    path: ['endDate'],
  }
);

const updateStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'COMPLETED', 'RENEWAL_PENDING']),
  reason: z.string()
    .min(1, 'Reason required')
    .max(500, 'Reason max 500 characters'),
});
```

**Validation Rules Detail:**

| Field | Type | Constraints | Format |
|-------|------|-------------|--------|
| contractName | String | 1-255 chars | alphanumeric + spaces/punctuation |
| contractType | String | 1-50 chars | alphanumeric + spaces |
| startDate | Date | Format valid | ISO8601 (YYYY-MM-DD) |
| endDate | Date | >= startDate | ISO8601 (YYYY-MM-DD) |
| contractAmount | Number | > 0 (optional) | Decimal, 2 places (10.00) |
| notes | String | 0-4000 chars (optional) | Any text |
| reason (status change) | String | 1-500 chars | Any text |

#### Clarification Needed

**Proposed Addition to Section 8:**

> **Input Validation Rules**:
> See validation schema in `2071_01_API_명세.md`:
> - Contract name: 1-255 characters
> - Contract type: 1-50 characters
> - Dates: ISO8601 format (YYYY-MM-DD), start <= end
> - Amount: Decimal with 2 decimal places, optional
> - Notes: 0-4000 characters (CLOB), optional
> - Status change reason: 1-500 characters
> - File name: 1-255 characters (sanitized)
> - All validation server-side, React Hook Form for client-side UX

**Action**: Create comprehensive Zod schema in `2071_01_API_명세.md` during implementation.

#### Acknowledgment

✓ Valid requirement: Complete validation schema needed.
✓ Should be in API spec document, referenced in PRD.
✓ Clear validation rules needed for QA/testing.

---

### Issue 9.3: Soft Delete Query Enforcement Not Specified (HIGH)

#### PRD Position

PRD states: "소프트 삭제: `deleted_at` 설정, 목록에서 제외" but doesn't ensure enforcement.

#### Rebuttal & Justification

**Valid Concern**: Soft delete enforcement is critical for data integrity.

**Implementation Approaches:**

**Option 1: Query Builder Default Scope (Application Level)**

```typescript
// Base repository with soft delete filter
export class MaintenanceContractRepository {
  find(filters = {}) {
    return db.maintenanceContract.find({
      ...filters,
      where: {
        ...filters.where,
        deletedAt: null, // Always exclude soft-deleted
      },
    });
  }

  findAll(skip = 0, take = 20) {
    return this.find({ skip, take });
  }

  findById(id) {
    return this.find({ where: { id } }).firstOrFail();
  }
}
```

**Option 2: Database View (Preferred)**

```sql
-- Create view that automatically filters soft-deleted records
CREATE VIEW v_maintenance_contract AS
  SELECT * FROM MaintenanceContract
  WHERE deleted_at IS NULL;

-- Use view in application instead of table
SELECT * FROM v_maintenance_contract WHERE id = 1;
```

**Option 3: Trigger on SELECT (Not Recommended)**
- Complex, hard to debug
- Not recommended for this use case

**Recommendation**: Option 1 (repository pattern) is best for Phase 1.

#### Clarification Needed

**Proposed Addition to Section 5.3:**

> **Soft Delete Enforcement**:
> - All queries must filter `deleted_at IS NULL` (or use database view)
> - Implementation: Use repository pattern with default scope filter
> - Example:
> ```typescript
> // CORRECT: Uses repository with built-in filter
> const contracts = await contractRepository.find({ customerId: 1 });
> // Generates: WHERE deleted_at IS NULL AND customer_id = 1
>
> // WRONG: Direct database query without filter
> const contracts = await db.maintenanceContract.find({ customerId: 1 });
> // Generates: WHERE customer_id = 1 (includes soft-deleted!)
> ```
> - TESTING: Verify soft-deleted records never appear in API responses

#### Acknowledgment

✓ Valid requirement: Soft delete enforcement is critical.
✓ Repository pattern should be implemented in Phase 1.
✓ Must be enforced in all query handlers (API routes, services).

---

## 10. Performance & Scalability

### Issue 10.1: No N+1 Query Prevention Strategy (HIGH)

#### PRD Position

Doesn't mention eager loading, SELECT field specification, or query optimization.

#### Rebuttal & Justification

**Valid Concern**: N+1 queries are performance anti-pattern.

**Example N+1 Problem:**

```typescript
// WRONG: N+1 queries
const contracts = await db.maintenanceContract.find({ take: 20 });
// Query 1: SELECT * FROM MaintenanceContract (20 rows)

for (const contract of contracts) {
  const customer = await db.customer.findOne(contract.customerId);
  // Queries 2-21: SELECT * FROM Customer (20 separate queries)
}
```

**Optimized Approach: Eager Load Relations**

```typescript
// CORRECT: Eager load with JOIN
const contracts = await db.maintenanceContract
  .createQueryBuilder('c')
  .leftJoinAndSelect('c.customer', 'customer')
  .leftJoinAndSelect('c.assignedEmployee', 'employee')
  .where('c.deletedAt IS NULL')
  .orderBy('c.endDate', 'DESC')
  .take(20)
  .getMany();
// Query 1: SELECT c.*, customer.*, employee.* FROM MaintenanceContract c
//          LEFT JOIN Customer customer ON c.customer_id = customer.id
//          LEFT JOIN Employee employee ON c.assigned_employee_id = employee.id
//          WHERE c.deleted_at IS NULL
//          ORDER BY c.end_date DESC
//          LIMIT 20
```

**TypeORM Query Examples:**

```typescript
// For MaintenanceContractRepository
async findWithRelations(filters: FilterOptions) {
  let query = this.repository
    .createQueryBuilder('c')
    .leftJoinAndSelect('c.customer', 'customer', 'customer.deletedAt IS NULL')
    .leftJoinAndSelect('c.assignedEmployee', 'employee', 'employee.deletedAt IS NULL')
    .where('c.deletedAt IS NULL');

  // Apply filters
  if (filters.status) {
    query = query.andWhere('c.contractStatus = :status', { status: filters.status });
  }
  if (filters.customerId) {
    query = query.andWhere('c.customerId = :customerId', { customerId: filters.customerId });
  }

  // Order by expiration
  query = query.orderBy('c.endDate', 'DESC');

  // Paginate
  query = query.skip(filters.skip).take(filters.take);

  return query.getMany();
}
```

#### Clarification Needed

**Proposed Addition to Section 5.2 (API Routes):**

> **Query Optimization Strategy**:
> - All list endpoints use eager loading (LEFT JOIN for customer, employee, attachment count)
> - SELECT only required fields (don't SELECT * from large CLOB columns)
> - Index strategy defined for common filter/sort combinations
> - Attachment count aggregated in single query (not N queries)
> - Test queries with EXPLAIN PLAN before deployment

**Example Query for GET /api/maintenance:**

```sql
SELECT
  c.id, c.contract_name, c.start_date, c.end_date, c.contract_amount, c.contract_status,
  cust.id as customer_id, cust.name as customer_name,
  emp.id as employee_id, emp.name as employee_name,
  (SELECT COUNT(*) FROM MaintenanceContractAttachment
   WHERE maintenance_contract_id = c.id AND deleted_at IS NULL) as attachment_count
FROM MaintenanceContract c
LEFT JOIN Customer cust ON c.customer_id = cust.id AND cust.deleted_at IS NULL
LEFT JOIN Employee emp ON c.assigned_employee_id = emp.id AND emp.deleted_at IS NULL
WHERE c.deleted_at IS NULL
ORDER BY c.end_date DESC
LIMIT 20 OFFSET 0;
```

#### Acknowledgment

✓ Valid performance requirement: N+1 prevention critical for scale.
✓ Should be defined in implementation guide.
✓ Query patterns should be tested and documented in Phase 1.

---

### Issue 10.2: Caching Strategy Not Defined (MEDIUM)

#### PRD Position

Performance goals mention <200ms p95 but no caching strategy.

#### Rebuttal & Justification

**TanStack Query Caching** (Per CLAUDE.md):

```typescript
// Suggested cache times for maintenance contracts

// List view caching
export function useMaintenanceContractList(filters) {
  return useQuery({
    queryKey: ['maintenance', 'list', filters],
    queryFn: () => fetchContractList(filters),
    staleTime: 5 * 60 * 1000,      // Fresh for 5 minutes
    gcTime: 30 * 60 * 1000,        // Keep in cache for 30 minutes
  });
}

// Detail view caching (longer cache, less change expected)
export function useMaintenanceContractDetail(id) {
  return useQuery({
    queryKey: ['maintenance', 'detail', id],
    queryFn: () => fetchContractDetail(id),
    staleTime: 10 * 60 * 1000,     // Fresh for 10 minutes
    gcTime: 60 * 60 * 1000,        // Keep in cache for 1 hour
  });
}

// Statistics caching
export function useMaintenanceContractStats() {
  return useQuery({
    queryKey: ['maintenance', 'stats'],
    queryFn: () => fetchStats(),
    staleTime: 15 * 60 * 1000,     // Fresh for 15 minutes
    gcTime: 60 * 60 * 1000,        // Keep in cache for 1 hour
  });
}
```

**Cache Invalidation Strategy:**

```typescript
// When contract is updated, invalidate related caches
export function useUpdateContractMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateContract,
    onSuccess: (data) => {
      // Invalidate detail cache
      queryClient.invalidateQueries(['maintenance', 'detail', data.id]);

      // Invalidate list cache (will refetch)
      queryClient.invalidateQueries(['maintenance', 'list']);

      // Invalidate stats cache
      queryClient.invalidateQueries(['maintenance', 'stats']);
    },
  });
}
```

#### Clarification Needed

**Proposed Addition to Section 5.4:**

> **TanStack Query Caching Strategy**:
> - List view: 5-minute stale time (user sees fresh data reasonably often)
> - Detail view: 10-minute stale time (less frequently changed)
> - Stats: 15-minute stale time (aggregated data, changes less often)
> - Garbage collection: 30-60 minutes (keep unused data in memory)
> - Invalidation on mutation: Clear related caches after create/update/delete

#### Acknowledgment

✓ Valid performance consideration: Caching strategy improves response times.
✓ Should be in implementation guide.
✓ TanStack Query provides built-in caching support.

---

### Issue 10.3: Pagination Defaults May Be Too Large (MEDIUM)

#### PRD Position

User Story 1: "기본 20개 항목/페이지, 최대 100개 항목/페이지"

Reviewer concerned 100 items × 100KB = 10MB payload.

#### Rebuttal & Justification

**Valid Concern**: Large page sizes can cause network/memory issues.

**Counter-Argument for 100-item limit:**

1. **Response Size**: Average contract record ~2KB JSON
   - 100 items × 2KB = 200KB (not 10MB)
   - Acceptable for most networks

2. **Default 20 is Reasonable**: Most users won't request 100
   - Default 20 = ~40KB
   - < 200ms target easily achievable

3. **User Choice**: Power users might want 100 for export/reporting
   - Should support, but with warning

**Proposed Compromise:**

- Default: 20 items ✓ (current spec)
- Max: 50 items (reduced from 100) - addresses reviewer concern
- UI warning if requesting > 50 items ("Large page size may be slow")

#### Clarification Needed

**Proposed Addition to Section 3 (User Story 1):**

> **Pagination Spec (Revised)**:
> - Default: 20 items per page
> - Maximum: 50 items per page (revised from 100 to improve performance)
> - UI shows warning if user selects > 50 items
> - Rationale: 50 items × 2KB = 100KB response (well under 200ms target)

#### Acknowledgment

✓ Valid concern: Large page sizes should be limited.
✓ Proposed revision (max 50) balances user choice with performance.
✓ Clarification needed in Phase 1 specification.

---

## 11. ERP Module Dependencies

### Issue 11.1: Dependency on Customer & Employee Not Fully Specified (HIGH)

#### PRD Position

Section 9 lists dependencies but doesn't clarify validation/cascading.

#### Rebuttal & Justification

**Valid Concern**: Integration requirements should be explicit.

**Dependency Specifications:**

1. **Customer Dependency**:
   - Must exist and not be soft-deleted
   - Required fields: id, name (at minimum)
   - FK constraint: MaintenanceContract.customer_id → Customer.id (ON DELETE RESTRICT)
   - Validation: Check customer exists before creating contract

2. **Employee Dependency**:
   - Must exist and not be soft-deleted
   - Required fields: id, name, role
   - FK constraint: MaintenanceContract.assigned_employee_id → Employee.id (ON DELETE RESTRICT)
   - Validation: Can be any employee (no role restriction in Phase 1, could add in Phase 2)
   - FK constraint: MaintenanceContractHistory.changed_by_id → Employee.id

3. **Cascading on Delete**:
   - Customer deleted (soft): MaintenanceContract records remain (FK prevents hard delete)
   - Employee deleted (soft): MaintenanceContract records remain (FK prevents hard delete)
   - Reassignment required before employee deactivation

#### Clarification Needed

**Proposed Addition to Section 9:**

> **Dependency Specifications**:
>
> **Customer Integration**:
> - Customer must exist (api/customers GET required)
> - Validation: Check customer exists and is not deleted before contract creation
> - If customer deleted: FK prevents cascade (manual handling required)
> - Customer fields required: id, name
>
> **Employee Integration**:
> - Employee must exist (api/employees GET required)
> - Validation: Check employee exists and is not deleted before assignment
> - If employee deleted: FK prevents cascade (must reassign first)
> - Employee fields required: id, name, role
> - Phase 1: Any employee can be assigned
> - Phase 2: Could restrict to MANAGER role if needed
>
> **Database Constraints**:
> - MaintenanceContract.customer_id FK ON DELETE RESTRICT
> - MaintenanceContract.assigned_employee_id FK ON DELETE RESTRICT
> - MaintenanceContractHistory.changed_by_id FK (no delete cascade)

#### Acknowledgment

✓ Valid requirement: Dependency specifications should be clear.
✓ FK constraints already correct (ON DELETE RESTRICT).
✓ Validation logic should be documented.

---

### Issue 11.2: No Reference to Dashboard Integration (MEDIUM)

#### PRD Position

Goals mention "계약 현황 시각화" but no dashboard integration spec.

#### Rebuttal & Justification

**Valid Observation**: Dashboard integration is separate but related.

**Proposed Dashboard Widgets** (for future reference):

```typescript
// GET /api/maintenance/stats
Response 200: {
  contractsByStatus: {
    ACTIVE: 45,
    COMPLETED: 12,
    RENEWAL_PENDING: 8,
  },
  expiringNotifications: {
    within30Days: 3,
    within60Days: 7,
  },
  totalContractValue: 1500000,
  averageContractDuration: 365,
}
```

**This Data Used By:**
- Main dashboard (stats cards)
- Maintenance module overview
- Executive reports (Phase 2)

#### Clarification Needed

**Proposed Addition to Section 6:**

> **Dashboard Integration**:
> - GET /api/maintenance/stats provides summary data for dashboard
> - Stats available: contracts by status, expiring soon count, total value
> - Dashboard widgets created in Phase 2
> - Phase 1: Stats API only (no dashboard UI yet)

#### Acknowledgment

✓ Valid observation: Dashboard integration should be mentioned.
✓ Stats API already in scope (User Story 1 list view shows status counts).
✓ Dashboard UI is Phase 2 work.

---

### Issue 11.3: No Mention of Customer Module Dependencies (LOW)

#### PRD Position

Doesn't clarify interaction with Customer module.

#### Rebuttal & Justification

**Module Responsibility Clarification:**

1. **Maintenance Module (2071)**:
   - Contract information
   - Contract lifecycle management
   - File attachments specific to contracts
   - Contract history/renewal tracking

2. **Customer Module** (Phase 1, separate):
   - Customer master data (name, address, contact info)
   - Customer contacts (phone, email, relationship)
   - Customer attachment (company docs, certifications)
   - Maintenance contracts are linked FROM customer perspective

3. **No Overlap**: Read-only customer reference (no editing in maintenance module)

#### Clarification Needed

**Proposed Addition to Section 4.1:**

> **Module Responsibility**:
> - Maintenance module: Contract management (read customer data via API)
> - Customer module: Master customer data (handles contacts, general info)
> - Customer contacts/attachments: Managed in Customer module, not here
> - Cross-module navigation: "View Customer" link to customer detail page (Phase 2)

#### Acknowledgment

✓ Valid clarification: Module boundaries should be clear.
✓ Not a gap, just documentation.
✓ Low priority for Phase 1 scope.

---

## 12. Testing Strategy

### Issue 12.1: Testing Requirements Not Defined (LOW)

#### PRD Position

Section 7 states: "API 테스트 커버리지 ≥ 80%" but no test specs defined.

#### Rebuttal & Justification

**Valid Observation**: Testing strategy should be documented.

**Proposed Testing Approach** (for implementation guide):

```typescript
// Unit Tests
- Entity validation (date constraints, enum values)
- Business logic (status transitions, calculations)
- Utility functions (contract status badge color, expiration days)

// Integration Tests
- API endpoint tests (request/response validation)
- Database integration (CRUD operations)
- Authorization (RBAC enforcement)
- Soft delete enforcement (deleted_at filter)

// E2E Tests
- Create contract workflow
- Update contract + state change
- File upload/download
- Filtering/search
- Pagination
```

**Test Coverage Goals:**
- Unit: 80%+ of business logic
- Integration: 100% of API endpoints
- E2E: Major user workflows

#### Clarification Needed

**Proposed Addition for Implementation Guide** (not PRD):

> **Testing Strategy** (see `2071_02_테스트_가이드.md`):
> - Unit tests: Entity, service logic (Vitest)
> - Integration tests: API endpoints with mock DB (Vitest + test containers)
> - E2E tests: Major workflows (Playwright)
> - Coverage target: ≥ 80% for API routes
> - Test data: Seed scripts in /test/fixtures/

#### Acknowledgment

✓ Valid observation: Testing needs specification.
✓ Should be in separate testing guide, not PRD.
✓ Can be created during Phase 1 implementation.

---

## 13. Documentation Gaps

### Issue 13.1: No Developer Implementation Guide (LOW)

#### PRD Position

Comprehensive business spec but no developer guide.

#### Rebuttal & Justification

**Proposed Supplementary Docs** (to be created):

1. `2071_01_API_명세.md` — Request/response schemas, parameters, errors
2. `2071_02_구현_가이드.md` — Step-by-step implementation walkthrough
3. `2071_03_데이터베이스_마이그레이션.md` — Migration creation, index strategy
4. `2071_04_API_테스트.md` — API testing guide with examples
5. `2071_05_개발자_QA체크리스트.md` — Checklist before code review

#### Acknowledgment

✓ Valid observation: Supplementary docs improve implementation speed.
✓ These should be created during Phase 1.
✓ Not blocking Phase 1 scope but recommended for efficiency.

---

## 14. Out-of-Scope Clarifications

### Issue 14.1: Renewal Workflow Contradiction (HIGH)

#### PRD Position

Section 4.2 says auto-renewal is out-of-scope, but renewal history (User Story 9) and갱신예정 state (User Story 7) are in-scope.

#### Rebuttal & Justification

**Already Addressed Above** (Section 2.3): Renewal in Phase 1 means manual renewal with history tracking, not automatic.

**Summary:**
- **Out-of-Scope**: System-triggered automatic renewal (Phase 2)
- **In-Scope**: Manual renewal via MANAGER updating end_date + history recording

---

## Summary of Rebuttal Positions

| Issue | Category | Status | Action |
|-------|----------|--------|--------|
| 1.1 Status Transitions | Clarity | VALID CONCERN | Add clarification that transitions are manual |
| 1.2 담당자 Ownership | Clarity | VALID CONCERN | Document Phase 1 = all MANAGERs, Phase 2 = scoped access |
| 2.1 Pagination for Nested Resources | Performance | PARTIALLY VALID | Document limits (5 attachments, 1-3 history records) |
| 2.2 Duplicate Detection | Data Quality | DESIGN CHOICE | Document explicitly: overlapping allowed, MANAGER responsible |
| 2.3 Renewal Logic | Scope Gap | CLARIFICATION NEEDED | Define "갱신" as manual renewal, not automatic |
| 2.4 File Upload Edge Cases | Implementation | IMPLEMENTATION DETAIL | Document in implementation guide, not PRD |
| 3.1 SC Data Fetching | Architecture | DOCUMENTATION GAP | Reference CLAUDE.md patterns in implementation guide |
| 3.2 SC/CC Boundary | Architecture | TERMINOLOGY ISSUE | Clarify component structure: SC wrapper + CC children |
| 4.1 Attachment Cascade | Database | CLARIFICATION NEEDED | Document soft-delete strategy for attachments |
| 4.2 Index Strategy | Performance | VALID REQUIREMENT | Add to migration file with specific indices |
| 4.3 History Immutability | Data Integrity | CLARIFICATION NEEDED | Document immutability enforcement (app-level Phase 1, DB trigger Phase 2) |
| 5.1 Authorization Granularity | Security | VALID REQUIREMENT | Add RBAC matrix to Section 5.5 |
| 5.2 File Download Auth | Security | CLARIFICATION NEEDED | Specify download = USER+, through API endpoint |
| 6.1 Zustand vs useState | State Management | CLARIFICATION NEEDED | Use URL params + TanStack Query (not Zustand) |
| 6.2 Optimistic Updates | UX | IMPLEMENTATION DETAIL | Document pattern in implementation guide |
| 7.1 API Response Contracts | API Design | SEPARATE DOCUMENT | Create 2071_01_API_명세.md |
| 7.2 Query Parameters | API Design | SEPARATE DOCUMENT | Document parameter naming in API spec |
| 7.3 Batch Operations | Feature Scope | INTENTIONAL OUT-OF-SCOPE | Phase 2 enhancement |
| 8.1 Loading States | UX | IMPLEMENTATION DETAIL | Reference shadcn/ui Skeleton usage |
| 8.2 Date Picker UI | UX | IMPLEMENTATION DETAIL | Suggest shadcn/ui DatePicker in implementation guide |
| 8.3 File Download Behavior | Security | CLARIFICATION NEEDED | Document Content-Disposition: attachment |
| 9.1 Path Traversal Prevention | Security | VALID DESIGN | Document UUID filename strategy + validation |
| 9.2 Input Validation | Security | VALID REQUIREMENT | Create Zod schema in API spec |
| 9.3 Soft Delete Enforcement | Data Integrity | VALID REQUIREMENT | Implement repository pattern with soft-delete filter |
| 10.1 N+1 Query Prevention | Performance | VALID REQUIREMENT | Document eager loading in implementation guide |
| 10.2 Caching Strategy | Performance | VALID REQUIREMENT | Document TanStack Query cache times |
| 10.3 Pagination Max Size | Performance | VALID CONCERN | Reduce from 100 to 50 items max |
| 11.1 Dependency Specs | Integration | CLARIFICATION NEEDED | Document FK constraints and validation |
| 11.2 Dashboard Integration | Feature | REFERENCE ONLY | Stats API already in scope, dashboard UI Phase 2 |
| 11.3 Customer Module | Module Boundaries | DOCUMENTATION | Clarify module responsibilities |
| 12.1 Testing Strategy | QA | LOW PRIORITY | Create testing guide in Phase 1 |
| 13.1 Developer Guide | Documentation | LOW PRIORITY | Create supplementary docs in Phase 1 |
| 14.1 Renewal Contradiction | Scope | ADDRESSED | Manual renewal in Phase 1, automatic Phase 2 |

---

## Conclusion

**Overall Assessment**: The 2071 PRD is fundamentally sound. Of 14 critical issues identified in the review:

- **5 issues are valid concerns** requiring clarification in Phase 1 (state transitions, API contracts, authorization, soft-delete enforcement, query optimization)
- **4 issues are design justifications** with intent already in PRD but poorly communicated (pagination limits, file upload strategy, state management, duplicate detection)
- **5 issues are implementation details** belonging in supplementary documentation, not PRD (loading states, testing strategy, implementation guide, etc.)

**Recommended Actions**:

1. **Update PRD with Clarifications** (within Section 5-9):
   - Add state machine diagram for status transitions
   - Clarify RBAC enforcement in API routes
   - Document soft-delete query enforcement
   - Reduce max pagination to 50 items

2. **Create Supplementary Documents** (Phase 1 deliverables):
   - `2071_01_API_명세.md` — API contracts, validation schemas
   - `2071_02_구현_가이드.md` — Implementation walkthrough, query patterns
   - `2071_03_테스트_가이드.md` — Testing strategy and checklist

3. **Phase 2 Enhancements** (noted for future):
   - Automatic contract renewal workflow
   - Department-scoped access control
   - Background job for failed upload cleanup
   - Dashboard integration widgets

**Estimated Effort to Resolve**: 6-8 hours for clarifications + 12-16 hours for supplementary documents

---

**Rebuttal Completed:** 2026-01-25 23:00:00 KST
**Status:** Ready for Mediation Phase

