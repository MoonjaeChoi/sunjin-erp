// Generated: 2026-01-24 23:30:00 KST

import { TaskType, WorkType, TaskStatus } from './task';

// === API Request DTOs ===

export interface CreateTaskDto {
  title: string;
  description?: string;
  task_date: string;
  start_time?: number;
  end_time?: number;
  task_type: TaskType;
  work_type: WorkType;
  status?: TaskStatus;
  customer_id?: number;
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  task_date?: string;
  start_time?: number | null;
  end_time?: number | null;
  task_type?: TaskType;
  work_type?: WorkType;
  status?: TaskStatus;
  customer_id?: number | null;
}

export interface TaskFilters {
  date_from: string;
  date_to: string;
  employee_id?: number;
  type?: TaskType;
  status?: TaskStatus;
}

// === API Response Types ===

export interface TaskListItem {
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
  employee_name: string;
  customer_id: number | null;
  customer_name: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskListResponse {
  tasks: TaskListItem[];
  total: number;
}

export interface DailySummaryResponse {
  date: string;
  tasks: TaskSummaryItem[];
  techSupports: TechSupportSummaryItem[];
}

export interface TaskSummaryItem {
  id: number;
  title: string;
  task_type: TaskType;
  work_type: WorkType;
  status: TaskStatus;
  start_time: number | null;
  end_time: number | null;
  customer_name: string | null;
}

export interface TechSupportSummaryItem {
  id: number;
  title: string;
  customer_name: string;
  status: string;
  support_date: string;
}

export interface TeamCalendarResponse {
  employees: TeamEmployeeData[];
}

export interface TeamEmployeeData {
  employee_id: number;
  employee_name: string;
  tasks: TeamTaskItem[];
}

export interface TeamTaskItem {
  id: number;
  title: string;
  task_date: string;
  start_time: number | null;
  end_time: number | null;
  task_type: TaskType;
  work_type: WorkType;
  status: TaskStatus;
}

// === UI Types ===

export type CalendarView = 'month' | 'week' | 'day';
