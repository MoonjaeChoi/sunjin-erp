<!-- Generated: 2026-01-25 23:00:00 KST -->

# Rebuttal: 재고 관리 (Inventory Management) PRD 2061

**문서번호:** 2061_재고_관리_prd_rebuttal
**작성일:** 2026-01-25
**대상:** 2061_재고_관리_prd_critical_review.md의 지적사항

---

## Executive Summary

The critical review raises valid architectural and specification concerns. This rebuttal acknowledges **all 11 HIGH/MEDIUM issues** and clarifies the design intent. Most issues are **valid concerns requiring clarification** rather than fundamental design flaws.

**Resolution Status:**
- **5 HIGH issues:** 4 require explicit clarification, 1 requires Phase 1 implementation fix
- **8 MEDIUM issues:** 6 are valid enhancement notes, 2 require Phase 1 clarification
- **5 LOW issues:** All are valid polish recommendations for Phase 1

---

## Detailed Rebuttal by Section

---

## 1. CLARITY & AMBIGUITY

### 1.1 User Role Definition Inconsistency (HIGH)

**Review Issue:** Section 1 says "USER / MANAGER / ADMIN" but Section 5.5 says USER is read-only, contradicting User Story 8 which allows USER to checkin.

**Rebuttal:**

**Valid Concern - Acknowledged.** This is a genuine contradiction that must be resolved before implementation.

**Design Intent:**
- The PRD intended USER to be read-only (view-only access)
- User Story 8's inclusion of USER was an error (copy-paste oversight)
- Line 96 should read "MANAGER / ADMIN only" for checkin operations

**Current PRD Position:**
- Section 5.5 (Authorization) clearly states "USER: 목록 조회, 상세 조회 읽기만 가능"
- This is the intended permission model

**Recommendation Accepted:** Use Option A from review:
- USER: Read-only (조회만)
- MANAGER: Checkout/checkin/relocate
- ADMIN: All operations + delete

**Action Required:**
Update User Story 8 to say "MANAGER / ADMIN" instead of "USER / MANAGER / ADMIN" (Line 96).

---

### 1.2 "출고 위치" vs "현재 위치" Semantics (MEDIUM)

**Review Issue:** Unclear whether current_location updates on checkout/checkin.

**Rebuttal:**

**Valid Concern - Partially Addressed.** The distinction is made in Q&A (Line 376-377), but acceptance criteria could be clearer.

**Design Intent:**
- `current_location`: Physical warehouse location (always tracked)
- `checkout_location`: Logical destination (project, person, etc.)

**Clarification:**

| Operation | Current Location | Checkout Location | Notes |
|-----------|------------------|-------------------|-------|
| 입고 (Checkin) | Specified by user (warehouse) | N/A | Initial location set |
| 출고 (Checkout) | Remains warehouse | Updated to project/destination | Physical location unchanged, logical owner updated |
| 위치변경 (Relocation) | Updated to new warehouse | N/A | Only when status = "재고" |
| 반납 (Return) | Updated to return location | N/A | Cleared; equipment back in stock |

**InventoryHistory Tracking:**
- `checkout_location`: Captured only in checkout operation
- `previous_location` / `new_location`: Captured in relocation operation
- On checkin, `checkout_location` is cleared (not stored in history)

**Action Required:**
- Add explicit table to Section 3 (User Stories) clarifying location update behavior
- Confirm: Checkout doesn't update current_location, only checkout_location

---

### 1.3 Status Transition Rules Incomplete (MEDIUM)

**Review Issue:** Missing state transitions; unclear if 출고 → 폐기 (direct deprecation) allowed.

**Rebuttal:**

**Valid Concern - Design Decision Needed.** The review correctly identifies ambiguous transitions.

**Current PRD Position (Line 87-91):**
```
재고 → 고장 / 폐기 (O)
출고 → 고장 / 폐기 (O, 반납 후)
고장 → 폐기 (O)
폐기 → 변경 불가 (최종 상태)
```

**Interpretation:** "O, 반납 후" (require return first) suggests:
- 출고 → 폐기 NOT allowed directly
- Must 출고 → 재고 (return) → 폐기

**Missing Cases Identified by Review:**
1. **출고 → 폐기 directly?** — Currently: NO (must return first)
2. **고장 → 재고 (repair)?** — Currently: NO (one-way to deprecation)
3. **고장 → 출고 (send for external repair)?** — Currently: NO (not in scope)
4. **폐기 → any?** — Currently: NO (final state)

**Design Decision:**
Status transitions are **deliberately restrictive** to maintain data integrity:
- Once "폐기", no further changes
- Once "고장", only path is 폐기 (not returning to stock)
- Checked-out equipment must return before deprecation

**This is NOT a flaw, but a business rule.** The restrictive model prevents equipment mismanagement.

**Action Required:**
- Add explicit state transition diagram to Section 3 or 9 (as review suggests)
- Clarify: These are feature constraints, not oversights

---

## 2. COMPLETENESS & EDGE CASES

### 2.1 Missing Approval Workflow (HIGH)

**Review Issue:** No approval for critical operations (deprecation, status changes) — risky for expensive equipment.

**Rebuttal:**

**Valid Concern - Acknowledged as Out-of-Scope by Design.**

**Current PRD Position (Section 4.2):**
The PRD explicitly lists approval workflows as **Out-of-Scope** for Phase 1:
```
출고 승인 워크플로우
```

**Design Intent:**
Phase 1 prioritizes core CRUD functionality. Approval workflows are Phase 2+ enhancements.

**Business Justification:**
- Early phases assume trust in MANAGER/ADMIN users (smaller teams)
- Approval workflows add significant complexity
- Can be added retroactively without schema changes

**Recommendation Accepted:**
The review correctly notes this limitation. For Phase 1, rely on:
- Role-based access (MANAGER/ADMIN only)
- Immutable audit trail (InventoryHistory)
- Optional manual review process (outside system)

**Action Required:**
- Explicitly add to Section 4.2 (Out-of-Scope): "장비 상태 변경 승인 워크플로우"
- No schema change needed; Phase 2 can add approval_status to InventoryHistory

---

### 2.2 Overdue Equipment Tracking Missing (MEDIUM)

**Review Issue:** No enforcement of expected_checkin_date; no overdue alerts.

**Rebuttal:**

**Valid Concern - Confirmed as Out-of-Scope.**

**Current PRD Position (Section 4.2):**
```
자동 알림 (재고 부족 경보) — Out-of-Scope
```

**Design Intent:**
Overdue tracking is intentionally Phase 2+. Phase 1 stores `expected_checkin_date` for future use.

