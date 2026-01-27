<!-- Generated: 2026-01-28 15:30:00 KST -->

# TypeScript 타입 정의

**문서 번호**: 2101_03
**원본 PRD**: 2101_공지사항_prd_v2.md
**PRD 참조**: 원본 PRD의 'Section 4.1 In-Scope' 참조
**구현 범위**: Notice, Comment, NoticeAttachment 타입 정의
**복잡도**: S (0.5~1일)
**의존성**: 2101_01~02 (테이블 스키마)

---

## 구현 목표

공지사항 모듈의 TypeScript 타입을 정의합니다.
API 요청/응답, 컴포넌트 props에 사용됩니다.

---

## 구현 내용

### 파일 구조

```
src/
└── types/
    └── notice.ts
```

### 타입 정의

```typescript
// Generated: 2026-01-28 15:30:00 KST

// ============================================================
// 게시판 유형 (Enum)
// ============================================================

export type NoticeType = '공지' | '공유' | '지시' | '건의' | '자유';

export const NOTICE_TYPES: NoticeType[] = ['공지', '공유', '지시', '건의', '자유'];

export const NOTICE_TYPE_COLORS: Record<NoticeType, string> = {
  '공지': 'bg-red-100 text-red-800',
  '공유': 'bg-blue-100 text-blue-800',
  '지시': 'bg-orange-100 text-orange-800',
  '건의': 'bg-green-100 text-green-800',
  '자유': 'bg-gray-100 text-gray-800',
};

// ============================================================
// Notice (게시물)
// ============================================================

/** 게시물 기본 정보 */
export interface Notice {
  id: number;
  title: string;
  content: string;
  type: NoticeType;
  authorId: number;
  authorName: string;
  viewCount: number;
  updatedById?: number;
  updatedByName?: string;
  deletionReason?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

/** 게시물 목록 아이템 (간략 정보) */
export interface NoticeListItem {
  id: number;
  title: string;
  type: NoticeType;
  authorId: number;
  authorName: string;
  viewCount: number;
  commentCount: number;
  attachmentCount: number;
  createdAt: string;
  updatedAt: string;
}

/** 게시물 상세 (첨부파일 포함) */
export interface NoticeDetail extends Notice {
  attachments: NoticeAttachment[];
  commentCount: number;
}

/** 게시물 생성 요청 */
export interface CreateNoticeRequest {
  title: string;
  content: string;
  type: NoticeType;
}

/** 게시물 수정 요청 */
export interface UpdateNoticeRequest {
  title?: string;
  content?: string;
  type?: NoticeType;
}

/** 게시물 생성/수정 응답 */
export interface NoticeResponse {
  message: string;
  data: Notice;
}

// ============================================================
// NoticeAttachment (첨부파일)
// ============================================================

/** 첨부파일 정보 */
export interface NoticeAttachment {
  id: number;
  noticeId: number;
  filename: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
  deletedAt?: string;
}

/** 파일 업로드 응답 */
export interface UploadAttachmentResponse {
  message: string;
  data: NoticeAttachment[];
}

/** 허용된 MIME 타입 */
export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // PPTX
] as const;

export type AllowedMimeType = typeof ALLOWED_MIME_TYPES[number];

/** 파일 업로드 제한 */
export const FILE_UPLOAD_LIMITS = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxFileCount: 5,
} as const;

// ============================================================
// Comment (댓글)
// ============================================================

/** 댓글 정보 */
export interface Comment {
  id: number;
  noticeId: number;
  content: string;
  authorId: number;
  authorName: string;
  parentCommentId?: number;
  parentAuthorName?: string;
  isEdited: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  replies?: Comment[]; // 답글 (트리 구조용)
}

/** 댓글 생성 요청 */
export interface CreateCommentRequest {
  content: string;
  parentCommentId?: number;
}

/** 댓글 수정 요청 */
export interface UpdateCommentRequest {
  content: string;
}

/** 댓글 응답 */
export interface CommentResponse {
  message: string;
  data: Comment;
}

/** 댓글 목록 응답 */
export interface CommentListResponse {
  data: Comment[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// ============================================================
// 목록 조회 파라미터
// ============================================================

/** 정렬 기준 */
export type NoticeSortBy = 'latest' | 'viewCount' | 'commentCount';

/** 목록 조회 파라미터 */
export interface NoticeListParams {
  page?: number;
  limit?: number;
  type?: NoticeType | 'all';
  search?: string;
  sortBy?: NoticeSortBy;
  startDate?: string;
  endDate?: string;
  authorId?: number;
}

/** 목록 조회 응답 */
export interface NoticeListResponse {
  data: NoticeListItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// ============================================================
// 통계 (ADMIN 전용)
// ============================================================

/** 게시판 통계 */
export interface NoticeStatistics {
  totalCount: number;
  typeCount: Record<NoticeType, number>;
  topViewed: NoticeListItem[];
  topCommented: NoticeListItem[];
  recentActivity: {
    date: string;
    noticeCount: number;
    commentCount: number;
  }[];
}

/** 통계 응답 */
export interface NoticeStatisticsResponse {
  data: NoticeStatistics;
}

// ============================================================
// 폼 상태 (React Hook Form)
// ============================================================

/** 게시물 폼 데이터 */
export interface NoticeFormData {
  title: string;
  content: string;
  type: NoticeType;
  files?: FileList;
}

/** 댓글 폼 데이터 */
export interface CommentFormData {
  content: string;
  parentCommentId?: number;
}

// ============================================================
// API 에러
// ============================================================

/** API 에러 응답 */
export interface NoticeApiError {
  message: string;
  errors?: Record<string, string>;
}

// ============================================================
// 유틸리티 함수
// ============================================================

/** 파일 크기 포맷 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** 댓글이 수정되었는지 확인 */
export function isCommentEdited(comment: Comment): boolean {
  return comment.createdAt !== comment.updatedAt;
}

/** MIME 타입이 허용되는지 확인 */
export function isAllowedMimeType(mimeType: string): mimeType is AllowedMimeType {
  return (ALLOWED_MIME_TYPES as readonly string[]).includes(mimeType);
}
```

