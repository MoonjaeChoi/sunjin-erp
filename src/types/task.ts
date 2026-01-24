// Generated: 2026-01-24 23:00:00 KST

/** 업무 유형 */
export enum TaskType {
  DOCUMENT = 'DOCUMENT',
  TEST = 'TEST',
  MEETING = 'MEETING',
  TRAINING = 'TRAINING',
  OTHER = 'OTHER',
}

/** 근무 형태 */
export enum WorkType {
  OFFICE = 'OFFICE',
  FIELD = 'FIELD',
}

/** 업무 상태 */
export enum TaskStatus {
  READY = 'READY',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
}

/** TaskType 한글 레이블 */
export const TaskTypeLabel: Record<TaskType, string> = {
  [TaskType.DOCUMENT]: '문서작성',
  [TaskType.TEST]: '테스트',
  [TaskType.MEETING]: '회의',
  [TaskType.TRAINING]: '교육',
  [TaskType.OTHER]: '기타',
};

/** WorkType 한글 레이블 */
export const WorkTypeLabel: Record<WorkType, string> = {
  [WorkType.OFFICE]: '내근',
  [WorkType.FIELD]: '외근',
};

/** TaskStatus 한글 레이블 */
export const TaskStatusLabel: Record<TaskStatus, string> = {
  [TaskStatus.READY]: '준비',
  [TaskStatus.IN_PROGRESS]: '진행',
  [TaskStatus.DONE]: '완료',
};
