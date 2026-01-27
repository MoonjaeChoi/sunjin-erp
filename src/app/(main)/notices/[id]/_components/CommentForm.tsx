// Generated: 2026-01-28 16:00:00 KST

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';

interface CommentFormProps {
  onSubmit: (content: string) => void;
  onCancel?: () => void;
  isSubmitting: boolean;
  placeholder?: string;
  showCancel?: boolean;
}

export default function CommentForm({
  onSubmit,
  onCancel,
  isSubmitting,
  placeholder = '댓글을 입력하세요...',
  showCancel = false,
}: CommentFormProps) {
  const [content, setContent] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || content.length > 1000) return;
    onSubmit(content.trim());
    setContent('');
  };

  const isValid = content.trim().length >= 1 && content.length <= 1000;

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        className="min-h-[80px]"
        maxLength={1000}
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {content.length} / 1,000
        </span>
        <div className="flex gap-2">
          {showCancel && (
            <Button type="button" variant="outline" size="sm" onClick={onCancel}>
              취소
            </Button>
          )}
          <Button type="submit" size="sm" disabled={!isValid || isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            작성
          </Button>
        </div>
      </div>
    </form>
  );
}
