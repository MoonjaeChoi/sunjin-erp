// Generated: 2026-01-25 06:30:00 KST

'use client';

import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { Upload, FileText, Download, Trash2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { useUploadAttachmentMutation, useDeleteAttachmentMutation } from '@/hooks/support';

interface AttachmentUploadProps {
  supportId: number;
  attachmentName: string | null;
  canEdit: boolean;
}

const ALLOWED_EXTENSIONS = ['pdf', 'docx', 'xlsx', 'jpg', 'jpeg', 'png'];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

function validateClientFile(file: File): string | null {
  if (file.size > MAX_SIZE) return '파일 크기는 10MB를 초과할 수 없습니다.';
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
    return `허용된 파일 형식: ${ALLOWED_EXTENSIONS.join(', ')}`;
  }
  return null;
}

export function AttachmentUpload({ supportId, attachmentName, canEdit }: AttachmentUploadProps) {
  const { mutateAsync: upload, isPending: isUploading } = useUploadAttachmentMutation();
  const { mutateAsync: deleteAttachment } = useDeleteAttachmentMutation();

  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [replaceOpen, setReplaceOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    const err = validateClientFile(file);
    if (err) {
      setError(err);
      return;
    }
    setError(null);

    if (attachmentName) {
      setPendingFile(file);
      setReplaceOpen(true);
    } else {
      doUpload(file);
    }
  };

  const doUpload = async (file: File) => {
    try {
      await upload({ id: supportId, file });
      toast.success('파일이 업로드되었습니다.');
    } catch (e: any) {
      toast.error(e.message || '업로드에 실패했습니다.');
    }
  };

  const handleReplace = async () => {
    if (pendingFile) {
      await doUpload(pendingFile);
      setPendingFile(null);
    }
    setReplaceOpen(false);
  };

  const handleDelete = async () => {
    try {
      await deleteAttachment(supportId);
      toast.success('파일이 삭제되었습니다.');
    } catch {
      toast.error('삭제에 실패했습니다.');
    }
    setDeleteOpen(false);
  };

  const handleDownload = () => {
    window.open(`/api/support/${supportId}/attachment`, '_blank');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">첨부파일</label>

      {attachmentName ? (
        <div className="flex items-center gap-2 p-3 border rounded-md">
          <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="flex-1 text-sm truncate">{attachmentName}</span>
          <Button size="sm" variant="outline" onClick={handleDownload}>
            <Download className="h-3.5 w-3.5 mr-1" />
            다운로드
          </Button>
          {canEdit && (
            <>
              <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()}>
                <RefreshCw className="h-3.5 w-3.5 mr-1" />
                교체
              </Button>
              <Button size="sm" variant="destructive" onClick={() => setDeleteOpen(true)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
        </div>
      ) : canEdit ? (
        <div
          className="border-2 border-dashed rounded-md p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">클릭하여 파일 선택</p>
          <p className="text-xs text-muted-foreground mt-1">PDF, DOCX, XLSX, JPG, PNG (최대 10MB)</p>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">첨부파일 없음</p>
      )}

      {isUploading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="h-1 flex-1 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary animate-pulse w-2/3" />
          </div>
          업로드 중...
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".pdf,.docx,.xlsx,.jpg,.jpeg,.png"
        onChange={handleInputChange}
      />

      {/* 교체 확인 Dialog */}
      <Dialog open={replaceOpen} onOpenChange={setReplaceOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>파일 교체</DialogTitle>
            <DialogDescription>기존 파일이 교체됩니다. 계속하시겠습니까?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setReplaceOpen(false); setPendingFile(null); }}>취소</Button>
            <Button onClick={handleReplace}>교체</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>파일 삭제</DialogTitle>
            <DialogDescription>첨부파일을 삭제합니다. 이 작업은 취소할 수 없습니다.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>취소</Button>
            <Button variant="destructive" onClick={handleDelete}>삭제</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
