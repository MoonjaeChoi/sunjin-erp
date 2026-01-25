<!-- Generated: 2026-01-25 23:45:00 KST -->

# Decision Document: 재고 관리 (Inventory Management) PRD 2051

**문서번호:** 2051_재고_관리_prd_decisions
**작성일:** 2026-01-25
**대상:** Discussion Topics 및 Critical Review 항목 중 의사결정 사항
**의사결정자:** PRD Mediator (Claude Code)

---

## Executive Summary

All **11 discussion topics** have been mediated and resolved. **4 HIGH-priority items** that were implementation blockers are now clarified. **3 MEDIUM-priority items** are deferred to Phase 2 as planned. All decisions align with sunjin-erp architecture patterns and best practices.

**Decision Status:**
- **HIGH Priority:** 4/4 resolved (blockers cleared)
- **MEDIUM Priority:** 7/7 resolved (3 Phase 1, 4 Phase 2)
- **LOW Priority:** 1/1 deferred to Phase 2

---

## Decision Summary Table

| # | Topic | Priority | Phase | Decision | Rationale |
|---|-------|----------|-------|----------|-----------|
| 1 | USER Role Permission Model | HIGH | 1 | **Option A: Read-Only for USER** | Cleaner security model; Section 5.5 is canonical. Update User Story 8 to MANAGER/ADMIN only. |
| 2 | Location Management Semantics | MEDIUM | 1 | **Option A: Separate Tracking** | Current spec is correct. Add clarity: checkout_location for logical dest, current_location for physical warehouse. |
| 3 | Status Transition Rules | MEDIUM | 1 | **Option A: Restrictive State Machine** | Current spec enforces data integrity. Document explicit state diagram showing all valid transitions. |
| 4 | Department-Scoped Permissions | MEDIUM | 1-2 | **Option B: Department-Scoped MANAGER (Phase 2)** | Aligns with sunjin-erp pattern. Phase 1 can use global scope; add department_id FK in Phase 2. |
| 5 | Partial Unique Index for Serial Number | HIGH | 1 | **Option D: Partial Index + App Validation** | Oracle XE 21c supports. Primary: database index. Secondary: app-level validation for UX. |
| 6 | Soft Delete Strategy for InventoryHistory | HIGH | 1 | **Option A: No deleted_at Column** | Audit trail must be immutable. Remove deleted_at from InventoryHistory migration. |
| 7 | Cache Invalidation Strategy | HIGH | 1 | **Option B: Granular Invalidation** | Efficient + correct. Document invalidation map for each operation (checkout, checkin, etc). |
| 8 | Approval Workflow for Deprecation | MEDIUM | 2 | **Option A (Phase 1) + C (Phase 2)** | Phase 1: No approval (audit via history). Phase 2: Threshold-based approval for expensive items. |
| 9 | Search Performance (Substring vs Prefix) | MEDIUM | 1-2 | **Option D: Prefix Phase 1, Full-Text Phase 2** | Phase 1: Prefix-based search (fast with index). Phase 2: Full-text search if needed. |
| 10 | Overdue Equipment Tracking | MEDIUM | 1-2 | **Option B: Computed is_overdue Field** | Phase 1: Compute in API for detail view. Phase 2: Add list highlighting + alerts. |
| 11 | Equipment Owner Attribution | LOW | 2 | **Option B: Optional assigned_to_id (Phase 2)** | Phase 1: Not needed. Phase 2: Add optional owner field for accountability. |

---

## Detailed Decisions

---

### Decision 1: USER Role Permission Model (HIGH)

**Status:** RESOLVED ✓

**Decision:** **Option A — USER is fully read-only**

**Selected:** Yes
**Phase:** 1
**Rationale:**
- Section 5.5 (Authorization) clearly defines USER as read-only: "목록 조회, 상세 조회 읽기만 가능"
- This is the canonical source for role definitions in this PRD
- User Story 8 inclusion of USER was a copy-paste error (acknowledged in rebuttal)
- Simpler, cleaner permission model
- Aligns with standard enterprise RBAC patterns
- Easier to audit and enforce

**Implementation Notes:**
- Update User Story 8 (Line 96): Change "USER / MANAGER / ADMIN" to "MANAGER / ADMIN"
- All checkout/checkin/status-change operations: MANAGER and ADMIN only
- API Route Handlers: Check `session.user.role` and reject if USER

