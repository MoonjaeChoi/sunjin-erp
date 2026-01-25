<!-- Generated: 2026-01-25 23:30:00 KST -->

# Mediation Decisions: 유지보수 고객 관리 (2061 PRD)

**Mediation Date:** 2026-01-25
**Mediator:** Claude Code (AI-Assisted Decision Making)
**Status:** Final Decisions Ready for Implementation

---

## Executive Summary

This document provides final, binding decisions on all 10 discussion topics from the PRD review and rebuttal process. Decisions prioritize:

1. **Phase 1 Completeness**: Features must be deliverable within Phase 1 scope
2. **Simplicity**: Start simple, enhance in Phase 2
3. **sunjin-erp Best Practices**: Align with CLAUDE.md and existing module patterns
4. **Security & Data Integrity**: Non-negotiable requirements
5. **User Experience**: Practical usability for small teams

**Decision Outcome Summary:**
- **10 Topics Discussed** → **10 Final Decisions Made**
- **7 Topics: Proceed as Recommended** → Accepted design recommendations
- **2 Topics: Compromise Decision** → Balancing trade-offs
- **1 Topic: Phase 1 Focus** → Defer enhancement to Phase 2

---

## Decision Matrix

| Topic | Decision | Priority | Phase | Effort | Reasoning |
|-------|----------|----------|-------|--------|-----------|
| 1. Status Transitions | Manual Only (User-Initiated) | HIGH | 1 | Low | Simple, flexible, feedback-driven |
| 2. MANAGER Authorization | Open Access (All MANAGERs) | HIGH | 1 | Low | Small team assumption, add audit logs |
| 3. Renewal Workflow | Simple Update + History | HIGH | 1 | Low | Manual renewal, extend end_date |
| 4. Pagination (Nested) | Explicit Pagination | HIGH | 1 | Medium | 10 attachments, 20 history per page |
| 5. File Versioning | Append-Only | MEDIUM | 1 | Low | 5-file limit prevents explosion |
| 6. Soft Delete Cascading | Cascade Soft-Delete | HIGH | 1 | Medium | Clean hierarchy deletion, audit trail |
| 7. Index Strategy | Selective + Composite | HIGH | 1 | Low | Performance + soft-delete compliance |
| 8. Filter State | URL Query Parameters | MEDIUM | 1 | Medium | Per CLAUDE.md, shareable URLs |
| 9. Pagination Max | 50 Items (not 100) | MEDIUM | 1 | Low | Conservative for performance |
| 10. Authorization | Defense in Depth | MEDIUM | 1 | Medium | API + UI, best practice |

---

## Detailed Decisions

### Decision 1: Status Transitions (Manual Only)

**Topic:** Should contract status transitions be automatic (system-triggered) or manual (MANAGER-initiated)?

**Decision: MANUAL TRANSITIONS ONLY (Phase 1)**

**Rationale:**
- Simplest implementation (no background job needed)
- Flexibility for edge cases (delayed renewal, early cancellation, contract amendments)
- MANAGER controls workflow pace
- Phase 2 can add automatic triggers based on real-world usage patterns
- Aligns with small-team, collaborative operational model

**Implementation Details:**

```typescript
// Status transitions initiated by MANAGER via UI form
// All transitions are manual, no auto-triggers

// Valid state transitions:
// ACTIVE → RENEWAL_PENDING (MANAGER sets when ready to renew)
// ACTIVE → COMPLETED (MANAGER closes when contract ends)
// RENEWAL_PENDING → ACTIVE (MANAGER confirms renewal)
// RENEWAL_PENDING → COMPLETED (MANAGER closes if not renewed)
// COMPLETED → ACTIVE (MANAGER re-contracts)
```

**PRD Update Required:**
- Section 7 (User Story 7): Add explicit statement: "All status changes are MANAGER-initiated through UI form. System does NOT automatically trigger state transitions."

**Phase 2 Enhancement:**
- Automatic "RENEWAL_PENDING" trigger at 3-month boundary (background job)
- Automatic "COMPLETED" transition on end_date if not renewed
- Configuration: Enable/disable auto-transitions per contract

---

### Decision 2: MANAGER Authorization Scope (Open Access)

**Topic:** Should all MANAGERs be able to modify contracts assigned to other MANAGERs, or should access be scoped?

**Decision: OPEN ACCESS FOR ALL MANAGERs (Phase 1)**

**Rationale:**
- Designed for small teams (< 20 employees)
- Collaborative workflow: Any MANAGER can help with any contract
- Reduces complexity: No row-level access control needed
- Audit trail (created_by_id, updated_by_id) tracks who changed what
- Phase 2 can add department-scoped access if team grows

