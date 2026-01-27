// Generated: 2026-01-28 16:00:00 KST

'use client';

import { useCallback, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { X, Upload, File, Image, FileText } from 'lucide-react';
import { formatFileSize, ALLOWED_MIME_TYPES } from '@/types/notice';
import { toast } from 'sonner';

interface FileUploadProps {
  files: File[];
  onChange: (files: File[]) => void;
  maxFiles?: number;
  maxSize?: number; // bytes
}

// MIME type icon helper
function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) {
    return <Image className="h-5 w-5" />;
  }
  if (mimeType === 'application/pdf') {
    return <FileText className="h-5 w-5 text-red-500" />;
  }
  return <File className="h-5 w-5" />;
}

// Client-side MIME type validation
function isAllowedType(file: File): boolean {
  return (ALLOWED_MIME_TYPES as readonly string[]).includes(file.type);
}

export default function FileUpload({
  files,
  onChange,
  maxFiles = 5,
  maxSize = 10 * 1024 * 1024,
}: FileUploadProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [previews, setPreviews] = useState<Map<string, string>>(new Map());
  const inputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback(
    (acceptedFiles: File[]) => {
      // Check file count limit
      const remainingSlots = maxFiles - files.length;
      if (remainingSlots <= 0) {
        toast.error(`최대 ${maxFiles}개까지 업로드 가능합니다`);
        return;
      }

      const validFiles: File[] = [];
      const newPreviews = new Map(previews);

      for (const file of acceptedFiles.slice(0, remainingSlots)) {
        // Type check
        if (!isAllowedType(file)) {
          toast.error(`${file.name}: 지원하지 않는 파일 형식입니다`);
          continue;
        }

        // Size check
        if (file.size > maxSize) {
          toast.error(`${file.name}: 파일 크기가 10MB를 초과합니다`);
          continue;
        }

        // Duplicate check
        if (files.some((f) => f.name === file.name && f.size === file.size)) {
          toast.error(`${file.name}: 이미 추가된 파일입니다`);
          continue;
        }

        validFiles.push(file);

        // Generate image preview
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = () => {
            newPreviews.set(file.name, reader.result as string);
            setPreviews(new Map(newPreviews));
          };
          reader.readAsDataURL(file);
        }
      }

      if (validFiles.length > 0) {
        onChange([...files, ...validFiles]);
      }
    },
    [files, onChange, maxFiles, maxSize, previews]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragActive(false);

      const droppedFiles = Array.from(e.dataTransfer.files);
      processFiles(droppedFiles);
    },
    [processFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        const selectedFiles = Array.from(e.target.files);
        processFiles(selectedFiles);
      }
      // Reset input value so the same file can be selected again
      e.target.value = '';
    },
    [processFiles]
  );

  const removeFile = (index: number) => {
    const file = files[index];
    const newFiles = files.filter((_, i) => i !== index);
    onChange(newFiles);

    // Remove preview
    if (previews.has(file.name)) {
      const newPreviews = new Map(previews);
      newPreviews.delete(file.name);
      setPreviews(newPreviews);
    }
  };

  const isDisabled = files.length >= maxFiles;

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div
        onClick={() => !isDisabled && inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
          transition-colors
          ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
          ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary/50'}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          onChange={handleInputChange}
          accept=".jpg,.jpeg,.png,.gif,.pdf,.docx,.pptx"
          className="hidden"
          disabled={isDisabled}
        />
        <Upload className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
        {isDragActive ? (
          <p className="text-primary">파일을 여기에 놓으세요</p>
        ) : (
          <div>
            <p className="text-muted-foreground">
              파일을 드래그하거나 클릭하여 선택하세요
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              JPEG, PNG, GIF, PDF, DOCX, PPTX (최대 {maxFiles}개, 각 10MB)
            </p>
          </div>
        )}
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => (
            <div
              key={`${file.name}-${file.size}`}
              className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30"
            >
              {/* Preview or Icon */}
              {previews.has(file.name) ? (
                <img
                  src={previews.get(file.name)}
                  alt={file.name}
                  className="h-10 w-10 object-cover rounded"
                />
              ) : (
                <div className="h-10 w-10 flex items-center justify-center bg-muted rounded">
                  {getFileIcon(file.type)}
                </div>
              )}

              {/* File Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(file.size)}
                </p>
              </div>

              {/* Delete Button */}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeFile(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* File Count */}
      <p className="text-xs text-muted-foreground">
        {files.length} / {maxFiles} 파일
      </p>
    </div>
  );
}
