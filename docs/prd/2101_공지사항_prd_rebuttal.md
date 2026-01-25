<!-- Generated: 2026-01-25 23:30:00 KST -->

# 2101 공지사항 - Rebuttal & Counter-Arguments

## Response to Critical Issues

### Issue #1: Comment Authorization Ambiguity
**Context:** The Notice Board design intentionally simplifies authorization by leveraging role-based separation. The original concern conflates three distinct permission models that need to be addressed separately rather than unified.

**Rebuttal:**
- US-6 ("자신의 댓글 수정/삭제") defines the default permission model for all users. This is the PRIMARY behavior and should be the source of truth.
- API Section 5.2 mentions "자신 또는 ADMIN" which is not a conflict—it's a layering: owner OR ADMIN is the correct authorization check (`user.id === comment.author_id OR user.role === ADMIN`).
- The concern about "MANAGER deleting other MANAGER's comments on their own post" introduces unnecessary complexity: we keep ownership model simple across all roles. A MANAGER cannot delete another MANAGER's comment, even on their own post. This is consistent with sunjin-erp's principle of clear ownership hierarchy.
- Post owners (MANAGER) should NOT have override authority over comments to prevent inappropriate suppression of feedback.

**Alignment:** Follows sunjin-erp pattern: owner-based permissions (post owner can delete post, comment owner can delete comment) + ADMIN override. This prevents role creep and maintains clear audit trails.

**Resolution:** Implement as: `DELETE /api/notices/[id]/comments/[commentId]` checks `user.id === comment.author_id || user.role === 'ADMIN'`. Document single scenario.

---

### Issue #2: View Count Increment Race Condition Undefined
**Context:** The PRD acknowledged this is a known limitation in Phase 1 ("Phase 1은 제한 없음 (모든 조회 카운트), Phase 2에서 개선"). The concern is valid but represents intentional deferment, not ambiguity.

**Rebuttal:**
- Oracle's atomic `UPDATE view_count = view_count + 1` operation with ACID guarantees handles concurrent increments correctly at database level. This is standard behavior, not something needing special specification.
- The PRD explicitly states "비동기 업데이트 (응답 지연 없음)"—this is a deliberate design choice to avoid blocking the GET response. Async updates are appropriate for non-critical metrics.
- Duplicate view count prevention was explicitly deferred to Phase 2 ("과도한 조작 방지, Phase 2") with understanding of Phase 1 limitations.
- Concern about "updates failing silently" is address by: (1) logging errors server-side (Phase 1), (2) verification dashboard (Phase 2). This is acceptable risk for non-critical statistics.

**Alignment:** Aligns with sunjin-erp's pragmatic phasing strategy: MVP in Phase 1 (accurate total count with potential duplicates), improvement in Phase 2 (deduplication). This is standard SaaS practice.

**Resolution:** Implement atomic UPDATE with async fire-and-forget pattern. Log failures to application error queue. Add metrics dashboard to verify count accuracy.

---

### Issue #4: Attachment Download Authorization Incomplete
**Context:** The PRD's specification "로그인 사용자만" is intentionally minimal and complete for Phase 1 scope. The concern raises valid edge cases that are appropriately OUT-OF-SCOPE.

**Rebuttal:**
- The current specification correctly identifies the MVP requirement: only authenticated users can download. This is the baseline.
- The concern conflates three separate features: (1) private posts (Phase 2), (2) deleted attachment recovery (Phase 2), (3) permission inheritance from notice. All are explicitly OUT-OF-SCOPE.
- For Phase 1, the authorization check is: USER+ role + notice.deleted_at IS NULL + attachment.deleted_at IS NULL. This is complete and unambiguous.
- Deleted attachments should return 404 (not found) consistently, which is standard REST behavior.

**Alignment:** Maintains separation of concerns: Phase 1 handles basic auth + existence checks, Phase 2 handles privacy levels. This follows sunjin-erp's incremental design pattern.

**Resolution:** Document that Phase 1 authorization: "Authenticated USER+ AND notice not deleted AND attachment not deleted. Return 404 for any deleted entity."

---

