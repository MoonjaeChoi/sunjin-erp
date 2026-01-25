'use client';

// Generated: 2026-01-25 18:05:00 KST

import { useState } from 'react';
import { useUploadAttachmentMutation } from '@/hooks/issues';
import { Button } from '@/components/ui/button';

interface FileUploadAreaProps {
  issueId: number;
}

export default function FileUploadArea({ issueId }: FileUploadAreaProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const uploadMutation = useUploadAttachmentMutation(issueId);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      await uploadMutation.mutateAsync(selectedFile);
      setSelectedFile(null);
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  return (
    <div className="mt-4 p-4 border-2 border-dashed rounded-lg">
      <div className="flex flex-col gap-3">
        <input
          type="file"
          onChange={handleFileSelect}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
        />
        {selectedFile && (
          <div className="text-sm text-gray-600">
            선택된 파일: {selectedFile.name}
          </div>
        )}
        <Button
          type="button"
          onClick={handleUpload}
          disabled={!selectedFile || uploadMutation.isPending}
          className="w-full"
        >
          {uploadMutation.isPending ? '업로드 중...' : '업로드'}
        </Button>
      </div>
    </div>
  );
}