**Why Out-of-Scope for Phase 1:**
1. Notification system not yet built
2. Adds alert logic complexity
3. Can be implemented without schema migration

**Phase 1 Preparation:**
- Store `expected_checkin_date` in InventoryHistory
- No validation or enforcement
- Foundation for Phase 2 alerts

**Recommendation Accepted:**
The review suggests:
- Clarify in Section 4.2 (done above)
- Add computed field `is_overdue` (optional for Phase 1)
- Add `overdue_count` to statistics (Phase 2)

**Action Required:**
- Confirm: Phase 1 stores date but doesn't enforce/alert
- Implement computed `is_overdue` field in Phase 2

---

### 2.3 Equipment Checkout While Broken (MEDIUM)

**Review Issue:** No validation preventing checkout of "고장" equipment.

**Rebuttal:**

**Non-Issue - Already Designed In.**

**PRD Already Specifies (Line 68):**
```
출고 폼: 장비 선택(상태: 재고인 것만)
```

**Clear Restriction:** Only equipment with `current_status = '재고'` can be checked out. Equipment with status `고장` or `폐기` are excluded.

**This is enforced:**
1. CheckoutForm: Render only "재고" items
2. API validation: Reject checkout if status ≠ "재고"

**Recommendation Not Needed:** The review misread the AC; this is already specified.

---

### 2.4 Serial Number Uniqueness Enforcement (HIGH)

**Review Issue:** Oracle doesn't support conditional unique constraints; UNIQUE with "deleted_at IS NULL" isn't possible.

**Rebuttal:**

**Valid Concern - Implementation Detail Needs Clarification.**

**Current PRD Position (Line 225):**
```
`serial_number` UNIQUE 제약 (중복 입고 방지, deleted_at IS NULL 조건)
```

**Problem Acknowledged:** Oracle doesn't support CHECK constraints with IS NULL in unique indexes (this varies by version).

**Recommended Solutions (from review):**

**Option 1: Partial Unique Index (Preferred)**
```sql
CREATE UNIQUE INDEX idx_inventory_serial_active
ON inventory(serial_number) WHERE deleted_at IS NULL;
```
- Supported in Oracle 12c+
- Clean, efficient
- Recommended for sunjin-erp (Oracle XE 21c)

**Option 2: Database Trigger**
```sql
CREATE TRIGGER trg_inventory_serial_unique
BEFORE INSERT ON inventory
BEGIN
  SELECT COUNT(*) INTO cnt FROM inventory
  WHERE serial_number = :NEW.serial_number AND deleted_at IS NULL;
  IF cnt > 0 THEN
    RAISE_APPLICATION_ERROR(-20001, 'Serial number must be unique');
  END IF;
END;
```
- More complex, less efficient
- Fallback if index not available

**Option 3: Application Validation**
- Application checks before insert
- Not sufficient alone (race conditions possible)
- Use as safety net only

**Design Decision:**
Use **Option 1** (partial unique index) as primary enforcement, with **Option 3** (app validation) as defense-in-depth.

**Action Required:**
- Update Section 5.3 to specify partial unique index approach
- Create explicit migration file with INDEX DDL
- Add application-level validation in CreateInventoryForm and API handler

---

### 2.5 Cascading Deletion Behavior Undefined (HIGH)

**Review Issue:** Soft delete strategy unclear; TypeORM softRemove() behavior not defined; cascade handling ambiguous.

**Rebuttal:**

**Valid Concern - Requires Clarification and Implementation Planning.**

**Current PRD Position (Line 237-238):**
```
Soft delete 필수 (deleted_at 컬럼)
InventoryHistory: ON DELETE RESTRICT
```

**Problem Identified:**
1. How to perform soft delete in TypeORM? (softRemove() vs UPDATE)
2. Can you delete Inventory if InventoryHistory exists? (ON DELETE RESTRICT)
3. Should deleted inventory appear in API responses?

**Soft Delete Strategy:**

**For Inventory (parent):**
```typescript
// WRONG (attempts physical delete)
await repository.delete({ id });

// CORRECT (soft delete)
await repository.update({ id }, { deletedAt: new Date() });

// Or with TypeORM softRemove (if configured)
await repository.softRemove(inventory);
```

**For InventoryHistory (child):**
- Should NEVER be soft-deleted independently
- Remains as immutable audit trail
- ON DELETE RESTRICT prevents accidental cascade

**Implementation Pattern:**
```typescript
// When deleting Inventory:
await queryRunner.manager.update(Inventory,
  { id },
  { deletedAt: new Date(), deletedById: user.id }
);
// InventoryHistory records remain untouched
```

**API Response Filtering:**
```typescript
// GET /api/inventory should exclude deleted records
const active = await repository.find({
  where: { deletedAt: IsNull() }
});

// GET /api/inventory/[id]/history should include history even if inventory deleted
const history = await historyRepository.find({
  where: { inventoryId: id }
});
```

**Action Required:**
- Add explicit soft delete implementation pattern to Section 5.3
- Create migration with proper `deleted_at` and `deleted_by_id` columns
- Document TypeORM @DeleteDateColumn() usage
- Add comment: "InventoryHistory never soft-deleted; audit trail immutable"

---

## 3. ARCHITECTURE COMPLIANCE

### 3.1 Server Component Data Fetching Unclear (MEDIUM)

**Review Issue:** Section 5.1 implies server-side data fetching in Server Component, contradicting sunjin-erp pattern of TanStack Query.

**Rebuttal:**

**Valid Concern - Requires Clarification of Architecture Pattern.**

**Current PRD Position (Line 153-154):**
```
- `inventory/page.tsx`: Server Component — 데이터 페칭, 권한 검증
```

**Misunderstanding:** "데이터 페칭" was intended to mean fetching for **layout/structural purposes only**, not business data.

**Correct sunjin-erp Pattern:**

| Layer | Component Type | Responsibility | Data Fetching |
|-------|-----------------|-----------------|----------------|
| Route/Layout | Server Component | Auth verification, layout structure | getServerSession() only |
| Business Data | Client Component | User interactions, forms, filtering | TanStack Query |
| API | Route Handler | Business logic, validation, DB queries | SQL queries |

**Clarified Pattern:**
```typescript
// app/(main)/inventory/page.tsx (Server Component)
export default async function InventoryPage() {
  const session = await getServerSession(); // ✓ Auth check
  if (!session) redirect('/login');

  return <InventoryListClient />; // ✓ Render client component
}

// components/features/inventory/InventoryListClient.tsx (Client Component)
export function InventoryListClient() {
  const { data, isLoading } = useInventoryList(); // ✓ TanStack Query
  return <InventoryTable data={data} />;
}
```

