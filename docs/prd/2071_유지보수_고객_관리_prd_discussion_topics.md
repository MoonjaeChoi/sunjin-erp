<!-- Generated: 2026-01-25 23:05:00 KST -->

# Discussion Topics: 유지보수 고객 관리 (2071 PRD)

**Document Date:** 2026-01-25
**Related Documents:** 2071_유지보수_고객_관리_prd.md, 2071_유지보수_고객_관리_prd_critical_review.md, 2071_유지보수_고객_관리_prd_rebuttal.md
**Purpose:** Unresolved decisions requiring mediation phase resolution

---

## Discussion Topic 1: Automatic vs. Manual Status Transitions

**Priority:** HIGH
**Issue:** Should contract status transitions (활성 → 갱신예정 → 활성 → 종료) be automatic (system-triggered) or manual (MANAGER-initiated)?

**Current PRD Position:**
PRD implies manual transitions (User Story 7: "MANAGER/ADMIN으로서, 계약의 상태를 변경하고 싶다"). But doesn't explicitly state whether system should auto-trigger "갱신예정" state at 3-month mark.

**Options:**

1. **Manual Only (Current Design)**
   - PRD: MANAGER manually sets all status transitions via UI form
   - "갱신예정" = manual state flag, not automatic trigger
   - Renewal = MANAGER extends end_date and updates status
   - **Pros:**
     - Simpler Phase 1 implementation (no background job needed)
     - Flexibility for edge cases (delayed renewal, early cancellation)
     - MANAGER controls renewal timing
   - **Cons:**
     - Requires MANAGER discipline (can forget to update status)
     - No system reminders for approaching expiration
     - Higher manual workload

2. **Hybrid: Manual with Automatic Reminders (Phase 1.5)**
   - System auto-sets "갱신예정" at 3-month boundary
   - But doesn't auto-transition to "활성" (MANAGER must complete renewal)
   - Requires background job: Scheduled task checks end_dates daily
   - **Pros:**
     - Reduces manual overhead
     - System flags attention-needed contracts
     - Clearer workflow (machine finds, human approves)
   - **Cons:**
     - Adds complexity: background job, scheduling, error handling
     - Risk of incorrect state changes (should we auto-close expired contracts?)
     - Scheduling infrastructure needed

3. **Fully Automatic (Phase 2+)**
   - System auto-triggers all transitions based on rules and time
   - "활성" → "갱신예정" at 3-month boundary
   - "갱신예정" → "활성" on renewal date confirmation
   - "활성" → "종료" on end_date if not renewed
   - **Pros:**
     - Minimal manual work (MANAGER only approves)
     - Contracts always in correct state
     - Audit trail of automated state changes
   - **Cons:**
     - Complex business logic to encode
     - Risk of auto-terminating contracts (requires careful testing)
     - Requires robust error handling and alerting

**Recommended:** **Manual Transitions for Phase 1** (Option 1)
- Start simple, gather MANAGER feedback
- Transition to Option 2 (hybrid) in Phase 1.5 if users request
- Option 3 (fully automatic) as Phase 2 enhancement

**Decision Needed:** Confirm Phase 1 = manual only, OR proceed with Option 2 hybrid approach?

---

## Discussion Topic 2: Authorization Scope for MANAGER Role

**Priority:** HIGH
**Issue:** Should all MANAGERs be able to modify contracts assigned to other MANAGERs, or should access be scoped by department/assignment?

**Current PRD Position:**
Not explicitly stated. RBAC table shows MANAGER has CRUD capability, but no row-level access control defined.

**Options:**

1. **Open Access: All MANAGERs Can Modify Any Contract (Phase 1)**
   - Authorization: MANAGER role only
   - No additional owner/department check
   - All MANAGERs see all contracts
   - All MANAGERs can edit any contract
   - **Pros:**
     - Simple implementation (role-only check)
     - Flexible collaboration (team can help each other)
     - Suitable for small teams (< 20 MANAGERs)
   - **Cons:**
     - No accountability (who changed what?)
     - Risk of accidental overwrites
     - No privacy/separation of duties

