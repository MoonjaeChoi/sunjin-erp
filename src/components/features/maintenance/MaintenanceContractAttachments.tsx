// Generated: 2026-01-27 02:05:00 KST

'use client';

import { MaintenanceContractAttachment } from '@/types/maintenance';
import { Button } from '@/components/ui/button';
import { FileText, Trash2, Download, Plus } from 'lucide-react';
import { useMemo } from 'react';

interface MaintenanceContractAttachmentsProps {
  contractId: number;
  attachments: MaintenanceContractAttachment[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  isLoading?: boolean;
  onPageChange?: (page: number) => void;
  onDelete?: (attachmentId: number) => void;
  onUpload?: () => void;
  onDownload?: (attachmentId: number, fileName: string) => void;
}

/**
 * 유지보수 계약 첨부파일 컴포넌트
 * - 파일 목록 (PDF, DOC, DOCX)
 * - 파일 정보 (이름, 크기, 업로드자, 날짜)
 * - 페이지네이션
 * - 다운로드, 삭제 액션
 */
export default function MaintenanceContractAttachments({
  contractId,
  attachments,
  pagination,
  isLoading = false,
  onPageChange,
  onDelete,
  onUpload,
  onDownload,
}: MaintenanceContractAttachmentsProps) {
  // 파일 타입별 아이콘 색상 결정
  const getFileIcon = (fileName: string) => {
    const ext = fileName.toLowerCase().split('.').pop();
    const iconClass = `h-6 w-6`;

    switch (ext) {
      case 'pdf':
        return <FileText className={`${iconClass} text-red-500`} />;
      case 'doc':
      case 'docx':
        return <FileText className={`${iconClass} text-blue-500`} />;
      default:
        return <FileText className={`${iconClass} text-gray-500`} />;
    }
  };

  // 파일 크기 포맷팅
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-gray-200 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  if (attachments.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 mb-4">첨부파일이 없습니다.</p>
        <Button onClick={onUpload} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          파일 업로드
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Upload Button */}
      <div className="flex justify-end">
        <Button onClick={onUpload} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          파일 추가
        </Button>
      </div>

      {/* File List */}
      <div className="space-y-3">
        {attachments.map((attachment) => (
          <div
            key={attachment.id}
            className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            {/* File Info */}
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="flex-shrink-0">
                {getFileIcon(attachment.file_name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {attachment.file_name}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatFileSize(attachment.file_size)} ·
                  {attachment.uploadedBy?.name && (
                    <> {attachment.uploadedBy.name} · </>
                  )}
                  {new Date(attachment.created_at).toLocaleDateString('ko-KR')}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 ml-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDownload?.(attachment.id, attachment.file_name)}
                title="다운로드"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete?.(attachment.id)}
                className="text-red-600 hover:text-red-700"
                title="삭제"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between border-t pt-4 mt-4">
          <p className="text-sm text-gray-500">
            총 {pagination.total}개 ({pagination.page} / {pagination.totalPages})
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page === 1}
              onClick={() => onPageChange?.(Math.max(1, pagination.page - 1))}
            >
              이전
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => onPageChange?.(pagination.page + 1)}
            >
              다음
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