**Action Required:**
- Clarify Section 5.1 to explicitly separate auth/layout (server) from data fetching (client)
- Note: All business data comes via TanStack Query to Client Component
- Remove ambiguous "데이터 페칭" from Server Component description

---

### 3.2 Client vs Server Component Separation Missing (MEDIUM)

**Review Issue:** Form rendering location and cache invalidation pattern not specified.

**Rebuttal:**

**Valid Concern - Requires Explicit Pattern Documentation.**

**Recommended Pattern (review is correct):**

```
1. InventoryListClient (Client) renders table
2. [입고] button opens CreateInventoryDialog (Client)
3. CreateInventoryForm (Client) uses useCreateInventoryMutation()
4. On success:
   a. Mutation invalidates useInventoryList() query
   b. useInventoryList() refetches data
   c. Table auto-updates
   d. Dialog closes
```

**Implementation Pattern to Document:**
```typescript
// hooks/useInventoryMutations.ts
export function useCreateInventoryMutation() {
  const queryClient = useQueryClient();
  return useMutation(
    async (data) => POST('/api/inventory', data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['inventory-list']);
        // Dialog closes via callback
      }
    }
  );
}
```

**Action Required:**
- Add Section 5.6 (Form & Dialog Pattern) with explicit code example
- Document cache invalidation for each operation
- Clarify: Forms are in dialogs; dialogs are Client Components

---

### 3.3 File Structure Has Non-Standard Paths (LOW)

**Review Issue:** Route `/inventory/[id]/actions/page.tsx` is unusual.

**Rebuttal:**

**Valid Suggestion - Design Choice Needs Clarification.**

**Current PRD Position (Section 10):**
```
├── [id]/actions/page.tsx  # 출고/반납/위치변경 (SC)
```

**Design Rationale:**
- Option A (dialogs on detail page) — simpler UX
- Option B (separate action pages) — explicit routes

PRD chose Option B implicitly (via file structure), but didn't explain why.

**Recommendation from Review (Correct):**
Option A (dialogs) is more intuitive:
```
├── [id]/page.tsx  # Detail view + action dialogs (no /actions subpath)
```

**Action Required:**
- Adopt Option A: Remove `/actions/page.tsx` from file structure
- Update Section 10 to show single detail page with embedded dialogs
- Dialogs triggered by buttons on detail page

---

## 4. DATABASE DESIGN

### 4.1 Entity Relationships Missing FK Definitions (MEDIUM)

**Review Issue:** TypeORM decorators (@OneToMany, @JoinColumn, etc.) not shown in entity specs.

**Rebuttal:**

**Valid Concern - Implementation Detail, Not Spec Flaw.**

**Current PRD Position (Section 5.3):**
PRD defines entities in conceptual notation, not TypeORM code.

**Why Not in PRD:**
- PRD is requirements document, not implementation code
- TypeORM decorators are implementation detail
- Migration files will define actual structure

**However, Review is Correct:** Adding TypeORM example improves clarity.

**Action Required:**
- Add Appendix to PRD with TypeORM entity code templates
- Or defer to implementation plan (out of PRD scope)
- Minimum: Add FK notation to entity diagrams (e.g., "Inventory ←→ InventoryHistory")

---

### 4.2 Check Constraint for Status Enum (MEDIUM)

**Review Issue:** Oracle CHECK constraint optional; status validation not enforced at DB.

**Rebuttal:**

**Valid Concern - Requires Multi-Layer Enforcement.**

**Recommended Approach (Review Correct):**

**Layer 1: Database**
```sql
ALTER TABLE inventory ADD CONSTRAINT chk_inventory_status
CHECK (current_status IN ('재고', '출고', '고장', '폐기'));
```

**Layer 2: TypeORM**
```typescript
enum InventoryStatus {
  IN_STOCK = '재고',
  CHECKED_OUT = '출고',
  BROKEN = '고장',
  DEPRECATED = '폐기'
}

@Column({ type: 'varchar2', enum: InventoryStatus })
current_status: InventoryStatus;
```

**Layer 3: API Validation**
```typescript
const VALID_STATUSES = ['재고', '출고', '고장', '폐기'];
if (!VALID_STATUSES.includes(newStatus)) {
  throw new BadRequestException('Invalid status');
}
```

**Action Required:**
- Update Section 5.3 to specify CHECK constraint in migration
- Document all three enforcement layers
- Add constant definition for status enum

---

### 4.3 InventoryHistory Soft Delete Semantics Undefined (HIGH)

**Review Issue:** Section 5.3 says InventoryHistory shouldn't be soft-deleted but column exists; unclear.

**Rebuttal:**

**Valid Concern - Requires Explicit Policy Definition.**

**Current PRD Position (Line 208):**
```
└── deleted_at: DateTime (nullable) — 소프트 삭제 (논리적으로는 사용 안 함)
```

**Clarification:**

**Design Intent:**
- InventoryHistory should be immutable audit trail
- Should NEVER be deleted (soft or hard)
- But parent Inventory CAN be soft-deleted
- When querying, include history from deleted inventory

**Recommended Policy:**

| Scenario | Behavior |
|----------|----------|
| Delete Inventory | Soft-delete inventory only (InventoryHistory remains) |
| View Equipment Detail | Show history even if inventory deleted |
| List All Equipment | Exclude deleted inventory and its history |
| Audit Trail | InventoryHistory is permanent |

**Implementation:**
```sql
-- Migration: Don't add deleted_at to inventory_history
-- Or if added, never use it (only for consistency)

-- Query: Include history of deleted inventory when viewing detail
SELECT * FROM inventory_history
WHERE inventory_id = ?; -- No filter for deleted_at

-- Query: Exclude history of deleted inventory when listing
SELECT * FROM inventory_history ih
WHERE ih.inventory_id IN (
  SELECT id FROM inventory WHERE deleted_at IS NULL
);
```

**Action Required:**
- Remove deleted_at column from InventoryHistory (or leave but document as unused)
- Add explicit policy: "InventoryHistory is immutable; never soft-deleted"
- Document query patterns for history retrieval

---

### 4.4 Missing Indexes for Performance (MEDIUM)

**Review Issue:** Only serial_number is indexed; missing indexes for common queries.

**Rebuttal:**

**Valid Concern - Performance-Critical for Production.**

