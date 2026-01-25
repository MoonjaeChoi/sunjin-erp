<!-- Generated: 2026-01-25 23:45:00 KST -->

# 2101 공지사항 - Final Decisions

## Overview

This document presents AI-mediated decisions for 15 design topics identified during the PRD review cycle (critical review, rebuttal, discussion topics). The decision process evaluated trade-offs, alignment with sunjin-erp architecture patterns, and MVP feasibility.

**Decision Outcome:**
- **2 HIGH-priority topics:** Strong recommendations with security/architectural justification
- **8 MEDIUM-priority topics:** Pragmatic decisions aligned with Phase 1 scope and sunjin-erp conventions
- **5 LOW-priority topics:** Default recommendations with flexibility for implementation team

**Total Decisions:** 15 (all topics resolved with explicit recommendations)

---

## High Priority Decisions (2)

### Decision #1: Soft Delete Cascade Strategy

**Topic:** When a Notice is soft-deleted (deleted_at set), should Comments and Attachments be automatically cascaded to soft-deleted status?

**Options Evaluated:**
1. **Cascade soft-delete:** Automatically set deleted_at on Comments and Attachments when Notice is deleted (recommended)
2. **No cascade:** Comments/Attachments remain with deleted_at = NULL, list queries must handle orphaned records
3. **Hard delete children:** Physical remove Comments/Attachments when Notice is soft-deleted (violates soft-delete principle)

**Final Decision:** Option 1 - Cascade soft-delete

**Rationale:**
- Aligns with enterprise soft-delete patterns (Stripe, GitHub, Shopify) where cascading maintains referential integrity in soft-delete scenarios
- Prevents orphaned soft-deleted records that complicate queries ("find all non-deleted comments" requires checking both notice.deleted_at and comment.deleted_at)
- Maintains audit trail consistency: soft-deleted parent → soft-deleted children (all marked at same timestamp)
- sunjin-erp principle (CLAUDE.md): "Soft delete only" implies consistent treatment across related entities
- Simplifies list queries: `WHERE deleted_at IS NULL` works correctly without orphan handling logic
- Enables future recovery features (Phase 2): cascaded deletion can be reversed together

**Implementation Impact:**
- Create `NoticeService.softDelete(noticeId)` method that:
  1. Sets NOTICE.deleted_at = NOW()
  2. Cascades to COMMENT: UPDATE COMMENT SET deleted_at = NOW() WHERE notice_id = ? AND deleted_at IS NULL
  3. Cascades to NOTICE_ATTACHMENT: UPDATE NOTICE_ATTACHMENT SET deleted_at = NOW() WHERE notice_id = ? AND deleted_at IS NULL
- Add DELETE route handler to call `noticeService.softDelete()` instead of direct UPDATE
- No database trigger needed (application-level cascade is clearer for business logic)
- Update repository queries: `noticeRepository.find({ where: { deleted_at: IsNull() } })` pattern excludes soft-deleted records automatically

**Trade-offs Accepted:**
- Users cannot selectively recover comments if notice is recovered (recovery is all-or-nothing) — acceptable for MVP, Phase 2 can add granular recovery
- Requires service method instead of simple UPDATE query — trade-off for data integrity is worthwhile

**Approval:** ✓ APPROVED

---

### Decision #2: File Upload MIME Type Validation Strategy

**Topic:** What security level for file upload validation? Should validation rely on MIME type headers only or require magic number verification?

**Options Evaluated:**
1. **Extension whitelist only:** Check file extension, trust client-provided MIME type (weak)
2. **MIME type whitelist:** Server-side check MIME header without magic bytes (moderate)
3. **Magic number validation + whitelist:** Validate file signature using file-type library + whitelist allowed types (recommended)

**Final Decision:** Option 3 - Magic number validation + moderate whitelist

