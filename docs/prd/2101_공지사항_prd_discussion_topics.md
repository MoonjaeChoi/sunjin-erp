<!-- Generated: 2026-01-25 23:30:00 KST -->

# 2101 공지사항 - Discussion Topics & Unresolved Design Decisions

## Overview

This document extracts 15 unresolved design decisions and architectural trade-offs from the Notice Board PRD and critical review. These topics require team discussion and explicit decisions before implementation begins. They represent choices with meaningful trade-offs, not simple specification gaps.

---

## Topics (15 Total)

### Topic 1: Comment Depth Limit Enforcement Strategy
**Priority:** MEDIUM
**Context:** The PRD specifies max 2-level comment nesting (comment → reply, no reply-to-reply). However, multiple enforcement mechanisms exist with different trade-offs: (1) Application-level validation (clear errors, easier testing), (2) Database trigger (enforces at DB layer), (3) UI prevention only (simplest but weakest).

**Options:**
1. **Application-only validation:** Validate in API route handler; return HTTP 400 if user tries to reply to a reply. UI hides reply button for level-2 comments.
   - Pros: Clear error messages, easy unit testing, no DB trigger complexity
   - Cons: Malicious client could bypass with direct API call (mitigated by validation)
2. **Database trigger + Application validation:** Oracle trigger prevents parent_comment_id.parent_comment_id violations at DB layer. Application validates too (defense in depth).
   - Pros: Strongest enforcement, catches bugs in application layer
   - Cons: Oracle trigger complexity, harder to debug, slower inserts
3. **UI-only prevention:** Hide reply button for replies only, no API-level validation.
   - Pros: Simplest to implement, no backend logic
   - Cons: Weak enforcement, accidental or intentional API calls create invalid state

**Considerations:** sunjin-erp prefers application layer for business rules (see CLAUDE.md philosophy). UI prevention is good UX but insufficient alone. Database trigger adds complexity without much benefit (application validation is sufficient for this use case).

**Recommendation:** Use Option 1 (application-only validation + UI prevention). Simplest and sufficient for Phase 1.

---

### Topic 2: Soft Delete Cascade Behavior & Orphaned Data
**Priority:** HIGH (Blocking)
**Context:** When a Notice is soft-deleted, should its associated Comments and Attachments be automatically cascaded? Current PRD specifies ON DELETE RESTRICT for FK, but soft-delete (logical delete) is different from hard delete (physical deletion). Three strategies exist.

**Options:**
1. **Cascade soft-delete:** When Notice.deleted_at is set, automatically set Comments.deleted_at and Attachments.deleted_at to same timestamp. Orphaned data is marked as deleted but not removed.
   - Pros: Maintains referential integrity, prevents orphaned soft-deleted records in lists, audit trail is clean
   - Cons: Requires service method (NoticeService.softDelete) to handle cascading, not automatic
2. **No cascade, manual orphan handling:** When Notice is soft-deleted, Comments/Attachments remain with deleted_at = NULL. List queries must explicitly check notice.deleted_at IS NULL.
   - Pros: Simpler implementation (no cascading logic), orphan comments might be useful for recovery (Phase 2)
   - Cons: Complex queries (must join to notice and check both deleted flags), orphaned data visible in unfiltered queries
3. **Hard delete only for children:** When Notice is soft-deleted, hard-delete (physically remove) all Comments/Attachments. Notice remains soft-deleted.
   - Pros: Prevents orphaned data, simple queries
   - Cons: Violates soft-delete-only principle (CLAUDE.md), destroys audit trail for child records, risky

**Considerations:** Enterprise soft-delete pattern (Stripe, GitHub) uses cascade (Option 1). sunjin-erp principle: "soft delete only" suggests cascade but no explicit guidance. Option 3 violates soft-delete principle. Option 2 requires complex query logic.

**Recommendation:** Implement Option 1 (cascade soft-delete). When Notice.softDelete() is called, set deleted_at on Comments and Attachments. This aligns with enterprise practice and maintains data integrity.

---

### Topic 3: View Count Duplicate Prevention Mechanism
**Priority:** MEDIUM
**Context:** PRD defers view count deduplication to Phase 2, but needs Phase 1 strategy. Three approaches exist for handling repeated views by same user.

**Options:**
1. **Count all views (no deduplication):** Every GET request increments view_count. Same user viewing 100 times = 100 counts.
   - Pros: Simplest implementation, no session tracking, accurate "total impressions"
   - Cons: Metrics misleading (100 views from 1 user ≠ 1 view from 100 users), gameable