---

## Acceptance Criteria

- [ ] `src/types/notice.ts` 파일 생성
- [ ] NoticeType enum 정의
- [ ] Notice, NoticeDetail, NoticeListItem 인터페이스 정의
- [ ] Comment 인터페이스 정의 (replies 포함)
- [ ] NoticeAttachment 인터페이스 정의
- [ ] 요청/응답 타입 정의
- [ ] 유틸리티 함수 정의
- [ ] TypeScript 컴파일 성공

---

## 테스트 전략

### TypeScript 컴파일

```bash
npm run type-check
```

### 타입 검증 테스트

```typescript
// src/__tests__/types/notice.test.ts

import {
  Notice,
  NoticeType,
  NOTICE_TYPES,
  isAllowedMimeType,
  formatFileSize,
} from '@/types/notice';

describe('Notice Types', () => {
  it('should have 5 notice types', () => {
    expect(NOTICE_TYPES).toHaveLength(5);
    expect(NOTICE_TYPES).toContain('공지');
    expect(NOTICE_TYPES).toContain('공유');
    expect(NOTICE_TYPES).toContain('지시');
    expect(NOTICE_TYPES).toContain('건의');
    expect(NOTICE_TYPES).toContain('자유');
  });

  it('should validate allowed MIME types', () => {
    expect(isAllowedMimeType('image/jpeg')).toBe(true);
    expect(isAllowedMimeType('image/png')).toBe(true);
    expect(isAllowedMimeType('application/pdf')).toBe(true);
    expect(isAllowedMimeType('image/svg+xml')).toBe(false);
    expect(isAllowedMimeType('application/javascript')).toBe(false);
  });

  it('should format file size correctly', () => {
    expect(formatFileSize(500)).toBe('500 B');
    expect(formatFileSize(1024)).toBe('1.0 KB');
    expect(formatFileSize(1536)).toBe('1.5 KB');
    expect(formatFileSize(1048576)).toBe('1.0 MB');
    expect(formatFileSize(10485760)).toBe('10.0 MB');
  });
});
```

---

## 완료 체크리스트

- [ ] `npm run type-check` 통과
- [ ] `npm run lint` 통과
- [ ] 타입 테스트 작성 및 통과
- [ ] 기존 types 폴더 패턴과 일관성 유지

---

**다음 문서**: 2101_04_API_게시물_목록_작성.md
