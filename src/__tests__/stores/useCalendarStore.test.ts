// Generated: 2026-01-24 23:30:00 KST

import { useCalendarStore } from '@/stores/useCalendarStore';

describe('useCalendarStore', () => {
  beforeEach(() => {
    useCalendarStore.setState({
      taskFormOpen: false,
      editingTaskId: null,
      selectedEmployeeFilter: null,
      selectedDate: null,
    });
  });

  it('should initialize with default values', () => {
    const state = useCalendarStore.getState();
    expect(state.taskFormOpen).toBe(false);
    expect(state.editingTaskId).toBeNull();
    expect(state.selectedEmployeeFilter).toBeNull();
    expect(state.selectedDate).toBeNull();
  });

  it('openTaskForm should set taskFormOpen true and editingTaskId', () => {
    useCalendarStore.getState().openTaskForm(42);
    const state = useCalendarStore.getState();
    expect(state.taskFormOpen).toBe(true);
    expect(state.editingTaskId).toBe(42);
  });

  it('openTaskForm without id should set editingTaskId null (new)', () => {
    useCalendarStore.getState().openTaskForm();
    const state = useCalendarStore.getState();
    expect(state.taskFormOpen).toBe(true);
    expect(state.editingTaskId).toBeNull();
  });

  it('closeTaskForm should reset form state', () => {
    useCalendarStore.getState().openTaskForm(10);
    useCalendarStore.getState().closeTaskForm();
    const state = useCalendarStore.getState();
    expect(state.taskFormOpen).toBe(false);
    expect(state.editingTaskId).toBeNull();
  });

  it('setEmployeeFilter should update filter', () => {
    useCalendarStore.getState().setEmployeeFilter(5);
    expect(useCalendarStore.getState().selectedEmployeeFilter).toBe(5);
  });

  it('setEmployeeFilter with null should clear filter', () => {
    useCalendarStore.getState().setEmployeeFilter(5);
    useCalendarStore.getState().setEmployeeFilter(null);
    expect(useCalendarStore.getState().selectedEmployeeFilter).toBeNull();
  });

  it('setSelectedDate should update selected date', () => {
    useCalendarStore.getState().setSelectedDate('2026-01-24');
    expect(useCalendarStore.getState().selectedDate).toBe('2026-01-24');
  });

  it('resetFilters should clear all filters', () => {
    useCalendarStore.getState().setEmployeeFilter(3);
    useCalendarStore.getState().setSelectedDate('2026-01-24');
    useCalendarStore.getState().resetFilters();
    const state = useCalendarStore.getState();
    expect(state.selectedEmployeeFilter).toBeNull();
    expect(state.selectedDate).toBeNull();
  });
});