**Rationale:**
- **Security requirement (non-negotiable):** MIME type spoofing is trivial (client can set any header). SVG files are image/* but contain JavaScript (XSS vector). Magic number verification prevents polyglot attacks.
- **OWASP best practice:** File type validation should use magic bytes (file signature), not client-provided headers
- **Allowed file types (strict whitelist):** JPEG, PNG, GIF, PDF, DOCX, PPTX only
  - Include: JPEG/PNG (most common images), GIF (for compatibility), PDF (documents), DOCX/PPTX (modern Office formats)
  - Exclude: SVG (XSS risk, JavaScript capable), DOC (legacy, security issues), generic image/* (catches spoofed files)
- **Implementation simplicity:** file-type library (npm) handles magic byte detection with minimal code
- **Enterprise requirement:** sunjin-erp is internal system but handles business-critical documents → security-first approach appropriate

**Implementation Impact:**
- Install dependency: `npm install file-type` (lightweight library)
- Create `FileValidationService.validateUpload(file)`:
  1. Check file extension (allows: .jpg, .jpeg, .png, .gif, .pdf, .docx, .pptx)
  2. Read file magic bytes using file-type library
  3. Verify magic type matches whitelist (mime.mimeType must be one of: image/jpeg, image/png, image/gif, application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document, application/vnd.openxmlformats-officedocument.presentationml.presentation)
  4. Return validation result (pass/fail) with specific error reason
- File naming sanitization:
  - Strip special characters except hyphen/underscore
  - Allow alphanumeric + "-_" only
  - Max 100 characters for original filename (stored in DB for display)
  - Generate UUID filename for disk storage (prevents directory traversal attacks)
- Store validation in API route handler before file write
- Return HTTP 400 with specific error ("Unsupported file type: SVG files not allowed") if validation fails

**Trade-offs Accepted:**
- Rejects legacy .doc format (users must save as .docx) — acceptable, encourages modern formats
- Requires file-type dependency — minimal overhead, standard industry practice
- Slightly more CPU for magic byte validation — negligible for small files (10MB limit)

**Approval:** ✓ APPROVED

---

## Medium Priority Decisions (8)

### Decision #3: Comment Depth Limit Enforcement Strategy

**Topic:** How to enforce max 2-level comment nesting (comment → reply, no reply-to-reply)?

**Options Evaluated:**
1. **Application-level validation only:** Validate in API route; return HTTP 400 if user tries to reply to a reply. UI hides reply button for level-2 comments (recommended)
2. **Database trigger + Application validation:** Oracle trigger enforces at DB layer, application validates too (defense in depth)
3. **UI-only prevention:** Hide reply button for replies only, no API-level validation

**Final Decision:** Option 1 - Application-level validation + UI prevention

**Rationale:**
- sunjin-erp principle (CLAUDE.md): Application layer handles business rules, database handles structural integrity
- Clearer error messages to client ("Reply to reply not allowed") vs cryptic database error
- Easier unit testing and debugging than database triggers
- Defense in depth: UI prevents users from accidentally triggering depth violation, API validates malicious direct calls
- Database trigger complexity not justified for simple rule (parent_comment_id IS NOT NULL → parent.parent_comment_id MUST BE NULL)

**Implementation Impact:**
- API route handler POST `/api/notices/[id]/comments`:
  1. Validate: if parent_comment_id is provided, fetch parent comment
  2. If parent.parent_comment_id IS NOT NULL, return HTTP 400: `{ error: "Cannot reply to a reply. Replies can only be made to top-level comments." }`
  3. Otherwise, create comment normally
- UI: Hide reply button for comments where comment.parent_comment_id IS NOT NULL (only show reply button for level-1 comments)
- Add unit test: attempt to create reply to reply, verify 400 response

**Trade-offs Accepted:**
- Malicious client could craft direct API call, but validation catches it and returns 400 — acceptable security posture

**Approval:** ✓ APPROVED

---

### Decision #4: View Count Duplicate Prevention Mechanism

**Topic:** How to handle repeated views by same user? Count all views or deduplicate?

**Options Evaluated:**
1. **Count all views:** Every GET increments view_count (simplest, no deduplication)
2. **Session-based deduplication:** Track viewed notices in session; increment only once per session per notice (recommended)
3. **Database-based deduplication:** Track (user_id, notice_id, viewed_at) pairs; increment once per day/week

**Final Decision:** Option 2 - Session-based deduplication

**Rationale:**
- Phase 1 MVP should balance simplicity and accuracy — session-based (Option 2) is middle ground
- PRD explicitly states "Phase 1은 제한 없음" but doesn't prevent lightweight deduplication (session storage is negligible overhead)
- Session-based prevents same-user rapid clicks within one browser session (realistic duplicate prevention)
- Re-increments on new session (next day/logout) → captures genuine repeat interest over time
- Avoids full database tracking (Option 3) which adds NoticeView table, migrations, and query complexity
- Still allows accurate "total impressions" metric (useful for popular content ranking)

**Implementation Impact:**
- Add session tracking in API route `GET /api/notices/[id]`:
  1. Get session: `const session = await getServerSession()`
  2. Initialize session.viewed_notices as Set (or array) if not exists
  3. Check if notice already in viewed set: `if (!session.viewed_notices.has(noticeId))`
  4. If not viewed in session: increment view_count and add to session.viewed_notices
  5. If already viewed: fetch and return current view_count without increment
- Use `sessionStorage` or cookies if sessions unavailable (minimal fallback)
- No database schema changes needed

**Trade-offs Accepted:**
- Users who refresh page or reload don't increment (may seem unintuitive but accurate) — acceptable for Phase 1
- Full deduplication (daily/weekly prevention) deferred to Phase 2 when analytics requirements clarified

**Approval:** ✓ APPROVED

---

### Decision #5: Search Scope & Relevance Ranking

**Topic:** Should search use simple LIKE substring matching or full-text search (FTS) with relevance ranking?

**Options Evaluated:**
1. **Simple LIKE substring search:** Search NOTICE(title) OR NOTICE(content) LIKE '%query%', sorted by created_at (recommended)
2. **Full-text search with relevance:** Use Oracle Text (FTS extension) for relevance ranking
3. **Hybrid:** LIKE search with manual relevance heuristics

**Final Decision:** Option 1 - Simple LIKE substring search (Phase 1), FTS evaluation planned for Phase 2

**Rationale:**
- Phase 1 MVP: LIKE search is sufficient for small dataset (initial deployment unlikely to have 100K+ notices)
- Oracle Text (FTS) requires license/setup verification and infrastructure decision best made separately (not MVP blocker)
- Manual relevance heuristics (Option 3) are fragile and hard to maintain
- LIKE search with indexes `NOTICE(title, content)` or composite indexes provides acceptable performance (<100ms for reasonable dataset)
- Results sorted by created_at DESC (latest first) is intuitive for internal communication board
- Allows Phase 2 evaluation: if search volume/dataset grows, FTS can be added without breaking API contract

**Implementation Impact:**
- API route `GET /api/notices?search=query`:
  1. Build query: `WHERE deleted_at IS NULL AND (title LIKE '%' + query + '%' OR content LIKE '%' + query + '%')`
  2. Sort by: created_at DESC (latest first)
  3. Implement LIKE case-insensitively (Oracle default)
  4. Add indexes: create index idx_notice_title on NOTICE(title); create index idx_notice_content on NOTICE(content) if Oracle supports full-text indexing, else standard column index
- Test query performance with sample data (aim for <100ms response time)
- If performance degrades (Phase 2): plan Oracle Text evaluation as separate initiative

**Trade-offs Accepted:**
- Results not ranked by relevance (all matches equally weighted) — acceptable for internal board, relevant results often at top anyway due to content freshness
- "cat" search matches "concatenate" (no word boundary) — acceptable, use case is internal search not public search engine

**Approval:** ✓ APPROVED

---

### Decision #6: Notice Type Categorization Strategy

**Topic:** Should notice types (공지, 공유, 지시, 건의, 자유) be hardcoded enum or database-backed flexible categories?

**Options Evaluated:**
1. **Hardcoded enum:** 5 fixed values checked via CHECK constraint (recommended)
2. **Database-backed categories:** NOTICE_TYPE table allows ADMIN to add new types
3. **Multi-select tags:** Notices can have multiple tags (scope expansion)

**Final Decision:** Option 1 - Hardcoded enum (5 values: 공지, 공유, 지시, 건의, 자유)

**Rationale:**
- PRD strongly implies fixed types (enumerated 5 values, no mention of dynamic categories)
- sunjin-erp principle: KISS (Keep It Simple) — flexible categories add complexity (new table, migrations, admin UI in Phase 2) without clear MVP requirement
- Hardcoded enum is type-safe (cannot accidentally create "공지X" typo), indexed efficiently, checked at DB level
- If organizational need changes → Phase 2 can redesign with proper UX (admin category management page)
- 5 types (공지, 공유, 지시, 건의, 자유) cover typical internal communication needs adequately

**Implementation Impact:**
- Define in TypeORM entity: `@Column('varchar', { enum: ['공지', '공유', '지시', '건의', '자유'] })`
- Create CHECK constraint in migration: `ALTER TABLE NOTICE ADD CONSTRAINT chk_notice_type CHECK (type IN ('공지', '공유', '지시', '건의', '자유'))`
- API validation: verify type is in allowed enum before insert/update
- UI: use Select dropdown with hardcoded options (no dynamic fetch from NOTICE_TYPE table)

**Trade-offs Accepted:**
- Inflexible if organization wants new type → requires code deployment (acceptable for rare change)
- No admin UI for category management (Phase 1 scope explicit)

**Approval:** ✓ APPROVED

---

### Decision #7: Attachment Storage Strategy

**Topic:** Should attachment files be stored on local file system or cloud blob storage (AWS S3)?

**Options Evaluated:**
1. **Local file system:** Store in ./public/uploads/notices/{noticeId}/{filename} (Phase 1 MVP)
2. **AWS S3 / Azure Blob Storage:** Cloud storage for scalability
3. **Hybrid:** Local FS for Phase 1, plan S3 migration for Phase 2 (recommended)

**Final Decision:** Option 3 - Hybrid approach

**Rationale:**
- Staging server (192.168.75.194:3200) is single-container deployment → local file system works fine for Phase 1
- Production deployment (future, Phase 2 or later) will need cloud storage for scalability
- sunjin-erp hasn't specified production deployment infrastructure yet → storage strategy decision best made with that context
- Hybrid allows fast MVP delivery without cloud dependency
- Design abstraction layer (FileStorageService) enables easy provider swap

**Implementation Impact:**
- Phase 1: Implement local file system storage as specified in PRD
  - Create uploads directory structure: ./public/uploads/notices/{noticeId}/
  - Store files with UUID filename (prevent directory traversal): `{uuid}_{sanitized_original_name}`
  - Store file metadata in DB (original filename, file_path, mime_type)
  - API route `GET /api/notices/[id]/attachments/[attachmentId]/download` streams file from disk
- Design FileStorageService interface:
  ```typescript
  interface IFileStorageService {
    uploadFile(file: File, destinationPath: string): Promise<string>; // returns file URL
    downloadFile(filePath: string): Promise<Buffer>;
    deleteFile(filePath: string): Promise<void>;
  }
  ```
- Implement LocalFileStorageService for Phase 1
- Phase 2: Plan S3StorageService implementation (separate PRD)
- Dependency injection: inject FileStorageService implementation, allowing provider swap without code changes

**Trade-offs Accepted:**
- Single-server storage not scalable (acceptable for Phase 1/staging)
- No backup strategy in Phase 1 (Phase 2 can add backup/disaster recovery)
- Phase 2 requires migration from local FS to S3 (separate initiative)

**Approval:** ✓ APPROVED

---

### Decision #8: Server-Side Rendering Strategy for Detail Page

**Topic:** Should detail page (`/notices/[id]`) use Server-Side Rendering (SSR), Static Generation (SSG), or Client-Side Rendering (CSR)?

**Options Evaluated:**
1. **Server-Side Rendering (SSR):** Render on each request (simple but slow)
2. **Static Site Generation (SSG) with ISR:** Pre-generate pages, revalidate on-demand (recommended)
3. **Client-Side Rendering (CSR):** Server renders shell, client hydrates with TanStack Query

**Final Decision:** Option 2 - SSG with ISR (Incremental Static Regeneration)

**Rationale:**
- Notice detail page has semi-dynamic data: notice text/metadata is static (rarely changes), comments are dynamic (added frequently)
- ISR pattern perfect fit: render detail page with notice data at build time or on-demand, revalidate when notice changes, comments load client-side via TanStack Query
- Next.js 14 natively supports ISR with `revalidatePath()` — no additional setup needed
- Performance benefits: cached HTML served instantly (fast FCP), comments load separately (not blocking page load)
- Enables future caching improvements (CDN, edge caching) without code changes
- Aligns with sunjin-erp architecture: Server Component for initial data, Client Component for interactive elements

**Implementation Impact:**
- Page component (`/app/(main)/notices/[id]/page.tsx`):
  ```typescript
  export const revalidate = 3600; // ISR: revalidate every 1 hour or on-demand

  export default async function NoticePage({ params }) {
    const notice = await db.notice.findById(params.id); // Server-side fetch
    if (!notice) notFound();
    return <NoticeDetail notice={notice} />; // Hydrate client component
  }
  ```
- Client component (`NoticeDetail.tsx`) loads comments via TanStack Query hook: `useComments(noticeId)`
- Update notice mutation invalidates cache: call `revalidatePath('/notices/[id]')` when notice is updated
- Update comment mutation only invalidates comments-list query (doesn't regenerate page)

**Trade-offs Accepted:**
- Initial build time increased slightly (regenerates on-demand) — acceptable, ISR generates only requested pages
- Cache invalidation requires explicit `revalidatePath()` call (not automatic) — developers must remember to call it (mitigated by mutation hook that calls it automatically)

**Approval:** ✓ APPROVED

---

### Decision #9: Notice Board Search Across Soft-Deleted Records

**Topic:** Should search exclude deleted notices only, or also exclude notices from deleted employees?

**Options Evaluated:**
1. **Exclude deleted notices only:** WHERE deleted_at IS NULL (recommended)
2. **Exclude deleted notices and deleted authors:** WHERE deleted_at IS NULL AND author_id NOT IN (soft-deleted employees)
3. **Exclude deleted notices, show author placeholder:** WHERE deleted_at IS NULL, display deleted author name as "[Deleted Employee]"

**Final Decision:** Option 1 - Exclude deleted notices only (Phase 1)

**Rationale:**
- Oracle FK constraint ON DELETE RESTRICT prevents employee deletion (EMPLOYEE table, not soft-deletable in Phase 1)
- Employee soft-delete is future feature (Phase 2), so author_id FK always exists and valid
- Option 2 (exclude deleted authors) is premature optimization — revisit when employee soft-delete is implemented
- Query simplicity: `WHERE deleted_at IS NULL` is clearer than complex join/subquery checking author deletion status
- When EMPLOYEE soft-delete is implemented in future, revisit this decision (may require Option 2)

**Implementation Impact:**
- Search query: `WHERE NOTICE.deleted_at IS NULL AND (NOTICE.title LIKE '%query%' OR NOTICE.content LIKE '%query%')`
- No changes to author_id join logic
- Future decision: when employee soft-delete is implemented (Phase 2+), add check for author.deleted_at IS NULL if needed

**Trade-offs Accepted:**
- If employee soft-delete is added before Phase 1 completes: search may include orphaned notices (mitigated by revisiting decision immediately)

**Approval:** ✓ APPROVED

---

## Low Priority Decisions (5)

### Decision #10: Comment Edit History Tracking & Display

**Topic:** Should comment edits show visible indicator ("edited") to users or remain silent internally?

**Options Evaluated:**
1. **Silent updates:** Store updated_at but don't display to users
2. **Edited indicator badge:** Show "(edited)" badge, display updated_at on hover (recommended)
3. **Full edit history:** Show all versions with timestamps

**Final Decision:** Option 2 - Edited indicator badge with timestamp on hover

**Rationale:**
- sunjin-erp is internal corporate system → transparency on edited content is important (auditing, trust)
- Option 2 (indicator badge) is lightweight compromise: transparent without heavyweight UI
- Matches modern platform patterns (Facebook, Twitter show "edited" indicator)
- Encourages responsible editing (users know edits are tracked)
- Option 3 (full history) overengineered for Phase 1 (separate version history table adds complexity)
- Option 1 (silent) defeats transparency purpose

**Implementation Impact:**
- Comment UI shows "(edited)" badge if comment.updated_at > comment.created_at
- Hover tooltip displays: "Edited on 2026-01-25 15:30"
- No backend changes needed (created_at and updated_at already tracked)
- Add styling: badge color subtle (gray), tooltip on hover

**Recommendation:** Implement in Phase 1 as lightweight transparency feature. Defer full edit history to Phase 2 if needed.

**Approval:** ✓ RECOMMENDED

---

### Decision #11: Pagination Default Limits & User Preferences

**Topic:** Should pagination limit be fixed (20 items) or user-configurable per preference?

**Options Evaluated:**
1. **Fixed pagination:** Default 20 items per page, max 100, all users same (recommended)
2. **User preference:** Store user's preferred page size in session/DB, apply on subsequent visits
3. **Dynamic responsive:** Adjust page size based on screen size (mobile=10, tablet=20, desktop=30)

**Final Decision:** Option 1 - Fixed pagination (20 default, max 100)

**Rationale:**
- Phase 1 MVP: simplicity is priority — fixed pagination is standard convention
- 20 items is reasonable default (balances data loaded vs page scrolling)
- Max 100 prevents performance issues from excessive data loading
- User preferences (Option 2) add storage/persistence complexity without clear MVP requirement
- Dynamic sizing (Option 3) requires responsive design finalized (Phase 2)
- Can easily add user preferences in Phase 2 if demand exists

**Implementation Impact:**
- API query parameter: `?page=1&limit=20` with defaults
- Validate: if limit > 100, cap at 100 (return 400 error or silently cap, recommend latter)
- UI: hardcoded 20-item pagination, "Load more" button if more pages exist

**Recommendation:** Implement in Phase 1 as specified. Defer user preferences to Phase 2 based on user feedback.

**Approval:** ✓ RECOMMENDED

---

### Decision #12: Notice Edit Tracking & Audit Trail Display

**Topic:** Should edit history (updated_by_id, updated_at) be visible to users or internal audit only?

**Options Evaluated:**
1. **Internal audit only:** Store metadata but don't display to users
2. **User-visible metadata:** Display "Updated by [author] on [date]" on detail page (recommended)
3. **Badge only:** Show "(edited)" badge but hide who/when unless hover

**Final Decision:** Option 2 - User-visible metadata

**Rationale:**
- sunjin-erp is internal system → transparency and audit trail are important for trust and accountability
- Option 2 (visible metadata) matches modern platforms (Medium, Ghost, Google Docs show edit history)
- Lightweight display: "Updated by 김관리 on 2026-01-25 15:30" (one line, non-intrusive)
- Supports future audit requirements (Phase 2+) without design changes
- Option 1 (hidden) defeats transparency purpose
- Option 3 (badge only) insufficient — "edited by whom?" is useful context

**Implementation Impact:**
- Detail page displays after creation metadata section:
  - If updated_at != created_at: show "Last updated by [employee name] on [date]"
  - Fetch employee name from FK (updated_by_id)
  - UI position: below creation metadata, same visual weight

**Recommendation:** Implement in Phase 1. Simple to add, improves transparency without complexity.

**Approval:** ✓ RECOMMENDED

---

### Decision #13: Comment Mention & Notification System Pre-Decision

**Topic:** When replying to a comment (US-3), should mentions trigger notifications? (Phase 2 pre-decision)

**Options Evaluated:**
1. **Mentions without notifications:** Auto-add @username in reply, no email/in-app notifications (recommended for Phase 1)
2. **Mentions + in-app notifications:** Store notification in Notification entity, badge on board
3. **Mentions + email notifications:** Send email to replied-to user

**Final Decision (Phase 1):** Option 1 - Mentions without notifications

**Rationale:**
- Phase 1 scope is notices + comments, notifications are "별도 모듈" (separate module)
- Option 1 implements US-3 requirement ("@원댓글작성자 멘션 자동 추가") without dependency on notification infrastructure
- Parsing @username is simple and valuable (threads track who's mentioned)
- Options 2-3 require Phase 2 work (separate notification module)
- Phase 1 design should support mentions as technical foundation (stored as plain text in comment)

**Implementation Impact (Phase 1):**
- Comment form auto-adds @username when user clicks "Reply to [name]" button
- Store comment content with @username: "좋습니다! @원댓글작성자 피드백 주셔서 감사합니다."
- Simple text parsing (no hyperlinks or notification triggers in Phase 1)
- Parse @usernames in UI render (add styling: bold, different color) but no functionality

**Phase 2 Pre-Decision:**
- Implement mention detection system: parse @username from comment content
- Store mentions in separate Comment_Mention junction table if needed
- Integrate with notification module when available
- Add email/in-app notification triggers based on mentioned usernames

**Recommendation:** Implement Phase 1 as Option 1. Phase 2 design should plan mention detection and notification integration.

**Approval:** ✓ RECOMMENDED

---

### Decision #14: Comment Sorting Options

**Topic:** Should comments default to oldest-first or newest-first? Should users be able to change sort order?

**Options Evaluated:**
1. **Fixed oldest-first sorting:** Comments always sorted by created_at ASC (recommended)
2. **Newest-first sorting:** Comments sorted by created_at DESC (reverse chronological)
3. **User-selectable sort:** Users can toggle between oldest/newest-first

**Final Decision:** Option 1 - Fixed oldest-first sorting

**Rationale:**
- US-3 specifies nested display (replies under parent comments), implying thread structure
- Thread discussions naturally follow chronological order (oldest comment first, replies follow, context preserved)
- Matches Reddit, HN comment threads (oldest-first default)
- Simplest implementation (no sort button, no additional state)
- Option 3 (selectable) adds UI complexity without MVP requirement
- If users request reverse sort in Phase 2, implement then

**Implementation Impact:**
- API route: default sort by `created_at ASC`
- Comment list component renders in order: parent comment → replies (oldest first within each thread)
- No sort UI button in Phase 1

**Recommendation:** Implement in Phase 1. Simple, follows discussion thread pattern. Defer selectable sorting to Phase 2 if user feedback supports it.

**Approval:** ✓ RECOMMENDED

---

### Decision #15: Comment Editing UX Pattern

**Topic:** When user edits a comment, should editing happen inline or in modal dialog?

**Options Evaluated:**
1. **Inline editing:** Comment card becomes textarea, edit in place (recommended)
2. **Modal dialog:** Popup shows edit form in modal
3. **Dedicated page:** Navigate to edit page (overengineered)

**Final Decision:** Option 1 - Inline editing

**Rationale:**
- Comments are small (max 1000 chars), lightweight edit operation
- Inline editing is lightweight UX pattern (Facebook, Twitter, Slack)
- Preserves thread context (user sees their edit in context)
- Simpler implementation (no modal component needed)
- Option 2 (modal) appropriate for heavy operations (create notice, bulk actions)
- Option 3 (dedicated page) overengineered for small edit
- Matches lightweight comment pattern (low friction to edit)

**Implementation Impact:**
- Comment card UI: click "Edit" button → card converts to textarea with Save/Cancel buttons
- Form validation shown inline (error messages below textarea)
- Save: API call, UI shows loading state, then reverts to display mode
- Cancel: discard changes, revert to display mode

**Recommendation:** Implement in Phase 1 as lightweight UX. Simple, matches comment editing pattern across web.

**Approval:** ✓ RECOMMENDED

---

## Summary of Changes to Original PRD

### High-Impact Changes (Architectural)
1. **Soft Delete Cascade (Decision #1):** NoticeService.softDelete() must cascade to Comments and Attachments. Update Section 5.3 database constraints description and Section 5.2 DELETE route handler behavior.

2. **File Upload Security (Decision #2):** Implement magic number validation using file-type library. Update Section 5.6 file security section: exclude SVG, limit to JPEG/PNG/GIF/PDF/DOCX/PPTX.

### Medium-Impact Changes (Implementation Clarifications)
3. **Comment Depth Enforcement (Decision #3):** Application-level validation in API route handler. Update Section 5.2 POST `/api/notices/[id]/comments` to specify return HTTP 400 for depth violations.

4. **View Count Tracking (Decision #4):** Session-based deduplication replaces "count all" in Phase 1. Update Section 5.8 to clarify session tracking mechanism.

5. **Search Strategy (Decision #5):** LIKE-based substring search (no FTS in Phase 1). Update Section 5.2 GET `/api/notices` to specify LIKE query pattern and sorting.

6. **Notice Type Strategy (Decision #6):** Hardcoded enum (5 types) with CHECK constraint. Confirm in Section 5.3 database constraints.

7. **File Storage (Decision #7):** Local file system in Phase 1, abstract FileStorageService for Phase 2 migration. Update Section 5.6 file upload path.

8. **Detail Page Rendering (Decision #8):** Use ISR (Incremental Static Regeneration), not pure SSR. Update Section 5.1 server component description to mention revalidatePath().

9. **Search Query Scope (Decision #9):** Exclude deleted notices only (no author deletion check). Update Section 5.2 search implementation.

### Low-Impact Changes (UX/Presentation)
10. **Comment Edit Indicator (Decision #10):** Show "(edited)" badge on comments. Update Section 6 UI section.

11. **Edit Metadata Display (Decision #12):** Display "Updated by [name] on [date]" on notice detail. Update Section 6 detail page layout.

12. **Comment Mentions (Decision #13):** Auto-add @username in Phase 1 (no notifications). Update US-3 acceptance criteria.

### No Changes (Decisions Confirm Original PRD)
- Decision #11 (pagination): Confirms original PRD (20 default, max 100)
- Decision #14 (comment sort): Confirms original PRD (oldest-first implied)
- Decision #15 (edit UX): Inline editing, not originally specified but aligns with lightweight comment pattern

---

## Sections of PRD Requiring Updates for Implementation

### Section 5.2 API Routes (Update Required)
- **DELETE /api/notices/[id]:** Clarify that soft-delete cascades to comments/attachments
- **POST /api/notices/[id]/comments:** Add error handling for comment depth violation (HTTP 400)
- **GET /api/notices:** Specify LIKE-based search query pattern and sorting

### Section 5.3 Database Design (Update Required)
- **NOTICE entity:** Confirm comment/attachment cascade soft-delete behavior
- **CHECK constraint on NOTICE.type:** Confirm 5 hardcoded enum values
- **Index strategy (Decision #5):** Add indexes for search performance

### Section 5.6 File Upload & Download (Update Required)
- **File validation:** Add magic number validation requirements, exclude SVG, specify allowed types
- **File naming:** Clarify sanitization rules (alphanumeric + hyphen/underscore, max 100 chars, UUID storage)

### Section 5.1 Server Components (Update Recommended)
- **Detail page rendering:** Clarify ISR with revalidatePath() pattern
- **Client component hydration:** Confirm Server Component passes initial data to Client Component

### Section 6 UI/UX (Update Recommended)
- **Comment edit indicator:** Add "(edited)" badge display
- **Notice metadata:** Add "Updated by [name]" line to detail page layout

---

## Next Steps

### Immediate (Before Implementation Starts)
1. ✓ Review all 15 decisions with technical leads
2. ✓ Confirm Decision #1 (cascade soft-delete) and Decision #2 (file security) with security team
3. Create implementation PRD addendum documenting all 15 decisions
4. Update original PRD sections listed above

### Implementation Phase
1. Reference this decisions document in implementation PRD (2101_01, 2101_02, etc.)
2. Implement decisions in order of priority (HIGH first, then MEDIUM, then LOW)
3. Create unit tests for Decision #1 (cascade) and Decision #3 (depth validation)
4. Code review checklist: verify all 15 decisions implemented correctly

### Phase 2 & Future
1. Revisit Decision #5 (search) when dataset grows or FTS requirement emerges
2. Revisit Decision #7 (storage) when production infrastructure finalized
3. Revisit Decision #9 (search scope) when employee soft-delete implemented
4. Plan Phase 2 initiatives: mentiondetection (Decision #13), user preferences (Decision #11), notification system

---

## Appendix: Decision Traceability

| Decision | Topic | Priority | PRD Sections Affected | Implementation Owner |
|----------|-------|----------|----------------------|----------------------|
| #1 | Soft Delete Cascade | HIGH | 5.2, 5.3, 6.4 | Backend (NoticeService) |
| #2 | File MIME Validation | HIGH | 5.6, 6.4 | Backend (FileValidationService) |
| #3 | Comment Depth Enforcement | MEDIUM | 5.2, 6.4 | Backend (API validation) |
| #4 | View Count Deduplication | MEDIUM | 5.2, 5.8 | Backend (session tracking) |
| #5 | Search Strategy | MEDIUM | 5.2, 5.8 | Backend (QueryBuilder) |
| #6 | Notice Type Categorization | MEDIUM | 5.3, 6.1 | Backend (Entity, UI dropdown) |
| #7 | File Storage Strategy | MEDIUM | 5.6 | Backend (FileStorageService interface) |
| #8 | Detail Page Rendering | MEDIUM | 5.1 | Backend (ISR config) |
| #9 | Search Query Scope | MEDIUM | 5.2 | Backend (query logic) |
| #10 | Comment Edit Indicator | LOW | 6.2 | Frontend (UI badge) |
| #11 | Pagination Strategy | LOW | 5.2 | Backend (API parameter) |
| #12 | Edit Metadata Display | LOW | 6.2 | Frontend (metadata section) |
| #13 | Comment Mentions | LOW | US-3, 6.2 | Frontend (mention parsing, styling) |
| #14 | Comment Sort Order | LOW | 5.2 | Backend (sort query) |
| #15 | Comment Edit UX | LOW | 6.2 | Frontend (inline form) |

---

**Document Status:** ✓ FINAL - Ready for Implementation Planning

**Approved by:** AI Decision Mediator (PRD Mediation Process)
**Date:** 2026-01-25 23:45:00 KST