**Recommended Indexes (Review Correct):**
```sql
-- List queries with filters
CREATE INDEX idx_inventory_status ON inventory(current_status)
WHERE deleted_at IS NULL;
CREATE INDEX idx_inventory_category ON inventory(category)
WHERE deleted_at IS NULL;
CREATE INDEX idx_inventory_location ON inventory(current_location)
WHERE deleted_at IS NULL;

-- History queries
CREATE INDEX idx_inventory_history_inventory_id ON inventory_history(inventory_id);
CREATE INDEX idx_inventory_history_changed_at ON inventory_history(changed_at);

-- Search
CREATE INDEX idx_inventory_serial_search ON inventory(serial_number)
WHERE deleted_at IS NULL;
CREATE INDEX idx_inventory_model_search ON inventory(model)
WHERE deleted_at IS NULL;
```

**Business Impact:**
- Without indexes, filtering by category/status causes full table scans
- With 10k+ records, queries slow from <10ms to >1s
- Critical for dashboard performance

**Action Required:**
- Add Section 5.3.1 (Index Strategy) to PRD
- Include all recommended indexes in migration file
- Document why each index is needed (e.g., "status index for 출고 list filtering")

---

## 5. AUTHENTICATION & AUTHORIZATION

### 5.1 Permission Model for Checkout/Checkin Contradictory (HIGH)

**Review Issue:** Restates Section 1.1 contradiction.

**Rebuttal:**

Already addressed in Section 1.1 above. **USER should be read-only only.**

---

### 5.2 Department-Based Access Control Missing (MEDIUM)

**Review Issue:** No mention of department scoping for MANAGER permissions.

**Rebuttal:**

**Valid Concern - Scope Question for sunjin-erp Context.**

**Design Decision Needed:**

**Current sunjin-erp Pattern:**
- MANAGER permissions are department-scoped
- Users belong to departments
- MANAGER can only access their department's data

**For Inventory Module:**

**Option A: No Department Scoping**
- MANAGER sees all inventory
- Simpler implementation
- Works for small teams

**Option B: Department-Scoped (Preferred)**
- Add `department_id` FK to Inventory (optional)
- MANAGER filtered by: `inventory.department_id = session.user.department_id`
- Scales better; aligns with sunjin-erp pattern

**Recommendation:**
Implement Option B for consistency:
```typescript
// API query
const inventory = await repository.find({
  where: {
    deletedAt: IsNull(),
    ...(session.user.role === 'MANAGER' && {
      departmentId: session.user.departmentId
    })
  }
});
```

**Action Required:**
- Add `department_id: FK → Department (optional)` to Inventory entity
- Update authorization rules in Section 5.5:
  - USER: View all (not department-scoped; users need cross-dept visibility)
  - MANAGER: Manage own department only
  - ADMIN: All

---

### 5.3 Missing Audit Trail for Sensitive Operations (MEDIUM)

**Review Issue:** No logging of deletions (who, when).

**Rebuttal:**

**Valid Concern - Acknowledged for Phase 1 Enhancement.**

**Current PRD Position:**
- InventoryHistory tracks status changes
- InventoryHistory tracks checkout/checkin
- But deletion (soft delete) not logged

**Enhancement Needed:**

**Phase 1 Minimum:**
- Track deletion in InventoryHistory:
  ```
  change_type: '삭제'
  changed_by_id: admin_user_id
  changed_at: timestamp
  ```

**Phase 2 Enhancement:**
- Separate AuditLog table for sensitive actions
- Log all ADMIN operations (delete, restore, etc.)

**Action Required:**
- Add InventoryHistory entry for soft delete operations
- Document in Section 5.3: "Soft delete is audited via InventoryHistory"

---

## 6. STATE MANAGEMENT

### 6.1 Missing Cache Invalidation Strategy (HIGH)

**Review Issue:** No specification of which queries to invalidate after each operation.

**Rebuttal:**

**Valid Concern - Critical for TanStack Query Implementation.**

**Cache Invalidation Map:**

| Operation | Affected Queries | Reason |
|-----------|-----------------|--------|
| Create Inventory | inventory-list, inventory-stats | New item added |
| Update Inventory | inventory-list, inventory-detail, inventory-stats | Item modified |
| Checkout | inventory-list, inventory-detail, inventory-stats | Status changed |
| Checkin | inventory-list, inventory-detail, inventory-stats | Status changed |
| Relocate | inventory-list, inventory-detail | Location changed |
| Status Change | inventory-list, inventory-detail, inventory-stats | Status changed |
| Soft Delete | inventory-list, inventory-detail, inventory-stats | Item hidden |

**Implementation Pattern:**
```typescript
export function useInventoryMutations() {
  const queryClient = useQueryClient();

  const invalidateAll = () => {
    queryClient.invalidateQueries(['inventory-list']);
    queryClient.invalidateQueries(['inventory-detail']);
    queryClient.invalidateQueries(['inventory-stats']);
  };

  return {
    createMutation: useMutation({...}, { onSuccess: invalidateAll }),
    checkoutMutation: useMutation({...}, { onSuccess: invalidateAll }),
    checkinMutation: useMutation({...}, { onSuccess: invalidateAll }),
    // etc.
  };
}
```

**Action Required:**
- Add Section 5.4.1 (Cache Invalidation Strategy) with invalidation map
- Provide code template for each mutation

---

### 6.2 Real-Time Stats Update Strategy Unclear (MEDIUM)

**Review Issue:** "Real-time" stats not clearly defined (polling vs WebSocket).

**Rebuttal:**

**Valid Concern - Requires Definition and Clarification.**

**Recommended Approach:**

**Phase 1: "Near-Real-Time" via Cache Invalidation**
- User performs action → mutation succeeds
- Mutation invalidates stats cache
- Stats hook refetches (latency: 100-200ms)
- UI updates within 200ms
- **This is "near-real-time", not true real-time**

**Phase 2+: True Real-Time via WebSocket**
- Server broadcasts stats update to all clients
- Latency: <50ms
- Requires additional infrastructure (WebSocket server, Redis pub/sub)

**Phase 1 Implementation:**
```typescript
export function useInventoryStats() {
  return useQuery(['inventory-stats'], fetchStats, {
    staleTime: 0, // Always treat as stale
    cacheTime: 5 * 60 * 1000 // Keep in cache 5 min (background)
  });
}

// On mutation success, refetch
onSuccess: () => {
  queryClient.invalidateQueries(['inventory-stats']);
}
```

**Action Required:**
- Clarify Section 5.4: "Stats updates are near-real-time (via cache invalidation)"
- Defer true real-time to Phase 2+
- Update User Story 9 Acceptance Criteria: "Updates within 200ms of action"

---

### 6.3 Form State Management Not Specified (LOW)

**Review Issue:** React Hook Form usage not detailed.

**Rebuttal:**

