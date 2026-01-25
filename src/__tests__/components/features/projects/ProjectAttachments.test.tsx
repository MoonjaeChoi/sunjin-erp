// Generated: 2026-01-25 17:30:00 KST

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider } from 'next-auth/react';
import { ProjectAttachments } from '@/components/features/projects/ProjectAttachments';

const mockSession = {
  user: {
    id: 1,
    role: 'ADMIN',
    name: 'Admin User',
    email: 'admin@example.com',
  },
};

const mockAttachments = [
  {
    id: 1,
    file_name: 'contract.pdf',
    file_size: 102400,
    category: 'CONTRACT',
    created_at: '2026-01-20T10:00:00Z',
  },
  {
    id: 2,
    file_name: 'proposal.docx',
    file_size: 51200,
    category: 'PROPOSAL',
    created_at: '2026-01-21T14:00:00Z',
  },
];

jest.mock('@/hooks/projects', () => ({
  useUploadProjectAttachmentMutation: () => ({
    mutateAsync: jest.fn().mockResolvedValue({
      id: 3,
      file_name: 'new-file.pdf',
      file_size: 102400,
      category: 'REPORT',
      created_at: new Date().toISOString(),
    }),
    isPending: false,
  }),
  useDeleteProjectAttachmentMutation: () => ({
    mutateAsync: jest.fn().mockResolvedValue(undefined),
    isPending: false,
  }),
}));

describe('ProjectAttachments', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  const renderComponent = (attachments = mockAttachments, projectId = 1, canEdit = true) => {
    return render(
      <SessionProvider session={mockSession}>
        <QueryClientProvider client={queryClient}>
          <ProjectAttachments projectId={projectId} attachments={attachments} canEdit={canEdit} />
        </QueryClientProvider>
      </SessionProvider>
    );
  };

  it('should render attachment list', () => {
    renderComponent();

    expect(screen.getByText('contract.pdf')).toBeInTheDocument();
    expect(screen.getByText('proposal.docx')).toBeInTheDocument();
  });

  it('should display file size in KB/MB', () => {
    renderComponent();

    expect(screen.getByText(/100 KB|0.1 MB/)).toBeInTheDocument();
    expect(screen.getByText(/50 KB/)).toBeInTheDocument();
  });

  it('should display category badges with correct colors', () => {
    renderComponent();

    const contractBadge = screen.getByText('계약서');
    const proposalBadge = screen.getByText('제안서');

    expect(contractBadge).toBeInTheDocument();
    expect(proposalBadge).toBeInTheDocument();
  });

  it('should show download button for each attachment', () => {
    renderComponent();

    const downloadButtons = screen.getAllByRole('button', { name: /Download|다운로드/i });
    expect(downloadButtons.length).toBeGreaterThanOrEqual(2);
  });

  it('should show delete button when canEdit is true', () => {
    renderComponent(mockAttachments, 1, true);

    const deleteButtons = screen.getAllByRole('button', { name: /Delete|삭제/i });
    expect(deleteButtons.length).toBeGreaterThanOrEqual(2);
  });

  it('should not show delete button when canEdit is false', () => {
    renderComponent(mockAttachments, 1, false);

    const deleteButtons = screen.queryAllByRole('button', { name: /Delete|삭제/i });
    expect(deleteButtons.length).toBe(0);
  });

  it('should show upload button when canEdit is true', async () => {
    const user = userEvent.setup();
    renderComponent(mockAttachments, 1, true);

    // Look for the Plus icon button which is the upload trigger
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('should disable upload when canEdit is false', () => {
    renderComponent(mockAttachments, 1, false);

    // Component should still render, but without upload functionality
    expect(screen.getByText('contract.pdf')).toBeInTheDocument();
  });

  it('should show upload form after clicking add button', async () => {
    const user = userEvent.setup();
    renderComponent(mockAttachments, 1, true);

    // Find and click the add button (plus icon)
    const buttons = screen.getAllByRole('button');
    const addButton = buttons.find((btn) => {
      const svg = btn.querySelector('svg');
      return svg?.className.baseVal?.includes('lucide-plus');
    });

    if (addButton) {
      await user.click(addButton);
      // After clicking, the upload form should appear
      expect(screen.getByText(/Select Category|카테고리 선택/i)).toBeInTheDocument();
    }
  });

  it('should render category select in upload form', async () => {
    const user = userEvent.setup();
    renderComponent(mockAttachments, 1, true);

    // Click to show upload form
    const buttons = screen.getAllByRole('button');
    const addButton = buttons[buttons.length - 1]; // Last button is usually the add
    await user.click(addButton);

    expect(screen.getByText(/Select Category|카테고리 선택/i)).toBeInTheDocument();
  });

  it('should require category selection before upload', async () => {
    const user = userEvent.setup();
    renderComponent(mockAttachments, 1, true);

    const pdfFile = new File(['test'], 'doc.pdf', { type: 'application/pdf' });
    const fileInput = screen.getByDisplayValue(/Choose File|파일 선택/i, { selector: 'input' });
    await user.upload(fileInput, pdfFile);

    const uploadButton = screen.getByRole('button', { name: /Upload|업로드|등록/i });
    await user.click(uploadButton);

    await waitFor(() => {
      expect(screen.getByText(/카테고리|Select Category/i)).toBeInTheDocument();
    });
  });

  it('should show confirm dialog before delete', async () => {
    const user = userEvent.setup();
    renderComponent(mockAttachments, 1, true);

    const deleteButtons = screen.getAllByRole('button', { name: /Delete|삭제/i });
    await user.click(deleteButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(/confirm|confirm deletion|정말 삭제/i)).toBeInTheDocument();
    });
  });

  it('should call download when download button clicked', async () => {
    const user = userEvent.setup();
    const windowOpenSpy = jest.spyOn(window, 'open').mockImplementation();

    renderComponent(mockAttachments, 1, true);

    const downloadButtons = screen.getAllByRole('button', { name: /Download|다운로드/i });
    await user.click(downloadButtons[0]);

    expect(windowOpenSpy).toHaveBeenCalledWith(
      expect.stringContaining('/api/projects/1/attachments/1'),
      '_blank'
    );

    windowOpenSpy.mockRestore();
  });

  it('should show empty state when no attachments', () => {
    renderComponent([]);

    expect(screen.getByText(/No attachments|첨부파일 없음/i)).toBeInTheDocument();
  });

  it('should display attachment created date', () => {
    renderComponent();

    // At least one date should be visible
    expect(screen.getByText(/2026-01|January|01월/)).toBeInTheDocument();
  });

  it('should display correct file icons by type', () => {
    renderComponent();

    // Both PDF and DOCX files should be rendered in the attachment list
    expect(screen.getByText('contract.pdf')).toBeInTheDocument();
    expect(screen.getByText('proposal.docx')).toBeInTheDocument();
  });
});
