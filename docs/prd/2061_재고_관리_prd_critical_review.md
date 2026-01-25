<!-- Generated: 2026-01-25 22:30:00 KST -->

# Critical Review: 재고 관리 (Inventory Management) PRD 2061

**문서번호:** 2061_재고_관리_prd_critical_review
**검토일:** 2026-01-25
**검토자:** Claude Code Architecture Review
**대상:** docs/prd/2061_재고_관리_prd.md

---

## Executive Summary

The 재고 관리 (Inventory Management) PRD is **substantially well-structured** with clear user stories, well-defined acceptance criteria, and good alignment with the sunjin-erp architecture guidelines. However, there are **11 critical issues** and **8 medium-priority issues** that need to be addressed before implementation.

**Key Blockers:**
1. Missing soft delete enforcement in serial_number uniqueness constraint
2. Unclear permission model for USER role in checkout/checkin operations
3. Missing cascade behavior definition for Inventory deletion
4. Ambiguous InventoryHistory soft delete semantics
5. Missing approval workflow for critical operations

---

## Critical Issues Summary Table

| # | Category | Issue | Priority | Status |
|---|----------|-------|----------|--------|
| 1 | Database | Serial number uniqueness not enforced for deleted records | HIGH | Open |
| 2 | Authorization | USER role can perform checkout/checkin but description says "read-only" | HIGH | Open |
| 3 | Database | Missing cascade/restrict behavior when Inventory record is deleted | HIGH | Open |
| 4 | Data Integrity | InventoryHistory soft delete semantics undefined (should never be soft-deleted?) | HIGH | Open |
| 5 | State Management | No clear state mutation strategy (TanStack Query invalidation) | HIGH | Open |
| 6 | API Design | Missing endpoint for bulk operations (multi-select actions) | MEDIUM | Open |
| 7 | Completeness | Expected checkin date validation missing (overdue detection) | MEDIUM | Open |
| 8 | Edge Cases | Checkout → Broken → Checkin flow not clearly defined | MEDIUM | Open |
| 9 | Performance | No pagination/limit specified for statistics aggregation | MEDIUM | Open |
| 10 | Authorization | MANAGER approval/supervisor role distinction not clarified | MEDIUM | Open |
| 11 | State Management | Real-time synchronization between stats and list (cache invalidation) | MEDIUM | Open |

---

## Detailed Critical Review

---

### 1. CLARITY & AMBIGUITY

#### 1.1 User Role Definition Inconsistency (HIGH)

**Issue:** Section 1 (Overview) and Section 3 (User Stories) have contradictory role definitions for checkout/checkin operations.

- **Line 15:** "대상 사용자 역할: USER / MANAGER / ADMIN"
- **Line 28-30:** User Story 1 (조회) says USER/MANAGER/ADMIN can view
- **Line 56:** User Story 4 (입고) says "MANAGER / ADMIN" only
- **Line 96:** User Story 8 (반납) says "USER / MANAGER / ADMIN" can perform checkin

**Problem:** Section 5.5 (Authorization) says "USER: 목록 조회, 상세 조회 읽기만 가능" (read-only), but User Story 8 allows USER to checkin equipment. This is a **direct contradiction**.

**Decision Needed:**
- Can USER perform checkin (return) operations?
- Or is USER truly read-only and checkin restricted to MANAGER/ADMIN?

**Recommendation:** Clarify and update User Story 8 to either:
- Option A: Change to "MANAGER/ADMIN only" (enforce read-only for USER)
- Option B: Change Section 5.5 to explicitly allow USER checkin but nothing else
- **Preferred:** Option A (read-only for USER is cleaner)

---

#### 1.2 "출고 위치" vs "현재 위치" Semantics (MEDIUM)

**Issue:** Line 376-377 addresses this but the distinction is still unclear in entity design.

- `checkout_location` in InventoryHistory is "출고 위치 (사용처, 프로젝트명 등)"
- `current_location` in Inventory is "물리 보관 위치"

**Problem:** When equipment is checked out to "Project A", is `current_location` updated? The PRD says location change (User Story 6) is only for "재고" status equipment, but what about checkin? Does checkin update `current_location`?

**Acceptance Criteria Issue (Line 102):**
```
- 현재 위치: 반납 위치로 업데이트
```

This implies `current_location` should be updated on checkin, but:
1. What is the "반납 위치" (return location)? Is it specified by user or predefined?
2. Should `previous_location` be tracked in InventoryHistory for checkin?

**Recommendation:** Clarify the location update semantics:
- On checkout: Does `current_location` change to `checkout_location`? (Probably yes)
- On checkin: What is the expected `current_location` after return? (Warehouse location? Specified by user?)
- Add explicit acceptance criteria for location updates in each operation

---

#### 1.3 Status Transition Rules Incomplete (MEDIUM)

**Issue:** Line 87-91 defines some transitions but not all valid sequences.

Current rules:
```
재고 → 고장 / 폐기 (O)
출고 → 고장 / 폐기 (O, 반납 후)
고장 → 폐기 (O)
폐기 → 변경 불가 (최종 상태)
```

**Missing Cases:**
1. 출고 → 폐기: Is direct deprecation allowed without return? (Current spec says "반납 후" but is this enforced?)
2. 고장 → 재고: Can broken equipment be repaired and returned to stock?
3. 고장 → 출고: Can broken equipment be sent for repair (internal service)?
4. 폐기 → 고장: Should this be prevented in validation?

