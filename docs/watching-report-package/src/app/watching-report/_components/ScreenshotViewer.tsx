// Generated: 2026-02-24 20:00:00 KST
'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ImageOff } from 'lucide-react';

interface ScreenshotViewerProps {
  isOpen: boolean;
  onClose: () => void;
  screenshotPath: string;
  title: string;
  sectionId: string;
}

export function ScreenshotViewer({
  isOpen,
  onClose,
  screenshotPath,
  title,
  sectionId,
}: ScreenshotViewerProps) {
  const [hasError, setHasError] = useState(false);
  const imageSrc = `/watching-screenshots/${screenshotPath}`;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <span className="text-gray-400 dark:text-gray-500 font-mono text-sm">{sectionId}</span>
            <span>{title}</span>
          </DialogTitle>
        </DialogHeader>
        <div className="relative w-full">
          {hasError ? (
            <div className="flex flex-col items-center justify-center h-64 bg-gray-100 dark:bg-gray-800 rounded-lg gap-3">
              <ImageOff size={40} className="text-gray-400 dark:text-gray-500" />
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  스크린샷을 불러올 수 없습니다
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{imageSrc}</p>
              </div>
            </div>
          ) : (
            <div className="relative w-full h-auto min-h-[200px] bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
              <Image
                src={imageSrc}
                alt={`${title} 스크린샷`}
                width={1200}
                height={800}
                className="w-full h-auto object-contain rounded-lg"
                onError={() => setHasError(true)}
                unoptimized
              />
            </div>
          )}
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 text-center">
            {screenshotPath}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