**Code Example:**
```typescript
// POST /api/inventory/[id]/checkin
if (!['MANAGER', 'ADMIN'].includes(session.user.role)) {
  return Response.json(
    { error: { code: 'FORBIDDEN', message: 'Only MANAGER can perform this action' } },
    { status: 403 }
  );
}
```

**Acceptance Criteria:**
- ✓ USER can view list page (read-only)
- ✓ USER can view detail page (read-only)
- ✓ USER cannot see checkout/checkin/relocate buttons (UI disabled)
- ✓ USER requests to action endpoints return 403 Forbidden

---

### Decision 2: Location Management Semantics (MEDIUM)

**Status:** RESOLVED ✓

**Decision:** **Option A — Separate Tracking (current spec is correct)**

**Selected:** Yes
**Phase:** 1
**Rationale:**
- Current PRD already specifies this correctly in Q&A (Line 376-377)
- Provides complete audit trail
- Supports future complex workflows
- Separates concerns: logical (project) vs physical (warehouse) locations

**Implementation Notes:**
- `current_location`: Physical warehouse/storage location (updated on checkin/relocation)
- `checkout_location`: Logical destination (project, person) — stored only in InventoryHistory, not in Inventory entity
- Checkin form MUST require "반납 위치" (return location) field

**Location Update Semantics:**

| Operation | Current Location | Checkout Location | Notes |
|-----------|------------------|-------------------|-------|
| 입고 | Updated by user (warehouse) | N/A | Initial location set during creation |
| 출고 | Remains unchanged | Stored in history | Logical destination captured; physical location stays at warehouse |
| 위치변경 | Updated to new warehouse | N/A | Only allowed when status = "재고" |
| 반납 | Updated to return location | Cleared | Equipment returns to stock at specified location |

**Code Example:**
```typescript
// POST /api/inventory/[id]/checkout
const history = new InventoryHistory({
  change_type: '출고',
  checkout_location: data.checkoutLocation, // Logical dest (project name)
  // current_location NOT changed here
});

// POST /api/inventory/[id]/checkin
await queryRunner.manager.update(Inventory,
  { id },
  {
    current_location: data.returnLocation, // Physical location updated
    current_status: '재고'
  }
);
```

**Acceptance Criteria:**
- ✓ Checkout doesn't update current_location (stays at warehouse)
- ✓ Checkout captures checkout_location in history
- ✓ Checkin updates current_location to return location
- ✓ Relocation only updates current_location when status = "재고"

---

### Decision 3: Status Transition Rules (MEDIUM)

**Status:** RESOLVED ✓

**Decision:** **Option A — Restrictive State Machine (current spec is correct)**

**Selected:** Yes
**Phase:** 1
**Rationale:**
- Current PRD rules (Line 87-91) enforce business integrity
- Prevents equipment mismanagement
- Clear audit trail
- Enforces "return before deprecate" policy for checked-out items

**Valid State Transitions:**

```
[재고 (In Stock)]
├─→ [출고 (Checked Out)] ──→ [재고] (on checkin)
│                       └──→ [고장] (if broken while out)
├─→ [고장 (Broken)] ──→ [폐기] (one-way to deprecation)
└─→ [폐기 (Deprecated)] (FINAL — no further changes)

Key Rules:
1. Can only checkout from "재고" status
2. Cannot deprecate while "출고" (must return first)
3. "폐기" is final state (no transitions out)
4. "고장" can only go to "폐기" (no repair pathway in Phase 1)
```

**Invalid Transitions (Rejected by API):**
- 출고 → 폐기 (must return first)
- 출고 → 재고 (must use checkin endpoint, not status change)
- 폐기 → anything (final state)
- 고장 → 재고 (no repair pathway)

**Implementation Notes:**
- Add explicit validation in API handlers
- Example: Status change endpoint checks current_status before allowing transition
- Document all transitions in entity service class

**Code Example:**
```typescript
// lib/inventory-service.ts
const VALID_TRANSITIONS: Record<string, string[]> = {
  '재고': ['출고', '고장', '폐기'],
  '출고': ['고장'],  // Only broken while out
  '고장': ['폐기'],
  '폐기': []  // Final state
};

export function validateStatusTransition(from: string, to: string): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}
```

**Acceptance Criteria:**
- ✓ API rejects invalid transitions with 400 Bad Request
- ✓ State diagram documented in PRD Section 3
- ✓ All transitions validated server-side

---

### Decision 4: Department-Scoped Permissions for MANAGER (MEDIUM)

**Status:** PARTIALLY RESOLVED ✓

**Decision:** **Option B — Department-Scoped MANAGER (Phase 2)**