**Recommendation:** Create explicit state transition diagram:
```
[재고] ──┬→ [출고] ──→ [재고] (checkin)
        │      └────→ [고장]
        └──→ [고장] ──→ [폐기]
        └──→ [폐기] (final state, no transitions)
```

Clarify each arrow with business rule and whether approval is needed.

---

### 2. COMPLETENESS & EDGE CASES

#### 2.1 Missing Approval Workflow (HIGH)

**Issue:** Critical operations (deprecation, status changes) lack approval mechanisms.

**Problem:**
- User Story 7 (상태 변경) allows MANAGER to mark equipment as "고장/폐기" with just a reason.
- No approval from supervisor, auditor, or second reviewer.
- For expensive equipment ($10k+?), this is risky.

**Out-of-scope Confirmation:** Section 4.2 doesn't mention approval workflows, so this is **intentionally excluded** from Phase 1, which is fine. But the PRD should explicitly note this limitation.

**Recommendation:** Add to Section 4.2 (Out-of-Scope):
```
* 장비 상태 변경 승인 워크플로우 (고장/폐기 시 관리자 승인 요구)
```

Or implement a simple `requires_approval` flag in InventoryHistory for Phase 1.

---

#### 2.2 Overdue Equipment Tracking Missing (MEDIUM)

**Issue:** User Story 5 (출고 처리) includes `expected_checkin_date` but no enforcement.

**Problem:**
- Equipment checked out on Day 1 with expected return Day 30
- Equipment never returned → No alert, no overdue tracking
- Section 4.2 says "자동 알림 (재고 부족 경보)" is out-of-scope, which implies overdue alerts are also out-of-scope

**Missing Edge Cases:**
1. What if `expected_checkin_date` is in the past and equipment is still in "출고" status?
2. Should list view highlight overdue items?
3. Should statistics include "overdue_count"?

**Recommendation:**
- Clarify in Section 4.2 that overdue tracking/alerts are Phase 2
- Add a computed field `is_overdue: boolean` to Inventory (if expected_checkin_date < now and status = "출고")
- Add `overdue_count` to statistics endpoint

---

#### 2.3 Equipment Checkout While Broken (MEDIUM)

**Issue:** No validation preventing checkout of equipment in "고장" status.

**Acceptance Criteria (Line 68):**
```
출고 폼: 장비 선택(상태: 재고인 것만)
```

This is clear — only "재고" equipment can be checked out. Good.

**But:** What if:
1. Equipment A is checked out (status = "출고")
2. User marks it as "고장" while still checked out
3. Can it still be returned? (Yes, by User Story 7)
4. Can it be re-checked out? (Should be no, but not explicitly prevented)

**Recommendation:** Add validation rule:
```
Checkout allowed only if current_status = "재고"
```

Implement in CheckoutForm and API validation.

---

#### 2.4 Serial Number Uniqueness Enforcement (HIGH)

**Issue:** Section 5.3 says:
```
`serial_number` UNIQUE 제약 (중복 입고 방지, deleted_at IS NULL 조건)
```

**Problem:** Oracle unique constraint with "deleted_at IS NULL" condition is **not possible with standard constraints**. Oracle doesn't support conditional unique constraints.

**Solutions:**
1. Use partial unique index (Oracle 12c+):
   ```sql
   CREATE UNIQUE INDEX idx_inventory_serial_active
   ON inventory(serial_number) WHERE deleted_at IS NULL;
   ```
2. Use database trigger to enforce uniqueness before insert
3. Enforce only in application validation (risky)

**Recommendation:**
- Clarify in Section 5.3 that TypeORM will handle this via custom index
- Create explicit migration for partial unique index
- Add application-level validation as safety net

**Code Example Needed:**
```typescript
// In InventoryEntity
@Index({ where: `deleted_at IS NULL`, unique: true })
@Column({ unique: false })
serial_number: string;
```

---

#### 2.5 Cascading Deletion Behavior Undefined (HIGH)

**Issue:** Section 5.3 says "ON DELETE RESTRICT" for `inventory_id` FK in InventoryHistory, but what happens when Inventory record is deleted (soft-deleted)?

**Problem:**
1. If user deletes (soft-delete) an Inventory record, can they still view its history?
2. Should deleted inventory records be returned by `GET /api/inventory`? (Probably not, but needs clarification)
3. InventoryHistory.inventory_id → Inventory.id with ON DELETE RESTRICT means:
   - Cannot delete Inventory while history exists
   - This prevents soft delete via `DELETE` statement
   - Must use `UPDATE inventory SET deleted_at = NOW()` instead

**Missing:** How to handle soft delete in TypeORM?
- Override `softRemove()` method?
- Use custom repository method?

**Recommendation:**
- Add explicit note in Section 5.3:
  ```
  Soft Delete Strategy:
  - Never use DELETE statement; always UPDATE with deleted_at
  - TypeORM softRemove() must be configured to use UPDATE instead of DELETE
  - InventoryHistory records remain even after parent Inventory is deleted
  ```

---

### 3. ARCHITECTURE COMPLIANCE

#### 3.1 Server Component Data Fetching Unclear (MEDIUM)

