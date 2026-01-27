-- ============================================================
-- 2101_002_create_notice_indexes.sql
-- 공지사항 모듈 인덱스 생성
-- Generated: 2026-01-28 16:00:00 KST
-- ============================================================

-- ============================================================
-- 1. NOTICE 테이블 인덱스
-- ============================================================

-- 1.1 유형별 + 날짜 필터링 (목록 페이지 기본 쿼리)
CREATE INDEX IDX_NOTICE_TYPE_CREATED ON NOTICE(TYPE, "created_at" DESC);

-- 1.2 작성자별 이력 (내 게시물 조회)
CREATE INDEX IDX_NOTICE_AUTHOR_CREATED ON NOTICE(AUTHOR_ID, "created_at" DESC);

-- 1.3 최신순 정렬 (기본 정렬)
CREATE INDEX IDX_NOTICE_CREATED ON NOTICE("created_at" DESC);

-- 1.4 조회수순 정렬 (인기 게시물)
CREATE INDEX IDX_NOTICE_VIEWCOUNT ON NOTICE(VIEW_COUNT DESC);

-- 1.5 Soft delete 쿼리 최적화 (모든 목록 쿼리에서 사용)
CREATE INDEX IDX_NOTICE_DELETED ON NOTICE("deleted_at");

-- 1.6 제목 검색
CREATE INDEX IDX_NOTICE_TITLE ON NOTICE(TITLE);

-- 1.7 복합 인덱스: soft delete + 날짜 (가장 빈번한 쿼리 패턴)
CREATE INDEX IDX_NOTICE_ACTIVE_CREATED ON NOTICE("deleted_at", "created_at" DESC);

-- ============================================================
-- 2. NOTICE_COMMENT 테이블 인덱스
-- ============================================================

-- 2.1 게시물별 댓글 조회 (oldest-first 정렬)
CREATE INDEX IDX_NC_NOTICE_CREATED ON NOTICE_COMMENT(NOTICE_ID, "created_at" ASC);

-- 2.2 답글 트리 쿼리 (부모 댓글 + 시간순)
CREATE INDEX IDX_NC_NOTICE_PARENT_CREATED ON NOTICE_COMMENT(NOTICE_ID, PARENT_COMMENT_ID, "created_at" ASC);

-- 2.3 작성자별 댓글 (내 댓글 조회)
CREATE INDEX IDX_NC_AUTHOR ON NOTICE_COMMENT(AUTHOR_ID);

-- 2.4 부모 댓글 조회 (깊이 검증용)
CREATE INDEX IDX_NC_PARENT ON NOTICE_COMMENT(PARENT_COMMENT_ID);

-- 2.5 Soft delete 쿼리 최적화
CREATE INDEX IDX_NC_DELETED ON NOTICE_COMMENT("deleted_at");

-- 2.6 복합 인덱스: 게시물 + soft delete (댓글 목록 기본 쿼리)
CREATE INDEX IDX_NC_NOTICE_ACTIVE ON NOTICE_COMMENT(NOTICE_ID, "deleted_at");

-- ============================================================
-- 3. NOTICE_ATTACHMENT 테이블 인덱스
-- ============================================================

-- 3.1 게시물별 첨부파일 조회
CREATE INDEX IDX_NOTICE_ATTACH_NOTICE ON NOTICE_ATTACHMENT(NOTICE_ID);

-- 3.2 Soft delete 쿼리 최적화
CREATE INDEX IDX_NOTICE_ATTACH_DELETED ON NOTICE_ATTACHMENT("deleted_at");

-- 3.3 복합 인덱스: 게시물 + soft delete
CREATE INDEX IDX_NOTICE_ATTACH_NOTICE_ACTIVE ON NOTICE_ATTACHMENT(NOTICE_ID, "deleted_at");