**Valid Suggestion - Implementation Detail for Documentation.**

**Pattern to Document:**
```typescript
export function CheckoutForm({ inventoryId, onSuccess }) {
  const { register, handleSubmit, formState: { errors }, reset } = useForm();
  const mutation = useCheckoutMutation();

  const onSubmit = async (data) => {
    await mutation.mutateAsync({ ...data, id: inventoryId });
    reset();
    onSuccess?.();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('checkoutLocation', { required: 'Required' })} />
      {errors.checkoutLocation?.message && <span>{errors.checkoutLocation.message}</span>}
      <button disabled={mutation.isPending}>
        {mutation.isPending ? 'Processing...' : 'Checkout'}
      </button>
      {mutation.error && <Alert variant="destructive">{mutation.error.message}</Alert>}
    </form>
  );
}
```

**Action Required:**
- Add Appendix or Section 5.4.2 (Form Pattern) with code template
- Document error handling, loading states, success callbacks

---

## 7. API DESIGN

### 7.1 Missing Bulk Operation Endpoints (MEDIUM)

**Review Issue:** No bulk endpoints for multi-select operations.

**Rebuttal:**

**Valid Enhancement - Defer to Phase 2.**

**Use Case Acknowledged:**
Manager wants to deprecate 10 items at once. Current API requires 10 requests (2 seconds).

**Bulk Endpoints for Phase 2:**
```
POST /api/inventory/bulk/status        # Batch status change
POST /api/inventory/bulk/relocate      # Batch location change
POST /api/inventory/bulk/delete        # Batch soft delete

Request: { ids: [1, 2, 3], action: 'deprecate', reason: 'EOL' }
Response: { success: 3, failed: 0, errors: [] }
```

**Phase 1 Rationale:**
- Core features first (single-item operations)
- Bulk operations can be added without schema changes
- UI can show checkboxes now (backend added later)

**Action Required:**
- Add to Section 4.2 (Out-of-Scope): "Bulk operation endpoints"
- Note: UI prepared for Phase 2 (selectable rows, batch actions button)

---

### 7.2 Missing Query Parameter Specification (MEDIUM)

**Review Issue:** GET /api/inventory query parameters not specified.

**Rebuttal:**

**Valid Concern - Critical for API Documentation.**

**Recommended Query Parameters:**

```
GET /api/inventory

Query Parameters:
- page: number (default 1, min 1)
- pageSize: number (default 20, min 1, max 100)
- categories: string[] (comma-separated or repeated param)
  Example: ?categories=monitor,keyboard or ?categories=monitor&categories=keyboard
- status: string[] (comma-separated)
  Values: 재고, 출고, 고장, 폐기
- location: string (free text search, optional)
- search: string (partial match on serial_number or model, optional)
- sortBy: 'category' | 'model' | 'serialNumber' | 'location' | 'status' | 'purchaseDate'
- order: 'asc' | 'desc' (default 'asc')

Response:
{
  data: Inventory[],
  pagination: {
    page: number,
    pageSize: number,
    total: number,
    totalPages: number
  },
  _links: {
    next?: string,
    prev?: string,
    first?: string,
    last?: string
  }
}

Default Sorting: category ASC, then model ASC
```

**Action Required:**
- Add Section 5.2.1 (Query Parameters) with detailed spec
- Include examples: `GET /api/inventory?categories=monitor&status=재고&page=1`

---

### 7.3 Statistics Aggregation Query Unspecified (MEDIUM)

**Review Issue:** GET /api/inventory/stats response format not defined.

**Rebuttal:**

**Valid Concern - Important for Frontend Development.**

**Recommended Response Format:**

```typescript
GET /api/inventory/stats

Response:
{
  total: number,
  byStatus: {
    '재고': number,
    '출고': number,
    '고장': number,
    '폐기': number
  },
  byCategory: [
    {
      category: 'monitor',
      total: number,
      statuses: {
        '재고': number,
        '출고': number,
        '고장': number,
        '폐기': number
      }
    },
    ...
  ],
  updated_at: ISO8601 timestamp
}
```

**Usage:**
- Stats panel renders total + byStatus counts
- Charts render byCategory breakdown
- Updated_at shows when data was last refreshed

**Action Required:**
- Add Section 5.2.2 (Statistics API) with response schema
- Include example response in User Story 9 AC

---

### 7.4 Error Response Format Unspecified (LOW)

**Review Issue:** No standard error response format defined.

**Rebuttal:**

**Valid Suggestion - Use sunjin-erp Standard Format.**

sunjin-erp should have standard error responses. Recommend documenting in this PRD:

```typescript
// 400 Bad Request
{
  error: {
    code: 'VALIDATION_ERROR',
    message: 'Serial number must be unique',
    details: [
      { field: 'serial_number', message: 'Duplicate entry' }
    ]
  }
}

// 401 Unauthorized
{
  error: {
    code: 'UNAUTHORIZED',
    message: 'Session expired. Please login again.'
  }
}

// 403 Forbidden
{
  error: {
    code: 'FORBIDDEN',
    message: 'Only MANAGER can perform this action'
  }
}

// 500 Server Error
{
  error: {
    code: 'INTERNAL_ERROR',
    message: 'Database connection failed'
  }
}
```

**Action Required:**
- Add Section 5.2.3 (Error Responses) with standard format
- Or reference sunjin-erp global error handling documentation

---

## 8. UI/UX & RESPONSIVE DESIGN

### 8.1 Status Badge Color Scheme Missing Accessibility (LOW)

**Review Issue:** Yellow and gray badges have poor contrast.

**Rebuttal:**

**Valid Concern - Accessibility Improvement.**

**Recommended Colors:**

| Status | Current | Recommended | Reasoning |
|--------|---------|-------------|-----------|
| 재고 | green | #10b981 (emerald) | OK; good contrast |
| 출고 | blue | #3b82f6 (blue) | OK; good contrast |
| 고장 | yellow | #f59e0b (amber/orange) | Better contrast; more accessible |
| 폐기 | gray | #6b7280 (gray) + dark text | Explicit text label required |

**Implementation:**
```typescript
const STATUS_COLORS = {
  '재고': { bg: 'bg-green-100', text: 'text-green-800', icon: Package },
  '출고': { bg: 'bg-blue-100', text: 'text-blue-800', icon: Download },
  '고장': { bg: 'bg-amber-100', text: 'text-amber-800', icon: AlertTriangle },
  '폐기': { bg: 'bg-gray-100', text: 'text-gray-800', icon: Trash2 }
};
```

