// Generated: 2026-01-28 20:30:00 KST

'use client';

import { useState, useCallback, useEffect } from 'react';
import { useCreateNotice } from '@/hooks/notices';
import { NOTICE_TYPES, type NoticeType, FILE_UPLOAD_LIMITS } from '@/types/notice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import FileUpload from './FileUpload';

interface CreateNoticeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface FormData {
  title: string;
  type: NoticeType | '';
  content: string;
}

const initialFormData: FormData = {
  title: '',
  type: '',
  content: '',
};

export default function CreateNoticeDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateNoticeDialogProps) {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [files, setFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createMutation = useCreateNotice();
  const isSubmitting = createMutation.isPending;

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      setFormData(initialFormData);
      setFiles([]);
      setErrors({});
    }
  }, [open]);

  // Handle input change
  const handleInputChange = useCallback(
    (field: keyof FormData, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      if (errors[field]) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }
    },
    [errors]
  );

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = '제목은 필수입니다.';
    } else if (formData.title.length < 5) {
      newErrors.title = '제목은 5자 이상이어야 합니다.';
    } else if (formData.title.length > 200) {
      newErrors.title = '제목은 200자 이하여야 합니다.';
    }

    if (!formData.type) {
      newErrors.type = '게시판 유형을 선택하세요.';
    }

    if (!formData.content.trim()) {
      newErrors.content = '내용은 필수입니다.';
    } else if (formData.content.length < 10) {
      newErrors.content = '내용은 10자 이상이어야 합니다.';
    } else if (formData.content.length > 10000) {
      newErrors.content = '내용은 10,000자 이하여야 합니다.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = async () => {
    if (!validateForm()) return;

    const submitFormData = new FormData();
    submitFormData.append('title', formData.title);
    submitFormData.append('content', formData.content);
    submitFormData.append('type', formData.type);
    files.forEach((file) => submitFormData.append('files', file));

    createMutation.mutate(submitFormData, {
      onSuccess: () => {
        onOpenChange(false);
        onSuccess?.();
      },
      onError: (error) => {
        setErrors({
          submit: error instanceof Error ? error.message : '오류가 발생했습니다',
        });
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>게시물 작성</DialogTitle>
          <DialogDescription>
            새 게시물을 작성합니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Submit Error */}
          {errors.submit && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-sm text-red-700">{errors.submit}</p>
            </div>
          )}

          {/* Type */}
          <div className="space-y-2">
            <label htmlFor="type" className="text-sm font-medium">
              게시판 유형 *
            </label>
            <Select
              value={formData.type}
              onValueChange={(v) => handleInputChange('type', v)}
              disabled={isSubmitting}
            >
              <SelectTrigger id="type">
                <SelectValue placeholder="유형 선택" />
              </SelectTrigger>
              <SelectContent>
                {NOTICE_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.type && (
              <p className="text-xs text-red-600">{errors.type}</p>
            )}
          </div>

          {/* Title */}
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">
              제목 *
            </label>
            <Input
              id="title"
              placeholder="제목을 입력하세요"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              disabled={isSubmitting}
              maxLength={200}
            />
            <div className="flex justify-between">
              {errors.title ? (
                <p className="text-xs text-red-600">{errors.title}</p>
              ) : (
                <span />
              )}
              <p className="text-xs text-gray-500">
                {formData.title.length}/200
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-2">
            <label htmlFor="content" className="text-sm font-medium">
              내용 *
            </label>
            <Textarea
              id="content"
              placeholder="내용을 입력하세요"
              value={formData.content}
              onChange={(e) => handleInputChange('content', e.target.value)}
              disabled={isSubmitting}
              rows={8}
              className="min-h-[200px]"
            />
            <div className="flex justify-between">
              {errors.content ? (
                <p className="text-xs text-red-600">{errors.content}</p>
              ) : (
                <span />
              )}
              <p className="text-xs text-gray-500">
                {formData.content.length}/10,000
              </p>
            </div>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <label className="text-sm font-medium">첨부파일</label>
            <FileUpload
              files={files}
              onChange={setFiles}
              maxFiles={FILE_UPLOAD_LIMITS.maxFileCount}
              maxSize={FILE_UPLOAD_LIMITS.maxFileSize}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            취소
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            등록
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