2. **Session-based deduplication:** Track viewed notices in session. Only increment if user hasn't viewed this notice in current session.
   - Pros: Prevents same-session rapid clicks, tracks real user interest
   - Cons: Requires session storage, doesn't prevent next-day re-views by same user
3. **Database-based deduplication:** Track (user_id, notice_id, viewed_at) pairs in separate table or timestamp. Increment only once per day/week.
   - Pros: Accurate metrics across sessions, prevents gaming
   - Cons: Requires new table (NoticeView), adds complexity, impacts performance

**Considerations:** Phase 1 is MVP—simple is better. Session-based (Option 2) is middle ground. Full deduplication (Option 3) can wait for Phase 2 analytics overhaul. The PRD explicitly states "Phase 1은 제한 없음 (모든 조회 카운트)" but doesn't prevent session-based deduplication (lightweight and reasonable).

**Recommendation:** Implement Option 2 (session-based deduplication). Track viewed_notices in session; increment only once per session per notice. Re-increment on new session (next day/logout). Reasonable compromise between accuracy and complexity.

---

### Topic 4: File Upload MIME Type Whitelist
**Priority:** MEDIUM (Security)
**Context:** PRD specifies "image/*, application/pdf, application/msword, application/vnd.openxmlformats-officedocument*" but this is too broad. Critical review identifies SVG XSS risk and need for magic number validation. Need explicit whitelist.