**Implementation Details:**

```typescript
// Phase 1 RBAC:
// USER: GET only (list, detail view - read-only)
// MANAGER: GET/POST/PUT (create, modify, state change)
// ADMIN: GET/POST/PUT/DELETE (all operations including delete)

// No owner check in Phase 1:
// MANAGER can modify any contract (no session.user.id == contract.assigned_employee_id check)

// Audit tracking:
// created_by_id: Who created the contract
// updated_by_id: Who last modified the contract
// History entries track: changed_by_id for every state change
```

**API Enforcement:**

```typescript
// Example: PUT /api/maintenance/[id]
export async function PUT(req, { params }) {
  const session = await getServerSession();

  // Check role: MANAGER+ only
  if (!session?.user || !['MANAGER', 'ADMIN'].includes(session.user.role)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Phase 1: No additional ownership check
  // All MANAGERs can modify any contract

  const contract = await updateContract(params.id, req.body);
  return Response.json(contract);
}
```

**Phase 2 Enhancement:**
- Add department-scoped access control
- Department validation: `contract.department_id == session.user.department_id`
- Department Manager oversight: Can override team member decisions
- Detailed audit trail: Department, manager, timestamp for every action

---

### Decision 3: Renewal Workflow (Simple Update)

**Topic:** How should contract renewal be implemented - manual update or automatic creation?

**Decision: SIMPLE RENEWAL (Update End_Date + Create History) - Phase 1**

**Rationale:**
- Simplest implementation (one UPDATE statement + one history record)
- Satisfies "갱신 이력 추적" requirement (renewal history tracking)
- Renewal = MANAGER extends contract period manually
- Clear history of all renewal changes
- Phase 2 can add full contract renewal workflow with cloning

**Implementation Details:**

```typescript
// Renewal Workflow (Phase 1):
// 1. MANAGER views contract detail page
// 2. Clicks "Renew Contract" button
// 3. Form shows: Current end_date, New end_date, Renewal reason
// 4. MANAGER enters new end_date (must be > current end_date)
// 5. Click "Save"
// 6. System performs:
//    a) UPDATE MaintenanceContract SET end_date = new_date, updated_at = NOW()
//    b) INSERT MaintenanceContractHistory WITH change_type='갱신', previous_end_date=old, new_end_date=new
//    c) Optionally: Set status to ACTIVE (if was RENEWAL_PENDING)

// NO new contract record created in Phase 1
// NO contract linking (previous_contract_id = NULL)
// Renewal tracked purely through history

// Example History Record:
{
  change_type: '갱신',
  previous_end_date: 2026-12-31,
  new_end_date: 2027-12-31,
  reason: 'Renewal approved by customer',
  changed_by_id: 5,
  changed_at: 2026-10-15 14:30:00
}
```

**API Endpoint:**

```typescript
// POST /api/maintenance/[id]/renew (alternative to status change)
// Or: Handle renewal via PUT /api/maintenance/[id] with updated end_date

// Recommended: Use PUT to update end_date directly
// History creation is automatic on any date change

export async function PUT(req, { params }) {
  const { end_date, reason } = req.body;

  // Validate: new end_date > current end_date
  const contract = await getContract(params.id);
  if (new Date(end_date) <= contract.end_date) {
    return Response.json(
      { error: 'New end_date must be after current end_date' },
      { status: 400 }
    );
  }

  // Update contract
  const updated = await updateContract(params.id, { end_date });

  // Create history
  await createHistory({
    maintenance_contract_id: params.id,
    change_type: '갱신',
    previous_end_date: contract.end_date,
    new_end_date: end_date,
    reason,
    changed_by_id: session.user.id
  });

  return Response.json(updated);
}
```

**Phase 2 Enhancement:**
- Full renewal workflow: `POST /api/maintenance/[id]/renew`
- Contract cloning: Create new contract with previous_contract_id
- Renewal terms: Rate adjustments, scope changes
- Automatic renewal scheduling

---

### Decision 4: Pagination for Nested Resources

**Topic:** Should attachments and history have pagination? If so, what limits?

**Decision: EXPLICIT PAGINATION WITH LIMITS - Phase 1**

**Rationale:**
- Design for scale from day one (even if starting small)
- Consistent with list endpoint pagination (20-50 items)
- Supports future growth: Easy to increase limits
- API consistency: Same pagination pattern across all endpoints

**Implementation Details:**

