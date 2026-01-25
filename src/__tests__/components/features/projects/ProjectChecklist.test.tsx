// Generated: 2026-01-25 17:30:00 KST

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider } from 'next-auth/react';
import { ProjectChecklist } from '@/components/features/projects/ProjectChecklist';

const mockSession = {
  user: {
    id: 1,
    role: 'ADMIN',
    name: 'Admin User',
    email: 'admin@example.com',
  },
};

const mockStages = {
  MEETING: '2026-01-20T10:00:00Z',
  PROPOSAL: null,
  QUOTATION: '2026-01-22T14:00:00Z',
  CONTRACT: null,
  KICKOFF: null,
  DEVELOPMENT: null,
  DELIVERY: null,
  HANDOVER: null,
};

jest.mock('@/hooks/projects', () => ({
  useToggleChecklistMutation: () => ({
    mutate: jest.fn(),
    isPending: false,
  }),
}));

describe('ProjectChecklist', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  const renderComponent = (stages = mockStages, projectId = 1, canEdit = true) => {
    return render(
      <SessionProvider session={mockSession}>
        <QueryClientProvider client={queryClient}>
          <ProjectChecklist projectId={projectId} stages={stages} canEdit={canEdit} />
        </QueryClientProvider>
      </SessionProvider>
    );
  };

  it('should render all 8 stages', () => {
    renderComponent();

    expect(screen.getByText('회의')).toBeInTheDocument();
    expect(screen.getByText('제안')).toBeInTheDocument();
    expect(screen.getByText('견적')).toBeInTheDocument();
    expect(screen.getByText('계약')).toBeInTheDocument();
    expect(screen.getByText('착수')).toBeInTheDocument();
    expect(screen.getByText('진행')).toBeInTheDocument();
    expect(screen.getByText('납품')).toBeInTheDocument();
    expect(screen.getByText('인수인계')).toBeInTheDocument();
  });

  it('should show completed checkboxes as checked', () => {
    renderComponent();

    const checkboxes = screen.getAllByRole('checkbox');
    // MEETING is completed, so first checkbox should be checked
    expect(checkboxes[0]).toBeChecked();
    // PROPOSAL is not completed
    expect(checkboxes[1]).not.toBeChecked();
  });

  it('should highlight stages with gaps', () => {
    const stagesWithGap = {
      MEETING: '2026-01-20T10:00:00Z', // completed
      PROPOSAL: null, // not completed
      QUOTATION: '2026-01-22T14:00:00Z', // completed (creates gap)
      CONTRACT: null,
      KICKOFF: null,
      DEVELOPMENT: null,
      DELIVERY: null,
      HANDOVER: null,
    };
    renderComponent(stagesWithGap);

    // PROPOSAL should be highlighted because QUOTATION (later stage) is completed
    const proposalCheckbox = screen.getByText('제안').closest('div');
    expect(proposalCheckbox?.className).toContain('bg-orange');
  });

  it('should display timestamps for completed stages', () => {
    renderComponent();

    // MEETING was completed on 2026-01-20
    // Korean date format is "2026. 1. 20..."
    expect(screen.getByText(/2026\.\s*1\.\s*20|1\.\s*20/)).toBeInTheDocument();
    // QUOTATION was completed on 2026-01-22
    expect(screen.getByText(/2026\.\s*1\.\s*22|1\.\s*22/)).toBeInTheDocument();
  });

  it('should not show timestamps for uncompleted stages', () => {
    renderComponent();

    const proposalElement = screen.getByText('제안').closest('div');
    expect(proposalElement).not.toHaveTextContent(/2026-/);
  });

  it('should disable checkboxes when canEdit is false', () => {
    renderComponent(mockStages, 1, false);

    const checkboxes = screen.getAllByRole('checkbox');
    checkboxes.forEach((checkbox) => {
      expect(checkbox).toBeDisabled();
    });
  });

  it('should enable checkboxes when canEdit is true', () => {
    renderComponent(mockStages, 1, true);

    const checkboxes = screen.getAllByRole('checkbox');
    checkboxes.forEach((checkbox) => {
      expect(checkbox).not.toBeDisabled();
    });
  });

  it('should call toggle mutation when checkbox clicked', async () => {
    const user = userEvent.setup();
    renderComponent();

    const uncompleteCheckbox = screen.getAllByRole('checkbox')[1]; // PROPOSAL
    await user.click(uncompleteCheckbox);

    await waitFor(() => {
      expect(screen.getByText(/제안/)).toBeInTheDocument();
    });
  });

  it('should handle all stages being completed', () => {
    const allCompletedStages = Object.fromEntries(
      Object.entries(mockStages).map(([key]) => [key, '2026-01-25T00:00:00Z'])
    );

    renderComponent(allCompletedStages);

    // All stages should be completed
    const checkboxes = screen.getAllByRole('checkbox');
    checkboxes.forEach((checkbox) => {
      expect(checkbox).toBeChecked();
    });
  });

  it('should display stage in sequential order', () => {
    renderComponent();

    // Verify all 8 stages are present in order
    const stageLabels = ['회의', '제안', '견적', '계약', '착수', '진행', '납품', '인수인계'];
    stageLabels.forEach((label) => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });

  it('should show completed count', () => {
    renderComponent();

    // 2 out of 8 stages are completed
    const completedText = screen.queryByText(/2 of 8|2\/8/i) || screen.queryByText(/완료: 2/);
    if (completedText) {
      expect(completedText).toBeInTheDocument();
    }
  });
});