**Issue:** Section 5.1 says Page Routes are Server Components, but doesn't specify HOW they fetch data.

**Problem:** Current sunjin-erp pattern uses:
1. Server Component: `getServerSession()` for auth, nothing else
2. Client Component: Uses TanStack Query to fetch API data

But Section 5.1 says:
```
- `inventory/page.tsx`: Server Component — 데이터 페칭, 권한 검증
- `inventory/[id]/page.tsx`: Server Component — 장비 + 이력 조회
```

This implies server-side fetching in Server Component, which **contradicts the established pattern** (TanStack Query should handle all fetching).

**Recommendation:** Clarify:
- Server Component should ONLY:
  1. Call `getServerSession()` to verify auth
  2. Pass session to Client Component
  3. Render layout/structure
- Client Component should:
  1. Use `useSession()` hook
  2. Use TanStack Query for all data fetching
  3. Handle loading/error states

**Proposed Pattern:**
```typescript
// app/(main)/inventory/page.tsx (Server Component)
export default async function InventoryPage() {
  const session = await getServerSession();
  if (!session) redirect('/login');

  return <InventoryListClient session={session} />;
}

// components/features/inventory/InventoryListClient.tsx (Client Component)
export function InventoryListClient({ session }) {
  const { data, isLoading } = useInventoryList();
  // ... render with TanStack Query
}
```

---

#### 3.2 Client vs Server Component Separation Missing (MEDIUM)

**Issue:** Section 5.1 mentions "폼 컴포넌트: Client Component" but doesn't specify where they're rendered.

**Problem:**
- Are forms rendered in dialogs/sheets (separate client component)?
- Or are they directly in the page?
- How does form submission trigger cache invalidation?

**Current Pattern in sunjin-erp:**
- Page route (server) renders layout
- Client component with TanStack Query handles data
- Forms in dialogs (client component) use mutations
- Mutation success invalidates query cache

**Recommendation:** Specify explicitly:
```
Form Pattern:
1. InventoryTable (Client) renders equipment list
2. "입고" button opens InventoryCreateDialog (Client)
3. CreateInventoryForm (Client Component) uses useCreateInventoryMutation()
4. On success, mutation invalidates useInventoryList() query
5. Table auto-updates with new data
```

---

#### 3.3 File Structure Has Non-Standard Paths (LOW)

**Issue:** Section 10 (Component File Structure) shows:
```
├── [id]/actions/page.tsx  # 출고/반납/위치변경 (SC)
```

**Problem:** This is unusual. The route `/inventory/[id]/actions` doesn't match the operations being described. Should be:
- `/inventory/[id]` — Detail page (view equipment)
- Modals/dialogs opened from detail page — not separate route

**Recommendation:** Rethink the page structure:
```
Option A: All actions in dialogs on detail page
├── [id]/page.tsx  # Detail view + action dialogs

Option B: Separate pages for actions
├── [id]/page.tsx        # Detail view only
├── [id]/checkout/page.tsx
├── [id]/checkin/page.tsx
├── [id]/relocate/page.tsx
├── [id]/status/page.tsx
```

**Preferred:** Option A (dialogs are more intuitive UX)

---

### 4. DATABASE DESIGN

#### 4.1 Entity Relationships Missing FK Definitions (MEDIUM)

**Issue:** Section 5.3 defines entities but doesn't show @OneToMany/@ManyToOne relationships.

**Missing in InventoryHistory:**
```typescript
@ManyToOne(() => Inventory)
@JoinColumn({ name: 'inventory_id' })
inventory: Inventory;

@ManyToOne(() => Employee)
@JoinColumn({ name: 'changed_by_id' })
changedBy: Employee;
```

**Recommendation:** Add complete TypeORM decorator examples:
```typescript
@Entity('inventory')
export class Inventory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar2', length: 100 })
  category: string;

  @Column({ type: 'varchar2', length: 255 })
  serial_number: string;

  @OneToMany(() => InventoryHistory, (history) => history.inventory)
  histories: InventoryHistory[];

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'created_by_id' })
  createdBy: Employee;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'updated_by_id' })
  updatedBy: Employee;

  @DeleteDateColumn()
  deleted_at: Date;
}
```

---

#### 4.2 Check Constraint for Status Enum (MEDIUM)

**Issue:** Section 5.3 says:
```
`current_status` 제약: CHECK 또는 애플리케이션 검증 (재고/출고/고장/폐기)
```

**Problem:** Oracle CHECK constraint is optional; not enforced at DB level.

**Recommendation:** Implement both:
1. **Oracle CHECK Constraint (in migration):**
   ```sql
   ALTER TABLE inventory
   ADD CONSTRAINT chk_inventory_status
   CHECK (current_status IN ('재고', '출고', '고장', '폐기'));
   ```

2. **TypeORM Enum Column:**
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

3. **Validation in mutations:**
   ```typescript
   const VALID_STATUSES = ['재고', '출고', '고장', '폐기'];
   if (!VALID_STATUSES.includes(newStatus)) {
     throw new BadRequestException('Invalid status');
   }
   ```

---

#### 4.3 InventoryHistory Soft Delete Semantics Undefined (HIGH)

**Issue:** Section 5.3 says:
```
└── deleted_at: DateTime (nullable) — 소프트 삭제 (논리적으로는 사용 안 함)
```

