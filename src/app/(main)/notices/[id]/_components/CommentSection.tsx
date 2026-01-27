// Generated: 2026-01-28 16:00:00 KST

'use client';

import { useState } from 'react';
import { useComments, useCreateComment, useUpdateComment, useDeleteComment } from '@/hooks/notices';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { MessageCircle, Reply, Edit, Trash2, Loader2 } from 'lucide-react';
import CommentForm from './CommentForm';
import type { Comment } from '@/types/notice';

interface CommentSectionProps {
  noticeId: number;
  userId: number;
  userRole: string;
}

export default function CommentSection({ noticeId, userId, userRole }: CommentSectionProps) {
  const { data, isLoading } = useComments(noticeId);
  const createMutation = useCreateComment();
  const updateMutation = useUpdateComment();
  const deleteMutation = useDeleteComment();

  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');

  const handleCreateComment = async (content: string, parentCommentId?: number) => {
    try {
      await createMutation.mutateAsync({
        noticeId,
        data: { content, parentCommentId },
      });
      toast.success(parentCommentId ? '답글이 등록되었습니다' : '댓글이 등록되었습니다');
      setReplyingTo(null);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const handleEdit = async (commentId: number) => {
    try {
      await updateMutation.mutateAsync({
        noticeId,
        commentId,
        data: { content: editContent },
      });
      toast.success('댓글이 수정되었습니다');
      setEditingId(null);
      setEditContent('');
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const handleDelete = async (commentId: number) => {
    if (!confirm('댓글을 삭제하시겠습니까?')) return;

    try {
      await deleteMutation.mutateAsync({ noticeId, commentId });
      toast.success('댓글이 삭제되었습니다');
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const startEdit = (comment: Comment) => {
    setEditingId(comment.id);
    setEditContent(comment.content);
    setReplyingTo(null);
  };

  const canEditDelete = (comment: Comment) => {
    return comment.authorId === userId || userRole === 'ADMIN';
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const comments = data?.data || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          댓글 ({data?.pagination.total || 0})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Comment Form */}
        <CommentForm
          onSubmit={(content) => handleCreateComment(content)}
          isSubmitting={createMutation.isPending && !replyingTo}
          placeholder="댓글을 입력하세요..."
        />

        {/* Comment List */}
        {isLoading ? (
          <CommentsSkeleton />
        ) : comments.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">
            첫 댓글을 남겨주세요!
          </p>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="space-y-4">
                {/* Top-level Comment */}
                <CommentCard
                  comment={comment}
                  isEditing={editingId === comment.id}
                  editContent={editContent}
                  onEditContentChange={setEditContent}
                  onEditSave={() => handleEdit(comment.id)}
                  onEditCancel={() => { setEditingId(null); setEditContent(''); }}
                  onStartEdit={() => startEdit(comment)}
                  onDelete={() => handleDelete(comment.id)}
                  onReply={() => setReplyingTo(comment.id)}
                  canEditDelete={canEditDelete(comment)}
                  showReplyButton={true}
                  isReplying={replyingTo === comment.id}
                  isPending={updateMutation.isPending || deleteMutation.isPending}
                  formatDateTime={formatDateTime}
                />

                {/* Reply Form */}
                {replyingTo === comment.id && (
                  <div className="ml-8 pl-4 border-l-2">
                    <CommentForm
                      onSubmit={(content) => handleCreateComment(content, comment.id)}
                      onCancel={() => setReplyingTo(null)}
                      isSubmitting={createMutation.isPending}
                      placeholder={`@${comment.authorName}에게 답글 작성...`}
                      showCancel
                    />
                  </div>
                )}

                {/* Replies */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="ml-8 pl-4 border-l-2 space-y-4">
                    {comment.replies.map((reply) => (
                      <CommentCard
                        key={reply.id}
                        comment={reply}
                        isEditing={editingId === reply.id}
                        editContent={editContent}
                        onEditContentChange={setEditContent}
                        onEditSave={() => handleEdit(reply.id)}
                        onEditCancel={() => { setEditingId(null); setEditContent(''); }}
                        onStartEdit={() => startEdit(reply)}
                        onDelete={() => handleDelete(reply.id)}
                        canEditDelete={canEditDelete(reply)}
                        showReplyButton={false} // No reply button on replies (Decision #3)
                        isPending={updateMutation.isPending || deleteMutation.isPending}
                        formatDateTime={formatDateTime}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface CommentCardProps {
  comment: Comment;
  isEditing: boolean;
  editContent: string;
  onEditContentChange: (content: string) => void;
  onEditSave: () => void;
  onEditCancel: () => void;
  onStartEdit: () => void;
  onDelete: () => void;
  onReply?: () => void;
  canEditDelete: boolean;
  showReplyButton: boolean;
  isReplying?: boolean;
  isPending: boolean;
  formatDateTime: (date: string) => string;
}

function CommentCard({
  comment,
  isEditing,
  editContent,
  onEditContentChange,
  onEditSave,
  onEditCancel,
  onStartEdit,
  onDelete,
  onReply,
  canEditDelete,
  showReplyButton,
  isReplying,
  isPending,
  formatDateTime,
}: CommentCardProps) {
  return (
    <div className="p-4 rounded-lg bg-muted/30">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium">{comment.authorName}</span>
            <span className="text-xs text-muted-foreground">
              {formatDateTime(comment.createdAt)}
            </span>
            {/* (edited) badge - Decision #10 */}
            {comment.isEdited && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-xs text-muted-foreground cursor-help">
                      (edited)
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Edited on {formatDateTime(comment.updatedAt)}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          {comment.parentAuthorName && (
            <span className="text-xs text-muted-foreground">
              @{comment.parentAuthorName}
            </span>
          )}
        </div>
        {canEditDelete && !isEditing && (
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={onStartEdit}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onDelete} disabled={isPending}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Inline Edit - Decision #15 */}
      {isEditing ? (
        <div className="mt-2 space-y-2">
          <Textarea
            value={editContent}
            onChange={(e) => onEditContentChange(e.target.value)}
            className="min-h-[80px]"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={onEditSave} disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              저장
            </Button>
            <Button size="sm" variant="outline" onClick={onEditCancel}>
              취소
            </Button>
          </div>
        </div>
      ) : (
        <p className="mt-2 text-sm whitespace-pre-wrap">{comment.content}</p>
      )}

      {/* Reply Button */}
      {showReplyButton && !isEditing && !isReplying && (
        <Button variant="ghost" size="sm" className="mt-2" onClick={onReply}>
          <Reply className="h-4 w-4 mr-1" />
          답글
        </Button>
      )}
    </div>
  );
}

function CommentsSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="p-4 rounded-lg bg-muted/30">
          <div className="flex gap-2 mb-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4 mt-1" />
        </div>
      ))}
    </div>
  );
}