2. **Owner-Scoped Access (Phase 1.5)**
   - MANAGER can only modify contracts assigned to them
   - Or: MANAGER can modify own + team members' contracts
   - Requires additional authorization check: `session.user.id == contract.assigned_employee_id`
   - **Pros:**
     - Clear accountability (MANAGER owns their contracts)
     - Prevents accidental overwrites
     - Good audit trail
   - **Cons:**
     - Less flexibility (can't help teammates)
     - Requires reassignment for handoff
     - More complex authorization logic

3. **Department-Scoped Access (Phase 2)**
   - MANAGER can only modify contracts in their department
   - Requires: Employee.department_id, MaintenanceContract.department_id
   - Hierarchical RBAC: Department Manager > Team Manager > User
   - **Pros:**
     - Enterprise-grade access control
     - Clear organizational boundaries
     - Audit trail per department
   - **Cons:**
     - Complex schema changes needed
     - Phase 2 work (out of scope)
     - Overkill for small team

4. **Role Hierarchy (Phase 2)**
   - MANAGER can modify own + team members' contracts
   - ADMIN can override and modify any contract
   - Requires: Employee.manager_id (reporting relationship)
   - **Pros:**
     - Realistic org structure
     - Manager oversight of team
     - Scalable to larger orgs
   - **Cons:**
     - Complex authorization logic
     - Requires org chart data
     - Phase 2 work

**Recommended:** **Option 1 (Open Access) for Phase 1**
- Assume small, collaborative team
- Add audit logging to track who changed what
- Revisit in Phase 2 if team expands

**Decision Needed:** Confirm open access for Phase 1, OR implement Option 2 (owner-scoped) from day one?

**Related Actions:**
- Add created_by_id, updated_by_id to MaintenanceContract (already in PRD ✓)
- Log all changes to audit trail (Phase 2 enhancement)

---

## Discussion Topic 3: Renewal Workflow: Manual vs. Automatic

**Priority:** HIGH
**Issue:** How should contract renewal be implemented? Manual contract extension (update end_date), or automatic contract renewal (create new record)?

**Current PRD Position:**
Out-of-Scope: "자동 계약 갱신 (2단계)" (automatic renewal = Phase 2)
In-Scope: "계약 갱신 이력 추적" (renewal history tracking = Phase 1)
Contradiction: How to create history without renewal workflow?

**Options:**

1. **Simple Renewal: Update end_date + Record History (Phase 1)**
   - Existing contract extended: `UPDATE end_date = new_date`
   - History record: `change_type='갱신'`, `previous_end_date=old, new_end_date=new`
   - No new contract record created
   - **Pros:**
     - Simple: Update one record, add one history entry
     - Minimal schema/logic changes
     - Clear history of all date changes
   - **Cons:**
     - No separate "old" vs "new" contract records (audit trail unclear)
     - Hard to compare renewal changes if multiple updates
     - Doesn't align with traditional "renewal" (clone + new terms)

2. **Contract Linking Renewal: Create New Contract + Link to Previous (Phase 1)**
   - New contract created for renewal term
   - Add `previous_contract_id` to MaintenanceContract (optional FK)
   - History record: Links old contract ID to new contract ID
   - **Pros:**
     - Clear separation: Contract 1 (2026-01-01 to 2026-12-31), Contract 2 (2027-01-01 to 2027-12-31)
     - Full audit trail (each contract is immutable)
     - Easier to analyze renewal patterns
     - Aligns with business concept of "renewal" = new contract
   - **Cons:**
     - More complex: Need contract linking, copy logic
     - More records: Doubles contract count over time
     - UI complexity: Display linked contracts vs single evolving contract

3. **Full Contract Renewal Workflow (Phase 2)**
   - `POST /api/maintenance/[id]/renew` endpoint
   - System clones contract with new dates, terms, amount
   - Old contract status → "갱신됨" (archived)
   - New contract created as "활성"
   - History tracks full renewal event
   - **Pros:**
     - Enterprise-grade: Full renewal management
     - Clear state transitions
     - Supports complex renewal terms (rate increases, terms changes)
     - Audit trail: Every renewal documented
   - **Cons:**
     - Complex logic: Validation, cloning, state transitions
     - Phase 2+ work
     - Requires UX for renewal form

4. **Inline Renewal: Update Within Same Record (Current Approach)**
   - Contract record updated: end_date, status, amount can all change
   - No new record, no linking
   - History tracks each field change
   - **Pros:**
     - Simplest approach
     - Single source of truth (contract record is current state)
     - Clear history of all updates
   - **Cons:**
     - No clear "renewal event" (mixed with other updates)
     - Hard to know "was this a renewal or just an update?"
     - Doesn't create separation between contract periods

**Recommended:** **Option 1 (Simple Renewal) for Phase 1**
- Simplest to implement
- Satisfies "갱신 이력 추적" requirement (option 4 also works, but option 1 clearer)
- Add optional `previous_contract_id` field for Phase 2 linking

**If Business Requires Clear Renewal Events:** **Option 2 (Linking)**
- Slightly more complex but clear semantics
- Better for long-term analytics (can query "all renewals for customer X")

**Decision Needed:** Confirm Option 1, OR implement Option 2 with contract linking?

**Related Changes:**
- Add `previous_contract_id` as optional FK (nullable, points to MaintenanceContract.id)
- Define renewal history: When end_date changes, create history entry with change_type='갱신'

---

## Discussion Topic 4: Pagination Limits: Attachments and History

**Priority:** HIGH
**Issue:** Should nested resources (attachments, history) have pagination limits? If so, what limits?

**Current PRD Position:**
- Attachments: "최대 5개 한정" (max 5 per contract) — PRD already specifies!
- History: No limit specified, but expected 1-3 records per contract

**Options:**

1. **No Pagination: Load All Records (Phase 1)**
   - Attachments: All 5 displayed on one page
   - History: All records displayed on one page
   - **Pros:**
     - Simplest implementation
     - No UI pagination component needed
     - Expected dataset sizes don't warrant pagination (5 + 1-3 records)
   - **Cons:**
     - Doesn't scale if limits increased in future (e.g., 20 attachments)
     - User scrolls long list if history grows
     - Not "best practice" for scalable design

2. **Explicit Pagination: Load with Limit (Phase 1 + Strategy)**
   - Attachments: 10 per page (exceeds max of 5, so always 1 page in practice)
   - History: 20 per page (allows room to grow)
   - API endpoints: `GET /api/maintenance/[id]/attachments?page=1&limit=10` and `GET /api/maintenance/[id]/history?page=1&limit=20`
   - Response format: `{ items: [...], total, hasMore, page, limit }`
   - **Pros:**
     - Scalable: Easy to increase limits in Phase 2
     - Professional: Handles edge cases gracefully
     - Growth path: Shows patterns for larger resources
   - **Cons:**
     - More API endpoints / complexity
     - Client needs pagination UI components (nested pagination)
     - Overkill for current expected data sizes

3. **Hybrid: No Pagination Now, Ready for Phase 2 (Phase 1)**
   - Load all records in Phase 1 (simple)
   - Design API to support pagination in Phase 2
   - Document limits: "If attachments exceed 10, will add pagination endpoint"
   - **Pros:**
     - Start simple, upgrade path clear
     - Current size doesn't warrant pagination
     - Reduces Phase 1 complexity
   - **Cons:**
     - Future migration effort
     - UI changes needed later
     - Inconsistent with other APIs (main list is paginated)

**Recommended:** **Option 2 (Explicit Pagination) for Phase 1**
- Design for scale from day one
- Minimal added complexity (same pagination pattern as list endpoint)
- Consistent API design across all endpoints

**Specific Limits:**
- Attachments: max 10 per page (PRD allows 5 max, leaves room for growth)
- History: max 20 per page (expected 1-3 now, allows growth to 20+)

**Decision Needed:** Confirm Option 2 limits (10 attachments, 20 history), OR simplify to Option 1 (no pagination)?

**Related Changes:**
- Add two new API endpoints: `GET /api/maintenance/[id]/attachments` and `GET /api/maintenance/[id]/history` (separate from detail endpoint)
- Detail page endpoint still returns full attachments/history (for initial load), but pagination endpoint available for full history view

---

## Discussion Topic 5: File Upload Versioning Strategy

**Priority:** MEDIUM
**Issue:** When same file is uploaded twice, should it replace the old one (versioning) or create duplicate entries?

**Current PRD Position:**
User Story 6: "파일당 5개 한정" (max 5 files)
Doesn't specify: Filename uniqueness, versioning, or overwrite behavior

**Options:**

1. **Append-Only: Allow Duplicates (Phase 1)**
   - Each upload is new entry in MaintenanceContractAttachment
   - Same filename uploaded twice = two separate records (different UUIDs)
   - No versioning, no overwrite
   - MANAGER responsible for not uploading duplicates
   - **Pros:**
     - Simplest implementation
     - Preserves all versions (implicit history)
     - No file management logic needed
   - **Cons:**
     - Wastes disk space (duplicate files)
     - Confusing for users (which version is current?)
     - Easily hits 5-file limit with duplicates

2. **Replace: Overwrite Same Filename (Phase 1)**
   - New upload with same name → replaces old file
   - Old file deleted from disk, DB record deleted
   - Only "current" version kept
   - **Pros:**
     - Clear "current" version
     - No duplicates/confusion
     - Predictable behavior
   - **Cons:**
     - No version history (deleted file lost)
     - Risk: Accidental overwrite (user doesn't realize file exists)
     - Harder to recover old versions

3. **Simple Versioning: Keep History (Phase 2)**
   - Multiple versions of same file kept
   - UI shows "contract-2026.pdf v1, v2, v3"
   - Can download/restore old versions
   - New table: MaintenanceContractAttachmentVersion (tracks versions)
   - **Pros:**
     - Best UX: Users see all versions clearly
     - Safe: Old versions recoverable
     - Professional: Like Google Drive, Dropbox versioning
   - **Cons:**
     - Complex schema and logic
     - Phase 2 work
     - Disk space usage (keeps old files)

4. **Hybrid: Rename Strategy (Phase 1)**
   - User uploads "contract.pdf" twice
   - System creates: "contract.pdf" and "contract_1.pdf"
   - Auto-versioning without explicit versioning table
   - **Pros:**
     - Avoids overwrites, but clear versions
     - No explicit versioning table needed
     - Reasonable UX
   - **Cons:**
     - Clunky naming ("contract_1.pdf", "contract_2.pdf")
     - Different from industry standard (Google Drive shows "Version history")
     - Still confusing which is "current"

**Recommended:** **Option 1 (Append-Only) for Phase 1**
- Simplest implementation
- 5-file limit prevents explosion of duplicates
- MANAGER can delete old file if need space
- Phase 2: Add explicit versioning (Option 3) if users request it

**Alternative:** **Option 4 (Hybrid Rename)**
- If business insists on "one filename, one file" rule
- Slight UX improvement over Option 1 (clear versioning by name)

**Decision Needed:** Confirm Option 1 (append-only), OR prefer Option 4 (auto-rename)?

**Related Changes:**
- If Option 4: Add file versioning logic to upload handler (rename if exists)
- If Option 1: Document: "Multiple files with same name allowed. MANAGER manages via delete."

---

## Discussion Topic 6: Soft Delete Scope: Physical or Logical?

**Priority:** HIGH
**Issue:** When contract is deleted (soft-delete), should related attachments also be soft-deleted, or stay active?

**Current PRD Position:**
Section 5.3: MaintenanceContractAttachment has FK `ON DELETE RESTRICT` (prevents deletion if attachments exist)
But Section 4.2 (Delete functionality) allows contract deletion — doesn't address attachment handling

**Options:**

1. **Cascade Soft Delete: Delete Attachments When Contract Deleted (Phase 1)**
   - When contract.deleted_at = NOW(), also attachment.deleted_at = NOW()
   - All related history records also soft-deleted
   - One transaction: Delete contract + all children
   - FK RESTRICT applies to physical deletes (not soft deletes)
   - **Pros:**
     - Clean logical deletion (entire contract hierarchy deleted)
     - Preserves audit trail (deleted_at timestamps)
     - Consistent: All related records grouped
   - **Cons:**
     - More complex logic: Need cascade logic in code
     - Lost attachment metadata (if someone queries deleted attachments)
     - Harder to recover if needed

2. **Keep Attachments: Leave Active When Contract Deleted (Phase 1)**
   - Only contract soft-deleted (deleted_at = NOW())
   - Attachments remain active (deleted_at = NULL)
   - Orphaned attachments still exist (can't access through contract)
   - **Pros:**
     - Simpler: Just delete contract, nothing else
     - Preserves attachment history (can query what was attached)
     - Data recovery: Attachments still accessible
   - **Cons:**
     - Orphaned data (attachments without contract)
     - Confusing: Why are files still there if contract deleted?
     - Storage waste: Old attachments pile up

3. **Require Manual Cleanup: Delete Attachments First (Phase 1)**
   - API validation: Can't delete contract if attachments exist
   - MANAGER must delete attachments first, then delete contract
   - FK RESTRICT enforced by database
   - **Pros:**
     - Explicit, safe workflow (no accidents)
     - Clear separation of concerns
     - User sees what's being deleted
   - **Cons:**
     - Extra steps for MANAGER (delete 5 files first)
     - Poor UX (deletion fails with "delete attachments first" error)
     - Doesn't scale (what if history linked to contract?)

4. **Logical Separation: Keep Both Active (Phase 2+)**
   - Contract and attachments independent records
   - Can delete contract without touching attachments
   - History records track which contract they belong to
   - **Pros:**
     - Flexible: Contract and attachments have separate lifecycle
     - Data integrity: Attachments not tied to contract
     - Audit: Can analyze "this attachment was used by deleted contracts"
   - **Cons:**
     - Complex schema and logic
     - Orphaned data problem (what to do with old attachments?)
     - Requires separate cleanup job (Phase 2)

**Recommended:** **Option 1 (Cascade Soft Delete) for Phase 1**
- Natural grouping: Contract hierarchy deleted together
- Cleaner data model
- Easier to reason about: "deleted contract = all its data deleted"

**Implementation:**
```typescript
// When deleting contract
async deleteContract(id) {
  const now = new Date();
  await db.transaction(async () => {
    // Soft delete attachments first
    await db.maintenanceContractAttachment
      .update({ deleted_at: now })
      .where({ maintenance_contract_id: id });

    // Then soft delete history
    await db.maintenanceContractHistory
      .update({ deleted_at: now })
      .where({ maintenance_contract_id: id });

    // Finally soft delete contract
    await db.maintenanceContract
      .update({ deleted_at: now })
      .where({ id: id });
  });
}
```

**Decision Needed:** Confirm Option 1 (cascade soft-delete), OR prefer Option 3 (require manual cleanup)?

---

## Discussion Topic 7: Query Performance: Index Strategy

**Priority:** HIGH
**Issue:** What indices should be created for optimal query performance? Should they be selective (WHERE deleted_at IS NULL)?

**Current PRD Position:**
Section 7 mentions performance target: "API Response Time: p95 < 200ms"
But no index specification

**Options:**

1. **Basic Indices: One Per Filter Column (Phase 1)**
   - `idx_maintenance_contract_customer_id` on (customer_id)
   - `idx_maintenance_contract_employee_id` on (assigned_employee_id)
   - `idx_maintenance_contract_status` on (contract_status)
   - `idx_maintenance_contract_enddate` on (end_date DESC)
   - **Pros:**
     - Simple, covers most queries
     - Easy to explain and maintain
   - **Cons:**
     - Doesn't account for soft-deletes (queries add deleted_at filter)
     - May not be selective enough (large index)

2. **Selective Indices: Include Deleted_at Condition (Phase 1)**
   - `idx_maintenance_contract_customer_active` on (customer_id) WHERE deleted_at IS NULL
   - `idx_maintenance_contract_employee_active` on (assigned_employee_id) WHERE deleted_at IS NULL
   - `idx_maintenance_contract_status_active` on (contract_status) WHERE deleted_at IS NULL
   - `idx_maintenance_contract_enddate_active` on (end_date DESC) WHERE deleted_at IS NULL
   - Oracle SQL: `WHERE deleted_at IS NULL` creates partial index
   - **Pros:**
     - Optimal: Indexes only active records
     - Smaller index size (doesn't include deleted records)
     - Perfect for queries: `WHERE deleted_at IS NULL AND customer_id = X`
   - **Cons:**
     - Slightly more complex index definition
     - Oracle syntax: Must use exact WHERE clause

3. **Composite Indices: Multi-Column for Common Queries (Phase 1)**
   - `idx_maintenance_contract_status_enddate` on (contract_status, end_date DESC) WHERE deleted_at IS NULL
   - `idx_maintenance_contract_customer_enddate` on (customer_id, end_date DESC) WHERE deleted_at IS NULL
   - Covers combined filters (status + expiration date, customer + expiration date)
   - **Pros:**
     - Covers most user queries (filter by status/customer, sorted by expiration)
     - Fewer indices needed (composite is efficient)
     - Best performance for complex queries
   - **Cons:**
     - More indices to maintain
     - Composite indices are specific (won't help single-column queries)

4. **Database View: Virtual Filtered Table (Phase 1)**
   - Create view: `v_maintenance_contract_active` with WHERE deleted_at IS NULL
   - Queries use view instead of table
   - All indices on base table, view inherits
   - **Pros:**
     - Enforces soft-delete at database level
     - Developers can't accidentally query deleted records
     - Simpler to reason about
   - **Cons:**
     - Adds view management
     - Some DB tools don't optimize views well
     - Oracle-specific syntax

**Recommended:** **Option 2 or 3 (Selective + Composite) for Phase 1**

**Specific Indices to Create:**
```sql
-- Selective indices (Option 2)
CREATE INDEX idx_mc_customer_active
  ON MaintenanceContract(customer_id)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_mc_employee_active
  ON MaintenanceContract(assigned_employee_id)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_mc_status_active
  ON MaintenanceContract(contract_status)
  WHERE deleted_at IS NULL;

-- Composite indices (Option 3 - primary queries)
CREATE INDEX idx_mc_status_enddate_active
  ON MaintenanceContract(contract_status, end_date DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_mc_customer_enddate_active
  ON MaintenanceContract(customer_id, end_date DESC)
  WHERE deleted_at IS NULL;

-- Additional: Sort index
CREATE INDEX idx_mc_enddate_active
  ON MaintenanceContract(end_date DESC)
  WHERE deleted_at IS NULL;
```

**Decision Needed:** Confirm above indices, OR run query analysis first (EXPLAIN PLAN) to determine actual needs?

**Related Actions:**
- Phase 1: Create indices in migration file
- Phase 2: Monitor query performance, add more indices if needed

---

## Discussion Topic 8: State Management: Filters in URL or Zustand?

**Priority:** MEDIUM
**Issue:** Should filter state (status, employee, customer, date range) be stored in URL query parameters or Zustand store?

**Current PRD Position:**
Section 5.4: States "Zustand OR React useState" (ambiguous)
User Story 2: "필터 적용 시 URL query parameter 업데이트" (implies URL params)

**Options:**

1. **URL Query Parameters (CLAUDE.md Standard - Recommended)**
   - Filters stored as URL params: `?status=ACTIVE&employeeId=5&page=1&limit=20`
   - TanStack Query extracts params and fetches data
   - Browser back button works correctly
   - URL is shareable (colleague can copy/paste filter state)
   - **Pros:**
     - Best UX: Bookmarkable, shareable URLs
     - Integrates with browser history
     - TanStack Query built-in support
     - Clear separation: URL = external state, component = internal UI
   - **Cons:**
     - URL can get long with many filters
     - Requires syncing: Component state ↔ URL params
     - Need URL update library (e.g., nuqs)

2. **Zustand Store (Not Recommended per CLAUDE.md)**
   - Filters stored in Zustand: `{ status: 'ACTIVE', employeeId: 5, page: 1 }`
   - Manual sync to URL if needed (error-prone)
   - Component doesn't update when URL changes (bad for back button)
   - URL doesn't update when user changes filter (breaks bookmarking)
   - **Pros:**
     - Simple state management (one source of truth)
     - Fast updates (no URL parsing)
   - **Cons:**
     - Not sharable (URL doesn't reflect state)
     - Back button broken
     - Anti-pattern per CLAUDE.md (Zustand is for UI state, not data state)

3. **Hybrid: URL + Local Component State**
   - URL: Primary state (source of truth)
   - Component: Local state for UI interactions (form inputs)
   - On submit: Update URL → TanStack Query refetches
   - **Pros:**
     - URL is shareable
     - Component can have draft state (user typing without committing)
     - Best UX for forms (show validation error before submitting)
   - **Cons:**
     - More code (need to sync component ↔ URL)
     - More complex state management

4. **React Hook Form Local State (Simpler Alternative)**
   - Filters in React Hook Form (temporary, not committed)
   - Submit button: Updates URL → refetch
   - **Pros:**
     - Simple form management (React Hook Form built for this)
     - Clear submit flow
   - **Cons:**
     - Still need to sync to URL

**Recommended:** **Option 1 (URL Query Parameters) for Phase 1**
- Per CLAUDE.md philosophy
- Best UX
- TanStack Query integrates well

**Implementation Pattern:**
```typescript
// Page component
export function MaintenanceListPage() {
  const searchParams = useSearchParams(); // From URL
  const status = searchParams.get('status');
  const employeeId = searchParams.get('employeeId');
  const page = searchParams.get('page') || 1;

  // TanStack Query uses params as key
  const { data } = useMaintenanceContractList({
    status, employeeId, page
  });

  return (
    <>
      <FilterPanel onApply={(filters) => {
        // Update URL with new filters
        router.push(`?status=${filters.status}&employeeId=${filters.employeeId}&page=1`);
      }} />
      <ContractTable data={data} />
    </>
  );
}
```

**Decision Needed:** Confirm Option 1 (URL params), OR prefer Zustand (Option 2)?

**Related Library:** Consider `nuqs` (Next.js URL search params) for easier URL management

---

## Discussion Topic 9: Pagination Maximum: 50 or 100 Items?

**Priority:** MEDIUM
**Issue:** Should max page size be 100 (current PRD) or 50 (reviewer suggestion)?

**Current PRD Position:**
User Story 1: "기본 20개 항목/페이지, 최대 100개 항목/페이지"

**Options:**

1. **Max 100 (Current PRD)**
   - User can request up to 100 items per page
   - Default: 20 items
   - **Pros:**
     - Flexible for power users (export all)
     - Allows larger datasets in one request
     - Supports "show all" workflow
   - **Cons:**
     - 100 items × 2KB = 200KB response (large for slow networks)
     - Browser memory usage (rendering 100 rows)
     - Can exceed network timeout (if slow connection)

2. **Max 50 (Reviewer Suggestion)**
   - User can request up to 50 items per page
   - Default: 20 items
   - **Pros:**
     - Safer: 50 × 2KB = 100KB response (reasonable)
     - Better UX: Faster rendering (50 rows < 100 rows)
     - Conservative: Works on slower networks
   - **Cons:**
     - Limits power users (2 page requests instead of 1)
     - Slightly less flexible
     - Arbitrary limit

3. **Max 500 with Warning (Hybrid)**
   - Allow up to 500 items (for extreme cases)
   - But show UI warning: "Large page sizes may be slow"
   - Monitor actual usage to determine real limit
   - **Pros:**
     - Maximum flexibility
     - Gathers data to make informed decision
     - Users can override if they accept slower performance
   - **Cons:**
     - Doesn't solve performance problem
     - Could cause server overload
     - Complexity: Warning UI, monitoring

4. **No Client Limit: Server Decides**
   - Client can request any size
   - Server enforces max: "max 100 items" (or 50)
   - Returns: "limit is capped to 50" message
   - **Pros:**
     - Flexible: Can change server limit without code change
     - Clear error message
     - Future-proof
   - **Cons:**
     - Client confusion (requested 100, got 50)
     - More complex error handling

**Recommended:** **Option 2 (Max 50) for Phase 1**
- Safer default
- Good balance between flexibility and performance
- Can increase to 100 in Phase 2 if monitoring shows it's safe

**Actual Estimate:**
- Average contract record: 1.5-2KB JSON (conservative)
- 50 items: 75-100KB response (good)
- 100 items: 150-200KB response (acceptable for fast networks, risky for slow)
- Recommendation: Start with 50, increase if needed

**Decision Needed:** Confirm Max 50, OR keep Max 100?

**Related Metrics:**
- Monitor actual response times with 50 vs 100 items
- Adjust in Phase 2 based on data

---

## Discussion Topic 10: Authorization Enforcement: API or UI?

**Priority:** MEDIUM
**Issue:** Should authorization be enforced in API routes, Server Components, or both?

**Current PRD Position:**
Section 5.5: "각 핸들러에서 `getServerSession()` → `user.role` 검증" (API route enforcement)
But also: "클라이언트에서 `useSession()` 후 권한에 따라 UI 렌더링" (UI-level hiding)

**Options:**

1. **API-Only Enforcement (Most Secure)**
   - API routes check role and return 403 if unauthorized
   - UI assumes user has permission (doesn't check role)
   - All authorization happens server-side
   - **Pros:**
     - Secure: User can't bypass via client-side manipulation
     - Simpler client code (no auth checks)
     - Server is source of truth
   - **Cons:**
     - User sees errors instead of disabled buttons
     - Poor UX: No indication that feature unavailable
     - Requires error handling for each unauthorized action

2. **UI-Only Hiding (Insufficient Security)**
   - Client checks role and hides buttons/features
   - API assumes authorization is ok
   - **Pros:**
     - Good UX: Users see what they can do
     - Simple: No server errors
   - **Cons:**
     - Not secure: User can modify client and call API anyway
     - Developers might forget API check
     - Against security best practices

3. **Defense in Depth: Both Levels (Recommended)**
   - UI: Check role and hide buttons/disable forms
   - API: Validate authorization and return 403 if unauthorized
   - **Pros:**
     - Best UX: No errors, just disabled UI
     - Secure: API protects even if client bypassed
     - Best practice: Defense in depth
   - **Cons:**
     - More code (auth checks in two places)
     - Could cause drift (UI says allowed, API says denied)

4. **Server Component Authorization (Alternative)**
   - Server Component checks role before rendering page
   - If unauthorized: Render "Access Denied" or redirect
   - API checks role again as second line of defense
   - **Pros:**
     - Prevents reaching page if unauthorized
     - Better UX than API 403 error
     - Works for both Server and Client components
   - **Cons:**
     - More complex flow
     - Server Component must return different response

**Recommended:** **Option 3 (Defense in Depth) for Phase 1**

**Implementation Pattern:**
```typescript
// UI: Check role and disable button
'use client';
export function DeleteButton({ contractId }) {
  const { data: session } = useSession();
  const deleteContract = useDeleteContract();

  if (session?.user.role !== 'ADMIN') {
    return <Button disabled>Delete (ADMIN only)</Button>;
  }

  return (
    <Button onClick={() => deleteContract.mutate(contractId)}>
      Delete
    </Button>
  );
}

// API: Check role and enforce permission
export async function DELETE(req, { params }) {
  const session = await getServerSession();

  if (!session?.user || session.user.role !== 'ADMIN') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Delete logic here
}
```

**Decision Needed:** Confirm Option 3 (defense in depth), OR simplify to API-only (Option 1)?

---

## Summary of Discussion Topics

| Topic | Priority | Status | Decision Needed |
|-------|----------|--------|-----------------|
| 1. Status Transitions | HIGH | Clarified | Confirm Manual (Phase 1) vs Hybrid (Phase 1.5) |
| 2. MANAGER Authorization Scope | HIGH | Clarified | Confirm Open Access (Phase 1) vs Owner-Scoped (Phase 1.5) |
| 3. Renewal Workflow | HIGH | Clarified | Confirm Simple Update (Option 1) vs Contract Linking (Option 2) |
| 4. Pagination Limits (Nested) | HIGH | Clarified | Confirm Explicit Pagination (10 attachments, 20 history) |
| 5. File Upload Versioning | MEDIUM | Clarified | Confirm Append-Only (Phase 1) vs Auto-Rename (Phase 1) |
| 6. Soft Delete Cascading | HIGH | Clarified | Confirm Cascade Soft-Delete vs Require Manual Cleanup |
| 7. Index Strategy | HIGH | Clarified | Confirm Selective + Composite Indices vs Basic Indices |
| 8. Filter State Management | MEDIUM | Clarified | Confirm URL Query Params (CLAUDE.md) vs Zustand |
| 9. Pagination Maximum | MEDIUM | Clarified | Confirm Max 50 (Recommended) vs Max 100 (Current PRD) |
| 10. Authorization Enforcement | MEDIUM | Clarified | Confirm Defense in Depth (API + UI) vs API-Only |

---

## Mediation Phase Input Needed

For each discussion topic, please provide:

1. **Business Requirement**: What does the business need?
2. **Risk Assessment**: What risks exist with each option?
3. **Implementation Effort**: How much dev effort for each option?
4. **Timeline**: Can Phase 1.5 work fit into Phase 1, or must it be Phase 2?
5. **User Feedback**: Have users provided input on workflows?

---

**Discussion Topics Created:** 2026-01-25 23:15:00 KST
**Status:** Ready for Mediation Phase

**Next Steps:**
1. Mediation team reviews all 10 topics
2. Business stakeholders provide decisions on each topic
3. PRD updated with final decisions
4. Development team implements based on mediated PRD