**Problem:** "논리적으로는 사용 안 함" (logically not used) is ambiguous:
1. Should InventoryHistory ever be soft-deleted? (Probably no, it's audit data)
2. If Inventory is deleted, should its history be hidden? (Probably yes)
3. How to query history? Include deleted history or exclude?

**Recommendation:** Clarify deletion semantics:
```
InventoryHistory Deletion Rules:
1. InventoryHistory should NEVER be soft-deleted independently
2. When parent Inventory is deleted, InventoryHistory remains as audit trail
3. When querying Equipment detail, include ALL history (even if parent is deleted)
4. When querying Equipment list, exclude deleted equipment (and thus their history)
5. Implement: SELECT * FROM inventory_history WHERE inventory_id IN (non-deleted inventories)
```

**Code:**
```typescript
@Entity('inventory_history')
export class InventoryHistory {
  // deleted_at should NOT exist, or be always NULL
  // Keep audit trail immutable
}

// Query pattern
const histories = await getRepository(InventoryHistory)
  .createQueryBuilder('h')
  .innerJoin('h.inventory', 'i', 'i.deleted_at IS NULL')
  .getMany();
```

---

#### 4.4 Missing Indexes for Performance (MEDIUM)

**Issue:** Section 5.3 doesn't specify indexes beyond the unique constraint on serial_number.

**Recommended Indexes:**
```sql
-- For list queries with filters
CREATE INDEX idx_inventory_status ON inventory(current_status) WHERE deleted_at IS NULL;
CREATE INDEX idx_inventory_category ON inventory(category) WHERE deleted_at IS NULL;
CREATE INDEX idx_inventory_location ON inventory(current_location) WHERE deleted_at IS NULL;

-- For history queries
CREATE INDEX idx_inventory_history_inventory_id ON inventory_history(inventory_id);
CREATE INDEX idx_inventory_history_changed_at ON inventory_history(changed_at);

-- For search
CREATE INDEX idx_inventory_serial_search ON inventory(serial_number) WHERE deleted_at IS NULL;
CREATE INDEX idx_inventory_model_search ON inventory(model) WHERE deleted_at IS NULL;
```

**Recommendation:** Add to migration file with detailed comments.

---

### 5. AUTHENTICATION & AUTHORIZATION

#### 5.1 Permission Model for Checkout/Checkin Contradictory (HIGH)

**Issue:** Already identified in Section 1.1, but restated here for database context.

**Decision:**
- Line 56: "MANAGER / ADMIN" for checkout (입고)
- Line 65: "MANAGER / ADMIN" for checkout (출고)
- Line 96: "USER / MANAGER / ADMIN" for checkin (반납)

**Implication:** USER can return equipment but not use it? Unusual permission model.

**Recommendation:** Resolve contradiction:
- **Option A (Preferred):** Only MANAGER/ADMIN can do anything (input, output, return)
  - USER: View only
  - MANAGER: All operations except delete
  - ADMIN: Everything including soft delete/restore

- **Option B:** Department-scoped permissions
  - USER: Can return only their own equipment
  - MANAGER: Can manage department inventory
  - ADMIN: All inventory

**Update:** Section 5.5 and User Stories accordingly.

---

#### 5.2 Department-Based Access Control Missing (MEDIUM)

**Issue:** No mention of department scope for MANAGER permissions.

**Problem:** Current sunjin-erp pattern uses `department_id` to scope MANAGER permissions. But PRD doesn't mention:
1. Can MANAGER see all departments' equipment?
2. Or only their department?
3. What about employees without department assignment?

**Recommendation:** Add to Section 5.5:
```
Authorization by Department:
- USER: Can view inventory; can only return equipment they checked out
- MANAGER: Can view/manage equipment in their own department
- ADMIN: Can view/manage all equipment

Department Filtering:
- Include `department_id` in Inventory entity (optional FK → Department)
- Filter API results by session.user.department_id for MANAGER
- No filter for ADMIN
```

---

#### 5.3 Missing Audit Trail for Sensitive Operations (MEDIUM)

**Issue:** No mention of logging who performed deletions, status changes.

**Current Plan:** InventoryHistory tracks status changes, but soft delete (deletion by ADMIN) isn't logged.

**Problem:**
- ADMIN soft-deletes an Inventory record
- No audit trail of WHO deleted it and WHEN
- Cannot reconstruct event

**Recommendation:**
- Add `deleted_by_id` and `deleted_at` to Inventory (in addition to soft delete)
- Log deletion in InventoryHistory with `change_type = '삭제'`
- Or create separate AuditLog table for admin actions

---

### 6. STATE MANAGEMENT

#### 6.1 Missing Cache Invalidation Strategy (HIGH)

**Issue:** Section 5.4 lists hooks but doesn't define invalidation logic.

**Problem:** When user performs checkout:
1. Checkout API returns success
2. How does UI update?
3. Which queries need invalidation?

**Current Pattern in sunjin-erp:** Each mutation should call `queryClient.invalidateQueries()`

**Missing:** No specification of which queries to invalidate after each operation.

**Recommendation:** Add invalidation map:
```typescript
// hooks/useInventoryMutations.ts

export function useCheckoutMutation() {
  const queryClient = useQueryClient();

  return useMutation(
    async (data) => {
      const res = await fetch(`/api/inventory/${data.id}/checkout`, {
        method: 'POST',
        body: JSON.stringify(data)
      });
      return res.json();
    },
    {
      onSuccess: () => {
        // Invalidate affected queries
        queryClient.invalidateQueries(['inventory-list']);
        queryClient.invalidateQueries(['inventory-detail']);
        queryClient.invalidateQueries(['inventory-stats']);
      }
    }
  );
}
```

Add this to Section 5.4 (State Management).

---

#### 6.2 Real-Time Stats Update Strategy Unclear (MEDIUM)

**Issue:** User Story 9 says:
```
- 갱신: 실시간 (데이터 변경 시 자동 갱신)
```

**Problem:** How is real-time achieved?
1. Poll every N seconds? (Not real-time)
2. WebSocket? (Not mentioned in tech stack)
3. Query cache invalidation on mutation? (Eventual consistency, not real-time)

**Recommendation:** Clarify in Section 5.4:
```
Stats Update Strategy:
- On equipment action (checkout/checkin/status change):
  1. Mutation completes
  2. useInventoryStats() cache is invalidated
  3. Component automatically refetches stats
  4. UI updates with new stats
- This is "near-real-time" (within 100-200ms), not true real-time
- WebSocket upgrade deferred to Phase 2
```

---

#### 6.3 Form State Management Not Specified (LOW)

**Issue:** Section 5.4 says "Form State: React Hook Form" but no details on:
1. Submission handling
2. Error handling
3. Loading states

**Recommendation:** Add form pattern:
```typescript
// CheckoutForm.tsx (Client Component)
import { useForm } from 'react-hook-form';
import { useCheckoutMutation } from '@/hooks/useInventoryMutations';

export function CheckoutForm({ inventoryId }) {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const mutation = useCheckoutMutation();

  return (
    <form onSubmit={handleSubmit(mutation.mutate)}>
      <input {...register('checkoutLocation', { required: true })} />
      {errors.checkoutLocation && <span>{errors.checkoutLocation.message}</span>}
      <button disabled={mutation.isLoading}>
        {mutation.isLoading ? 'Processing...' : 'Checkout'}
      </button>
      {mutation.error && <Alert variant="destructive">{mutation.error.message}</Alert>}
      {mutation.isSuccess && <Alert variant="success">Checked out successfully</Alert>}
    </form>
  );
}
```

---

### 7. API DESIGN

#### 7.1 Missing Bulk Operation Endpoints (MEDIUM)

**Issue:** Section 5.2 defines single-equipment operations but no bulk actions.

**Use Case:** Manager wants to bulk-deprecate 10 old devices.

**Problem:** Current API requires 10 separate DELETE requests, each taking 200ms = 2 seconds total.

**Recommendation:** Add bulk endpoints:
```
POST /api/inventory/bulk/status        # Batch status change
POST /api/inventory/bulk/relocate      # Batch location change
POST /api/inventory/bulk/delete        # Batch soft delete

Request: { ids: [1, 2, 3], newStatus: '폐기', reason: 'End of life' }
Response: { success: 3, failed: 0, errors: [] }
```

Optional for Phase 1, but note in out-of-scope if deferred.

---

#### 7.2 Missing Query Parameter Specification (MEDIUM)

**Issue:** Section 5.2 lists endpoints but doesn't specify query parameters.

**Example:** GET /api/inventory

**Missing details:**
1. Pagination: `page`, `pageSize`? Or `skip`, `take`?
2. Filters: How to pass category filter? `?categories=monitor,mouse`?
3. Sorting: `?sortBy=category&order=asc`?
4. Search: `?search=SN123`?

**Recommendation:** Add detailed query spec:
```
GET /api/inventory

Query Parameters:
- page: number (default 1)
- pageSize: number (default 20, max 100)
- categories: string[] (e.g., ?categories=monitor&categories=keyboard)
- status: string[] (e.g., ?status=재고&status=출고)
- location: string (free text search)
- search: string (serial_number or model partial match)
- sortBy: 'category' | 'model' | 'serialNumber' | 'location' | 'status'
- order: 'asc' | 'desc'

Response:
{
  data: Inventory[],
  pagination: { page, pageSize, total, totalPages },
  _links: { next, prev }
}
```

---

#### 7.3 Statistics Aggregation Query Unspecified (MEDIUM)

**Issue:** Section 5.2 says `GET /api/inventory/stats` but doesn't specify format.

**Problem:** User Story 9 shows:
```
표시 항목: 카테고리별 총 수량, 재고 중, 출고 중, 고장 중, 폐기
```

But API response format is not defined.

**Recommendation:**
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
      total: 10,
      '재고': 5,
      '출고': 3,
      '고장': 1,
      '폐기': 1
    },
    ...
  ]
}
```

---

#### 7.4 Error Response Format Unspecified (LOW)

**Issue:** No defined error response format.

**Recommendation:** Standardize:
```typescript
// Success 200
{
  data: { ... },
  message: 'Equipment created successfully'
}

