// Generated: 2026-01-25 15:58:00 KST

'use client';

import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Download, Trash2, Plus, FileText, File, FileSpreadsheet, Image as ImageIcon } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  useUploadProjectAttachmentMutation,
  useDeleteProjectAttachmentMutation,
} from '@/hooks/projects';
import {
  AttachmentCategory,
  AttachmentCategoryLabel,
  AttachmentCategoryColor,
  FILE_UPLOAD_CONFIG,
  ProjectAttachment,
} from '@/types/project';
import { cn } from '@/lib/utils';

interface ProjectAttachmentsProps {
  projectId: number;
  attachments: ProjectAttachment[];
  canEdit: boolean;
}

const CATEGORY_OPTIONS: AttachmentCategory[] = ['CONTRACT', 'PROPOSAL', 'QUOTATION', 'REPORT', 'OTHER'];

/**
 * 프로젝트 첨부파일 관리 컴포넌트
 * 파일 업로드, 다운로드, 삭제 기능을 제공합니다.
 */
export function ProjectAttachments({
  projectId,
  attachments,
  canEdit,
}: ProjectAttachmentsProps) {
  // ============================================================================
  // 1. 상태 관리
  // ============================================================================
  const [showUpload, setShowUpload] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<AttachmentCategory | ''>('');
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ============================================================================
  // 2. 뮤테이션
  // ============================================================================
  const { mutateAsync: uploadAttachment, isPending: isUploading } =
    useUploadProjectAttachmentMutation();
  const { mutateAsync: deleteAttachment, isPending: isDeleting } =
    useDeleteProjectAttachmentMutation();

  // ============================================================================
  // 3. 파일 검증
  // ============================================================================
  const validateFile = (file: File): string | null => {
    if (file.size > FILE_UPLOAD_CONFIG.MAX_SIZE) {
      return `파일 크기는 ${FILE_UPLOAD_CONFIG.MAX_SIZE / 1024 / 1024}MB를 초과할 수 없습니다.`;
    }

    const ext = file.name.split('.').pop()?.toLowerCase();
    const allowedExts = FILE_UPLOAD_CONFIG.ALLOWED_EXTENSIONS as readonly string[];
    if (!ext || !allowedExts.includes(ext)) {
      return `허용된 파일 형식: ${allowedExts.join(', ')}`;
    }

    return null;
  };

  // ============================================================================
  // 4. 이벤트 핸들러
  // ============================================================================
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const err = validateFile(file);
    if (err) {
      setError(err);
      setSelectedFile(null);
      return;
    }

    setError(null);
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    if (!selectedCategory) {
      setError('카테고리를 선택해주세요.');
      return;
    }

    try {
      await uploadAttachment({
        projectId,
        file: selectedFile,
        category: selectedCategory as AttachmentCategory,
      });
      toast.success('파일이 업로드되었습니다.');
      resetUploadForm();
    } catch (err: any) {
      toast.error(err.message || '업로드에 실패했습니다.');
    }
  };

  const handleDownload = (attachmentId: number) => {
    window.open(`/api/projects/${projectId}/attachments/${attachmentId}`, '_blank');
  };

  const handleDelete = async () => {
    if (deleteTarget === null) return;

    try {
      await deleteAttachment({
        projectId,
        attachmentId: deleteTarget,
      });
      toast.success('파일이 삭제되었습니다.');
    } catch (err: any) {
      toast.error(err.message || '삭제에 실패했습니다.');
    }

    setDeleteTarget(null);
  };

  const resetUploadForm = () => {
    setShowUpload(false);
    setSelectedFile(null);
    setSelectedCategory('');
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // ============================================================================
  // 5. 렌더링 헬퍼
  // ============================================================================
  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();

    const iconProps = { className: 'h-4 w-4' };

    switch (ext) {
      case 'pdf':
        return <FileText {...iconProps} className="h-4 w-4 text-red-500" />;
      case 'docx':
      case 'doc':
        return <FileText {...iconProps} className="h-4 w-4 text-blue-500" />;
      case 'xlsx':
      case 'xls':
        return <FileSpreadsheet {...iconProps} className="h-4 w-4 text-green-500" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
        return <ImageIcon {...iconProps} className="h-4 w-4 text-purple-500" />;
      default:
        return <File {...iconProps} className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  // ============================================================================
  // 6. 렌더링
  // ============================================================================
  return (
    <div className="space-y-3 border-t pt-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">첨부파일 ({attachments.length})</h3>
        {canEdit && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowUpload(true)}
            disabled={showUpload}
          >
            <Plus className="h-4 w-4 mr-1" />
            추가
          </Button>
        )}
      </div>

      {/* 파일 목록 */}
      {attachments.length === 0 ? (
        <p className="text-sm text-muted-foreground">첨부파일 없음</p>
      ) : (
        <div className="space-y-2">
          {attachments.map((attachment) => {
            const color = AttachmentCategoryColor[attachment.category];
            return (
              <div
                key={attachment.id}
                className="flex items-center gap-3 p-3 border rounded-md hover:bg-muted/50 transition-colors"
              >
                {/* 파일 아이콘 */}
                {getFileIcon(attachment.file_name)}

                {/* 카테고리 Badge */}
                <Badge className={cn(color.bg, color.text)} variant="secondary">
                  {AttachmentCategoryLabel[attachment.category]}
                </Badge>

                {/* 파일명 */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{attachment.file_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(attachment.file_size)} · {new Date(attachment.created_at).toLocaleDateString('ko-KR')}
                  </p>
                </div>

                {/* 다운로드 버튼 */}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDownload(attachment.id)}
                  title="다운로드"
                >
                  <Download className="h-4 w-4" />
                </Button>

                {/* 삭제 버튼 */}
                {canEdit && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setDeleteTarget(attachment.id)}
                    disabled={isDeleting}
                    title="삭제"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 업로드 영역 */}
      {showUpload && (
        <div className="border rounded-md bg-muted/30 p-4 space-y-3">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground">
              카테고리 <span className="text-red-500">*</span>
            </label>
            <Select
              value={selectedCategory}
              onValueChange={(value) => {
                setSelectedCategory(value as AttachmentCategory);
                setError(null);
              }}
              disabled={isUploading}
            >
              <SelectTrigger>
                <SelectValue placeholder="카테고리 선택" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_OPTIONS.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {AttachmentCategoryLabel[cat]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground">
              파일 선택 <span className="text-red-500">*</span>
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.xlsx,.jpg,.jpeg,.png"
              onChange={handleFileChange}
              disabled={isUploading}
              className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
            />
            {selectedFile && (
              <p className="text-xs text-muted-foreground">
                선택됨: {selectedFile.name} ({formatFileSize(selectedFile.size)})
              </p>
            )}
          </div>

          {error && (
            <p className="text-xs text-destructive">{error}</p>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              size="sm"
              onClick={handleUpload}
              disabled={!selectedFile || !selectedCategory || isUploading}
            >
              {isUploading ? '업로드 중...' : '업로드'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={resetUploadForm}
              disabled={isUploading}
            >
              취소
            </Button>
          </div>
        </div>
      )}

      {/* 삭제 확인 AlertDialog */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>파일 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              파일을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? '삭제 중...' : '삭제'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