**Action Required:**
- Update Section 6.4 (Status Badge Colors) with recommended palette
- Ensure text color has sufficient contrast (WCAG AA minimum)
- Include icons alongside badges (not color alone)

---

### 8.2 Loading State for List Not Specified (LOW)

**Review Issue:** Skeleton design not detailed.

**Rebuttal:**

**Valid Suggestion - UX Polish Detail.**

**Skeleton Design:**
```
- 5 rows of placeholder skeletons
- Each row shows: gray placeholder boxes for each column
- Pulsing animation (opacity 0.5 → 1.0, 1s cycle)
- Height matches table row height (prevents CLS)
- After 3s without data, show "Loading..." message
```

**Implementation:**
```typescript
export function InventoryTableSkeleton() {
  return (
    <>
      {Array(5).fill(0).map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-8 w-16" /></TableCell>
          <TableCell><Skeleton className="h-8 w-24" /></TableCell>
          {/* ... more cells */}
        </TableRow>
      ))}
    </>
  );
}
```

**Action Required:**
- Add Section 6.2.1 (Skeleton UI) with design spec
- Provide code template

---

### 8.3 Empty State Not Defined (LOW)

**Review Issue:** UI for zero results not designed.

**Rebuttal:**

**Valid Suggestion - UX Completeness.**

**Empty State Design:**

**Scenario 1: No Results (filtered)**
```
Icon: PackageOpen or Search
Message: "No equipment found"
Subtext: "Try adjusting your filters or create a new entry"
Action: [Clear Filters] [Create Equipment]
```

**Scenario 2: No Inventory (first use)**
```
Icon: Package
Message: "No equipment in inventory"
Subtext: "Get started by adding your first equipment item"
Action: [입고 등록]
```

**Action Required:**
- Add Section 6.3.1 (Empty State) with design mockup
- Provide React component template

---

## 9. SECURITY CONSIDERATIONS

### 9.1 Input Validation Rules Incomplete (HIGH)

**Review Issue:** Validation rules not specified; needs detailed field constraints.

**Rebuttal:**

**Valid Concern - Critical for Phase 1 Implementation.**

**Recommended Validation Rules:**

```
Inventory Field Validation:

category:
- Required: true
- Type: enum
- Values: ['모니터', '노트북', '라우터', '프린터', '기타']
- Length: max 50

model:
- Required: true
- Type: string
- Length: 1-255 (min 1)
- Allowed: alphanumeric, space, dash, parenthesis, comma
- Reject: special chars that could indicate injection

serial_number:
- Required: true
- Type: string
- Length: 1-100
- Allowed: alphanumeric, dash, underscore
- Unique: across non-deleted records (partial index enforcement)
- Unique validation: check before insert

purchase_date:
- Required: true
- Type: date (YYYY-MM-DD)
- Constraint: not in future (cannot exceed today)
- Min: 1900-01-01
- Max: today

purchase_from:
- Required: true
- Type: string
- Length: 1-255
- Allowed: free text (sanitized)

current_location:
- Required: true
- Type: string
- Length: 1-255
- Allowed: free text (warehouse location)

notes:
- Required: false
- Type: string (CLOB)
- Max length: 4000

reason (for status changes):
- Required: true (if status = '고장' or '폐기')
- Type: string
- Length: 1-500
```

**Implementation with class-validator:**
```typescript
import { IsString, IsEnum, MaxLength, MinLength, IsISO8601, IsNotEmpty } from 'class-validator';

export class CreateInventoryDto {
  @IsEnum(['모니터', '노트북', '라우터', '프린터', '기타'])
  @IsNotEmpty()
  category: string;

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  model: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  serial_number: string;

  @IsISO8601()
  purchase_date: string;

  // ... more fields
}
```

**Action Required:**
- Add Section 8.1 (Input Validation) with detailed field rules
- Provide DTO class example
- Document both client-side (form) and server-side validation

---

### 9.2 SQL Injection Prevention Not Addressed Fully (MEDIUM)

**Review Issue:** Search query may be vulnerable if not properly parameterized.

**Rebuttal:**

**Valid Concern - TypeORM Handles This, But Should Document.**

**TypeORM Protection (Default):**
TypeORM uses parameterized queries by default, preventing SQL injection.

**Safe Pattern:**
```typescript
const inventory = await repository
  .createQueryBuilder('i')
  .where('i.model LIKE :search', { search: `%${searchTerm}%` })
  .getMany();
```

**Unsafe Pattern (NEVER USE):**
```typescript
const inventory = await repository.query(
  `SELECT * FROM inventory WHERE model LIKE '%${searchTerm}%'`
);
```

**Action Required:**
- Add Section 8.2 (SQL Injection Prevention) noting TypeORM parameterization
- Provide code examples of safe vs unsafe patterns
- Document: "All searches use TypeORM QueryBuilder with parameterized values"

---

### 9.3 XSS Prevention for User Input (MEDIUM)

**Review Issue:** User-entered notes/reason fields could contain script tags.

**Rebuttal:**

**Valid Concern - React Auto-Escapes, But Should Document Policy.**

**React Protection (Default):**
React auto-escapes HTML entities when rendering JSX.

**Safe Pattern:**
```typescript
<p>{notes}</p>  // ✓ React auto-escapes HTML
```

**Unsafe Pattern (NEVER USE):**
```typescript
<p dangerouslySetInnerHTML={{ __html: notes }} />  // ✗ Vulnerable if notes from untrusted source
```

**Policy for Inventory Notes:**
- Plain text only (no rich text)
- React auto-escaping sufficient
- If rich text added in Phase 2+, use DOMPurify

**Action Required:**
- Add Section 8.3 (XSS Prevention) with React escaping note
- Document: "All user input rendered as plain text; no HTML/Rich text allowed"
- If adding rich text editor later, mandate DOMPurify

---

### 9.4 Soft Delete Not Enforced in All Queries (HIGH)

**Review Issue:** If queries accidentally include deleted records, data leaks.

**Rebuttal:**

**Valid Concern - Critical for Data Integrity.**

**Enforcement Strategy:**

**Option 1: Custom Repository (Recommended)**
```typescript
@EntityRepository(Inventory)
export class InventoryRepository extends Repository<Inventory> {
  async findActive(options?: FindOptionsWhere<Inventory>) {
    return this.find({
      where: { ...options, deletedAt: IsNull() }
    });
  }

  async findActiveWithPagination(page: number, pageSize: number) {
    return this.findAndCount({
      where: { deletedAt: IsNull() },
      skip: (page - 1) * pageSize,
      take: pageSize
    });
  }
}
```