// Error 400
{
  error: {
    code: 'VALIDATION_ERROR',
    message: 'Serial number already exists',
    details: [
      { field: 'serialNumber', message: 'Must be unique' }
    ]
  }
}

// Unauthorized 401
{
  error: {
    code: 'UNAUTHORIZED',
    message: 'Session expired. Please login again.'
  }
}

// Forbidden 403
{
  error: {
    code: 'FORBIDDEN',
    message: 'You do not have permission to delete equipment'
  }
}

// Server Error 500
{
  error: {
    code: 'INTERNAL_ERROR',
    message: 'Database connection failed'
  }
}
```

---

### 8. UI/UX & RESPONSIVE DESIGN

#### 8.1 Status Badge Color Scheme Missing Accessibility (LOW)

**Issue:** Section 6.4 defines colors but no accessibility notes.

| Status | Color | Issue |
|--------|-------|-------|
| 재고 | green | OK |
| 출고 | blue | OK |
| 고장 | yellow | **Poor contrast** for visually impaired |
| 폐기 | gray | **Poor contrast** |

**Recommendation:**
```
고장 상태 개선:
- Color: #FFA500 (orange) instead of yellow
- Icon: AlertTriangle + text label

폐기 개선:
- Color: #808080 (medium gray) + dark text
- Icon: Trash2 + text label
```

Use icons + text for status, not just color.

---

#### 8.2 Loading State for List Not Specified (LOW)

**Issue:** Section 6.2 mentions "Skeleton UI" but no specific skeleton design.

**Recommendation:** Define skeleton:
```
InventoryTable Skeleton:
- 5 rows of placeholder skeletons
- Each cell has pulsing gray background
- Height matches real table row height
- Prevents layout shift (CLS > 0.1)
```

Implement with `shadcn/ui Skeleton` component.

---

#### 8.3 Empty State Not Defined (LOW)

**Issue:** What does list page look like with 0 results?

**Recommendation:**
```
Empty State (no results):
- Icon: Package or NotFound
- Message: "No equipment found"
- Subtext: "Try adjusting your filters or create a new entry"
- Action: "Create Equipment" button

