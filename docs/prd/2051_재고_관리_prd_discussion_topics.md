<!-- Generated: 2026-01-25 23:15:00 KST -->

# Discussion Topics: 재고 관리 (Inventory Management) PRD 2051

**문서번호:** 2051_재고_관리_prd_discussion_topics
**작성일:** 2026-01-25
**대상:** PRD 재정의 필요 항목 및 의사결정 대상

---

## Discussion Topic 1: USER Role Permission Model

**Priority:** HIGH

**Issue:**
Section 5.5 (Authorization) states USER can only view (read-only), but User Story 8 allows USER to perform checkin (반납) operations. This is a direct contradiction that must be resolved before implementation.

**Current PRD Position:**
- Section 1.15: "대상 사용자 역할: USER / MANAGER / ADMIN"
- Section 5.5: "USER: 목록 조회, 상세 조회 읽기만 가능" (read-only)
- User Story 8 (Line 96): "USER / MANAGER / ADMIN" can perform checkin

**Options:**

**Option A: USER is Fully Read-Only (Preferred)**
- USER: Can view inventory list and details only
- MANAGER: Can checkout, checkin, relocate, change status
- ADMIN: Can do everything + delete/restore
- Pros:
  - Clean, simple permission model
  - Aligns with typical role hierarchy
  - Easier to audit and enforce
- Cons:
  - Users cannot return their own equipment
  - More dependent on MANAGER availability

**Option B: USER Can Only Checkin (Return)**
- USER: Can view + return equipment they checked out
- MANAGER: Can do all operations
- ADMIN: Can do everything + delete/restore
- Pros:
  - Users can manage their own equipment
  - Reduces MANAGER burden
- Cons:
  - Inconsistent permission model (write in one case only)
  - Harder to implement and test

**Option C: Department-Scoped USER Permissions**
- USER: Can view all + checkout/checkin within their department only
- MANAGER: Can manage department inventory
- ADMIN: All inventory
- Pros:
  - Granular control per department
  - Reduces equipment loss
- Cons:
  - Requires department assignment in Employee entity
  - More complex authorization logic

**Recommended:** Option A (USER read-only)

**Reasoning:** Simplest model, clearest audit trail, aligns with standard sunjin-erp role hierarchy.

---

## Discussion Topic 2: Location Management Semantics

**Priority:** MEDIUM

**Issue:**
Current PRD defines two location concepts but their interaction during checkout/checkin is ambiguous:
- `current_location`: Physical warehouse/storage location
- `checkout_location`: Logical destination (project, person, etc.)

**Current PRD Position:**
- Line 376-377 addresses distinction but acceptance criteria unclear
- User Story 5 (Checkout): "출고 위치" is specified
- User Story 6 (Relocation): Only affects "재고" status equipment
- User Story 8 (Checkin): "반납 위치" updates current_location

**Options:**

**Option A: Separate Tracking (Current Spec)**
- On checkout: current_location stays at warehouse, checkout_location set to destination
- On checkin: current_location updated to return location (specified by user)
- Pros:
  - Tracks both logical (checkout) and physical (current) locations
  - Useful for auditing equipment movement
  - Supports complex workflows
- Cons:
  - More complex to implement
  - Users must specify return location on checkin

**Option B: Single Location (Simplified)**
- current_location updates to checkout_location on checkout
- On checkin, current_location updated to return location
- Pros:
  - Simpler mental model
  - Fewer fields
- Cons:
  - Loses information about original warehouse location
  - Cannot track where equipment was "supposed" to go vs actual location

