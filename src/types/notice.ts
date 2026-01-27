// Generated: 2026-01-28 16:00:00 KST

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