Empty State (no inventory at all):
- Same as above, but suggest "입고 등록" action
```

---

### 9. SECURITY CONSIDERATIONS

#### 9.1 Input Validation Rules Incomplete (HIGH)

**Issue:** Section 8 mentions validation but doesn't specify rules.

**Problem:** What is "valid" input?

**Recommendation:** Add detailed validation rules:
```
Inventory Field Validation:

category:
- Required: true
- Type: enum ('모니터', '노트북', '라우터', '프린터', '기타')
- Max length: 50

model:
- Required: true
- Type: string
- Length: 1-255
- Allowed chars: alphanumeric, space, dash, parenthesis
- Prevent SQL injection: use parameterized queries (TypeORM default)

serial_number:
- Required: true
- Type: string
- Length: 1-100
- Allowed chars: alphanumeric, dash, underscore
- Unique: with soft delete filter (partial unique index)

purchase_date:
- Required: true
- Type: date
- Constraint: not in future

purchase_from:
- Required: true
- Type: string
- Max length: 255

current_location:
- Required: true (except at creation? clarify)
- Type: string
- Max length: 255

notes:
- Required: false
- Type: string (CLOB)
- Max length: 4000
```

Implement with `class-validator` decorators:
```typescript
import { IsString, IsEnum, MaxLength, IsDateString } from 'class-validator';

export class CreateInventoryDto {
  @IsEnum(['모니터', '노트북', '라우터', '프린터', '기타'])
  category: string;

  @IsString()
  @MaxLength(255)
  model: string;

  @IsString()
  @MaxLength(100)
  serial_number: string;

  @IsDateString()
  purchase_date: string;
}
```

---

#### 9.2 SQL Injection Prevention Not Addressed Fully (MEDIUM)

**Issue:** Section 8 says "TypeORM parameterized queries 사용" but what about search?

**Problem:** User Story 2 includes free-text search:
```
- 검색: 시리얼 번호, 모델명 (부분 검색, 대소문자 무시)
```

**Example vulnerability:**
```
search = "monitor'; DROP TABLE inventory; --"
```

**TypeORM is safe by default,** but code must use:
```typescript
// GOOD: parameterized
const inventories = await repository
  .createQueryBuilder('i')
  .where('i.model LIKE :search', { search: `%${searchTerm}%` })
  .getMany();

// BAD: string concatenation
const inventories = await repository
  .query(`SELECT * FROM inventory WHERE model LIKE '%${searchTerm}%'`);
```

**Recommendation:** Add code example to Section 8 showing safe search pattern.

---

#### 9.3 XSS Prevention for User Input (MEDIUM)

**Issue:** Section 8 says "React 자동 escaping" but what about user-entered notes/reason?

**Example:**
- User enters reason: `<script>alert('hacked')</script>`
- Stored in CLOB
- Displayed in UI

**React auto-escapes by default,** so risk is low, but should note:

**Recommendation:**
```
XSS Prevention:
1. All user input (notes, reason, location) goes through React rendering
2. React auto-escapes HTML entities
3. No rich text editor; plain text only
4. If rich text added in Phase 2, use DOMPurify library
```

---

#### 9.4 Soft Delete Not Enforced in All Queries (HIGH)

**Issue:** Section 8 says "Soft Delete: 물리 삭제 금지" but how to enforce?

**Problem:** If any query accidentally includes deleted records, data leaks.

**Example:**
```typescript
// WRONG: includes deleted records
const all = await repository.find();