**Attachment Pagination:**
```typescript
// Limit: 10 items per page
// Max file count: 5 per contract (PRD spec)
// But allow for future growth

// GET /api/maintenance/[id]/attachments?page=1&limit=10
Response 200:
{
  data: [
    {
      id: 1,
      file_name: "contract-2026.pdf",
      file_size: 500000,
      uploaded_by: { id: 1, name: "Kim" },
      created_at: "2026-01-15T10:30:00Z"
    },
    // ... up to 10 items
  ],
  pagination: {
    page: 1,
    limit: 10,
    total: 5,
    hasMore: false
  }
}
```

**History Pagination:**
```typescript
// Limit: 20 items per page
// Expected: 1-3 records per contract initially
// Allows growth to 60+ records over contract lifetime

// GET /api/maintenance/[id]/history?page=1&limit=20
Response 200:
{
  data: [
    {
      id: 1,
      change_type: '갱신',
      previous_end_date: "2026-12-31",
      new_end_date: "2027-12-31",
      reason: "Renewal approved",
      changed_by: { id: 1, name: "Kim" },
      changed_at: "2026-10-15T14:30:00Z"
    },
    // ... up to 20 items
  ],
  pagination: {
    page: 1,
    limit: 20,
    total: 3,
    hasMore: false
  }
}
```

**Detail View Response:**
```typescript
// GET /api/maintenance/[id]
// Returns full contract WITH:
// - Attachments: First 10 (paginated)
// - History: First 20 (paginated)
// - Links to get more (if hasMore: true)

Response 200:
{
  contract: { /* full contract data */ },
  attachments: {
    data: [ /* first 10 */ ],
    pagination: { page: 1, limit: 10, total: 5, hasMore: false }
  },
  history: {
    data: [ /* first 20 */ ],
    pagination: { page: 1, limit: 20, total: 3, hasMore: false }
  }
}
```

**UI Implementation:**
- Detail page shows first page of attachments/history
- "Load More" button if hasMore: true
- Dedicated history page (optional) with full pagination

**Phase 2 Enhancement:**
- Dedicated attachments browser with filters
- Attachment versioning (if needed)
- History search and filtering

---

### Decision 5: File Upload Versioning (Append-Only)

**Topic:** When same file is uploaded twice, should it replace or allow duplicates?

**Decision: APPEND-ONLY (Allow Duplicates) - Phase 1**

**Rationale:**
- Simplest implementation (no version tracking logic)
- 5-file limit prevents duplication explosion
- Audit trail preserved (timestamp shows when each uploaded)
- MANAGER can delete old version manually
- Phase 2 can add explicit versioning if business requires

**Implementation Details:**

```typescript
// File upload: Each upload is new entry
// Same filename uploaded twice = two separate records

// Example:
// Upload 1: contract-2026.pdf (UUID: a1b2c3d4)
// Upload 2: contract-2026.pdf (UUID: e5f6g7h8)
// Both stored, both listed separately

// File system:
// /uploads/maintenance/a1b2c3d4-contract-2026.pdf
// /uploads/maintenance/e5f6g7h8-contract-2026.pdf

// UI shows:
// contract-2026.pdf (uploaded 2026-01-10 by Kim)
// contract-2026.pdf (uploaded 2026-01-15 by Lee)  ← Different upload
```

**Validation Rules:**
```typescript
// POST /api/maintenance/[id]/attachments
// Validation:
// 1. File type: PDF, DOCX, DOC only
// 2. File size: 10MB max
// 3. Count: Max 5 files per contract
// 4. Name: Allow same name (no uniqueness constraint)

export async function POST(req, { params }) {
  const file = req.file;
  const { id } = params;

  // Get current attachment count
  const count = await countAttachments(id);
  if (count >= 5) {
    return Response.json(
      { error: 'Maximum 5 files per contract' },
      { status: 400 }
    );
  }

  // Validation
  if (!isValidMimeType(file.mimetype)) {
    return Response.json({ error: 'Invalid file type' }, { status: 400 });
  }
  if (file.size > 10 * 1024 * 1024) {
    return Response.json({ error: 'File too large (10MB max)' }, { status: 400 });
  }

  // Save file with UUID prefix (handles duplicates)
  const uuid = uuidv4();
  const safeFileName = `${uuid}-${sanitizeFilename(file.originalname)}`;
  const filePath = path.join('/uploads/maintenance', safeFileName);

  await fs.promises.writeFile(filePath, file.buffer);

  // Save metadata (duplicate names allowed)
  const attachment = await createAttachment({
    maintenance_contract_id: id,
    file_name: file.originalname,  // Original name shown to user
    file_path: safeFileName,        // UUID name on disk
    file_size: file.size,
    uploaded_by_id: session.user.id
  });

  return Response.json(attachment);
}
```