**Option 2: Global Soft Delete Filter (TypeORM 0.3+)**
```typescript
@Entity('inventory')
@DeleteDateColumn()
export class Inventory {
  // TypeORM can auto-filter deleted_at in queries
  // (check version compatibility)
}
```

**Implementation Pattern:**
```typescript
// API handler
export async function GET(req: Request) {
  const { page = 1, pageSize = 20 } = req.query;

  const [data, total] = await inventoryRepository.findActiveWithPagination(
    parseInt(page),
    parseInt(pageSize)
  );

  return Response.json({ data, pagination: { page, pageSize, total } });
}
```

**Testing Requirement:**
- Unit test: Verify all GET endpoints exclude deleted records
- Integration test: Create, delete, verify not returned in list

**Action Required:**
- Add Section 8.4 (Soft Delete Enforcement) with custom repository pattern
- Mandate: All .find() calls use findActive() method or explicit deletedAt IS NULL filter
- Add to implementation checklist: "Verify all queries filter soft-deleted records"

---

## 10. PERFORMANCE & SCALABILITY

### 10.1 Pagination Requirements Not Fully Specified (MEDIUM)

**Review Issue:** Edge cases for pagination (max page size, out-of-range pages) not defined.

**Rebuttal:**

**Valid Concern - API Contract Needs Clarification.**

**Recommended Pagination Spec:**

```
GET /api/inventory?page=1&pageSize=20

Constraints:
- page: min 1 (1-indexed), max N
- pageSize: min 1, max 100 (default 20)
  → If pageSize > 100, reject with 400: "Page size cannot exceed 100"
  → If pageSize < 1, reject with 400: "Page size must be at least 1"
- Out-of-range page (e.g., page 999 when only 10 pages exist):
  → Return empty array with total=X, totalPages=10
  → Not an error; just no results for that range

Sorting:
- Default: category ASC, then model ASC
- Specify: ?sortBy=purchaseDate&order=desc
- Valid sortBy values: category, model, serialNumber, location, status, purchaseDate
```

**Implementation:**
```typescript
const pageSize = Math.min(Math.max(parseInt(req.query.pageSize) || 20, 1), 100);
if (parseInt(req.query.pageSize) > 100) {
  return Response.json(
    { error: { code: 'INVALID_PAGE_SIZE', message: 'Max page size is 100' } },
    { status: 400 }
  );
}

const page = Math.max(parseInt(req.query.page) || 1, 1);
const skip = (page - 1) * pageSize;

const [data, total] = await repository.findAndCount({
  where: { deletedAt: IsNull() },
  skip,
  take: pageSize
});

return Response.json({
  data,
  pagination: {
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize)
  }
});
```

**Action Required:**
- Add Section 10.1 (Pagination) with detailed constraints
- Document error cases (max page size exceeded)
- Provide code template

---

### 10.2 Statistics Aggregation Performance Not Addressed (MEDIUM)

**Review Issue:** Large dataset aggregations could be slow; no indexing or caching strategy.

**Rebuttal:**

**Valid Concern - Important for Dashboard Performance.**

**Aggregation Query:**
```sql
SELECT
  category,
  current_status,
  COUNT(*) as count
FROM inventory
WHERE deleted_at IS NULL
GROUP BY category, current_status;
```

**Performance Optimization:**

**1. Indexes (Essential)**
```sql
CREATE INDEX idx_inventory_status_category
ON inventory(current_status, category)
WHERE deleted_at IS NULL;
```

**2. Query Timeout (Safety)**
```typescript
const stats = await repository.query(
  statsQuery,
  [],
  { timeout: 5000 } // 5-second max
);
```

**3. Response Caching (Phase 2)**
```typescript
export function useInventoryStats() {
  return useQuery(['inventory-stats'], fetchStats, {
    staleTime: 2 * 60 * 1000, // Cache 2 minutes
    cacheTime: 5 * 60 * 1000   // Keep in memory 5 minutes
  });
}
```

**Expected Performance:**
- With indexes: <100ms for 100k records
- Without indexes: >1000ms (full table scan)

**Action Required:**
- Add indexes from Section 4.4 to migration
- Document expected query times
- Implement TanStack Query caching strategy in Section 5.4

---

### 10.3 Serial Number Search Performance (MEDIUM)

**Review Issue:** Substring search (LIKE '%SN%') requires full table scan; slow without full-text index.

**Rebuttal:**

**Valid Concern - Search Performance Trade-off.**

**Performance Trade-offs:**

| Search Type | Query | Performance | Pros | Cons |
|-------------|-------|-------------|------|------|
| Prefix (SN123%) | LIKE 'SN123%' | Fast with index | Index-friendly | Less flexible |
| Substring (%SN123%) | LIKE '%SN123%' | Slow (full table scan) | Flexible | Requires full-text |
| Full-Text | CONTAINS(serial_number, 'SN123') | Fast | Very flexible | Complex to setup |

**Recommendation for Phase 1:**
Use **prefix-based search** for performance:
- User types "SN1" → matches "SN123", "SN124", not "OLD_SN123"
- Index on serial_number is efficient
- Simple to implement

**Phase 2 Enhancement:**
- Consider full-text index if substring search required
- Or accept slower search for better UX

**Implementation:**
```typescript
// User types "SN1" → add % to end only
const searchTerm = search.trim();
const query = repository
  .createQueryBuilder('i')
  .where('i.serial_number LIKE :search', { search: `${searchTerm}%` })
  .orWhere('i.model LIKE :search', { search: `${searchTerm}%` });
```

**Action Required:**
- Clarify Section 3 (User Story 2): Search is prefix-based, not substring
- Document index on serial_number for performance
- Note: Phase 2 can add full-text search if needed

---

### 10.4 Transaction Handling Not Specified (MEDIUM)

**Review Issue:** Multi-step operations (checkout, status change) lack transaction specification.

**Rebuttal:**

**Valid Concern - Data Consistency Critical.**

**Multi-Step Operations Requiring Transactions:**
1. **Checkout:** Update status + Create history + ...
2. **Checkin:** Update status + Update location + Create history + ...
3. **Status Change:** Update status + Create history + ...

**Transaction Pattern:**
```typescript
export async function POST(req: Request, { params }) {
  const queryRunner = dataSource.createQueryRunner();

  try {
    await queryRunner.connect();
    await queryRunner.startTransaction();

    // Step 1: Update inventory
    await queryRunner.manager.update(Inventory,
      { id: params.id },
      { current_status: '출고' }
    );

    // Step 2: Create history
    const history = new InventoryHistory();
    history.inventory_id = params.id;
    history.change_type = '출고';
    history.checkout_location = data.checkoutLocation;
    history.changed_by_id = session.user.id;
    history.changed_at = new Date();
    await queryRunner.manager.save(history);

    // Step 3: Commit all changes
    await queryRunner.commitTransaction();

    return Response.json({ success: true });
  } catch (error) {
    await queryRunner.rollbackTransaction();
    return Response.json(
      { error: { code: 'TRANSACTION_FAILED', message: error.message } },
      { status: 500 }
    );
  } finally {
    await queryRunner.release();
  }
}
```