**Selected:** Yes
**Phase:** 1-2
**Phase 1 Approach:** Global scope (simple)
**Phase 2 Approach:** Add department_id FK
**Rationale:**
- Aligns with sunjin-erp established pattern (employees, tasks use dept scoping)
- Scales better as organization grows
- Clear accountability per department
- Phase 1 can use simpler global scope to unblock
- No schema breaking changes in Phase 2

**Phase 1 Implementation:**
- No department filtering for MANAGER
- MANAGER sees and manages all inventory
- Simpler initial implementation
- Acceptable for single-department or small organizations

**Phase 2 Implementation:**
- Add `department_id: FK → Department (nullable)` to Inventory
- Update API queries to filter by session.user.departmentId for MANAGER role
- Update UI to show only user's department inventory for MANAGER

**Code Example (Phase 1):**
```typescript
// POST /api/inventory
// No department filtering
const inventory = await repository.find({
  where: { deletedAt: IsNull() }
});
```

**Code Example (Phase 2):**
```typescript
// POST /api/inventory
let where = { deletedAt: IsNull() };
if (session.user.role === 'MANAGER') {
  where = { ...where, departmentId: session.user.departmentId };
}
const inventory = await repository.find({ where });
```

**Acceptance Criteria:**
- ✓ Phase 1: MANAGER sees all inventory (no department column needed)
- ✓ Phase 2: Add optional department_id column
- ✓ Phase 2: Implement department filtering for MANAGER
- ✓ Migration file prepared for Phase 2

---

### Decision 5: Partial Unique Index for Serial Number (HIGH)

**Status:** RESOLVED ✓

**Decision:** **Option D — Partial Unique Index + App Validation**

**Selected:** Yes
**Phase:** 1
**Rationale:**
- Oracle XE 21c fully supports partial indexes ✓
- Database-level enforcement prevents data corruption
- App-level validation provides UX-friendly error messages
- Defends against race conditions
- Best practice for multi-layer data integrity

**Primary Enforcement: Database Index**

```sql
CREATE UNIQUE INDEX idx_inventory_serial_active
ON inventory(serial_number) WHERE deleted_at IS NULL;
```

- Oracle raises ORA-00001 if duplicate inserted
- Efficient query performance (index seek)
- Prevents any application bypass

**Secondary Enforcement: Application Validation**

```typescript
export class CreateInventoryDto {
  @IsString()
  @MaxLength(100)
  @ValidateSerialUnique() // Custom validator
  serial_number: string;
}
```

- Checks before database insert
- Returns friendly error: "Serial number already exists"
- Reduces latency (app fails faster than DB roundtrip)

**Tertiary Enforcement: API Error Handling**

```typescript
try {
  await repository.save(inventory);
} catch (error) {
  if (error.code === 'ORA-00001') {
    return Response.json({
      error: {
        code: 'DUPLICATE_SERIAL',
        message: 'Serial number already exists'
      }
    }, { status: 400 });
  }
}
```

**Migration File:**

```typescript
// src/migrations/1706300000000-create-inventory-table.ts
await queryRunner.query(`
  CREATE UNIQUE INDEX idx_inventory_serial_active
  ON inventory(serial_number) WHERE deleted_at IS NULL
`);
```

**Acceptance Criteria:**
- ✓ Partial unique index created in migration
- ✓ Duplicate serial_number rejected with ORA-00001
- ✓ App validation returns 400 before DB constraint
- ✓ Soft-deleted records allow reuse of serial_number

---

### Decision 6: Soft Delete Strategy for InventoryHistory (HIGH)

**Status:** RESOLVED ✓

**Decision:** **Option A — No deleted_at Column for InventoryHistory**

**Selected:** Yes
**Phase:** 1
**Rationale:**
- InventoryHistory is an immutable audit trail
- Should never be soft-deleted under any circumstances
- Including a deleted_at column is misleading (implies it could be used)
- Simpler schema without unused column

**Design Policy:**

| Scenario | Behavior |
|----------|----------|
| Delete Inventory | Soft-delete inventory only; InventoryHistory remains |
| View Equipment Detail | Show all history even if inventory deleted |
| List All Equipment | Exclude deleted inventory; implicitly exclude their history |
| Audit Trail | InventoryHistory is permanent and immutable |

**Implementation:**

**InventoryHistory Entity:**
```typescript
@Entity('inventory_history')
export class InventoryHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Inventory)
  @JoinColumn({ name: 'inventory_id' })
  inventory: Inventory;

  @Column({ type: 'varchar2', length: 50 })
  change_type: string;

  // ... other fields

  // NO deleted_at column
  // NO @DeleteDateColumn()

  @CreateDateColumn()
  created_at: Date;
}
```