**User Interface:**
```typescript
// File list shows:
// □ contract-2026.pdf (500KB) - 2026-01-10 by Kim [Download] [Delete]
// □ contract-2026.pdf (600KB) - 2026-01-15 by Lee [Download] [Delete]

// User can see both, delete either one independently
// MANAGER responsible for managing duplicates via delete
```

**Phase 2 Enhancement:**
- Explicit versioning: UI shows "contract-2026.pdf v1, v2"
- Version history: Can restore old versions
- Version comparison: See what changed between versions
- Automatic deduplication: Warn if uploading same content

---

### Decision 6: Soft Delete Cascading

**Topic:** When contract is deleted, should related attachments/history also be soft-deleted?

**Decision: CASCADE SOFT-DELETE - Phase 1**

**Rationale:**
- Clean data model: Contract hierarchy deleted together
- Logical integrity: No orphaned attachments
- Audit trail: deleted_at timestamps show deletion hierarchy
- Simpler to reason about: "Deleted contract = all its data deleted"
- CLAUDE.md compliance: All cascades via soft-delete, not physical deletes

**Implementation Details:**

```typescript
// When contract is soft-deleted:
// 1. All MaintenanceContractAttachment records: deleted_at = NOW()
// 2. All MaintenanceContractHistory records: deleted_at = NOW()
// 3. Contract record: deleted_at = NOW()
// Single transaction: All succeed or all fail (no partial deletes)

export async function DELETE(req, { params }) {
  const session = await getServerSession();

  // Authorization
  if (!session?.user || session.user.role !== 'ADMIN') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const contractId = params.id;
  const now = new Date();

  try {
    await db.transaction(async (trx) => {
      // 1. Soft-delete all attachments
      await trx('maintenance_contract_attachment')
        .where({ maintenance_contract_id: contractId, deleted_at: null })
        .update({ deleted_at: now });

      // 2. Soft-delete all history
      await trx('maintenance_contract_history')
        .where({ maintenance_contract_id: contractId, deleted_at: null })
        .update({ deleted_at: now });

      // 3. Soft-delete contract
      await trx('maintenance_contract')
        .where({ id: contractId })
        .update({ deleted_at: now });
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json(
      { error: 'Failed to delete contract' },
      { status: 500 }
    );
  }
}
```

**UI/UX:**
```typescript
// Delete confirmation dialog:
// "Deleting this contract will also delete:
//  - 3 attachments
//  - 5 history records
// This action cannot be undone."

// After deletion:
// - Contract no longer appears in list
// - Attachments no longer downloadable
// - History no longer visible
// - But all data preserved in database (for recovery if needed)
```

**Database Queries (Automatic Filtering):**
```sql
-- All queries must filter soft-deleted:
SELECT * FROM MaintenanceContract WHERE deleted_at IS NULL;
SELECT * FROM MaintenanceContractAttachment WHERE deleted_at IS NULL;
SELECT * FROM MaintenanceContractHistory WHERE deleted_at IS NULL;

-- Repository pattern ensures this automatically
-- (see Decision 9: Repository Pattern Enforcement)
```

**Phase 2 Enhancement:**
- Soft-delete recovery: "Restore deleted contract" (admin only)
- Cascade show: Display what will be deleted before confirmation
- Bulk soft-delete: Delete multiple contracts in one action

---

### Decision 7: Index Strategy (Selective + Composite)

**Topic:** What indices should be created for optimal query performance?

**Decision: SELECTIVE + COMPOSITE INDICES - Phase 1**

**Rationale:**
- Selective indices: Include deleted_at condition (exclude soft-deleted records)
- Composite indices: Cover common filter + sort combinations
- Oracle-optimized: Uses WHERE clause for partial indices
- Performance target: p95 < 200ms for all queries

**Specific Indices to Create:**

```sql
-- Selective Indices (filter + soft-delete check)
CREATE INDEX idx_mc_customer_active
  ON MaintenanceContract(customer_id)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_mc_employee_active
  ON MaintenanceContract(assigned_employee_id)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_mc_status_active
  ON MaintenanceContract(contract_status)
  WHERE deleted_at IS NULL;

-- Composite Indices (common query patterns)
CREATE INDEX idx_mc_status_enddate_active
  ON MaintenanceContract(contract_status, end_date DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_mc_customer_enddate_active
  ON MaintenanceContract(customer_id, end_date DESC)
  WHERE deleted_at IS NULL;

-- Sort Index (default sort order)
CREATE INDEX idx_mc_enddate_active
  ON MaintenanceContract(end_date DESC)
  WHERE deleted_at IS NULL;
```