**Action Required:**
- Add Section 5.3.2 (Transaction Handling) with transaction pattern
- List all multi-step operations requiring transactions
- Provide code template for each operation type

---

## 11. ERP MODULE DEPENDENCIES

### 11.1 Employee Department Dependency Not Clarified (MEDIUM)

**Review Issue:** Assumes Employee entity exists; relationship unclear.

**Rebuttal:**

**Valid Concern - Dependency Verification Needed.**

**Current PRD Position (Section 5.3):**
```
created_by_id: number (FK → Employee.id)
updated_by_id: number (FK → Employee.id)
```

**Dependency Assumptions:**
1. Employee entity exists (created in Phase 1)
2. Employee has auto-increment ID
3. Employee has optional department_id (for filtering)

**Design Decision:**
- Inventory uses Employee.id for audit trail (who created/updated)
- Optionally: Add assigned_to_id FK to track equipment owner

**Action Required:**
- Verify Employee entity exists in sunjin-erp
- Confirm Employee.id is auto-increment
- If department scoping needed (Section 5.2 Decision B): Add department_id FK

---

### 11.2 Project Module Integration Unclear (MEDIUM)

**Review Issue:** checkout_location is free text, but could be FK to Project for data integrity.

**Rebuttal:**

**Valid Concern - Design Choice Needs Decision.**

**Options:**

| Option | Pros | Cons | Recommendation |
|--------|------|------|-----------------|
| A: Free Text | Flexible, no FK needed | No data integrity | For Phase 1 |
| B: FK to Project | Enforces consistency | Requires Project entity | Phase 2 |
| C: Both | Flexible + Safe | Slightly complex | Best for future |

**Recommended Approach (Option C):**

```sql
ALTER TABLE inventory_history ADD (
  checkout_location VARCHAR2(255),  -- For non-project checkouts
  checkout_project_id NUMBER        -- FK to Project (optional)
);

ALTER TABLE inventory_history
ADD CONSTRAINT fk_checkout_project
FOREIGN KEY (checkout_project_id) REFERENCES project(id) ON DELETE RESTRICT;
```

**Implementation:**
- Phase 1: Use checkout_location only (free text)
- Phase 2: Add checkout_project_id FK when Project module ready
- Backward compatible; can migrate data later

**Action Required:**
- Clarify Section 5.3: checkout_location is free text in Phase 1
- Plan Phase 2: Add checkout_project_id FK once Project entity ready

---

### 11.3 System Administrator Operations Not Defined (MEDIUM)

**Review Issue:** No ADMIN-only operations like restore deleted records.

**Rebuttal:**

**Valid Concern - ADMIN Operations Should Be Explicit.**

**ADMIN-Only Operations:**

```
POST /api/inventory/[id]/restore (ADMIN only)
  - Restore soft-deleted Inventory record
  - Update: SET deleted_at = NULL, restored_by_id = user_id, restored_at = now()
  - Log in InventoryHistory: change_type = '복원'

GET /api/inventory?includeDeleted=true (ADMIN only)
  - List all inventory including soft-deleted
  - For audit/recovery purposes

GET /api/inventory/[id] (ADMIN only for deleted)
  - View detail of soft-deleted equipment
  - Including full history
```

**Implementation:**
```typescript
// POST /api/inventory/[id]/restore
if (session.user.role !== 'ADMIN') {
  return Response.json(
    { error: { code: 'FORBIDDEN', message: 'Only ADMIN can restore' } },
    { status: 403 }
  );
}

const inventory = await repository.findOne({ where: { id: params.id } });
if (!inventory.deletedAt) {
  return Response.json(
    { error: { code: 'NOT_DELETED', message: 'Equipment is not deleted' } },
    { status: 400 }
  );
}

// Restore
await repository.update({ id: params.id }, {
  deletedAt: null,
  restoredById: session.user.id,
  restoredAt: new Date()
});

// Log in history
const history = new InventoryHistory();
history.change_type = '복원';
// ... set other fields
await historyRepository.save(history);
```

**Action Required:**
- Add Section 5.2.4 (ADMIN Operations) with restore/recovery endpoints
- Document authorization checks for sensitive operations

---

## Summary: Issues Resolved vs. Deferred

| Issue | Status | Action |
|-------|--------|--------|
| USER role contradiction | Resolved (UPDATE User Story 8) | Phase 1 |
| Location semantics | Resolved (ADD clarity table) | Phase 1 |
| Status transitions | Resolved (ADD state diagram) | Phase 1 |
| Approval workflow | Deferred (OUT-OF-SCOPE) | Phase 2 |
| Overdue tracking | Deferred (OUT-OF-SCOPE) | Phase 2 |
| Soft delete strategy | Resolved (ADD implementation doc) | Phase 1 |
| Cache invalidation | Resolved (ADD pattern doc) | Phase 1 |
| Query parameters | Resolved (ADD API spec) | Phase 1 |
| Input validation | Resolved (ADD DTO examples) | Phase 1 |
| Bulk operations | Deferred (OUT-OF-SCOPE) | Phase 2 |
| ADMIN operations | Resolved (ADD restore endpoint) | Phase 1 |
| Transactions | Resolved (ADD pattern doc) | Phase 1 |
| Department scoping | Pending (DECISION needed) | Phase 1 |
| Project integration | Deferred (PHASE 2) | Phase 2 |
| Indexes | Resolved (ADD migration) | Phase 1 |
| Pagination | Resolved (ADD spec) | Phase 1 |
| Statistics | Resolved (ADD response format) | Phase 1 |

---

## Conclusion

**The critical review raises valid concerns.** Most are **clarity/documentation issues**, not fundamental design flaws.

**Recommended Actions for PRD Revision:**
1. Update User Story 8 (change USER to MANAGER/ADMIN)
2. Add clarity tables for location semantics
3. Add API specification details (query params, response formats)
4. Add implementation patterns (transactions, cache invalidation, soft delete)
5. Add security validation rules
6. Confirm Phase 2 scope (approval, overdue, bulk, full-text search)

**Estimated PRD revision effort:** 4-6 hours
**Implementation effort:** Not affected by review; PRD is solid for Phase 1