**Options:**
1. **Broad whitelist (current PRD):** image/*, application/pdf, application/msword, application/vnd.openxmlformats-officedocument*
   - Pros: Accepts legacy .doc format, flexible for future image formats
   - Cons: SVG XSS risk (image/svg+xml contains JavaScript), MIME spoofing (client-provided header)
2. **Narrow whitelist:** JPEG, PNG, PDF, DOCX only. Exclude SVG, DOC.
   - Pros: Secure (no SVG XSS), modern (DOCX only), explicit whitelist easier to audit
   - Cons: Rejects some valid formats (GIF, animated PNG, legacy DOC files from 2003)
3. **Magic number validation + moderate whitelist:** Validate file signature (magic bytes) using file-type library. Whitelist: JPEG, PNG, GIF, PDF, DOCX, PPTX.
   - Pros: Prevents MIME spoofing, catches polyglot files, secure against XSS
   - Cons: Requires file-type dependency, slightly more CPU for validation

**Considerations:** Security requirement (no SVG XSS) is non-negotiable. Magic number validation is best practice (see OWASP). sunjin-erp is an enterprise system → prioritize security over flexibility.

**Recommendation:** Implement Option 3 (magic number validation + moderate whitelist: JPEG, PNG, GIF, PDF, DOCX, PPTX). Use file-type library. Validate magic bytes before storing file. Reject SVG and DOC format explicitly in comments.

---

### Topic 5: Comment Metadata: Edit History & Timestamps
**Priority:** LOW
**Context:** When a user edits a comment, should the edit be visible/tracked? Current PRD has comment.updated_at but doesn't specify whether to show "edited" indicator or edit history to other users.

**Options:**
1. **Silent updates:** Store updated_at but don't display to users. UI shows created_at only.
   - Pros: Simplest (no UI changes for "edited" badge), users can fix typos without drawing attention
   - Cons: No transparency, users might notice content changed without indicator
2. **Edited indicator:** Display "(edited)" badge on comment if updated_at > created_at. Show updated_at on hover.
   - Pros: Transparent that content changed, lightweight UI, matches Facebook/Twitter pattern
   - Cons: Slightly more complex UI, might discourage minor edits
3. **Full edit history:** Show all versions of comment with timestamps. Users can view who changed what when.
   - Pros: Maximum transparency, audit trail, deters abuse
   - Cons: Significant complexity (version history table), out-of-scope for Phase 1

**Considerations:** sunjin-erp is internal corporate system (not public forum), so transparency is important. Edited indicator (Option 2) is lightweight compromise between transparency and simplicity. Full history (Option 3) is nice but overengineered for Phase 1.

**Recommendation:** Implement Option 2 (edited indicator badge + timestamp on hover). Show "(edited 2026-01-25 15:30)" when user hovers on comment. Simple, transparent, Phase 1 appropriate.

---

### Topic 6: Search Scope & Relevance Ranking
**Priority:** MEDIUM
**Context:** US-8 requires search across "제목, 내용, 작성자" but doesn't specify ranking. Full-text search (FTS) vs simple LIKE substring matching is a trade-off between accuracy and complexity.

**Options:**
1. **Simple LIKE substring search:** Search NOTICE(title) OR NOTICE(content) LIKE '%query%'. Results sorted by created_at descending (latest first).
   - Pros: Simple, works with Oracle standard indexes, fast for Phase 1
   - Cons: Not relevance-ranked (all matches equally weighted), no word boundary handling (searching "cat" matches "concatenate")
2. **Full-text search with relevance:** Use Oracle Text (FTS extension) to index and rank by relevance. Results sorted by score (relevance).
   - Pros: Better UX (relevant results first), word boundaries, stemming support
   - Cons: Requires Oracle Text license/setup, more complex queries, potential performance impact
3. **Hybrid:** LIKE search with manual relevance heuristics (title match scores higher than content match, exact match scores higher than substring).
   - Pros: Reasonable compromise, simple implementation
   - Cons: Fragile heuristics, hard to maintain

**Considerations:** Phase 1 is MVP—LIKE search (Option 1) is acceptable. FTS (Option 2) requires infrastructure decision. Hybrid (Option 3) is maintainability risk. sunjin-erp doesn't have stated FTS requirement yet (distinct from search ability).

**Recommendation:** Implement Option 1 for Phase 1 (simple LIKE search, sort by created_at DESC). Plan Oracle Text evaluation for Phase 2 analytics/search overhaul.

---

### Topic 7: Pagination Default Limits & User Preferences
**Priority:** LOW
**Context:** PRD specifies default page size = 20, max = 100. But should this be: (1) Fixed for all users, (2) Configurable per-user preference, (3) Responsive to content size?

**Options:**
1. **Fixed pagination:** Default 20 items per page, max 100. All users same limit.
   - Pros: Simplest, consistent, no per-user storage
   - Cons: Not all users want 20 items; power users might want 100 always
2. **User preference:** Store user's preferred page size in EMPLOYEE or session. Apply on subsequent visits.
   - Pros: Better UX for power users, respects preference
   - Cons: Requires preference storage (UI state vs DB), adds complexity
3. **Dynamic responsive:** Adjust page size based on screen size (mobile=10, tablet=20, desktop=30).
   - Pros: Optimized for each viewport
   - Cons: Adds complexity, may not match user preference

**Considerations:** Phase 1 is MVP—fixed pagination (Option 1) is standard. User preferences (Option 2) add storage complexity. Responsive sizing (Option 3) requires responsive design (Phase 2).

**Recommendation:** Implement Option 1 for Phase 1 (fixed 20 items default, max 100). Defer user preferences to Phase 2 if demand exists.

---

### Topic 8: Notice Type Categorization: Enum vs Flexible Categories
**Priority:** MEDIUM
**Context:** PRD defines 5 fixed types (공지, 공유, 지시, 건의, 자유). But should this be: (1) Hardcoded enum, (2) Database-backed categories (allow ADMIN to add new types), (3) Multi-select tags instead of single type?

**Options:**
1. **Hardcoded enum:** Type values are fixed in code/database (5 values, checked via CHECK constraint).
   - Pros: Simple, type-safe (can't accidentally create "wrong" type), performance (indexed)
   - Cons: Inflexible, requires code deployment to add new type
2. **Database-backed categories:** Create NOTICE_TYPE table (id, name, description). Notice.type_id references it. ADMIN can add new types.
   - Pros: Flexible, no code deployment needed for new types, extensible
   - Cons: More complex (new table, migrations), performance (extra join), admin UI needed (Phase 2)
3. **Multi-select tags:** Notice can have multiple tags instead of single type. Tag table stores predefined tags.
   - Pros: More granular (post can be "공지" AND "중요" AND "보안"), flexible
   - Cons: Significant scope expansion, list UI more complex, filters more complex

**Considerations:** Current PRD strongly implies fixed types (5 types enumerated). Option 2 (flexible categories) adds significant complexity. Option 3 (tags) is out-of-scope for Phase 1. sunjin-erp principle: KISS (Keep It Simple).

**Recommendation:** Implement Option 1 (hardcoded enum: 공지, 공유, 지시, 건의, 자유). Use CHECK constraint. If flexibility needed in future, redesign in Phase 2 with proper UX.

---

### Topic 9: Attachment Storage Strategy: File System vs Blob Storage
**Priority:** MEDIUM (Infrastructure)
**Context:** PRD specifies `./public/uploads/notices/{noticeId}/{filename}` but this is file system storage. Should we consider cloud blob storage (AWS S3, Azure Blob)?

**Options:**
1. **Local file system:** Store attachments in ./public/uploads/notices/. Serve via Next.js public route.
   - Pros: Simple (no cloud dependency), fast for development, included in docker-compose setup
   - Cons: Not scalable (single server), doesn't work in serverless, requires backup strategy
2. **AWS S3 / Azure Blob Storage:** Upload to cloud storage, generate signed URLs for download.
   - Pros: Scalable, redundant, works with serverless, standard for production
   - Cons: External dependency, cost (storage + egress), setup complexity, not included in local docker-compose
3. **Hybrid:** Local file system for Phase 1 (MVP quick), plan migration to S3 for Phase 2 (production scaling).
   - Pros: Fast MVP, scalable future
   - Cons: Double implementation (local + cloud)

**Considerations:** Staging server (192.168.75.194:3200) is single container deployment → local file system works fine. Production deployment (future) will need cloud storage. sunjin-erp hasn't specified cloud infrastructure strategy yet.

**Recommendation:** Implement Option 3 (hybrid). Phase 1: local file system (./public/uploads/notices) as specified in PRD. Phase 2: plan S3 migration with separate PRD. Design abstraction layer (FileStorageService) to enable easy provider swap.

---

### Topic 10: Notice Edit Tracking & Audit Trail
**Priority:** LOW
**Context:** PRD records updated_by_id and updated_at but doesn't specify whether to display "Last edited by X on 2026-01-25" to users or hide internally.

**Options:**
1. **Internal audit only:** Store updated_by_id and updated_at in DB but don't display to users. Used for admin audit trails (Phase 2).
   - Pros: Simpler UI, hides internal metadata from users
   - Cons: No transparency on who changed what
2. **User-visible metadata:** Display "Updated by 김관리 on 2026-01-25 15:30" on notice detail page.
   - Pros: Transparent, matches modern blog platforms (Medium, Ghost)
   - Cons: Slightly more complex UI, might confuse users with "updated_at vs created_at"
3. **Edit history badge only:** Show "(edited)" badge with timestamp but hide "who edited" unless hover.
   - Pros: Lightweight transparency
   - Cons: Less useful for blame/accountability

**Considerations:** sunjin-erp is internal system → transparency and audit trail are important. Option 2 (visible metadata) is reasonable. Option 1 (hidden) defeats transparency purpose. Option 3 (badge only) is vague.

**Recommendation:** Implement Option 2 (visible metadata). Display "Updated by [author name] on [date] [time]" on notice detail page (near top, below creation metadata). Simple, transparent, aligns with modern UX.

---

### Topic 11: Comment Mention & Notification System
**Priority:** LOW (Out-of-Scope Phase 1, but pre-decision)
**Context:** US-3 mentions "답글 작성 시 '@원댓글작성자' 멘션 자동 추가 (선택)" (mention original commenter). But should this trigger notifications? Pre-decide for Phase 2.

**Options:**
1. **Mentions but no notifications:** Auto-add @username in reply, but don't send email/in-app notifications (users must manually check board).
   - Pros: Implements US-3 requirement, no notification infrastructure needed
   - Cons: Users won't know they were replied to, reduces engagement
2. **Mentions + in-app notifications:** Auto-mention + store notification in separate Notification entity. Users see badge on board.
   - Pros: Users know they were replied to, encourages discussion
   - Cons: Requires Notification table and icon UI (Phase 2)
3. **Mentions + email notifications:** Auto-mention + send email to replied-to user.
   - Pros: Maximum engagement (email is high-visibility)
   - Cons: Email infrastructure (SMTP), notification preferences (spam risk), out-of-scope for Phase 1

**Considerations:** Current PRD says this is Phase 2 out-of-scope ("별도 모듈" for notification system). But Phase 1 design should support mentions (technical foundation). Option 1 (mentions without notifications) is Phase 1 appropriate. Options 2-3 require Phase 2 work.

**Recommendation:** Implement Option 1 for Phase 1 (parse and auto-add @username in reply form, store mentioned usernames as plain text in comment content). Notification infrastructure deferred to Phase 2 (separate notification module).

---

### Topic 12: Server-Side Rendering vs Client-Side Rendering for Detail Page
**Priority:** MEDIUM (Performance)
**Context:** Section 5.1 specifies Server Component for detail page (/notices/[id]/page.tsx) but doesn't clarify: full SSR or SSG? Dynamic or static regeneration?

**Options:**
1. **Server-side rendering (SSR):** Render page on each request. Fetch notice data via TypeORM on server.
   - Pros: Always fresh data, simple to implement
   - Cons: Slower (fetch on every request), doesn't scale well
2. **Static site generation (SSG) with revalidation:** Pre-generate detail pages on-demand, revalidate every N seconds (ISR).
   - Pros: Fast (cached HTML), scales well, combines SSR benefits
   - Cons: Requires cache invalidation (purge on notice update), slightly more complex setup
3. **Client-side rendering (CSR) only:** Server renders shell, client hydrates with TanStack Query data.
   - Pros: Maximizes caching, works well with dynamic data (comments)
   - Cons: Slower FCP (First Contentful Paint), more JavaScript

**Considerations:** Notice board data is semi-dynamic (notice text is static, comments are dynamic). ISR (Option 2) is perfect fit: detail page regenerates on notice update, comment fetch is client-side. sunjin-erp uses Next.js 14 which supports ISR natively.

**Recommendation:** Implement Option 2 (SSR with ISR revalidation). Render detail page with notice data; revalidate on-demand when notice is updated. Comments load client-side via TanStack Query. Use Next.js revalidatePath() to purge cache when notice changes.

---

### Topic 13: Comment Sorting Options & Performance
**Priority:** LOW
**Context:** US-1 specifies sorting for notices (latest, viewCount, commentCount). Should comments also be sortable? Current PRD doesn't specify comment sort options (likely "oldest first" by default, but not stated).

**Options:**
1. **Comments: fixed oldest-first sorting:** Comments always sorted by created_at ASC (oldest comment first in thread).
   - Pros: Chronological order, easy to follow discussion flow, simple
   - Cons: Long threads require scrolling to see latest, newest insights buried
2. **Comments: newest-first sorting (reverse chronological):** Comments sorted by created_at DESC (latest comment first).
   - Pros: Latest insights prominent, matches Twitter/social media UX
   - Cons: Breaks chronological discussion flow, newer replies to old comments disjointed
3. **User-selectable sort (newest/oldest first):** Comments default oldest-first, user can toggle to newest-first.
   - Pros: Best UX flexibility, users choose
   - Cons: UI complexity (sort button), performance (requires re-rendering/API call)

**Considerations:** US-3 specifies comment nested display ("원댓글 아래 들여쓰기로 표시"), which implies thread-like structure. Thread discussions typically use oldest-first (chronological). Option 1 is simplest. Option 3 is overkill for Phase 1.

**Recommendation:** Implement Option 1 (fixed oldest-first sorting). Comments sorted by created_at ASC. Replies to a comment appear immediately below parent. Simple, follows discussion thread pattern. If users request reverse sort, implement in Phase 2.

---

### Topic 14: Notice Board Search Across Deleted/Soft-Deleted Records
**Priority:** MEDIUM (Query Design)
**Context:** Search queries should exclude deleted notices. But should they also exclude notices where author is deleted (employee soft-deleted)? Current PRD doesn't address.

**Options:**
1. **Exclude deleted notices only:** WHERE deleted_at IS NULL. Soft-deleted author doesn't affect visibility.
   - Pros: Simple query, soft-deleted author posts still searchable
   - Cons: Search results show posts from deleted employees (potentially confusing)
2. **Exclude deleted notices and notice author deleted:** WHERE deleted_at IS NULL AND author_id IN (SELECT id FROM EMPLOYEE WHERE deleted_at IS NULL).
   - Pros: Clean results (no orphan posts from deleted employees)
   - Cons: Complex query (requires join/subquery), impacts performance, author deletion is rare
3. **Exclude deleted notices, but show author as "[Deleted Employee]":** WHERE deleted_at IS NULL. Show deleted author names as placeholder.
   - Pros: Transparency (explains why author name missing), maintains audit trail
   - Cons: UI complexity, unclear if post should be deleted

**Considerations:** Oracle ON DELETE RESTRICT prevents author deletion (FK constraint), so author.deleted_at would require soft-delete on EMPLOYEE first (future feature). Option 2 is premature optimization. Option 1 (simple) is appropriate for Phase 1.

**Recommendation:** Implement Option 1 (exclude deleted notices only). When EMPLOYEE soft-delete is implemented in future, revisit this decision.

---

### Topic 15: Inline Comment Editing vs Modal-Based Editing
**Priority:** LOW (UX Pattern)
**Context:** US-6 specifies comment edit capability but doesn't specify UX: (1) inline edit (convert to textarea on same card), (2) modal dialog popup, (3) dedicated edit page.

**Options:**
1. **Inline editing:** Click edit → comment card becomes textarea, user edits in place, save/cancel buttons appear.
   - Pros: Lightweight UX, context-preserving (edit within discussion thread), fast
   - Cons: Form validation might be hidden, undo unclear
2. **Modal dialog:** Click edit → modal popup shows textarea with full edit UI, save/cancel buttons.
   - Pros: Clear UX, full validation display, consistent with POST form (modal-based)
   - Cons: More heavyweight (modal overhead), breaks thread context
3. **Dedicated edit page:** Click edit → navigate to /notices/[id]/comments/[commentId]/edit page.
   - Pros: Full-featured editing page
   - Cons: Too heavyweight for small edit operation, breaks discussion flow

**Considerations:** Comments are short (max 1000 chars), so inline editing (Option 1) is appropriate. Modal (Option 2) is overkill. Dedicated page (Option 3) is overengineered. Pattern: inline edits for lightweight changes, modals for heavy operations (mass delete, etc.).

**Recommendation:** Implement Option 1 (inline editing). Click edit → comment card becomes editable textarea with Save/Cancel buttons inline. Matches lightweight comment UX pattern (Facebook, Twitter, Slack).

---

## Summary by Priority

### HIGH (Must Decide Before Implementation)
- **Topic 2:** Soft Delete Cascade Behavior (decision on automatic cascade when parent deleted)
- **Topic 4:** File Upload MIME Type Whitelist (security decision: magic number validation + allowed types)

### MEDIUM (Should Decide, May Affect Architecture)
- **Topic 1:** Comment Depth Enforcement Strategy (application vs DB trigger vs UI-only)
- **Topic 6:** Search Scope & Ranking (LIKE vs full-text search)
- **Topic 8:** Notice Type Categorization (enum vs database-backed)
- **Topic 9:** Attachment Storage Strategy (file system vs cloud storage)
- **Topic 12:** Server-Side Rendering Strategy for Detail Page (SSR vs SSG vs CSR)
- **Topic 14:** Search Across Soft-Deleted Records (include or exclude deleted author posts)
- **Topic 3:** View Count Duplicate Prevention (count all vs session-based deduplication)

### LOW (Nice to Clarify, Minimal Impact)
- **Topic 5:** Comment Edit History Tracking (silent vs visible edited indicator)
- **Topic 7:** Pagination Limits & User Preferences (fixed vs user-configurable)
- **Topic 10:** Notice Edit Tracking & Audit Trail Display (internal vs user-visible)
- **Topic 11:** Comment Mentions & Notification System (Phase 2 pre-decision)
- **Topic 13:** Comment Sorting Options (oldest-first vs newest-first)
- **Topic 15:** Comment Editing UX Pattern (inline vs modal)

---

## Recommended Decision Flow

1. **Immediate (Before Architecture Lock-in):**
   - **Decision Owners:** Tech Lead + Product Manager
   - **Topics:** #2 (soft-delete cascade), #4 (file MIME types), #1 (comment depth)
   - **Duration:** 1 design sync (30-60 min)
   - **Outcome:** Clarified specification amendments to PRD

2. **Before Implementation Begins:**
   - **Decision Owners:** Tech Lead + Frontend Lead
   - **Topics:** #3, #6, #8, #9, #12, #14
   - **Duration:** 1 technical design review (1-2 hours)
   - **Outcome:** Implementation PRD (2101_01, 2101_02, etc.) with decided architectures

3. **During Implementation (Flexible):**
   - **Decision Owners:** Implementation team
   - **Topics:** #5, #7, #10, #11, #13, #15 (all LOW priority, good defaults exist)
   - **Duration:** Resolved in PR reviews as needed
   - **Outcome:** Consistent UX, may document in design doc for Phase 2

---

## Notes for Product Manager

All 15 topics are **legitimate design decisions** with meaningful trade-offs. None are specification ambiguities or gaps—they represent choices that affect implementation complexity, performance, user experience, or security posture.

**Expected outcomes after discussion:**
- 2 HIGH topics → 1-page architecture addendum to PRD
- 8 MEDIUM topics → 1-2 page implementation guidelines (reference for developers)
- 5 LOW topics → default decisions (inline edits, oldest-first sort, etc.) documented in implementation tickets

**Timeline Impact:** 2-4 hours discussion now saves 10+ hours implementation confusion later.