### Issue #5: Comment Depth Constraint Enforcement Mechanism
**Context:** This is a legitimate architectural concern. The PRD's mention of "Check constraint" was imprecise language, not a specification. The application-level enforcement is the correct approach.

**Rebuttal:**
- Oracle CHECK constraints cannot express multi-row dependencies (verifying parent.parent_comment_id IS NULL). Application-level enforcement is the ONLY viable approach.
- The PRD's intent was clear ("답글의 답글은 불가"—no replies to replies)—the specification was just incomplete in expressing HOW.
- Application-level validation is actually superior to database triggers for this use case: clearer error messages to client, easier to test, better performance (no roundtrip to trigger).
- The UI should NOT render "reply" button for replies (level 2 comments), preventing user confusion before API validation. API validation is defense-in-depth.

**Alignment:** Follows sunjin-erp's principle: application logic handles business rules, database handles structural integrity. Correct layering.

**Resolution:** Implement validation: `if (parent_comment_id is not null) { if (parent.parent_comment_id is not null) return 400 'Cannot reply to a reply'; }`. Hide reply button in UI for level-2 comments.

---

### Issue #6: Soft Delete Cascade Implications (HIGH)
**Context:** This is a LEGITIMATE HIGH-priority issue. The PRD was incomplete in specifying cascading behavior. However, the solution is straightforward and standard.

**Rebuttal (Partial Concession):**
- **Valid Point:** Cascading soft-delete behavior was not explicitly specified. This was an oversight in the PRD.
- **However:** The solution is not ambiguous—it's a standard best practice: when parent (Notice) is soft-deleted, all children (Comments, Attachments) must be soft-deleted for data consistency and to prevent orphaned soft-deleted records in queries.
- This is explicitly called for in CLAUDE.md: "Soft delete only - Every table has deleted_at column" implies consistent treatment across related entities.
- NoticeService.softDelete() method will handle cascading—this is a straightforward implementation pattern in TypeORM.

**Alignment:** Aligns with enterprise soft-delete patterns (e.g., Stripe, Shopify) where cascading soft-delete prevents orphaned data and maintains referential integrity in soft-delete scenarios.

**Resolution:** Implement NoticeService.softDelete() to cascade: set deleted_at on Notice → then cascade to Comments WHERE notice_id, then to Attachments WHERE notice_id. Document in service.

---

### Issue #8: User Role Transition & Backdating Scenarios
**Context:** This raises valid but edge-case scenarios. The PRD's implicit model is the correct approach—current role is authoritative.

**Rebuttal:**
- **Valid Point:** Role transition scenarios were not explicitly addressed.
- **However:** The design principle is clear from context: authorization checks CURRENT session role, not creation-time role. This is standard practice in all web applications.
- If USER is promoted to MANAGER, they CAN edit their old comments immediately (same edit permission logic applies). No special handling needed.
- If MANAGER is demoted to USER, they CANNOT edit/delete old posts (they fail the `author_id == user.id AND role >= MANAGER` check). This is correct behavior—demotion = loss of privilege.
- Timestamp integrity: created_at/updated_at are always server-generated, never user-controlled. ADMIN should NOT manipulate timestamps in Phase 1 (out-of-scope).

**Alignment:** Follows sunjin-erp security model: current session is the source of truth for permissions. No special cases or role history tracking in MVP.

**Resolution:** Document: "Authorization checks current user role and ownership at request time, not at creation time. Demoted users lose edit/delete privileges for old content (business rule, not a bug)."

---

### Issue #9: Large Content Handling & Truncation
**Context:** This raises a valid concern about missing specifications on content sizing and list display.

**Rebuttal:**
- **Valid Point:** Max content length was not specified, only minimum (10 chars). This is a gap.
- **However:** The solution is straightforward: set max content length to 10,000 characters (reasonable for a discussion post, matches comment limit × 10 for more verbosity).
- List view correctly does NOT display content (title + metadata only is standard). Detail view fetches full content via separate query—this is explicit in architecture and matches TanStack Query pattern.
- CLOB performance: for list view (no content), CLOB size is irrelevant. For detail view (content displayed), single large CLOB fetch is acceptable. Indexes on title/type handle list performance.