// CORRECT: excludes deleted records
const active = await repository.find({
  where: { deletedAt: IsNull() }
});
```

**Recommendation:**
1. Use TypeORM `@DeleteDateColumn()` with global soft delete filter
2. Create custom repository with safe `.find()` method
3. Add test to verify all `GET` endpoints filter soft-deleted records

**Code:**
```typescript
// In repository
const active = await repository
  .createQueryBuilder('i')
  .where('i.deleted_at IS NULL')
  .getMany();

// Or use typeorm-soft-delete extension
await repository.find({ where: { deletedAt: IsNull() } });
```

---

### 10. PERFORMANCE & SCALABILITY

#### 10.1 Pagination Requirements Not Fully Specified (MEDIUM)

**Issue:** Line 35 says:
```
페이지네이션: 기본 20개 항목/페이지, 최대 100개 항목/페이지
```

But no specification for:
1. What if user requests 1000 items/page? (Must limit to 100)
2. Cursor-based vs offset-based? (Offset recommended for simplicity)
3. How to sort with pagination? (Standard offset+limit+order)

**Recommendation:** Add to API spec:
```
GET /api/inventory?page=1&pageSize=20&sortBy=category&order=asc

Constraints:
- pageSize: min 1, max 100 (default 20)
- If pageSize > 100, return 400 error with message "Page size cannot exceed 100"
- Page numbers: 1-indexed (first page is page 1, not page 0)
- Out-of-range page: return empty array, not error
```

Implement in API handler:
```typescript
const pageSize = Math.min(Math.max(parseInt(req.query.pageSize) || 20, 1), 100);
const page = Math.max(parseInt(req.query.page) || 1, 1);
const skip = (page - 1) * pageSize;

const [data, total] = await repository.findAndCount({
  skip,
  take: pageSize,
  order: { category: 'ASC' }
});
```

---

#### 10.2 Statistics Aggregation Performance Not Addressed (MEDIUM)

**Issue:** Section 5.2 includes `GET /api/inventory/stats` but no discussion of query cost.

**Problem:** If there are 100,000 inventory records, aggregating by category + status is expensive:
```sql
SELECT category, status, COUNT(*)
FROM inventory
WHERE deleted_at IS NULL
GROUP BY category, status;
```

**With 100 categories × 4 statuses = 400 rows, should be OK.** But if category is not indexed, query scan is slow.

**Recommendation:**
1. Add indexes (already identified in Section 4.4):
   ```sql
   CREATE INDEX idx_inventory_status ON inventory(current_status);
   CREATE INDEX idx_inventory_category ON inventory(category);
   ```

2. Add caching strategy (optional for Phase 1):
   ```
   - Cache stats for 5 minutes in Redis or TanStack Query cache
   - Invalidate cache on equipment action (checkout/checkin/status change)
   - Reduces database load significantly
   ```

3. Add query timeout:
   ```typescript
   const stats = await repository.query(
     statsQuery,
     [],
     { timeout: 5000 } // 5 second max execution
   );
   ```

---

#### 10.3 Serial Number Search Performance (MEDIUM)

**Issue:** User Story 2 says serial number search is "부분 검색" (partial/substring search).

**Problem:** Substring search `LIKE '%SN123%'` requires full table scan (no index usage).
```sql
WHERE serial_number LIKE '%SN123%'  -- full table scan
```

But with index on serial_number, partial match at start is fast:
```sql
WHERE serial_number LIKE 'SN123%'  -- index seek
```

**Recommendation:**
1. Clarify if search must be prefix-based or true substring:
   - Prefix: `SN123...` (fast with index)
   - Substring: `...SN123...` (slow without full-text index)

2. If substring required, consider full-text index:
   ```sql
   CREATE INDEX idx_inventory_serial_fulltext
   ON inventory(serial_number)
   INDEXTYPE IS CTXSYS.CONTEXT;
   ```
   (Oracle-specific, complex)

3. Recommended: Limit search to prefix only for Phase 1:
   ```
   - Search: serial_number, model (prefix-based)
   - User types "SN1" → matches "SN123", "SN124", not "XSN123"
   ```

---

#### 10.4 Transaction Handling Not Specified (MEDIUM)

**Issue:** No mention of database transactions for multi-step operations.

**Example:** Checkout operation:
1. Find Inventory record
2. Update status from "재고" to "출고"
3. Create InventoryHistory record

**If step 2 succeeds but 3 fails:** Data is inconsistent (status changed but history missing).

**Recommendation:** Add transaction handling:
```typescript
// app/api/inventory/[id]/checkout/route.ts

export async function POST(req: Request, { params }) {
  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const inventory = await queryRunner.manager.findOneBy(Inventory, { id: params.id });

    inventory.current_status = '출고';
    await queryRunner.manager.save(inventory);

    const history = new InventoryHistory();
    history.inventory = inventory;
    history.change_type = '출고';
    // ... set other fields
    await queryRunner.manager.save(history);

    await queryRunner.commitTransaction();
    return Response.json({ success: true });
  } catch (error) {
    await queryRunner.rollbackTransaction();
    return Response.json({ error: error.message }, { status: 500 });
  } finally {
    await queryRunner.release();
  }
}
```

**Recommendation:** Implement for all multi-step operations (checkout, checkin, status change).

---

### 11. ERP MODULE DEPENDENCIES

#### 11.1 Employee Department Dependency Not Clarified (MEDIUM)

**Issue:** Section 5.3 includes FK to `created_by_id` and `updated_by_id` (Employee), but PRD assumes Employee exists.

**Problem:**
1. Does Employee have a `department_id`?
2. Does Inventory need `assigned_to_id` (equipment owner)?
3. How to handle deleted employees?

**Dependency Chain:**
```
Inventory depends on:
  - Employee (created_by, updated_by)
  - Department (optional, for MANAGER scoping)
  - Possibly Project (for checkout_location reference)
