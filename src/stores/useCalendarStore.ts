// Generated: 2026-01-24 23:30:00 KST

'use client';

import { create } from 'zustand';

interface CalendarState {
  taskFormOpen: boolean;
  editingTaskId: number | null;
  selectedEmployeeFilter: number | null;
  selectedDate: string | null;

  openTaskForm: (taskId?: number) => void;
  closeTaskForm: () => void;
  setEmployeeFilter: (employeeId: number | null) => void;
  setSelectedDate: (date: string | null) => void;
  resetFilters: () => void;
}

export const useCalendarStore = create<CalendarState>((set) => ({
  taskFormOpen: false,
  editingTaskId: null,
  selectedEmployeeFilter: null,
  selectedDate: null,

  openTaskForm: (taskId) =>
    set({
      taskFormOpen: true,
      editingTaskId: taskId ?? null,
    }),

  closeTaskForm: () =>
    set({
      taskFormOpen: false,
      editingTaskId: null,
    }),

  setEmployeeFilter: (employeeId) =>
    set({
      selectedEmployeeFilter: employeeId,
    }),

  setSelectedDate: (date) =>
    set({
      selectedDate: date,
    }),

  resetFilters: () =>
    set({
      selectedEmployeeFilter: null,
      selectedDate: null,
    }),
}));