**Query Patterns:**

```typescript
// Get history even if inventory deleted
const history = await historyRepository.find({
  where: { inventoryId: id },
  order: { createdAt: 'ASC' }
});

// List only includes history from non-deleted inventory
const activeHistory = await historyRepository
  .createQueryBuilder('h')
  .innerJoin('h.inventory', 'i', 'i.deleted_at IS NULL')
  .getMany();
```

**Acceptance Criteria:**
- ✓ InventoryHistory has no deleted_at column
- ✓ InventoryHistory cannot be soft-deleted
- ✓ History queries include records from deleted equipment (for detail page)
- ✓ List queries filter history by parent inventory's deleted_at

---

### Decision 7: Cache Invalidation Strategy (HIGH)

**Status:** RESOLVED ✓

**Decision:** **Option B — Granular Invalidation**

**Selected:** Yes
**Phase:** 1
**Rationale:**
- Balances efficiency with correctness
- Prevents stale data bugs
- Maintains good UX without excessive refetches
- Granular control enables future optimization

**Invalidation Map:**

| Operation | Invalidate inventory-list | Invalidate inventory-detail | Invalidate inventory-stats | Rationale |
|-----------|---------------------------|----------------------------|--------------------------|-----------|
| Create | ✓ Yes | — | ✓ Yes | New item affects list count and stats |
| Update | ✓ Yes | ✓ Yes | Depends | Item modified; detail changed |
| Checkout | ✓ Yes | ✓ Yes | ✓ Yes | Status changed; affects all |
| Checkin | ✓ Yes | ✓ Yes | ✓ Yes | Status changed; affects all |
| Relocate | ✓ Yes | ✓ Yes | ✗ No | Location changed but status same; stats unchanged |
| Status Change | ✓ Yes | ✓ Yes | ✓ Yes | Status affected; stats affected |
| Delete (soft) | ✓ Yes | ✗ No | ✓ Yes | Item hidden from list; stats changed |

**Implementation Pattern:**

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
    createMutation: useMutation(createInventory, {
      onSuccess: () => {
        invalidateListAndStats();
      }
    }),

    checkoutMutation: useMutation(checkoutInventory, {
      onSuccess: (data) => {
        invalidateDetail(data.id);
        invalidateListAndStats();
      }
    }),

    relocateMutation: useMutation(relocateInventory, {
      onSuccess: (data) => {
        invalidateDetail(data.id);
        queryClient.invalidateQueries(['inventory-list']); // Location changed
        // NO stats invalidation (status same)
      }
    })
  };
}
```

**Acceptance Criteria:**
- ✓ Each mutation invalidates appropriate queries
- ✓ No stale data visible after operation
- ✓ Minimal refetches (only affected queries)
- ✓ Detail pages refetch when item modified

---

### Decision 8: Approval Workflow for Deprecation (MEDIUM)

**Status:** DEFERRED (Phase 2) ✓

**Decision:** **Option A (Phase 1) + C (Phase 2)**

**Selected:** Yes
**Phase 1:** No approval required
**Phase 2:** Threshold-based approval
**Rationale:**
- Phase 1 prioritizes core CRUD without workflow infrastructure
- Immutable audit trail (InventoryHistory) provides accountability
- Manual review possible (ADMIN can audit history)
- Phase 2 can add threshold-based approval (e.g., >$5000 requires approval)

**Phase 1 Implementation:**
- MANAGER can deprecate equipment immediately
- Change logged in InventoryHistory with reason field
- ADMIN can review audit trail if needed
- Document: "Equipment deprecation is logged in audit trail for review"

**Phase 2 Enhancement:**
- Add optional `purchase_price` field to Inventory
- Define deprecation threshold (e.g., $5000)
- Deprecation of expensive items creates pending approval request
- ADMIN/Finance role must approve before status changes

**Code Example (Phase 1):**
```typescript
// POST /api/inventory/[id]/status
// Immediately change status; no approval needed
await queryRunner.manager.update(Inventory,
  { id },
  { current_status: '폐기' }
);

