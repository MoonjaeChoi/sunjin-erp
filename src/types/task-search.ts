// Generated: 2026-01-25 03:30:00 KST

import { TaskType, WorkType, TaskStatus } from './task';

/** 유효한 정렬 컬럼 */
export type TaskSortBy = 'task_date' | 'title' | 'status';

/** 정렬 방향 */
export type SortOrder = 'ASC' | 'DESC';

/** 유효한 페이지 크기 */
export type PageSize = 10 | 20 | 50;

/** 검색 API 요청 파라미터 */
export interface TaskSearchParams {
  date_from: string;
  date_to: string;
  type?: TaskType;
  work_type?: WorkType;
  status?: TaskStatus;
  keyword?: string;
  page?: number;
  page_size?: PageSize;
  sort_by?: TaskSortBy;
  sort_order?: SortOrder;
  // Phase 2-B
  employee_id?: number;
  customer_id?: number;
}

/** Task 엔티티 (API 응답) */
export interface TaskRecord {
  id: number;
  title: string;
  description: string | null;
  task_date: string;
  start_time: number | null;
  end_time: number | null;
  task_type: TaskType;
  work_type: WorkType;
  status: TaskStatus;
  employee_id: number;
  customer_id: number | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

/** 페이지네이션 응답 (page 지정 시) */
export interface TaskSearchResponse {
  tasks: TaskRecord[];
  total: number;
  page: number;
  page_size: number;
}

/** 기존 대시보드 응답 (page 미지정 시) */
export interface TaskListResponse {
  tasks: TaskRecord[];
  total: number;
}

/** 검색 필터 UI 상태 (debounce 전 로컬 상태) */
export interface TaskFilterState {
  dateFrom: string;
  dateTo: string;
  type: TaskType | '';
  workType: WorkType | '';
  status: TaskStatus | '';
  keyword: string;
}

/** 업무 수정 요청 DTO */
export interface UpdateTaskDto {
  title?: string;
  description?: string | null;
  task_date?: string;
  start_time?: number | null;
  end_time?: number | null;
  task_type?: TaskType;
  work_type?: WorkType;
  status?: TaskStatus;
  customer_id?: number | null;
}

/** 검색 필터 기본값 */
export const DEFAULT_PAGE_SIZE: PageSize = 20;
export const DEFAULT_SORT_BY: TaskSortBy = 'task_date';
export const DEFAULT_SORT_ORDER: SortOrder = 'DESC';