**Migration Implementation:**
```typescript
// src/migrations/1706300000000-create-maintenance-contract-table.ts

export class CreateMaintenanceContractTable1706300000000
  implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(/* ... table definition ... */);

    // Create indices
    await queryRunner.query(
      `CREATE INDEX idx_mc_customer_active ON maintenance_contract(customer_id) WHERE deleted_at IS NULL`
    );
    await queryRunner.query(
      `CREATE INDEX idx_mc_employee_active ON maintenance_contract(assigned_employee_id) WHERE deleted_at IS NULL`
    );
    await queryRunner.query(
      `CREATE INDEX idx_mc_status_active ON maintenance_contract(contract_status) WHERE deleted_at IS NULL`
    );
    await queryRunner.query(
      `CREATE INDEX idx_mc_status_enddate_active ON maintenance_contract(contract_status, end_date DESC) WHERE deleted_at IS NULL`
    );
    await queryRunner.query(
      `CREATE INDEX idx_mc_customer_enddate_active ON maintenance_contract(customer_id, end_date DESC) WHERE deleted_at IS NULL`
    );
    await queryRunner.query(
      `CREATE INDEX idx_mc_enddate_active ON maintenance_contract(end_date DESC) WHERE deleted_at IS NULL`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('maintenance_contract', 'idx_mc_customer_active');
    await queryRunner.dropIndex('maintenance_contract', 'idx_mc_employee_active');
    await queryRunner.dropIndex('maintenance_contract', 'idx_mc_status_active');
    await queryRunner.dropIndex('maintenance_contract', 'idx_mc_status_enddate_active');
    await queryRunner.dropIndex('maintenance_contract', 'idx_mc_customer_enddate_active');
    await queryRunner.dropIndex('maintenance_contract', 'idx_mc_enddate_active');
    // Drop table...
  }
}
```

**Query Pattern (Using Indices):**
```typescript
// These queries will use the indices:

// Filter by customer (uses idx_mc_customer_enddate_active)
SELECT * FROM MaintenanceContract
WHERE deleted_at IS NULL AND customer_id = 5
ORDER BY end_date DESC LIMIT 20;

// Filter by status (uses idx_mc_status_enddate_active)
SELECT * FROM MaintenanceContract
WHERE deleted_at IS NULL AND contract_status = 'ACTIVE'
ORDER BY end_date DESC LIMIT 20;

// Sort by expiration (uses idx_mc_enddate_active)
SELECT * FROM MaintenanceContract
WHERE deleted_at IS NULL
ORDER BY end_date DESC LIMIT 20;
```

**Phase 2 Enhancement:**
- Query monitoring: Track slow queries
- Add indices for additional common filters
- Partitioning by status (if table grows very large)

---

### Decision 8: Filter State Management (URL Query Parameters)

**Topic:** Should filter state be stored in URL query parameters or Zustand store?

**Decision: URL QUERY PARAMETERS (Per CLAUDE.md) - Phase 1**

**Rationale:**
- CLAUDE.md philosophy: TanStack Query + URL params for server state
- Best UX: Shareable, bookmarkable URLs
- Browser integration: Back button works correctly
- TanStack Query native support: Built-in parameter handling
- Scalable: Same pattern as other modules

**Implementation Pattern:**

```typescript
// Component: Uses URL params as source of truth
'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useMaintenanceContractList } from '@/hooks';

export function MaintenanceListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Extract filters from URL
  const status = searchParams.get('status');
  const employeeId = searchParams.get('assignedEmployeeId');
  const customerId = searchParams.get('customerId');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');

  // TanStack Query uses URL params as cache key
  const { data, isLoading } = useMaintenanceContractList({
    status,
    assignedEmployeeId: employeeId,
    customerId,
    page,
    limit
  });

  // Update URL when filters change
  const handleFilterChange = (newFilters) => {
    const params = new URLSearchParams();
    if (newFilters.status) params.set('status', newFilters.status);
    if (newFilters.employeeId) params.set('assignedEmployeeId', newFilters.employeeId);
    if (newFilters.customerId) params.set('customerId', newFilters.customerId);
    params.set('page', '1');
    params.set('limit', newFilters.limit || '20');

    router.push(`?${params.toString()}`);
  };

  const handlePageChange = (newPage) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    router.push(`?${params.toString()}`);
  };

  return (
    <>
      <FilterPanel
        status={status}
        onFilterChange={handleFilterChange}
      />
      <ContractTable
        data={data}
        page={page}
        onPageChange={handlePageChange}
      />
    </>
  );
}
```