**Alignment:** Aligns with sunjin-erp's component organization: list = summary view, detail = full data load. This is efficient and expected.

**Resolution:** Add to scope: "Content max length: 10,000 characters (reasonable user discussion limit). List queries do not fetch content column (title + metadata only). Detail view fetches full content. CLOB indexed if Oracle supports, else accept sequential scan for searches."

---

### Issue #10: API Route Organization Deviation
**Context:** This is a valid concern about REST semantics and route clarity, but the PRD's routes are actually compliant.

**Rebuttal:**
- The concern conflates nested routes with nested resources. Comments ARE logically nested under notices (a comment belongs to exactly one notice), so `/api/notices/[id]/comments` is correct REST semantics.
- Individual comment operations: `/api/notices/[id]/comments/[commentId]` for GET/PUT/DELETE is standard REST (resource at full path).
- Attachment download: `GET /api/notices/[id]/attachments/[attachmentId]/download` is common REST pattern for "download" action. Alternative: `GET /api/notices/[id]/attachments/[attachmentId]` with `Content-Disposition: attachment` header. Both are valid; first is clearer.
- HTTP method clarity: POST creates, PUT updates, DELETE removes. Standard REST. If ambiguous, document each route separately (which we'll do in implementation PRD).

**Alignment:** Routes follow RESTful principles and Next.js App Router conventions. No actual deviation from sunjin-erp standards.

**Resolution:** Keep routes as-is. Clarify in implementation docs that routes are RESTful with nested resources. Consider Content-Disposition header approach for downloads (eliminate `/download` suffix for simplicity).

---

### Issue #11: Server Component vs Client Component Boundary Fuzzy
**Context:** This is a legitimate architectural concern. The PRD was incomplete in specifying data hydration strategy.

**Rebuttal:**
- **Valid Point:** The detail page architecture was not fully specified (Server vs Client component boundary).
- **However:** The intended architecture is clear and standard for Next.js 14 App Router:
  - Page (/notices/[id]/page.tsx) = Server Component, fetches initial notice data via TypeORM (fast, reduces JS bundle)
  - Detail UI = Client Component, receives server data as props, hydrates comment section with TanStack Query
  - This pattern minimizes hydration mismatch and avoids waterfalls.
- Comments load separately via TanStack Query because they're paginated/dynamic. Attachments load in detail page.

**Alignment:** Matches sunjin-erp's architecture (stated in CLAUDE.md: Server Component for auth + initial data, Client Component for interactive UI).

**Resolution:** Specify clearly: "Page component (Server) fetches notice + attachments via TypeORM. Returns <NoticeDetail> Client Component with initial data. Client component handles comments via TanStack Query. This minimizes bundle size and prevents hydration mismatch."

---

### Issue #13: Middleware & Route Protection Details Missing
**Context:** This is a valid gap. The PRD mentioned middleware protection but didn't specify behavior.

**Rebuttal:**
- **Valid Point:** Middleware specification was incomplete (redirect vs 401, role checking).
- **However:** This is a straightforward implementation detail: redirect unauthenticated users to login, return 403 for insufficient role.
- sunjin-erp's standard middleware pattern (from CLAUDE.md) is: session check → role check → redirect to login or 403.
- Page-level checks are secondary (defense in depth) for each specific route.

**Alignment:** Follows sunjin-erp middleware conventions.

**Resolution:** Document: "Middleware checks /notices/* paths. No session → redirect to /auth/login. Session exists, role < USER → return 403. Create/edit routes require MANAGER+ (checked at page level)."

---

### Issue #14: Oracle Sequence & ID Generation Strategy Unspecified
**Context:** This is a valid implementation concern but the solution is standard practice in sunjin-erp.

**Rebuttal:**
- **Valid Point:** Sequence generation was not explicitly specified (TypeORM config).
- **However:** sunjin-erp uses standard TypeORM + Oracle pattern: `@PrimaryGeneratedColumn('increment')` auto-creates sequences.
- Migration strategy is explicit in CLAUDE.md: `npx typeorm migration:generate` then `npx typeorm migration:run`.
- This is repeated in multiple existing modules—not ambiguous, just not re-documented in every PRD.

**Alignment:** Standard sunjin-erp pattern (reference CLAUDE.md and existing modules like 2031_기술지원관리).

**Resolution:** Implement per sunjin-erp standard. Add note in PRD: "Sequences auto-generated via TypeORM @PrimaryGeneratedColumn('increment'). See CLAUDE.md for migration commands."

---

### Issue #15: Soft Delete Query Complexity
**Context:** This is a valid concern about standardizing soft-delete filtering across the codebase.

**Rebuttal:**
- **Valid Point:** Soft-delete filtering strategy was not specified (automatic exclude vs explicit withDeleted()).
- **However:** This is an architectural decision that sunjin-erp should make ONCE for all modules, not per-PRD. The concern is valid but outside scope of notice board PRD.
- For Phase 1 implementation: default list queries exclude deleted records (WHERE deleted_at IS NULL). Admin recovery queries use explicit withDeleted() method.
- Statistics (comment count, attachment count) exclude deleted items by default.

**Alignment:** Aligns with sunjin-erp soft-delete principles (CLAUDE.md: "soft delete only").

**Resolution:** Document for notice board: "All list queries automatically exclude soft-deleted records. Admin recovery (Phase 2) uses explicit withDeleted() method. Statistics exclude deleted items." For codebase: create BaseEntity with standardized soft-delete helpers (separate initiative).

---

### Issue #16: Index Strategy Incomplete for Composite Filters
**Context:** This is a valid performance concern. The PRD specified basic indexes but missed composite scenarios.

**Rebuttal:**
- **Valid Point:** Index strategy was incomplete for all query patterns (type + search + author).
- **However:** The core indexes were specified. Missing indexes are additional optimization (Phase 1 MVP doesn't require all index combinations, Phase 2 performance tuning adds more as needed).
- For Phase 1, the specified indexes support common queries. Full-text search (Phase 2) will require FTS index setup.

**Alignment:** Pragmatic approach: index for MVP, optimize in Phase 2 based on query patterns.

**Resolution:** Add all recommended indexes from critical review: (1) (type, created_at), (2) (author_id, created_at), (3) (view_count DESC), (4) (notice_id, parent_comment_id, created_at). Plan FTS index for Phase 2.

---

### Issue #17: Cross-Role Editing Scenarios Undefined
**Context:** This is a valid authorization edge case, but the intended model is clear and correct.

**Rebuttal:**
- **Valid Point:** Specific cross-role scenarios were not explicitly documented.
- **However:** The authorization model is clear: only post owner (author_id == user.id) + ADMIN can edit/delete. No manager override for subordinate's content.
- This is correct: a manager should not be able to suppress a subordinate's post just because they're the manager. Only the author + admin.
- Employee soft-delete scenario: ON DELETE RESTRICT prevents orphaning, so author_id FK is always valid. If author is later soft-deleted (future feature), posts remain but admin-only editable.
- Session role is source of truth—role changes apply on next login.

**Alignment:** Follows sunjin-erp's clear ownership model (no role-based overrides for content control).

**Resolution:** Document: "Only post owner (author_id == user.id) or ADMIN can edit/delete. No manager override for subordinates. Role checks are current session role, not creation-time role."

---

### Issue #22: File Upload MIME Type Validation Weak
**Context:** This is a LEGITIMATE MEDIUM-priority security concern. The PRD was too simplistic in MIME validation.

**Rebuttal (Partial Concession):**
- **Valid Point:** MIME type validation via client-provided headers alone is insufficient. Magic number validation is required for security.
- **However:** The PRD's intent was to define ALLOWED types, not to specify validation mechanism (that's implementation detail). We accept this as a gap to address.
- SVG exclusion is necessary (JavaScript XSS risk). Only safe image types: JPEG, PNG.
- File signature validation: use file-type library to check magic numbers before storing.
- File naming: sanitize to alphanumeric + hyphen/underscore, max 100 chars. Store as UUID, original name in DB only.
- Virus scanning: deferred to Phase 2 (infrastructure cost, not MVP feature).

**Alignment:** Aligns with sunjin-erp security standards. Magic number validation is enterprise best practice.

**Resolution:** Implement magic number validation using file-type library. Allowed: JPEG, PNG, PDF, DOCX only (not SVG, not DOC). Sanitize filenames. Store as UUID on disk.

---

## Addressed Items Summary

The following HIGH and MEDIUM issues were already partially addressed or intended in the PRD:

1. **Issue #1** (Comment Authorization) — Already specified in US-6 and API section, just needed clarification
2. **Issue #2** (View Count Race Condition) — Explicitly deferred to Phase 2, acceptable risk acknowledged
3. **Issue #4** (Attachment Authorization) — Complete for Phase 1, privacy levels deferred to Phase 2
4. **Issue #5** (Comment Depth Constraint) — Application-level enforcement intended, just needed articulation
6. **Issue #8** (Role Transition) — Current-role-based authorization was implicit model, needed documentation
7. **Issue #9** (Large Content) — List design (no content display) already specified, max length gap identified
8. **Issue #10** (API Route Organization) — Routes are RESTful and correct, just needed defense
9. **Issue #11** (Server/Client Boundary) — Standard Next.js 14 pattern intended, needed explicit specification
10. **Issue #13** (Middleware Protection) — Standard sunjin-erp pattern, needed explicit specification
11. **Issue #14** (Oracle Sequences) — Standard TypeORM + Oracle pattern (see CLAUDE.md), needed reference
12. **Issue #15** (Soft Delete Queries) — Design principle clear, implementation pattern needed
13. **Issue #17** (Cross-Role Editing) — Owner-based model intended, needed explicit documentation

---

## Remaining Concerns Requiring Discussion/Decision

### Issue #6: Soft Delete Cascade (HIGH - REQUIRES DECISION)
- **Decision Required:** Confirm automatic cascade soft-delete behavior for Comments and Attachments when Notice is deleted
- **Impact:** Implementation approach (service method vs database trigger)
- **Status:** Needs explicit decision but solution is clear

### Issue #20: Employee Module Dependency (HIGH - BLOCKING)
- **Decision Required:** Confirm Employee module completion date and available attributes (name, email, role, department)
- **Impact:** Blocks notice board implementation until Employee module is complete
- **Status:** External dependency on Phase 1 completion; not PRD ambiguity

### Index Strategy (Issue #16)
- **Decision Required:** Confirm all recommended indexes: (author_id, created_at), (notice_id, parent_comment_id, created_at), FTS index
- **Impact:** Query performance in Phase 1 vs optimization in Phase 2
- **Status:** Pragmatic: implement core indexes (type, created_at, view_count) in Phase 1, add others based on profiling

### File Security (Issue #22)
- **Decision Required:** Confirm magic number validation implementation and allowed file types (JPEG, PNG, PDF, DOCX only)
- **Impact:** Security posture and upload validation logic
- **Status:** Needs explicit decision on file type whitelist

---

## Summary

The Notice Board PRD is **fundamentally sound** with the intended architecture and authorization model being correct and aligned with sunjin-erp standards. The 17 MEDIUM-priority issues identified by the critical review were primarily **specification gaps** (incomplete documentation of intended behavior) rather than **design flaws** (incorrect architectural choices).

**Key Clarifications Made:**
- Authorization model (ownership + ADMIN override) is correct and well-specified
- API routes are RESTful and correct
- Soft-delete strategy requires cascading (missing specification addressed)
- File security needs magic number validation (implementation requirement)
- Phase 1/Phase 2 separation is intentional and reasonable

**Remaining Actions:**
1. **Issue #6 & #20:** HIGH-priority blockers require external decisions (cascade behavior confirmation, Employee module completion)
2. **Index Strategy & File Security:** Implementation PRD should detail specific validation rules and index definitions
3. **Documentation:** Clarified points should be incorporated into implementation PRD (2101_01, 2101_02, etc.)

The review's overall assessment was overly pessimistic. With the clarifications above, the PRD is **ready for implementation** after resolving the two HIGH-priority blockers.

