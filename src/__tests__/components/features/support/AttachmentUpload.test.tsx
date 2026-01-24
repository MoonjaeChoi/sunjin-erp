// Generated: 2026-01-25 06:40:00 KST

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AttachmentUpload } from '@/components/features/support/AttachmentUpload';

const mockUpload = jest.fn();
const mockDeleteAttachment = jest.fn();

jest.mock('@/hooks/support', () => ({
  useUploadAttachmentMutation: () => ({
    mutateAsync: mockUpload,
    isPending: false,
  }),
  useDeleteAttachmentMutation: () => ({
    mutateAsync: mockDeleteAttachment,
  }),
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('lucide-react', () => ({
  Upload: () => React.createElement('svg', { 'data-testid': 'upload-icon' }),
  FileText: () => React.createElement('svg', { 'data-testid': 'file-icon' }),
  Download: () => React.createElement('svg', { 'data-testid': 'download-icon' }),
  Trash2: () => React.createElement('svg', { 'data-testid': 'trash-icon' }),
  RefreshCw: () => React.createElement('svg', { 'data-testid': 'refresh-icon' }),
}));

jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: any) => open ? React.createElement('div', { 'data-testid': 'confirm-dialog' }, children) : null,
  DialogContent: ({ children }: any) => React.createElement('div', null, children),
  DialogHeader: ({ children }: any) => React.createElement('div', null, children),
  DialogTitle: ({ children }: any) => React.createElement('h2', null, children),
  DialogDescription: ({ children }: any) => React.createElement('p', null, children),
  DialogFooter: ({ children }: any) => React.createElement('div', null, children),
}));

describe('AttachmentUpload', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should show upload area when no attachment and canEdit', () => {
    render(<AttachmentUpload supportId={1} attachmentName={null} canEdit={true} />);
    expect(screen.getByText('클릭하여 파일 선택')).toBeInTheDocument();
    expect(screen.getByText('PDF, DOCX, XLSX, JPG, PNG (최대 10MB)')).toBeInTheDocument();
  });

  it('should show "첨부파일 없음" when no attachment and not editable', () => {
    render(<AttachmentUpload supportId={1} attachmentName={null} canEdit={false} />);
    expect(screen.getByText('첨부파일 없음')).toBeInTheDocument();
  });

  it('should display attachment name when file exists', () => {
    render(<AttachmentUpload supportId={1} attachmentName="report.pdf" canEdit={true} />);
    expect(screen.getByText('report.pdf')).toBeInTheDocument();
  });

  it('should show download button when attachment exists', () => {
    render(<AttachmentUpload supportId={1} attachmentName="report.pdf" canEdit={false} />);
    expect(screen.getByText('다운로드')).toBeInTheDocument();
  });

  it('should show replace and delete buttons when canEdit and attachment exists', () => {
    render(<AttachmentUpload supportId={1} attachmentName="report.pdf" canEdit={true} />);
    expect(screen.getByText('교체')).toBeInTheDocument();
    expect(screen.getByTestId('trash-icon')).toBeInTheDocument();
  });

  it('should not show replace/delete when not editable', () => {
    render(<AttachmentUpload supportId={1} attachmentName="report.pdf" canEdit={false} />);
    expect(screen.queryByText('교체')).not.toBeInTheDocument();
    expect(screen.queryByTestId('trash-icon')).not.toBeInTheDocument();
  });

  it('should show error for file too large', async () => {
    const user = userEvent.setup();
    render(<AttachmentUpload supportId={1} attachmentName={null} canEdit={true} />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const bigFile = new File(['x'.repeat(11 * 1024 * 1024)], 'big.pdf', { type: 'application/pdf' });
    await user.upload(fileInput, bigFile);

    expect(screen.getByText('파일 크기는 10MB를 초과할 수 없습니다.')).toBeInTheDocument();
  });

  it('should show error for invalid extension', () => {
    render(<AttachmentUpload supportId={1} attachmentName={null} canEdit={true} />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const invalidFile = new File(['content'], 'script.exe', { type: 'application/x-executable' });
    // Use fireEvent to bypass accept attribute filtering
    fireEvent.change(fileInput, { target: { files: [invalidFile] } });

    expect(screen.getByText('허용된 파일 형식: pdf, docx, xlsx, jpg, jpeg, png')).toBeInTheDocument();
  });

  it('should call upload for valid file when no existing attachment', async () => {
    const user = userEvent.setup();
    mockUpload.mockResolvedValue({});
    render(<AttachmentUpload supportId={1} attachmentName={null} canEdit={true} />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const validFile = new File(['content'], 'doc.pdf', { type: 'application/pdf' });
    await user.upload(fileInput, validFile);

    expect(mockUpload).toHaveBeenCalledWith({ id: 1, file: validFile });
  });

  it('should show replace confirmation when uploading with existing attachment', async () => {
    const user = userEvent.setup();
    render(<AttachmentUpload supportId={1} attachmentName="old.pdf" canEdit={true} />);

    // Click the replace button to open file dialog
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const newFile = new File(['content'], 'new.pdf', { type: 'application/pdf' });
    await user.upload(fileInput, newFile);

    expect(screen.getByText('파일 교체')).toBeInTheDocument();
    expect(screen.getByText('기존 파일이 교체됩니다. 계속하시겠습니까?')).toBeInTheDocument();
  });

  it('should call upload after replace confirmation', async () => {
    const user = userEvent.setup();
    mockUpload.mockResolvedValue({});
    render(<AttachmentUpload supportId={1} attachmentName="old.pdf" canEdit={true} />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const newFile = new File(['content'], 'new.pdf', { type: 'application/pdf' });
    await user.upload(fileInput, newFile);

    // Confirm replace
    await user.click(screen.getByText('교체', { selector: '[data-testid="confirm-dialog"] button' }));
    expect(mockUpload).toHaveBeenCalledWith({ id: 1, file: newFile });
  });

  it('should show delete confirmation dialog', async () => {
    const user = userEvent.setup();
    render(<AttachmentUpload supportId={1} attachmentName="file.pdf" canEdit={true} />);

    // Click the trash button (destructive button)
    const trashButton = screen.getByTestId('trash-icon').closest('button')!;
    await user.click(trashButton);

    expect(screen.getByText('파일 삭제')).toBeInTheDocument();
    expect(screen.getByText('첨부파일을 삭제합니다. 이 작업은 취소할 수 없습니다.')).toBeInTheDocument();
  });

  it('should call deleteAttachment after delete confirm', async () => {
    const user = userEvent.setup();
    mockDeleteAttachment.mockResolvedValue({});
    render(<AttachmentUpload supportId={1} attachmentName="file.pdf" canEdit={true} />);

    // Open delete confirmation
    const trashButton = screen.getByTestId('trash-icon').closest('button')!;
    await user.click(trashButton);

    // Confirm delete
    const deleteConfirmBtn = screen.getByText('삭제', { selector: '[data-testid="confirm-dialog"] button' });
    await user.click(deleteConfirmBtn);

    expect(mockDeleteAttachment).toHaveBeenCalledWith(1);
  });

  it('should open download URL on download click', async () => {
    const user = userEvent.setup();
    const mockOpen = jest.fn();
    Object.defineProperty(window, 'open', { value: mockOpen, writable: true });

    render(<AttachmentUpload supportId={5} attachmentName="file.pdf" canEdit={false} />);

    await user.click(screen.getByText('다운로드'));
    expect(mockOpen).toHaveBeenCalledWith('/api/support/5/attachment', '_blank');
  });
});