**URL Format Examples:**
```
// List with no filters
/maintenance

// Filter by status
/maintenance?status=ACTIVE

// Filter by status and employee, page 2
/maintenance?status=ACTIVE&assignedEmployeeId=5&page=2

// Date range filter
/maintenance?endDateFrom=2026-01-01&endDateTo=2026-12-31&sort=endDate:desc&page=1&limit=50
```

**Query Parameter Specification:**

| Parameter | Type | Example | Description |
|-----------|------|---------|-------------|
| status | string | ACTIVE,RENEWAL_PENDING | Comma-separated status values |
| assignedEmployeeId | number | 5 | Single employee ID |
| customerId | number | 10 | Single customer ID |
| contractNameSearch | string | ABC Corp | Partial match, case-insensitive |
| startDateFrom | string | 2026-01-01 | ISO8601 date format |
| startDateTo | string | 2026-12-31 | ISO8601 date format |
| endDateFrom | string | 2026-01-01 | ISO8601 date format |
| endDateTo | string | 2026-12-31 | ISO8601 date format |
| sort | string | endDate:desc | Field:direction (asc/desc) |
| page | number | 1 | 1-based page number |
| limit | number | 20 | Items per page (20-50) |

**TanStack Query Hook:**

```typescript
// hooks/useMaintenanceContractList.ts

export function useMaintenanceContractList(filters) {
  return useQuery({
    queryKey: ['maintenance', 'list', filters],  // Cache key includes all filters
    queryFn: () => fetchContractList(filters),
    staleTime: 5 * 60 * 1000,      // 5 minutes
    gcTime: 30 * 60 * 1000,        // 30 minutes
    enabled: true                    // Always enabled (no skip)
  });
}
```

**Phase 2 Enhancement:**
- URL shortening: Save filter presets
- Filter templates: "My Top Customers", "Expiring Soon"
- Advanced search: Complex filter UI with date pickers

---

### Decision 9: Pagination Maximum (50 Items)

**Topic:** Should max page size be 100 (current PRD) or 50 (recommended)?

**Decision: MAX 50 ITEMS PER PAGE - Phase 1**

**Rationale:**
- Conservative for network performance: 50 × 2KB = 100KB (safe)
- Browser rendering: 50 rows faster than 100
- Slow network friendly: Works on 3G connections
- Reasonable UX: Most users don't need 100+ items per page
- Phase 2: Can increase to 100 if monitoring shows it's safe

**Implementation Details:**

```typescript
// GET /api/maintenance?page=1&limit=50
// Valid limit values: 1-50
// Default: 20
// If user requests > 50: Server caps to 50

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  let limit = parseInt(searchParams.get('limit') || '20');
  const page = parseInt(searchParams.get('page') || '1');

  // Validate limit
  if (limit < 1) limit = 1;
  if (limit > 50) limit = 50;  // Cap at 50

  const skip = (page - 1) * limit;

  const [contracts, total] = await Promise.all([
    db.maintenanceContract.find({
      where: { deletedAt: null },
      skip,
      take: limit,
      order: { endDate: 'DESC' }
    }),
    db.maintenanceContract.count({ where: { deletedAt: null } })
  ]);

  return Response.json({
    data: contracts,
    pagination: {
      page,
      limit,
      total,
      hasMore: page * limit < total
    }
  });
}
```

**UI Implementation:**
```typescript
// Pagination controls show:
// "Items per page: [20] [30] [50]"
// Dropdown capped at 50

// If user tries to request via URL:
// ?limit=100 → Server caps to 50 (silently)
// Response includes actual limit: limit: 50
```

**Performance Targets:**

| Scenario | Response Size | Target | Status |
|----------|---------------|--------|--------|
| Default (20 items) | 40KB | <100ms | ✓ Expected |
| 50 items | 100KB | <200ms | ✓ Expected |
| 100 items (if Phase 2) | 200KB | <300ms | ? TBD |

**Phase 2 Enhancement:**
- Monitor actual usage patterns
- Increase to 100 if slow queries are optimized
- Add export-to-CSV for large datasets (instead of 100-item page)

---

### Decision 10: Authorization Enforcement (Defense in Depth)

**Topic:** Should authorization be enforced in API routes, Server Components, or both?

**Decision: DEFENSE IN DEPTH (API + UI + Server Component) - Phase 1**