```

**Recommendation:**
1. Verify Employee entity exists and has `department_id`
2. Consider adding optional `assigned_to_id` FK to Inventory for equipment owner tracking
3. Add migration with explicit FK constraints

---

#### 11.2 Project Module Integration Unclear (MEDIUM)

**Issue:** User Story 5 mentions "출고 위치(자유 텍스트 또는 프로젝트명)" but no FK to Project.

**Problem:**
1. Is checkout_location a free text field?
2. Or should it be a FK to Project?
3. If Project is deleted, what happens to history?

**Recommendation:** Decide on approach:

**Option A: Free Text (Current spec)**
- `checkout_location: VARCHAR2(255)`
- Flexible but no data integrity
- Risk: Typos, inconsistent project names

**Option B: FK to Project (Better)**
- `checkout_project_id: FK → Project.id`
- Enforces data integrity
- Requires Project entity to exist

**Option C: Both (Best)**
- `checkout_project_id: FK → Project.id (nullable)`
- `checkout_location: VARCHAR2(255) (for other non-project usage)`
- Flexible and safe

**Recommendation:** Choose Option C for future extensibility.

---

#### 11.3 System Administrator Operations Not Defined (MEDIUM)

**Issue:** No mention of ADMIN-only operations like restore deleted records.

**Use Case:** Soft delete error — ADMIN needs to restore deleted Inventory.

**Missing Operations:**
1. Restore soft-deleted Inventory: `POST /api/inventory/[id]/restore` (ADMIN only)
2. Permanently delete: Not specified (should probably never allow)

**Recommendation:** Add to Section 5.2 (API Routes):
```
ADMIN-Only Operations:
- POST /api/inventory/[id]/restore — Restore soft-deleted record
- GET /api/inventory/deleted — List all soft-deleted records (audit trail)
```

---

## Summary Table of Critical Points

| Priority | Count | Examples |
|----------|-------|----------|
| **HIGH** | 5 | Serial number uniqueness, Authorization contradiction, Cascade behavior, HistorySoft delete, Cache invalidation |
| **MEDIUM** | 8 | Approval workflow, Overdue tracking, Bulk operations, Query parameters, Input validation, Transaction handling, Employee dependency, Project integration |
| **LOW** | 5 | Status color accessibility, Skeleton design, Empty state, Error response format, Form state pattern |

---

## Recommendations by Phase

### Phase 1: Core CRUD (Before Implementation)
**MUST FIX (Blockers):**
1. ✅ Clarify USER role permissions (checkout/checkin allowed?)
2. ✅ Define serial_number uniqueness enforcement (partial unique index)
3. ✅ Specify soft delete strategy for InventoryHistory
4. ✅ Document cache invalidation for TanStack Query
5. ✅ Add detailed input validation rules

**SHOULD FIX (Quality):**
1. ✅ Clarify location update semantics (checkout vs checkin)
2. ✅ Define complete state transition diagram
3. ✅ Add transaction handling for multi-step operations
4. ✅ Specify pagination and query parameters
5. ✅ Add authentication for all API routes

### Phase 2: Actions + History
1. Implement approval workflow for deprecation
2. Add overdue equipment tracking and alerts
3. Bulk operation endpoints
4. Department-scoped permissions for MANAGER
5. Full-text search or prefix-based search with indexes

### Phase 3+: Analytics & Polish
1. WebSocket real-time stats updates
2. Rich text editor for notes (with DOMPurify)
3. Barcode/QR code scanning integration
4. Equipment performance monitoring
5. External system integrations

---

## Sign-Off Checklist

Before PRD is approved for implementation, address:

- [ ] Resolve USER role contradiction (read-only or can return?)
- [ ] Define serial_number uniqueness enforcement in migration
- [ ] Specify InventoryHistory soft delete semantics
- [ ] Document TanStack Query cache invalidation pattern
- [ ] Add detailed input validation rules to Section 8
- [ ] Clarify location update logic (checkout → current_location?)
- [ ] Define complete state transition diagram with all edges
- [ ] Implement transaction handling in transaction-heavy operations
- [ ] Specify all query parameters for API endpoints
- [ ] Add ADMIN restore operation definition
- [ ] Verify Employee and Department entities exist
- [ ] Consider Project entity FK for checkout_location

---

## Conclusion

The 재고 관리 PRD is **well-structured and comprehensive** with clear user stories and good alignment with sunjin-erp architecture. However, **11 HIGH/MEDIUM-priority issues** must be resolved before implementation begins, particularly around authorization, database constraints, and state management.

**Estimated effort to resolve:**
- Critical fixes: 2-3 hours
- Medium fixes: 4-5 hours
- Total review cycle: 1 day

**Recommendation:** Address all HIGH priority items in pre-implementation phase. MEDIUM priority items can be tracked as Phase 2 enhancements or implementation notes.

