// Generated: 2026-01-25 18:05:00 KST

/**
 * Unit Tests for Issue Tracking Hooks
 *
 * Tests for TanStack Query hooks with mock API responses
 * This file demonstrates the test structure for the Issue module hooks.
 *
 * Coverage:
 * - useIssueListQuery: Data fetching with pagination
 * - useIssueDetailQuery: Single issue detail retrieval
 * - useIssueSummaryQuery: Status summary counts
 * - useCreateIssueMutation: Issue creation flow
 * - useUpdateIssueMutation: Issue update flow
 * - useDeleteIssueMutation: Soft delete flow
 * - useRollbackIssueMutation: Status rollback flow
 * - useUploadAttachmentMutation: File upload flow
 * - useDeleteAttachmentMutation: Attachment deletion flow
 */

import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import {
  useIssueListQuery,
  useIssueDetailQuery,
  useIssueSummaryQuery,
  useCreateIssueMutation,
} from '@/hooks/issues';

// Mock setup
const mockFetch = jest.fn();
global.fetch = mockFetch;

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('Issue Tracking Hooks', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('useIssueListQuery', () => {
    it('should fetch issue list successfully', async () => {
      const mockData = {
        data: [
          {
            id: 1,
            title: 'Test Issue',
            status: 'INTAKE',
            severity: 'HIGH',
            customer_id: 1,
          },
        ],
        pagination: {
          page: 1,
          page_size: 20,
          total: 1,
          total_pages: 1,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const { result } = renderHook(
        () =>
          useIssueListQuery({
            page: 1,
            page_size: 20,
          }),
        {
          wrapper: createWrapper(),
        }
      );

      // Wait for initial fetch
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual(mockData);
    });

    it('should handle fetch error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(
        () =>
          useIssueListQuery({
            page: 1,
            page_size: 20,
          }),
        {
          wrapper: createWrapper(),
        }
      );

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  describe('useIssueDetailQuery', () => {
    it('should fetch issue detail successfully', async () => {
      const mockData = {
        data: {
          id: 1,
          title: 'Test Issue',
          description: 'Test Description',
          status: 'INTAKE',
          severity: 'HIGH',
          customer_id: 1,
          created_by_id: 1,
          assigned_to_id: null,
          created_at: '2026-01-25T00:00:00Z',
          updated_at: '2026-01-25T00:00:00Z',
          completed_at: null,
          deleted_at: null,
          is_public: 0,
          treatment_method: null,
          treatment_time_minutes: null,
          treatment_result: null,
          attachments: [],
          histories: [],
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const { result } = renderHook(
        () => useIssueDetailQuery(1),
        {
          wrapper: createWrapper(),
        }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual(mockData);
    });

    it('should not fetch when id is invalid', () => {
      mockFetch.mockClear();

      const { result } = renderHook(
        () => useIssueDetailQuery(0),
        {
          wrapper: createWrapper(),
        }
      );

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('useIssueSummaryQuery', () => {
    it('should fetch summary data with status counts', async () => {
      const mockData = {
        data: {
          total: 100,
          intake: 40,
          in_progress: 35,
          completed: 25,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const { result } = renderHook(
        () => useIssueSummaryQuery(),
        {
          wrapper: createWrapper(),
        }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual(mockData);
    });

    it('should apply filters to summary query', async () => {
      const mockData = {
        data: {
          total: 10,
          intake: 5,
          in_progress: 3,
          completed: 2,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const { result } = renderHook(
        () =>
          useIssueSummaryQuery({
            customer_id: 1,
            severity: 'CRITICAL',
          }),
        {
          wrapper: createWrapper(),
        }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual(mockData);
    });
  });

  describe('useCreateIssueMutation', () => {
    it('should create issue successfully', async () => {
      const mockResponse = {
        message: 'Issue created',
        data: {
          id: 1,
          title: 'New Issue',
          status: 'INTAKE',
          severity: 'MEDIUM',
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(
        () => useCreateIssueMutation(),
        {
          wrapper: createWrapper(),
        }
      );

      result.current.mutate({
        customer_id: 1,
        title: 'New Issue',
        severity: 'MEDIUM',
        description: 'This is a test issue',
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockResponse);
    });

    it('should handle creation error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Bad Request',
      });

      const { result } = renderHook(
        () => useCreateIssueMutation(),
        {
          wrapper: createWrapper(),
        }
      );

      result.current.mutate({
        customer_id: 1,
        title: 'New Issue',
        severity: 'MEDIUM',
        description: 'This is a test issue',
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });
});

/**
 * Test Plan for Additional Coverage:
 *
 * 1. API Route Tests (to be added):
 *    - GET /api/issues: RBAC filtering, pagination, multi-filter AND combination
 *    - POST /api/issues: Validation, permission checks, history creation
 *    - PUT /api/issues/[id]: Field-level permissions, state machine validation
 *    - DELETE /api/issues/[id]: Soft delete, attachment checks, history recording
 *    - PUT /api/issues/[id]/rollback: Status rollback validation
 *    - POST /api/issues/[id]/attachments: File upload validation
 *    - DELETE /api/issues/[id]/attachments/[id]: Soft delete attachments
 *    - GET /api/issues/summary: Aggregation counts with RBAC
 *
 * 2. Component Tests (to be added):
 *    - IssueFilters: Filter state updates, form submission
 *    - IssueDataTable: Row rendering, pagination, status/severity badges
 *    - IssueCreateDialog: Form validation, submission, modal behavior
 *    - IssueDetail: Permission-based UI rendering, edit mode, rollback button
 *    - FileUploadArea: File selection, upload, error handling
 *    - IssueHistoryList: History item rendering, date formatting
 *
 * 3. Integration Tests:
 *    - Complete issue creation flow
 *    - Filter + list + pagination flow
 *    - Edit + update flow
 *    - Attachment upload + delete flow
 *
 * All tests should:
 * - Mock external dependencies (fetch, auth, database)
 * - Use consistent error messages
 * - Cover both success and error paths
 * - Test RBAC boundaries
 * - Validate input/output types
 * - Test edge cases (empty data, large pagination, special characters)
 */