**Rationale:**
- Best security practice: Multiple layers of protection
- Best UX: Disabled buttons (not error messages)
- Prevents: Client-side authorization bypass
- Server Component: Prevents reaching unauthorized pages
- API: Final security check (never trust client)
- UI: Best user experience (no confusing errors)

**Implementation Layers:**

**Layer 1: Server Component (Page Authorization)**
```typescript
// src/app/(main)/maintenance/page.tsx
import { getServerSession } from 'next-auth/server';
import { redirect } from 'next/navigation';

export default async function MaintenancePage() {
  const session = await getServerSession();

  // Check: User authenticated
  if (!session) {
    redirect('/login');
  }

  // Check: User has read access (USER+)
  if (!['USER', 'MANAGER', 'ADMIN'].includes(session.user.role)) {
    return <div>Access denied</div>;
  }

  // Fetch data
  const contracts = await fetchContracts();

  // Render page (restricted content not visible to unauthorized)
  return <MaintenanceListView contracts={contracts} />;
}
```

**Layer 2: API Route Authorization**
```typescript
// src/app/api/maintenance/[id]/route.ts
import { getServerSession } from 'next-auth/server';

export async function PUT(req, { params }) {
  const session = await getServerSession();

  // Check: Authenticated
  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check: Has write permission (MANAGER+)
  if (!['MANAGER', 'ADMIN'].includes(session.user.role)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Check: Contract exists
  const contract = await getContract(params.id);
  if (!contract) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }

  // Proceed with update
  const updated = await updateContract(params.id, req.body);
  return Response.json(updated);
}

export async function DELETE(req, { params }) {
  const session = await getServerSession();

  // Check: Authenticated
  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check: Is ADMIN (delete permission)
  if (session.user.role !== 'ADMIN') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Proceed with delete
  await deleteContract(params.id);
  return Response.json({ success: true });
}
```

**Layer 3: UI Authorization (Client Component)**
```typescript
// components/features/maintenance/MaintenanceContractActions.tsx
'use client';

import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';

export function MaintenanceContractActions({ contract }) {
  const { data: session } = useSession();

  return (
    <div className="flex gap-2">
      {/* Edit button: MANAGER+ only */}
      {['MANAGER', 'ADMIN'].includes(session?.user?.role) ? (
        <Button onClick={() => openEditDialog(contract)}>
          Edit
        </Button>
      ) : (
        <Button disabled title="MANAGER+ required">
          Edit
        </Button>
      )}

      {/* Delete button: ADMIN only */}
      {session?.user?.role === 'ADMIN' ? (
        <Button
          variant="destructive"
          onClick={() => openDeleteDialog(contract)}
        >
          Delete
        </Button>
      ) : (
        <Button disabled variant="destructive" title="ADMIN only">
          Delete
        </Button>
      )}
    </div>
  );
}
```

**Authorization Matrix by Endpoint:**

| Endpoint | GET | POST | PUT | DELETE | Notes |
|----------|-----|------|-----|--------|-------|
| /api/maintenance | USER+ | MANAGER+ | - | - | List and create |
| /api/maintenance/[id] | USER+ | - | MANAGER+ | ADMIN | Detail, update, delete |
| /api/maintenance/[id]/status | USER+ | - | - | ADMIN | Status change |
| /api/maintenance/[id]/attachments | USER+ | MANAGER+ | - | ADMIN | Upload, delete files |
| /api/maintenance/[id]/history | USER+ | - | - | - | Read-only |
| /api/maintenance/stats | USER+ | - | - | - | Read-only stats |

**Error Handling:**
```typescript
// API returns clear error codes
// 401 Unauthorized: No session
// 403 Forbidden: Insufficient role
// 404 Not Found: Resource doesn't exist
// 400 Bad Request: Invalid input

// Client catches errors and shows toast:
// "You don't have permission to modify this contract (MANAGER+ required)"
```

**Phase 2 Enhancement:**
- Row-level access control: User can only modify own contracts
- Department-scoped access: MANAGER sees only department contracts
- Audit logging: Track all authorization checks
- Fine-grained permissions: MANAGER_READ, MANAGER_WRITE, ADMIN_DELETE

---

## Summary Table: All Decisions

| Decision | Phase 1 | Phase 2 Enhancement | Implementation Effort |
|----------|---------|--------------------|-----------------------|
| 1. Status Transitions | Manual only | Auto-triggers | Low |
| 2. MANAGER Authorization | Open access | Department-scoped | Medium |
| 3. Renewal Workflow | Simple update | Contract cloning | Low-Medium |
| 4. Pagination (Nested) | Explicit (10/20) | Advanced filtering | Medium |
| 5. File Versioning | Append-only | Explicit versioning | Low |
| 6. Soft Delete Cascading | Cascade soft-delete | Recovery feature | Medium |
| 7. Index Strategy | Selective+Composite | Query monitoring | Low |
| 8. Filter State | URL params | Filter presets | Medium |
| 9. Pagination Max | 50 items | Increase if needed | Low |
| 10. Authorization | Defense in depth | Fine-grained RBAC | Medium |

