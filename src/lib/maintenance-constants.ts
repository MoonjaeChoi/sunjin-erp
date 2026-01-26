// Generated: 2026-01-26 22:45:00 KST

/**
 * Maintenance Contract 상수 정의
 */

export const CONTRACT_STATUS = {
  ACTIVE: '활성',
  TERMINATED: '종료',
  RENEWAL_PENDING: '갱신예정',
} as const;

export const CHANGE_TYPE = {
  RENEWAL: '갱신',
  STATUS_CHANGE: '상태변경',
  INFO_UPDATE: '정보수정',
} as const;

/**
 * 첨부파일 설정
 */
export const ATTACHMENT_CONFIG = {
  ALLOWED_TYPES: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_FILES_PER_CONTRACT: 5,
  UPLOAD_DIR: 'maintenance',
} as const;

/**
 * 상태별 라벨 (UI 표시용)
 */
export const CONTRACT_STATUS_LABELS = {
  [CONTRACT_STATUS.ACTIVE]: '활성',
  [CONTRACT_STATUS.TERMINATED]: '종료',
  [CONTRACT_STATUS.RENEWAL_PENDING]: '갱신예정',
} as const;

/**
 * 변경 유형별 라벨 (UI 표시용)
 */
export const CHANGE_TYPE_LABELS = {
  [CHANGE_TYPE.RENEWAL]: '갱신',
  [CHANGE_TYPE.STATUS_CHANGE]: '상태변경',
  [CHANGE_TYPE.INFO_UPDATE]: '정보수정',
} as const;

/**
 * 상태 전환 규칙 (유효한 전환만 허용)
 */
export const VALID_STATUS_TRANSITIONS = {
  [CONTRACT_STATUS.ACTIVE]: [CONTRACT_STATUS.TERMINATED, CONTRACT_STATUS.RENEWAL_PENDING],
  [CONTRACT_STATUS.RENEWAL_PENDING]: [CONTRACT_STATUS.ACTIVE],
  [CONTRACT_STATUS.TERMINATED]: [CONTRACT_STATUS.ACTIVE],
} as const;

/**
 * Pagination 기본값
 */
export const DEFAULT_PAGINATION = {
  PAGE: 1,
  LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

/**
 * 정렬 필드
 */
export const SORT_FIELDS = {
  CREATED_AT: 'mc.created_at',
  END_DATE: 'mc.end_date',
  CONTRACT_NAME: 'mc.contract_name',
  CUSTOMER_NAME: 'customer.name',
  STATUS: 'mc.contract_status',
} as const;

export type ContractStatus = typeof CONTRACT_STATUS[keyof typeof CONTRACT_STATUS];
export type ChangeType = typeof CHANGE_TYPE[keyof typeof CHANGE_TYPE];
