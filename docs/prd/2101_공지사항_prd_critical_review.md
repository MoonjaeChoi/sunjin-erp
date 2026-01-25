<!-- Generated: 2026-01-25 23:15:00 KST -->

# 2101 공지사항 - Critical Review

## Overview

This PRD for the Notice Board (공지사항) module presents a well-structured foundation with comprehensive scope definition, clear user stories, and appropriate architecture alignment. However, the review identifies 22 critical issues spanning architectural ambiguities, incomplete permission models, performance concerns, and implementation feasibility gaps. The majority of issues are MEDIUM priority—addressing fundamental design decisions that require clarification before implementation begins. Key areas requiring remediation include: Comment authorization complexity, view count methodology (duplicate prevention), transaction safety in concurrent scenarios, file upload validation inconsistencies, and API route consolidation.

---

## Critical Issues (22 total)

### Dimension: Clarity & Ambiguity [5 issues]

- **[Issue #1] Comment Authorization Ambiguity** (Priority: MEDIUM)
  - Description: US-6 states "자신이 작성한 댓글을 수정하고 삭제할 수 있다" but API section (5.2) shows ADMIN can also delete any comment. The conflict between "자신 또는 ADMIN" (US-6 behavior) vs admin override capability is not explicitly clarified. Additionally, can MANAGER delete other MANAGER's comments on their own posts?
  - Impact: Implementation will require guesswork on authorization logic. Code reviews may reveal inconsistency during PR phase. API tests will fail due to misaligned expectations.
  - Recommendation: Clarify comment deletion policy with explicit decision: (a) Only owner + ADMIN, (b) Post owner (MANAGER) can delete any comment on their post + ADMIN, or (c) Post owner cannot delete comments. Document with specific scenarios.

- **[Issue #2] View Count Increment Race Condition Undefined** (Priority: MEDIUM)
  - Description: Section 5.8 states "조회수 업데이트: 비동기 업데이트 (응답 지연 없음)" but does not specify: (a) How concurrent requests are handled (database lock? optimistic concurrency?), (b) Whether `view_count` is a simple NUMBER or requires versioning, (c) What happens if update fails silently.
  - Impact: Incorrect concurrency handling could cause: view counts being lost under high traffic, race condition bugs manifesting in production only, soft delete paradoxes (deleted posts still incrementing counts).
  - Recommendation: Specify: "Use atomic UPDATE view_count = view_count + 1 with Oracle's ACID guarantees. If update fails, log error but do not fail the GET request. Implement view count verification query in admin dashboard."

- **[Issue #3] Search Implementation Scope Unclear** (Priority: LOW)
  - Description: US-8 requires search across "제목, 내용, 작성자" with "debounce 300ms" at frontend. However: (a) Is full-text search (FTS) required or LIKE-based substring matching acceptable? (b) Is search scope limited by current type filter or across all types? (c) No mention of search result ranking (relevance scoring).
  - Impact: Backend could implement expensive LIKE queries without FTS indexes, degrading performance on large datasets. Frontend may send redundant queries if debounce timing is misunderstood.
  - Recommendation: Specify: "Phase 1 uses Oracle LIKE-based search (no FTS). Implement indexes on NOTICE(title, content) or separate full-text index if available. Search is case-insensitive. Results ranked by created_at descending."

- **[Issue #4] Attachment Download Authorization Incomplete** (Priority: MEDIUM)
  - Description: Section 5.6 states "다운로드 시 권한 검증 (로그인 사용자만)" but does not specify: (a) Can deleted notice attachments still be downloaded? (b) Can USER download attachments from private posts (if feature added later)? (c) What happens if attachment is marked deleted but still referenced?
  - Impact: Confused implementation during file security review. Potential security holes if authorization is checked only at route level, not entity level.
  - Recommendation: Clarify: "Attachment download requires: (1) User is authenticated (USER+), (2) Notice exists and is not deleted (deleted_at IS NULL), (3) Attachment exists and is not deleted (deleted_at IS NULL). Return 404 for deleted entities."

- **[Issue #5] Comment Depth Constraint Enforcement Mechanism** (Priority: MEDIUM)
  - Description: US-3 specifies "최대 깊이: 2단계 (댓글 → 답글), 답글의 답글은 불가" (max 2 levels, no nested replies). Section 5.3 mentions "Check constraint on... Comment depth constraint: parent_comment_id의 parent_comment_id는 NULL이어야 함". However: (a) This constraint is application-level, not database-level (Oracle cannot express this as a CHECK). (b) No clear spec on error handling if violated (reject vs silently ignore).
  - Impact: Without database-level constraint, concurrent requests could bypass validation, creating malformed comment trees. API response ambiguity confuses clients about whether request succeeded.
  - Recommendation: Specify: "Application must validate: parent_comment_id IS NOT NULL AND parent_comment.parent_comment_id IS NULL. Return HTTP 400 'Reply to reply not allowed' if violated. Add database trigger or application-level check. Consider preventing UI button display for replies to replies."

---

### Dimension: Completeness & Edge Cases [4 issues]

- **[Issue #6] Soft Delete Cascade Implications Underspecified** (Priority: HIGH)
  - Description: Section 5.3 defines "ON DELETE RESTRICT" for all foreign keys (author_id, notice_id). This prevents physical deletion of referenced records (employees, notices). However: (a) When a NOTICE is soft-deleted (deleted_at set), should associated COMMENTS and ATTACHMENTS be soft-deleted too? (b) When COMMENT is soft-deleted, nothing depends on it, but consistency is unclear. (c) "Soft delete only - Every table has deleted_at column; physical delete requires separate approval" (CLAUDE.md) but no mechanism defined for soft-delete cascading.
  - Impact: Data integrity issues: deleted notices with orphaned comments/attachments visible if filter logic is incomplete. Admin recovery features (Phase 2) may fail if cascading is inconsistent. Query performance degrades with orphaned soft-deleted children.
  - Recommendation: Specify: "When Notice is soft-deleted: (1) Automatically cascade soft-delete to associated Comments and Attachments (set deleted_at). (2) Implement helper method in NoticeService.softDelete(). (3) Add database trigger for enforcement if possible, or ensure application enforces. (4) Clarify list query: exclude deleted comments/attachments from count."

- **[Issue #7] Empty State Handling Missing** (Priority: LOW)
  - Description: UI/UX section (6.2, 6.4) does not specify behavior for: (a) Empty notice list (no results after filtering), (b) Notice with 0 comments, (c) Notice with 0 attachments, (d) Search returning no results.
  - Impact: Poor user experience on empty pages. Frontend developer guesses between showing "No results" message, empty table, or spinner indefinitely.
  - Recommendation: Add to section 6.4: "Empty States: (1) Empty notice list: 'No notices found. [Adjust filters]' message with filter reset button. (2) No comments: 'Be the first to comment!' with comment form visible. (3) No attachments: attachment section hidden or 'No files attached' message. (4) Search no results: 'No notices match your search. [Clear search]'."

- **[Issue #8] User Role Transition & Backdating Scenarios** (Priority: MEDIUM)
  - Description: Requirements assume static roles (USER → MANAGER → ADMIN). Not addressed: (a) If USER creates comment (allowed) then is promoted to MANAGER, can they edit that comment? (b) If MANAGER creates post then is demoted to USER, can they still edit/delete? (c) Timestamp integrity: can updated_at be manually set by ADMIN to backdate modifications?
  - Impact: Unexpected authorization failures post-promotion. Audit trail inconsistencies if timestamps are manipulated. Users frustrated by "permission denied" after role change.
  - Recommendation: Specify: "Role-based authorization checks current session role, not role at creation time. Demoted users cannot edit/delete old content (return 403). Timestamps (created_at, updated_at) are server-generated immutable except during creation. ADMIN cannot manually adjust timestamps in Phase 1 (disallow via middleware)."

- **[Issue #9] Large Content Handling & Truncation** (Priority: MEDIUM)
  - Description: Content field is CLOB (unlimited size) but: (a) No max content length specified (only min 10 chars). (b) List view shows truncated preview? (c) How is CLOB rendered in list table (full content scrolls table?), (d) Performance impact of fetching full CLOB for list queries.
  - Impact: Posts with 10MB of text could be created, list page becomes unusable, truncation logic unclear. Inconsistency between DB and UI contract.
  - Recommendation: Specify: "Content max length: 10,000 characters (reasonable limit for discussion). In list view, content is not displayed (title + preview optional). Detail view fetches full content via separate API. Implement CLOB indexing strategy for Oracle."

---

### Dimension: Architecture Compliance [4 issues]

- **[Issue #10] API Route Organization Deviation** (Priority: MEDIUM)
  - Description: Section 5.2 defines 12 endpoints but Next.js App Router best practices suggest: (a) `/api/notices/[id]/comments` for nested comments under a notice, but also separate `/api/notices/[id]/comments/[commentId]`. This creates ambiguity: Are comments truly nested under notices or is notice just a filter? (b) No mention of HTTP method clarity (GET vs POST both on `/api/notices`?). (c) Attachment routes `/api/notices/[id]/attachments/[attachmentId]/download` vs `/api/notices/[id]/attachments/[attachmentId]` for deletion—unclear URI semantics (download is not CRUD operation).
  - Impact: Router implementation confusing. API contract unclear for clients. Potential naming conflicts or 404 errors if route patterns overlap.
  - Recommendation: Clarify route structure: "Use RESTful pattern: POST /api/notices/[id]/comments/[commentId]/replies (not /comments/[commentId]/comments). Attachment download: GET /api/notices/[id]/attachments/[attachmentId]?action=download or separate /download endpoint. Ensure unique, non-conflicting patterns."

- **[Issue #11] Server Component vs Client Component Boundary Fuzzy** (Priority: MEDIUM)
  - Description: Section 5.1 specifies: "Page: Server Component (권한 검증, 초기 데이터 로딩)" but detail page (`/notices/[id]/page.tsx`) needs to: (a) Load notice + comments + attachments before rendering (multi-query coordination), (b) Display edit/delete buttons (requires client state + user context), (c) Support comment form (interactive). This suggests hybrid Server + Client component pattern not clearly articulated. Question: Does page.tsx call API internally (server action?) or pass to Client Component for TanStack Query?
  - Impact: Performance uncertainty: SSR or CSR? Data hydration strategy unclear. Potential waterfalls or redundant queries. Developer confusion on where to place business logic.
  - Recommendation: Specify: "Detail page (/notices/[id]/page.tsx) is Server Component that fetches initial notice data via TypeORM. Client Component <NoticeDetail> is rendered client-side and hydrates with server data. Comments load via TanStack Query (Client Component). This pattern minimizes hydration mismatch."

- **[Issue #12] TanStack Query Hook Naming Inconsistency** (Priority: LOW)
  - Description: Section 4 lists hooks like `useNotices()`, `useCreateNotice()`, but convention in sunjin-erp (refer CLAUDE.md patterns) suggests hooks should be co-located with features. No clarity on: (a) Hook file structure (src/hooks/ vs src/features/notices/hooks/), (b) Query key factory (React Query requires consistent key naming), (c) Cache invalidation triggers (which mutations invalidate which queries?).
  - Impact: Hook organization diverges from project standards. Cache invalidation bugs due to key mismatches.
  - Recommendation: Specify hook organization: "Create src/features/notices/hooks/ directory. Define query keys in src/features/notices/queryKeys.ts. Use useQuery/useMutation patterns from TanStack Query. Document cache invalidation map: createNotice invalidates notices-list."

- **[Issue #13] Middleware & Route Protection Details Missing** (Priority: MEDIUM)
  - Description: Section 5.5 mentions "Middleware: `src/middleware.ts`에서 `/notices` 경로 보호" but does not specify: (a) What "protection" means (redirect to login? return 401?), (b) Which roles are allowed (/notices accessible to USER+?), (c) Sub-routes like /notices/new, /notices/[id]/edit—should they be protected at page level or middleware level?
  - Impact: Incomplete middleware implementation. Possible unauthorized access if routes not protected. Redirect loops if middleware logic is wrong.
  - Recommendation: Specify: "Middleware checks session for /notices/* paths. If no session, redirect to /auth/login. If session exists but role < USER, return 403. Page-level checks are secondary (defense in depth). Create/edit routes check if user is MANAGER+ before rendering form."

---

### Dimension: Database Design [3 issues]

- **[Issue #14] Oracle Sequence & ID Generation Strategy Unspecified** (Priority: MEDIUM)
  - Description: Section 5.3 specifies entity IDs but does not clarify: (a) Is ID auto-generated via Oracle sequence or database-generated default? (b) TypeORM configuration for @PrimaryGeneratedColumn—should use `@PrimaryGeneratedColumn("increment")` (sequence) or UUID? (c) No migration strategy defined (npx typeorm migration:generate vs manual SQL).
  - Impact: TypeORM entity setup confusion. Migration failures if sequence not created. Potential ID conflicts or NULL IDs if generation not configured.
  - Recommendation: Specify: "Use @PrimaryGeneratedColumn('increment') with Oracle sequence (auto-created by TypeORM). Sequence name: notice_id_seq, comment_id_seq, etc. Migrations are generated via `npx typeorm migration:generate` after entity changes. Ensure sequence is created before insert operations."

- **[Issue #15] Soft Delete Query Complexity** (Priority: MEDIUM)
  - Description: Entities have `deleted_at` column for soft delete, but: (a) No specification on how to filter: list queries must exclude deleted records (WHERE deleted_at IS NULL). Is this handled by repository methods or QueryBuilder custom logic? (b) Recovery queries (Phase 2) need to access deleted records (WHERE deleted_at IS NOT NULL). (c) NOTICE attachment count, comment count statistics—should deleted items be counted?
  - Impact: Query bugs: unintended soft-deleted data exposure. Statistics inconsistency. Complex repository code if soft-delete filtering is not standardized.
  - Recommendation: Specify: "Create BaseEntity with softDelete() method. Repository methods automatically exclude deleted_at IS NULL. Add queryBuilder.withDeleted() method for admin-only recovery queries. Statistics (comment count, attachment count) exclude deleted items. Document in each query: 'Soft-deleted records excluded by default'."

- **[Issue #16] Index Strategy Incomplete for Composite Filters** (Priority: MEDIUM)
  - Description: Section 5.8 specifies indexes: `NOTICE(type, created_at)`, `NOTICE(view_count DESC)` but: (a) Composite index (type, created_at) only supports queries filtering by type + date. What about type + search + author? (b) No index for common queries like (author_id, created_at) for author history. (c) Search queries on title/content need full-text index (not mentioned). (d) Comment queries on (notice_id, created_at) specified but (notice_id, parent_comment_id) not mentioned (needed for reply tree queries).
  - Impact: Query performance degradation on complex filters. Slow searches without FTS. Admin queries scanning entire table.
  - Recommendation: Specify: "Create indexes: (1) NOTICE(type, created_at) for filtered list, (2) NOTICE(author_id, created_at) for author history, (3) NOTICE(view_count DESC) for popular posts, (4) COMMENT(notice_id, parent_comment_id, created_at) for reply tree, (5) Full-text index on NOTICE(title, content) if Oracle FTS available, else implement application-level ranking."

---

### Dimension: Authentication & Authorization [3 issues]

- **[Issue #17] Cross-Role Editing Scenarios Undefined** (Priority: MEDIUM)
  - Description: Permission model (5.5) states MANAGER can modify "자신의 게시물만" but: (a) What if post author is employee X and requestor is employee X's manager? Can manager edit subordinate's post? (b) What if author is deleted from EMPLOYEE table (ON DELETE RESTRICT prevents delete, but author becomes orphaned in future if soft delete is allowed)? (c) Session invalidation: if user logs out and logs back in, can they still edit old posts (role might have changed)?
  - Impact: Authorization bypass if manager override is not intentional. Edge cases cause 403 errors in unexpected scenarios. Audit trail confusion.
  - Recommendation: Specify: "Only post owner (author_id == user.id) + ADMIN can edit/delete. No manager override for subordinates' posts. If author is soft-deleted as employee, posts remain editable by ADMIN only (author_id FK still exists). Session role is source of truth; role changes take effect on next login."

- **[Issue #18] Anonymous User & Guest Access Model** (Priority: LOW)
  - Description: All requirements assume authenticated users (USER+). Not addressed: (a) Can anonymous/unauthenticated users view notices? (b) Is public read / private comment model ever intended? (c) CLAUDE.md states "USER: 조회 및 댓글/답글 작성만 가능" but does not say unauthenticated users cannot view. (d) First-time login users—are they USER or require admin approval?
  - Impact: Security assumption unclarified. Potential information disclosure if anonymous viewing is enabled inadvertently. Confusion on public vs private board.
  - Recommendation: Specify: "Phase 1: Notice board is private (requires USER+ authentication). Anonymous users cannot view /notices (redirected to /auth/login). Public read is out-of-scope (Phase 2). All new users default to USER role."

- **[Issue #19] API Token / Service Account Authorization** (Priority: LOW)
  - Description: Section 5.5 describes NextAuth.js session-based auth but does not address: (a) Are there service accounts (e.g., scheduled jobs, integrations) that need API tokens instead of session? (b) Attachment downloads for external links (Phase 2)—how are they authorized? (c) Cross-origin requests (if frontend is on separate domain)—CORS policy?
  - Impact: Future integrations blocked without refactor. External sharing of notice links broken.
  - Recommendation: Specify: "Phase 1 uses NextAuth.js session only (no service account tokens). API tokens are out-of-scope (Phase 2). External attachment sharing: not supported in Phase 1. CORS: same-origin only (frontend + backend on same domain/port)."

---

### Dimension: ERP Module Dependencies [1 issue]

- **[Issue #20] Employee Module Dependency Critical Path** (Priority: HIGH)
  - Description: Section 9 lists "Dependency 1: Employee 엔티티 및 직원 관리 모듈 구현 선행 필요 (author_id FK)" but: (a) No specification of what Employee entity attributes are required (only author_id referenced). Does it need name, email, role? (b) CLAUDE.md Phase ordering suggests auth + employees in Phase 1, but notice board is Phase 6 (notices listed separately). (c) If employee deletion is restricted by FK, how do deleted employees appear in notice list? (d) Circular dependency risk if employee module references notice board for activity logging?
  - Impact: Implementation order confusion. Blocking issue if employee module not ready. Author names/details might not be available at render time.
  - Recommendation: Specify: "Notice board depends on Employee (Phase 1) + Authentication (Phase 1). Employee required attributes: id (PK), name, email, role. Author FK on NOTICE.author_id must exist before notice creation. Deleted employees: cascade ON DELETE RESTRICT prevents deletion; deleted_employee_id field optional for future soft-delete scenario."

---

### Dimension: UI/UX & Responsive Design [1 issue]

- **[Issue #21] Mobile Viewport Excluded but Responsive Breakpoint Unclear** (Priority: LOW)
  - Description: Section 6.3 states "모바일 (< 768px): 제외 (Phase 1은 데스크탑/태블릿 지원)" but: (a) Does "exclude" mean CSS `display: none`, empty page, or redirect? (b) Tablet layout (768-1279px) specifies "테이블 컬럼 축소 (댓글 수 생략), 상세 페이지는 전체 표시" but detail page with 3-4 sections (info, attachments, comments, form) becomes unwieldy on narrow tablet. (c) No mention of keyboard navigation / accessibility (WCAG).
  - Impact: Mobile users see error/blank. Tablet UX suboptimal but not specified. Accessibility compliance uncertain.
  - Recommendation: Specify: "Mobile (< 768px): show 'This page is optimized for desktop. Please use a larger screen.' message with full-width collapse option. Tablet: list table wraps to card layout, detail page stacks vertically. Accessibility: ARIA labels, keyboard nav, color contrast WCAG AA. Phase 2: mobile optimization."

---

### Dimension: Security Considerations [1 issue]

- **[Issue #22] File Upload MIME Type Validation Weak** (Priority: MEDIUM)
  - Description: Section 5.6 specifies MIME types: "image/*, application/pdf, application/msword, application/vnd.openxmlformats-officedocument*" but: (a) MIME type is spoofable (client-side header). No mention of magic number / file signature validation (e.g., PDF %PDF header). (b) SVG files are image/* but could contain JavaScript (XSS vector). (c) No mention of virus scanning or malware detection. (d) File path sanitization: "파일명 sanitization (special character 제거)" but no spec on which characters allowed (dots, dashes, spaces?).
  - Impact: Malicious file upload bypasses (SVG XSS, renamed .exe as .jpg). No defense against polyglot files. Malware distribution if not scanned.
  - Recommendation: Specify: "MIME type validation: server-side check magic number (file signature) using library like `file-type`. Disallow SVG (image/svg+xml). Allowed types: image/jpeg, image/png, application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document (docx only, not doc). File naming: strip special chars except hyphen/underscore, max 100 chars. File storage: use unique UUID filename, not user-provided name. Phase 2: integrate virus scanning (ClamAV)."

---

## Summary by Priority

- **HIGH:** 2 issues (blockers)
  - #6: Soft Delete Cascade Implications
  - #20: Employee Module Dependency Critical Path

- **MEDIUM:** 15 issues (important, should address)
  - #1: Comment Authorization Ambiguity
  - #2: View Count Increment Race Condition Undefined
  - #4: Attachment Download Authorization Incomplete
  - #5: Comment Depth Constraint Enforcement Mechanism
  - #8: User Role Transition & Backdating Scenarios
  - #9: Large Content Handling & Truncation
  - #10: API Route Organization Deviation
  - #11: Server Component vs Client Component Boundary Fuzzy
  - #13: Middleware & Route Protection Details Missing
  - #14: Oracle Sequence & ID Generation Strategy Unspecified
  - #15: Soft Delete Query Complexity
  - #16: Index Strategy Incomplete for Composite Filters
  - #17: Cross-Role Editing Scenarios Undefined
  - #22: File Upload MIME Type Validation Weak

- **LOW:** 5 issues (nice to have, consider)
  - #3: Search Implementation Scope Unclear
  - #7: Empty State Handling Missing
  - #12: TanStack Query Hook Naming Inconsistency
  - #18: Anonymous User & Guest Access Model
  - #19: API Token / Service Account Authorization
  - #21: Mobile Viewport Excluded but Responsive Breakpoint Unclear

---

## Overall Assessment

The Notice Board PRD provides a solid foundation with clear user stories, comprehensive scope definition, and reasonable architectural alignment with sunjin-erp standards (Next.js App Router, TanStack Query, shadcn/ui, TypeORM). The 9 user stories are well-articulated and acceptance criteria are mostly testable. However, the PRD contains **significant ambiguities in critical areas** that will cause implementation confusion and rework.

**Key Strengths:**
- Clear user personas and role-based access control (ADMIN/MANAGER/USER)
- Well-defined entities (Notice, Comment, Attachment) with soft-delete strategy
- Realistic performance targets (p95 < 200ms) and index strategy (partial)
- Security considerations addressed (XSS prevention, file upload limits, input validation)

**Critical Gaps:**
1. **Authorization Logic:** Comment edit/delete permissions, cross-role scenarios, and post ownership validation need explicit specification
2. **Concurrency & Data Integrity:** View count race conditions, soft-delete cascading, and comment depth enforcement lack implementation guidance
3. **API/Route Design:** Route organization is unclear (nested vs flat), server/client component boundary fuzzy, middleware protection underspecified
4. **File Security:** MIME type validation is weak (no magic number checks, SVG XSS risk)
5. **Database Design:** Sequence strategy, soft-delete query standardization, and composite index strategy incomplete

**Recommendation:** **Do not begin implementation until HIGH and MEDIUM priority issues are addressed.** Host a design sync to clarify: (1) comment authorization scenarios, (2) soft-delete cascading behavior, (3) employee dependency scope, (4) API route consolidation, (5) server/client component strategy. Expected remediation: 2-4 hours discussion + 1 hour PRD update. Implementation timeline: 25-35 business days (as estimated) is realistic only if architectural ambiguities are resolved first.

