// Generated: 2026-02-24 20:00:00 KST
'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ChevronDown, ChevronUp, Camera } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { StreamwoodModule, StreamwoodSection } from './_data/modules';
import { ScreenshotViewer } from './ScreenshotViewer';

interface SectionItemProps {
  section: StreamwoodSection;
  index: number;
}

function SectionItem({ section, index }: SectionItemProps) {
  const [isOpen, setIsOpen] = useState(index === 0);
  const [screenshotOpen, setScreenshotOpen] = useState(false);

  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader
          className="py-3 px-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="text-[11px] px-1.5 py-0 h-5 font-mono font-medium text-gray-500 dark:text-gray-400 border-gray-300 dark:border-gray-600 flex-shrink-0"
              >
                {section.id}
              </Badge>
              <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
                {section.title}
              </span>
              {section.isBeta && (
                <Badge
                  variant="secondary"
                  className="text-[10px] px-1 py-0 h-4 bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 border-0"
                >
                  Beta
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {section.screenshotPath && isOpen && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30"
                  onClick={(e) => {
                    e.stopPropagation();
                    setScreenshotOpen(true);
                  }}
                >
                  <Camera size={12} className="mr-1" />
                  스크린샷
                </Button>
              )}
              {isOpen ? (
                <ChevronUp size={16} className="text-gray-400" />
              ) : (
                <ChevronDown size={16} className="text-gray-400" />
              )}
            </div>
          </div>
        </CardHeader>
        {isOpen && (
          <CardContent className="py-3 px-4 border-t border-gray-100 dark:border-gray-800">
            <div className="prose prose-sm dark:prose-invert max-w-none text-gray-600 dark:text-gray-300">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {section.description}
              </ReactMarkdown>
            </div>
          </CardContent>
        )}
      </Card>

      {section.screenshotPath && (
        <ScreenshotViewer
          isOpen={screenshotOpen}
          onClose={() => setScreenshotOpen(false)}
          screenshotPath={section.screenshotPath}
          title={section.title}
          sectionId={section.id}
        />
      )}
    </>
  );
}

interface SectionDetailProps {
  module: StreamwoodModule;
}

export function SectionDetail({ module }: SectionDetailProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 pb-2 border-b border-gray-200 dark:border-gray-800">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${module.color} text-white text-xs font-bold`}>
          {module.number}
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">{module.title}</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">{module.summary}</p>
        </div>
      </div>

      <div className="space-y-2">
        {module.sections.map((section, index) => (
          <SectionItem key={section.id} section={section} index={index} />
        ))}
      </div>
    </div>
  );
}