// Log in history
const history = new InventoryHistory({
  change_type: '상태변경',
  new_status: '폐기',
  reason: data.reason,
  changed_by_id: session.user.id
});
```

**Acceptance Criteria (Phase 1):**
- ✓ MANAGER can change status immediately
- ✓ Reason is captured in InventoryHistory
- ✓ No approval workflow infrastructure needed
- ✓ Audit trail available for review

---

### Decision 9: Search Performance (Prefix vs Substring) (MEDIUM)

**Status:** DEFERRED (Phase 2 for full-text) ✓

**Decision:** **Option D — Prefix Phase 1, Full-Text Phase 2**

**Selected:** Yes
**Phase 1:** Prefix-based search
**Phase 2:** Full-text search
**Rationale:**
- Phase 1 gets working search quickly (prefix is fast and index-friendly)
- Most users find equipment with prefix (serial numbers typically start with prefix)
- Phase 2 can add full-text index without breaking Phase 1
- Balances performance and flexibility

**Phase 1 Implementation (Prefix):**

```typescript
// API: prefix-based search
export async function GET(req: Request) {
  const { search } = req.query;

  if (search) {
    const searchTerm = String(search).trim();
    const query = repository
      .createQueryBuilder('i')
      .where('i.serial_number LIKE :search OR i.model LIKE :search', {
        search: `${searchTerm}%`  // Prefix only (fast)
      });
  }
}
```

**Query Performance (Phase 1):**
- Query: `LIKE 'SN1%'` uses index
- Full table scan: No
- Expected latency: <50ms for 10k records

**Phase 2 Enhancement (Full-Text):**

```typescript
// Phase 2: Add full-text index
// CREATE INDEX idx_inventory_serial_fulltext ON inventory(serial_number)
// INDEXTYPE IS CTXSYS.CONTEXT;

// Use CONTAINS operator for substring search
const query = repository.query(`
  SELECT * FROM inventory
  WHERE CONTAINS(serial_number, '${searchTerm}', 1) > 0
  OR CONTAINS(model, '${searchTerm}', 1) > 0
`);
```

**UI Guidance (Phase 1):**
- Help text: "Search finds equipment by serial number or model starting with your text"
- Example: "Type 'SN1' to find 'SN123', 'SN124'"

**Acceptance Criteria (Phase 1):**
- ✓ Prefix search works (LIKE 'term%')
- ✓ Search uses index (fast)
- ✓ UI explains prefix search
- ✓ Search response < 200ms

---

### Decision 10: Overdue Equipment Tracking (MEDIUM)

**Status:** PARTIALLY RESOLVED ✓

**Decision:** **Option B — Computed is_overdue Field**

**Selected:** Yes
**Phase 1:** Compute in detail view
**Phase 2:** Add list highlighting + alerts
**Rationale:**
- Phase 1 can show overdue status without extra infrastructure
- Computed field has minimal overhead
- Phase 2 can enhance with highlighting and notifications
- Provides value incrementally

**Phase 1 Implementation (Detail View):**

```typescript
// GET /api/inventory/[id]
const inventory = await repository.findOne({ where: { id } });

// Compute is_overdue
const isOverdue = inventory.expectedCheckinDate < new Date()
  && inventory.currentStatus === '출고';

return Response.json({
  ...inventory,
  is_overdue: isOverdue,
  days_overdue: isOverdue
    ? Math.floor((new Date().getTime() - inventory.expectedCheckinDate.getTime()) / (1000 * 60 * 60 * 24))
    : 0
});
```

**UI Display (Phase 1):**
```typescript
// components/features/inventory/InventoryDetailView.tsx
{inventory.is_overdue && (
  <Alert variant="warning">
    Equipment is overdue! Expected return: {inventory.expectedCheckinDate.toLocaleDateString()}
    ({inventory.days_overdue} days overdue)
  </Alert>
)}
```

**Phase 2 Implementation (List View + Alerts):**

```typescript
// GET /api/inventory
const [data, total] = await repository
  .createQueryBuilder('i')
  .select([
    'i.*',
    `CASE WHEN i.expected_checkin_date < SYSDATE AND i.current_status = '출고'
     THEN 1 ELSE 0 END as is_overdue`,
    `EXTRACT(DAY FROM SYSDATE - i.expected_checkin_date) as days_overdue`
  ])
  .getMany();
```

**UI Display (Phase 2):**
```typescript
// Highlight overdue rows in table
<TableRow className={item.is_overdue ? 'bg-red-50' : ''}>
  {/* ... cells ... */}
  {item.is_overdue && <Badge variant="destructive">OVERDUE {item.days_overdue}d</Badge>}