**Option C: Location as History-Only**
- current_location: Only updated when equipment in "재고" status
- checkout_location: Only stored in InventoryHistory, not in main entity
- On checkin: current_location must be explicitly set
- Pros:
  - Clear separation: current = for storage, history = complete audit trail
  - Efficient queries (don't need to filter on checkout_location)
- Cons:
  - Requires more fields in InventoryHistory
  - Slightly more complex form (must require return location on checkin)

**Recommended:** Option A (Current Spec)

**Reasoning:** Provides full audit trail while maintaining separate concerns.

**Implementation Detail Needed:**
- Checkin form MUST require "반납 위치" (return location) field
- Update Location Update Table in Rebuttal to specify this requirement

---

## Discussion Topic 3: Status Transition Rules and State Machine

**Priority:** MEDIUM

**Issue:**
Current PRD defines some transitions (Line 87-91) but not all valid paths. Key ambiguities:
1. Can equipment go directly from "출고" → "폐기" without returning?
2. Can equipment be repaired (고장 → 재고)?
3. What are all valid transitions?

**Current PRD Position:**
```
재고 → 고장 / 폐기 (O)
출고 → 고장 / 폐기 (O, 반납 후)
고장 → 폐기 (O)
폐기 → 변경 불가 (최종 상태)
```

Interpretation: "O, 반납 후" suggests must return first before deprecation.

**Options:**

**Option A: Restrictive State Machine (Current Spec)**
```
[재고] ──→ [출고] ──→ [재고] (checkin)
         └──→ [고장]
[재고] ──→ [고장] ──→ [폐기]
[재고] ──→ [폐기] (direct, rare)
[출고] ──→ [고장] (while checked out)
[고장] ──→ [폐기] (only path from broken)
[폐기] → FINAL (no further changes)
```
- Pros:
  - Prevents equipment mismanagement
  - Clear audit trail (no shortcuts)
  - Enforces accountability
- Cons:
  - Inflexible (e.g., can't directly deprecate failing equipment)
  - May require "return" as administrative step

**Option B: Permissive State Machine**
```
[재고] → [출고] → [재고]
[재고] → [고장] → [폐기]
[재고] → [폐기]
[출고] → [고장]
[출고] → [폐기] (direct, allow shortcut)
[고장] → [재고] (allow repair/fix)
[고장] → [폐기]
[폐기] → FINAL
```
- Pros:
  - Flexible for edge cases
  - Allows direct deprecation of failed equipment
  - Supports repair workflows
- Cons:
  - Harder to enforce business rules
  - Potential for data inconsistency
  - More validation code

**Option C: State Machine with Explicit Approval Gates**
```
[재고] ──→ [출고] ──→ [재고] (checkin)
         └──→ [고장] (≤ requires manager approval)
[재고] ──→ [고장] (≤ requires manager approval)
[고장] ──→ [폐기] (≤ requires approval if expense > threshold)
[폐기] → FINAL
```
- Pros:
  - Enforces business policy
  - Prevents uncontrolled deprecation
  - Audit trail of approvals
- Cons:
  - Out of scope for Phase 1
  - Requires approval workflow infrastructure

**Recommended:** Option A (Current Spec)

**Reasoning:**
- Restrictive model is safer for Phase 1
- Enforces clear process: checkout → return → (optional) deprecate
- Can be relaxed in Phase 2 with approval workflow

**Implementation:**
- Add explicit validation in API for each operation
- Example: Checkin only allowed if status = "출고"
- Example: Deprecation not allowed if status = "출고" (must return first)

---

## Discussion Topic 4: Department-Scoped Permissions for MANAGER

**Priority:** MEDIUM

**Issue:**
Current PRD doesn't specify whether MANAGER permissions are department-scoped. This matters for multi-department organizations.

**Current PRD Position:**
Section 5.5 says "MANAGER: 조회 + 입고/출고/반납/위치변경 가능" but doesn't mention department scope.

**Background:**
sunjin-erp uses department-based access control for other modules (employees, tasks, etc.). Consistency would suggest inventory should also be scoped.

**Options:**

**Option A: No Department Scope (Current Spec)**
- MANAGER: Can see and manage ALL inventory
- Works for small organizations (single department or shared resources)
- Pros:
  - Simple to implement
  - Flexible resource sharing
  - No cross-department coordination needed
- Cons:
  - Single MANAGER becomes bottleneck
  - Difficult to scale to multi-department orgs
  - No access control per department

**Option B: Department-Scoped MANAGER (Recommended)**
- MANAGER: Can only see/manage inventory in their department
- Requires: Inventory.department_id FK → Department
- Inventory belongs to a department (storage warehouse is in a location)
- Pros:
  - Scales with organization growth
  - Matches sunjin-erp pattern
  - Clear accountability per department
  - MANAGER only manages their department's assets
- Cons:
  - Requires department_id in Inventory entity
  - More complex filtering in queries
  - Shared/cross-department equipment harder to manage

**Option C: Hybrid Scoping**
- MANAGER: Can see all inventory, but can only modify their department's
- Requires: Optional department_id on Inventory
- Pros:
  - Visibility across organization
  - Controlled modification per department
  - Flexible for shared resources
- Cons:
  - Complex authorization rules
  - Confusing UX (can see but can't edit some items)

**Recommended:** Option B (Department-Scoped)

**Reasoning:**
- Aligns with sunjin-erp established pattern
- Scales better as organization grows
- Clear responsibility assignment

**Implementation:**
- Add `department_id: FK → Department (nullable)` to Inventory entity
- Update API queries:
  ```typescript
  if (session.user.role === 'MANAGER') {
    query.where({ departmentId: session.user.departmentId });
  }
  ```
- Update UI: Filter list by user's department for MANAGER role

**Note:** Can implement as Phase 1.5 after core CRUD, if needed.

---

## Discussion Topic 5: Partial Unique Index for Serial Number Constraint

**Priority:** HIGH

**Issue:**
Oracle doesn't support conditional UNIQUE constraints. How to enforce "serial_number must be unique for active (non-deleted) records"?

**Current PRD Position:**
Section 5.3 says "UNIQUE 제약 (중복 입고 방지, deleted_at IS NULL 조건)" but doesn't specify implementation.

**Options:**

**Option A: Partial Unique Index (Preferred)**
```sql
CREATE UNIQUE INDEX idx_inventory_serial_active
ON inventory(serial_number) WHERE deleted_at IS NULL;
```
- Supported in Oracle 12c+
- Pros:
  - Native database enforcement
  - Efficient query performance
  - Clean, declarative
  - Works with TypeORM
- Cons:
  - Requires Oracle 12c+ (Verify sunjin-erp version: XE 21c ✓)
  - Index maintenance overhead (minimal)

**Option B: Database Trigger**
```sql
CREATE TRIGGER trg_inventory_serial_unique
BEFORE INSERT ON inventory
BEGIN
  IF :NEW.deleted_at IS NULL THEN
    SELECT COUNT(*) INTO cnt FROM inventory
    WHERE serial_number = :NEW.serial_number AND deleted_at IS NULL;
    IF cnt > 0 THEN
      RAISE_APPLICATION_ERROR(-20001, 'Serial number must be unique');
    END IF;
  END IF;
END;
```
- Pros:
  - Works on older Oracle versions
  - Explicit business logic
- Cons:
  - Complex trigger code
  - Performance overhead (trigger on every insert)
  - Harder to debug
  - Not portable

**Option C: Application Validation Only**
- Check before insert in application code
- Pros:
  - Works anywhere
  - Easy to implement
  - Can provide custom error messages
- Cons:
  - NOT sufficient alone (race conditions possible)
  - Requires network round-trip
  - Can be bypassed

**Option D: Hybrid (Index + App Validation)**
- Use partial unique index as primary enforcement
- Application validation as safety net/better error messages
- Pros:
  - Best of both worlds
  - Database prevents corruption
  - App provides UX-friendly errors
- Cons:
  - Requires two layers of code

**Recommended:** Option D (Partial Unique Index + App Validation)

**Reasoning:**
- Oracle XE 21c supports partial indexes ✓
- Database-level enforcement prevents data corruption
- App-level validation provides better UX error messages

**Implementation Plan:**
1. Migration file:
   ```typescript
   queryRunner.query(`
     CREATE UNIQUE INDEX idx_inventory_serial_active
     ON inventory(serial_number) WHERE deleted_at IS NULL
   `);
   ```

2. Application validation in DTO:
   ```typescript
   export class CreateInventoryDto {
     @IsString()
     @MaxLength(100)
     @ValidateSerialUnique() // Custom validator
     serial_number: string;
   }
   ```

3. API handler error handling:
   ```typescript
   try {
     await repository.save(inventory);
   } catch (error) {
     if (error.code === 'ORA-00001') { // Unique constraint violated
       return Response.json({
         error: { code: 'DUPLICATE_SERIAL', message: 'Serial number already exists' }
       }, { status: 400 });
     }
   }
   ```

---

## Discussion Topic 6: Soft Delete Strategy for InventoryHistory

**Priority:** HIGH

**Issue:**
InventoryHistory has a `deleted_at` column but should never be soft-deleted (it's an audit trail). Current spec is unclear: "논리적으로는 사용 안 함" (logically not used).

**Current PRD Position:**
Section 5.3 adds `deleted_at` to InventoryHistory but notes it's "logically not used."

**Options:**

**Option A: Don't Add deleted_at to InventoryHistory**
- Remove the column from migration
- InventoryHistory is completely immutable
- Pros:
  - Clear: history can never be deleted
  - Simpler schema
  - Forces correct behavior
- Cons:
  - Cannot restore history if parent is restored (though parent is restored)
  - No record of when history was created (use created_at instead)

**Option B: Add deleted_at But Never Use It**
- Column exists but documented as "never soft-deleted"
- Pros:
  - Consistent with other entities
  - Future flexibility if requirements change
  - TypeORM @DeleteDateColumn() available for future
- Cons:
  - Confusing (column exists but not used)
  - Risk someone uses it accidentally
  - Wastes 4 bytes per row

**Option C: Add deleted_at for Logical Deletion Only (When Parent Deleted)**
- Delete InventoryHistory when parent Inventory deleted
- Pros:
  - Clean audit trail (no orphaned records)
  - Simpler queries (don't need to filter)
- Cons:
  - Loses audit trail when equipment deleted
  - Violates audit principle (trail should be permanent)
  - Breaks regulatory compliance if needed

**Option D: Keep History, Mark as "Archived"**
- History always visible
- Add `is_visible: boolean` flag (shown only when parent active)
- Pros:
  - Complete audit trail
  - Visible for ADMIN in audit queries
  - Compliant with audit requirements
- Cons:
  - Slightly more complex (extra filter)

**Recommended:** Option A (Don't Add deleted_at)

**Reasoning:**
- Audit trail should be immutable
- `deleted_at` is misleading if never used
- TypeORM can use created_at instead if needed

**Implementation:**
- Migration: Don't add deleted_at to inventory_history
- Entity: Don't add @DeleteDateColumn() to InventoryHistory
- Add comment: `// InventoryHistory is immutable audit trail; never soft-deleted`
- Query pattern:
  ```typescript
  // Get history including from deleted inventory
  const history = await historyRepository.find({
    where: { inventoryId },
    order: { changedAt: 'ASC' }
  });
  ```

---

## Discussion Topic 7: Cache Invalidation Strategy for TanStack Query

**Priority:** HIGH

**Issue:**
PRD mentions TanStack Query but doesn't specify which queries need invalidation after each operation. Unclear invalidation can cause stale data bugs.

**Current PRD Position:**
Section 5.4 lists hooks (useInventoryList, useInventoryDetail, useInventoryStats) but no invalidation strategy.

**Options:**

**Option A: Invalidate All on Every Change (Simple)**
- Every mutation invalidates all inventory queries
- Pros:
  - Simple to implement
  - Guarantees fresh data
  - Difficult to have stale state
- Cons:
  - Inefficient (unnecessary refetches)
  - Stats refetch even if unaffected by change
  - Sluggish UX (multiple refetches)

**Option B: Invalidate Only Affected Queries (Granular)**
- Each mutation invalidates only affected queries
- Example: Checkout invalidates [list, detail, stats] but not individual items
- Example: Update invalidates only [detail, list] but not global stats
- Pros:
  - Efficient (fewer refetches)
  - Better UX (faster)
  - Predictable behavior
- Cons:
  - More code
  - Risk of missing invalidations
  - Harder to maintain

**Option C: Invalidate Aggregates Only (Minimal)**
- Mutations don't invalidate list
- Only invalidate if user navigates back to list
- Pros:
  - Most efficient
  - Fastest perceived UX
- Cons:
  - Users see stale list until refresh
  - Confusing if they have list open in another tab

**Recommended:** Option B (Granular Invalidation)

**Reasoning:**
- Balances efficiency with correctness
- Provides good UX without excessive refetches
- Maintainable with clear documentation

**Implementation:**
```typescript
// hooks/useInventoryMutations.ts
export function useInventoryMutations() {
  const queryClient = useQueryClient();

  const invalidateDetail = (id: number) => {
    queryClient.invalidateQueries(['inventory-detail', id]);
  };

  const invalidateListAndStats = () => {
    queryClient.invalidateQueries(['inventory-list']);
    queryClient.invalidateQueries(['inventory-stats']);
  };

  return {
    // Affects: list, detail, stats
    createMutation: useMutation(createInventory, {
      onSuccess: invalidateListAndStats
    }),

    // Affects: detail, list (if status changed, which it does)
    checkoutMutation: useMutation(checkoutInventory, {
      onSuccess: (data) => {
        invalidateDetail(data.id);
        invalidateListAndStats(); // Status changed
      }
    }),

    // Affects: detail, list, stats
    statusChangeMutation: useMutation(changeStatus, {
      onSuccess: (data) => {
        invalidateDetail(data.id);
        invalidateListAndStats();
      }
    })
  };
}
```

**Invalidation Map:**

| Operation | Invalidate List | Invalidate Detail | Invalidate Stats |
|-----------|-----------------|-------------------|------------------|
| Create | Yes | - | Yes (new item) |
| Update | Yes | Yes | Maybe (depends on field) |
| Checkout | Yes | Yes | Yes (status changed) |
| Checkin | Yes | Yes | Yes (status changed) |
| Relocate | Yes | Yes | No (status same) |
| Status Change | Yes | Yes | Yes (status changed) |
| Delete | Yes | No | Yes |

---

## Discussion Topic 8: Approval Workflow for Critical Operations

**Priority:** MEDIUM

**Issue:**
Should equipment deprecation (고장/폐기) require approval? Especially for expensive items, this prevents accidental loss.

**Current PRD Position:**
Section 4.2 lists "출고 승인 워크플로우" as Out-of-Scope. Deprecation approval also implied out-of-scope.

**Options:**

**Option A: No Approval Required (Phase 1 Spec)**
- MANAGER can deprecate equipment immediately
- Pros:
  - Simpler implementation
  - Faster workflow
  - Works for small teams with trust
- Cons:
  - Risk of accidental deprecation
  - No audit trail of approval decision
  - Harder to recover from mistakes

**Option B: Optional Approval Flag**
- Add `requires_approval: boolean` in InventoryHistory
- Status change with flag creates pending state
- ADMIN must approve before change takes effect
- Pros:
  - Phase 1 can set flag manually
  - Foundation for Phase 2 automated approval
  - Flexible policy per item
- Cons:
  - Requires pending state management
  - Slightly complex state machine

**Option C: Threshold-Based Approval**
- Require approval only for equipment > $5000 (configurable)
- Pros:
  - Balances safety with efficiency
  - Protects valuable assets
  - Flexible policy
- Cons:
  - Requires price field in Inventory
  - Need to configure threshold
  - Complex business logic

**Option D: Approval for All Deprecation (Phase 2)**
- Defer to Phase 2 completely
- Phase 1: Manual auditing process
- Pros:
  - Cleanest Phase 1
  - Implement proper workflow in Phase 2
- Cons:
  - Risky in early phases
  - Manual oversight error-prone

**Recommended:** Option A for Phase 1, with Plan for Option C in Phase 2

**Reasoning:**
- Phase 1 prioritizes core CRUD
- Approval workflow infrastructure not yet built
- Phase 2 can add threshold-based approval
- Audit trail (InventoryHistory) provides accountability

**Implementation:**
- Phase 1: MANAGER deprecates immediately (audit via history)
- Phase 2: Add optional price field + approval workflow
- Document: "Equipment deprecation is logged in audit trail; ADMIN can review"

---

## Discussion Topic 9: Search Performance (Substring vs Prefix)

**Priority:** MEDIUM

**Issue:**
User Story 2 specifies "부분 검색" (partial search), but substring search (`LIKE '%term%'`) requires full table scan. How to balance flexibility vs. performance?

**Current PRD Position:**
Line 42 says "검색: 시리얼 번호, 모델명 (부분 검색, 대소문자 무시)"

**Options:**

**Option A: Prefix-Based Search (Recommended for Phase 1)**
- User types "SN1" → matches "SN123", "SN124", not "OLD_SN123"
- Query: `LIKE 'SN1%'` (uses index)
- Pros:
  - Index-friendly (fast)
  - Simple to implement
  - Good UX for most cases
  - Less typing (start typing and filter narrows)
- Cons:
  - Cannot find "OLD_SN123" by searching "SN"
  - Less flexible than substring search

**Option B: Full Substring Search (Phase 2)**
- Query: `LIKE '%SN%'` (full table scan)
- Pros:
  - Most flexible
  - Users can search from any part
- Cons:
  - Slow without full-text index
  - Full-text index complex to set up (Oracle CTXSYS)
  - 1000+ records → noticeable lag

**Option C: Full-Text Search Index (Phase 2+)**
- Use Oracle full-text search (CTXSYS.CONTEXT)
- Pros:
  - Fast even for substring
  - Supports fuzzy matching, stemming
  - Production-grade search
- Cons:
  - Complex to set up
  - Requires separate index
  - Maintenance overhead

**Option D: Hybrid (Prefix in Phase 1, Full-Text in Phase 2)**
- Phase 1: Prefix-based search (fast)
- Phase 2: Add full-text index
- UI can indicate search type to user
- Pros:
  - Delivers Phase 1 quickly
  - Adds capability in Phase 2 without breaking changes
  - Users can adapt to search UX
- Cons:
  - Two search implementations

**Recommended:** Option D (Prefix Phase 1, Full-Text Phase 2)

**Reasoning:**
- Phase 1 gets working search quickly (prefix)
- Phase 2 can enhance without blocking Phase 1
- Most users find what they need with prefix (serial numbers typically start with prefix)

**Implementation:**

Phase 1:
```typescript
// API: prefix-based search
const searchTerm = search.trim();
const query = repository
  .createQueryBuilder('i')
  .where('i.serial_number LIKE :search OR i.model LIKE :search', {
    search: `${searchTerm}%`  // Prefix only
  });
```

Phase 2:
```typescript
// Add full-text index and use for substring
const query = repository.query(`
  SELECT * FROM inventory
  WHERE CONTAINS(serial_number, '${searchTerm}', 1) > 0
  OR CONTAINS(model, '${searchTerm}', 1) > 0
`);
```

---

## Discussion Topic 10: Overdue Equipment Tracking and Alerts

**Priority:** MEDIUM

**Issue:**
Equipment checked out with `expected_checkin_date` but no enforcement. How to track and alert on overdue items?

**Current PRD Position:**
User Story 5 captures `expected_checkin_date` but no validation or alerts (out-of-scope per Section 4.2).

**Options:**

**Option A: Store Only, No Enforcement (Phase 1)**
- Capture `expected_checkin_date` in InventoryHistory
- No validation, no alerts
- Pros:
  - Phase 1 can store data for future use
  - No infrastructure needed
  - Foundation for Phase 2 alerts
- Cons:
  - Ignored field (users don't see value)
  - Data stored but unused

**Option B: Computed is_overdue Field (Phase 1+)**
- Add computed field: `is_overdue = (expected_checkin_date < NOW AND status = '출고')`
- Phase 1: Compute in API for detail view
- Phase 2: Show in list view with highlighting
- Pros:
  - Phase 1 can show on detail page
  - No separate query needed
  - Easy to implement
- Cons:
  - Computed at query time (small overhead)
  - Doesn't alert automatically

**Option C: Background Job for Alerts (Phase 2)**
- Scheduled job checks overdue equipment daily
- Sends email/notification to MANAGER
- Pros:
  - Proactive notification
  - Doesn't block user workflow
  - Production-grade alerting
- Cons:
  - Out of scope for Phase 1
  - Requires job scheduling infrastructure
  - Email/notification system needed

**Recommended:** Option B (Computed Field Phase 1, Alerts Phase 2)

**Reasoning:**
- Phase 1 can compute and display on detail page
- Phase 2 can add list highlighting and alerts
- Provides value incrementally

**Implementation:**

Phase 1:
```typescript
// In detail view, show overdue status
const inventory = await getInventoryDetail(id);
const isOverdue = inventory.expectedCheckinDate < new Date()
  && inventory.currentStatus === '출고';

// Display: "Overdue! Expected return: 2026-01-20"
```

Phase 2:
```typescript
// Add to list query and stats
const [data, total] = await repository.findAndCount({
  select: {
    ...fields,
    isOverdue: () => `
      CASE WHEN expected_checkin_date < SYSDATE AND current_status = '출고'
      THEN 1 ELSE 0 END
    `
  }
});

// Add to stats: `overdue_count: number`
```

---

## Discussion Topic 11: Equipment Owner vs Created-By Attribution

**Priority:** LOW

**Issue:**
Current schema tracks `created_by_id` (who created record) but not `assigned_to_id` (who owns/is responsible for equipment).

**Current PRD Position:**
Section 5.3 includes `created_by_id` and `updated_by_id` but no owner tracking.

**Options:**

**Option A: No Owner Field (Phase 1)**
- Assume all equipment is organizationally managed
- No individual owner
- Pros:
  - Simpler schema
  - Fewer fields to maintain
  - Works for shared equipment
- Cons:
  - Cannot track responsibility
  - Cannot filter "my equipment"
  - Harder to recover lost items

**Option B: Optional Owner Field**
- Add `assigned_to_id: FK → Employee (nullable)`
- Equipment can be assigned to person
- Pros:
  - Tracks responsibility
  - Users can see "their" equipment
  - Enables accountability
- Cons:
  - Optional field (some records might not have owner)
  - Requires updating on checkin/checkout
  - More complex queries

**Option C: Owner Changes with Checkout**
- On checkout: `assigned_to_id = checkoutted_by_id`
- On checkin: `assigned_to_id = NULL` (back to unassigned)
- Pros:
  - Always current
  - Automatic updates (no manual assignment)
  - Clear accountability
- Cons:
  - More complex state management
  - Requires transactional updates

**Recommended:** Option B for Phase 2

**Reasoning:**
- Phase 1 focuses on inventory tracking (not asset ownership)
- Phase 2 can add owner tracking
- Optional field doesn't break Phase 1

**Implementation (Phase 2):**
```typescript
@Entity('inventory')
export class Inventory {
  @ManyToOne(() => Employee, { nullable: true })
  @JoinColumn({ name: 'assigned_to_id' })
  assignedTo?: Employee;

  @Column({ nullable: true })
  assigned_to_id?: number;
}

// On checkin, optionally assign to user returning
const inventory = await repository.findOne(id);
inventory.assignedToId = session.user.id; // Optional
await repository.save(inventory);
```

---

## Summary: Decision Matrix

| Topic | Phase | Priority | Recommended Option | Blocker? |
|-------|-------|----------|-------------------|----------|
| 1. USER Role | 1 | HIGH | Option A (read-only) | YES |
| 2. Location Semantics | 1 | MEDIUM | Option A (separate) | NO |
| 3. Status Transitions | 1 | MEDIUM | Option A (restrictive) | NO |
| 4. Department Scoping | 1-2 | MEDIUM | Option B (scoped) | NO |
| 5. Serial Uniqueness | 1 | HIGH | Option D (index + app) | YES |
| 6. History Deletion | 1 | HIGH | Option A (no deleted_at) | YES |
| 7. Cache Invalidation | 1 | HIGH | Option B (granular) | YES |
| 8. Approval Workflow | 2 | MEDIUM | Option A (Phase 1), C (Phase 2) | NO |
| 9. Search Performance | 1-2 | MEDIUM | Option D (prefix Phase 1) | NO |
| 10. Overdue Tracking | 1-2 | MEDIUM | Option B (computed Phase 1) | NO |
| 11. Equipment Owner | 2 | LOW | Option B (Phase 2) | NO |

**Blockers for Phase 1 Implementation:**
- Topic 1: USER Role (HIGH)
- Topic 5: Serial Uniqueness (HIGH)
- Topic 6: History Deletion (HIGH)
- Topic 7: Cache Invalidation (HIGH)

**Can Proceed with Defaults:**
- Topics 2, 3, 4: Use recommended options
- Topics 8, 9, 10, 11: Plan for Phase 2

---

## Mediation Requests

For PRD Mediator to resolve:

1. **USER Role (Topic 1):** Confirm read-only for Phase 1 or allow checkin?
2. **Department Scoping (Topic 4):** Should MANAGER permissions be department-scoped?
3. **Approval Workflow (Topic 8):** Should Phase 2 include threshold-based approval for deprecation?
4. **Search Type (Topic 9):** Confirm prefix-based search acceptable for Phase 1?

These decisions are orthogonal; can be made independently.

