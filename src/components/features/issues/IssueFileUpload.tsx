'use client';

// Generated: 2026-01-25 22:45:00 KST

import { useState } from 'react';
import {
  useUploadAttachmentMutation,
  useDeleteAttachmentMutation,
} from '@/hooks/issues';
import { Button } from '@/components/ui/button';

interface IssueFileUploadProps {
  issueId: number;
  attachments: any[];
  currentUserId: number;
  userRole: string;
}

const ALLOWED_MIMES = [
  'application/pdf',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'image/jpeg',
  'image/png',
  'image/gif',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES = 5;

export default function IssueFileUpload({
  issueId,
  attachments,
  currentUserId,
  userRole,
}: IssueFileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const uploadMutation = useUploadAttachmentMutation(issueId);

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return '파일은 10MB 이하여야 합니다';
    }

    // Check MIME type
    if (!ALLOWED_MIMES.includes(file.type)) {
      return '지원하지 않는 파일 형식입니다';
    }

    // Check file count
    if (attachments && attachments.length >= MAX_FILES) {
      return '최대 5개까지 업로드할 수 있습니다';
    }

    return null;
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setError('');

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
      } else {
        setSelectedFile(file);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    const file = e.target.files?.[0];
    if (file) {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
      } else {
        setSelectedFile(file);
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      await uploadMutation.mutateAsync(selectedFile);
      setSelectedFile(null);
      setError('');
    } catch (err) {
      setError('파일 업로드에 실패했습니다');
      console.error('Upload failed:', err);
    }
  };

  return (
    <div className="space-y-4">
      {/* 파일 목록 */}
      {attachments && attachments.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium">업로드된 파일</h3>
          {attachments.map((att) => (
            <AttachmentItemWithDelete
              key={att.id}
              issueId={issueId}
              attachment={att}
              currentUserId={currentUserId}
              userRole={userRole}
            />
          ))}
        </div>
      )}

      {/* 드래그앤드롭 영역 */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`p-6 border-2 border-dashed rounded-lg transition-colors ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 bg-gray-50'
        }`}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="text-gray-600">
            <svg
              className="w-8 h-8 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>

          <div className="text-center">
            <label htmlFor="file-input" className="cursor-pointer">
              <span className="text-blue-600 hover:text-blue-700 font-medium">
                클릭하여 파일 선택
              </span>
              <span className="text-gray-600"> 또는 드래그앤드롭</span>
            </label>
          </div>

          <p className="text-sm text-gray-500">
            지원 형식: PDF, Excel, Word, PowerPoint, 이미지 (최대 10MB, 5개까지)
          </p>

          <input
            id="file-input"
            type="file"
            onChange={handleFileSelect}
            className="hidden"
            accept={ALLOWED_MIMES.join(',')}
          />
        </div>
      </div>

      {/* 선택된 파일 표시 */}
      {selectedFile && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium text-sm text-gray-800">
                {selectedFile.name}
              </p>
              <p className="text-xs text-gray-600">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <Button
              size="sm"
              onClick={handleUpload}
              disabled={uploadMutation.isPending}
            >
              {uploadMutation.isPending ? '업로드 중...' : '업로드'}
            </Button>
          </div>
        </div>
      )}

      {/* 에러 메시지 */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
    </div>
  );
}

interface AttachmentItemWithDeleteProps {
  issueId: number;
  attachment: any;
  currentUserId: number;
  userRole: string;
}

function AttachmentItemWithDelete({
  issueId,
  attachment,
  currentUserId,
  userRole,
}: AttachmentItemWithDeleteProps) {
  const deleteMutation = useDeleteAttachmentMutation(issueId, attachment.id);
  const canDelete =
    userRole === 'ADMIN' || currentUserId === attachment.uploaded_by_id;

  return (
    <div className="flex justify-between items-center p-3 bg-gray-50 rounded border">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{attachment.file_name}</p>
        <p className="text-xs text-gray-500">
          {(attachment.file_size / 1024 / 1024).toFixed(2)} MB
        </p>
      </div>
      <div className="flex gap-2 ml-4 flex-shrink-0">
        <Button
          size="sm"
          variant="outline"
          disabled
          className="text-xs"
          title="다운로드 기능은 추후 지원됩니다"
        >
          다운
        </Button>
        {canDelete && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
            className="text-xs text-red-600"
          >
            {deleteMutation.isPending ? '삭제중' : '삭제'}
          </Button>
        )}
      </div>
    </div>
  );
}