</TableRow>
```

**Acceptance Criteria (Phase 1):**
- ✓ is_overdue computed in detail API
- ✓ Days overdue calculated
- ✓ Detail view shows overdue alert
- ✓ expected_checkin_date stored in InventoryHistory

---

### Decision 11: Equipment Owner Attribution (LOW)

**Status:** DEFERRED (Phase 2) ✓

**Decision:** **Option B — Optional assigned_to_id (Phase 2)**

**Selected:** Yes
**Phase:** 2
**Rationale:**
- Phase 1 focuses on inventory tracking (not asset ownership)
- Optional field doesn't break Phase 1
- Phase 2 can add owner tracking when needed
- Enables future accountability workflows

**Phase 1:** No assigned_to_id field

**Phase 2 Implementation:**

```typescript
@Entity('inventory')
export class Inventory {
  @ManyToOne(() => Employee, { nullable: true })
  @JoinColumn({ name: 'assigned_to_id' })
  assignedTo?: Employee;

  @Column({ nullable: true })
  assigned_to_id?: number;
}
```

**Migration (Phase 2):**
```typescript
await queryRunner.addColumn('inventory', new TableColumn({
  name: 'assigned_to_id',
  type: 'number',
  isNullable: true
}));
```

**Phase 2 Workflow (Optional Enhancement):**
```typescript
// On checkin, optionally assign equipment to user returning
const inventory = await repository.findOne(id);
if (data.trackOwnership) {
  inventory.assignedToId = session.user.id; // Optional
  await repository.save(inventory);
}
```

**Use Cases (Phase 2+):**
- Filter "my equipment" (USER can see their assigned items)
- Track accountability (who is responsible for equipment)
- Equipment lookup by owner
- Overdue alerts sent to equipment owner

**Acceptance Criteria (Phase 2):**
- ✓ Optional assigned_to_id column added
- ✓ Users can see their assigned equipment
- ✓ Equipment can be reassigned
- ✓ No impact on Phase 1 core functionality

---

## Implementation Checklist for Phase 1

**Before Implementation Begins:**

- [ ] User Story 8: Update to "MANAGER / ADMIN" (change line 96)
- [ ] Section 5.3: Add partial unique index specification
- [ ] Section 5.3: Add InventoryHistory immutability note (no deleted_at)
- [ ] Section 5.4: Add cache invalidation map
- [ ] Section 3: Add state transition diagram
- [ ] Section 5.1: Clarify Server Component fetches auth only, TanStack Query fetches data
- [ ] Section 5.2: Add detailed API query parameter spec
- [ ] Section 5.2: Add statistics response format
- [ ] Section 8: Add input validation rules (fields, constraints)
- [ ] Migration file: Include partial unique index
- [ ] Migration file: Include all recommended indexes (status, category, location)

**During Implementation:**

- [ ] Implement all 7 HIGH-priority decisions
- [ ] Test soft delete (verify deleted records excluded from list, included in detail)
- [ ] Test serial number uniqueness (verify app validation + DB constraint)
- [ ] Test state transitions (verify restrictive model enforced)
- [ ] Test cache invalidation (verify no stale data)
- [ ] Test authorization (verify USER cannot perform write operations)

**Acceptance Testing:**

- [ ] USER can only view inventory (no write buttons visible)
- [ ] Duplicate serial number rejected before DB constraint
- [ ] Serial number can be reused after soft delete
- [ ] Equipment cannot be checked out if already checked out
- [ ] Equipment cannot be depreciated while checked out
- [ ] All history records preserved (including from deleted equipment)
- [ ] List performance: <500ms for 10k records (p95)
- [ ] Prefix search works: <50ms for 10k records

---

## Phase 2 Enhancements (Deferred)

The following features are explicitly deferred to Phase 2 and do NOT block Phase 1:

1. **Department-Scoped Permissions** — Add department_id FK to Inventory
2. **Approval Workflow** — Threshold-based approval for expensive deprecations
3. **Full-Text Search** — Enhance prefix search with substring capability
4. **Overdue Alerts** — Email/notification for overdue equipment
5. **Equipment Owner** — Track assigned_to_id for accountability
6. **Bulk Operations** — Batch status change, relocate, delete
7. **Advanced Analytics** — Equipment aging, depreciation tracking

These can be implemented without schema-breaking changes.

---

## Conclusion

All **11 discussion topics** are resolved. **4 HIGH-priority blockers** (USER role, serial uniqueness, history deletion, cache invalidation) are now clarified and ready for implementation. The PRD is ready for Phase 1 development with no ambiguities.

**Next Step:** PRD v2 incorporates all decisions and is ready for implementation phase.