---

## Implementation Checklist

### Phase 1 (v1.0) - Core Functionality
- [x] Database: MaintenanceContract, Attachment, History entities
- [x] Migrations: Create tables + indices (selective + composite)
- [x] API: GET/POST/PUT/DELETE endpoints with proper authorization
- [x] Pagination: 20-50 items, with nested resource pagination (10/20)
- [x] Filters: URL query parameters (status, employee, customer, date range)
- [x] State Management: TanStack Query + URL params (no Zustand)
- [x] File Upload: Append-only, max 5 files per contract
- [x] Status Transitions: Manual only (MANAGER-initiated)
- [x] Soft Delete: Cascade to attachments/history
- [x] Authorization: API + UI + Server Component (defense in depth)
- [x] UI: List, detail, create, edit, delete views
- [x] Tests: 80%+ API coverage

### Phase 2 (v2.0) - Enhancements
- [ ] Auto-trigger status transitions (background job)
- [ ] Department-scoped authorization
- [ ] Contract renewal cloning (full renewal workflow)
- [ ] Explicit file versioning
- [ ] Soft-delete recovery (admin feature)
- [ ] Dashboard widgets
- [ ] Advanced search/filtering
- [ ] Bulk operations (delete, status change)
- [ ] Export to CSV
- [ ] Email notifications (contract expiring)

---

## Related PRD Updates Required

The following sections of the original PRD must be updated to reflect these decisions:

1. **Section 3 (User Stories)**:
   - User Story 7: Add "All status changes are manual, MANAGER-initiated"
   - User Story 9: Clarify renewal = manual update + history recording

2. **Section 5.3 (Database Schema)**:
   - Add index specification section
   - Document soft-delete cascade strategy
   - Add cascade behavior for delete operation

3. **Section 5.4 (State Management)**:
   - Specify: URL query parameters (not Zustand)
   - Document TanStack Query cache times
   - Remove ambiguity: "useState/Zustand OR..." → "URL params + TanStack Query"

4. **Section 5.5 (Authorization)**:
   - Add authorization matrix table
   - Specify defense-in-depth approach (API + UI + SC)
   - Clarify Phase 1 open access, Phase 2 scoped access

5. **Section 6.1 (UI/UX)**:
   - Specify pagination: 20 default, 50 max (not 100)

6. **Section 9 (Dependencies)**:
   - Reference specific RBAC enforcement for each role

---

## Decision Confidence Levels

| Decision | Confidence | Risk | Mitigation |
|----------|------------|------|-----------|
| 1. Manual Status Transitions | HIGH | Feedback may reveal need for auto-triggers | Phase 1.5 pivot if needed |
| 2. Open MANAGER Access | MEDIUM | May need scoping in Phase 2 | Audit logs help identify issues |
| 3. Simple Renewal | HIGH | Clear, simple, satisfies requirements | Phase 2 enhancement path clear |
| 4. Explicit Pagination | HIGH | Expected data sizes support it | Can simplify if unneeded |
| 5. Append-Only Files | HIGH | 5-file limit prevents issues | Phase 2 versioning available |
| 6. Cascade Soft-Delete | HIGH | Standard pattern, CLAUDE.md compliant | No known issues |
| 7. Selective Indices | HIGH | Proven Oracle performance pattern | Monitor and adjust Phase 2 |
| 8. URL Query Params | HIGH | CLAUDE.md standard, TanStack Query native | No alternative needed |
| 9. Max 50 Items | MEDIUM | Conservative but reasonable | Phase 2: increase to 100 if safe |
| 10. Defense in Depth | HIGH | Security best practice | Multiple layers prevent bypass |

---

## Next Steps

1. **Mediation Review** ✓ (This document)
2. **PRD v2 Generation** → Update PRD with all decisions
3. **Implementation Start** → Development team builds Phase 1
4. **Supplementary Docs** → API spec, implementation guide, testing guide
5. **Phase 1 Launch** → Deploy and gather feedback
6. **Phase 2 Planning** → Incorporate learnings into Phase 2

---

**Mediation Complete:** 2026-01-25 23:45:00 KST
**Status:** All Decisions Final, Ready for PRD v2 Generation
