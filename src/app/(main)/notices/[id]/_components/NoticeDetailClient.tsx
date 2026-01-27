// Generated: 2026-01-28 16:00:00 KST

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useNotice, useDeleteNotice } from '@/hooks/notices';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { ArrowLeft, Edit, Trash2, Eye, MessageCircle, Download, Loader2 } from 'lucide-react';
import CommentSection from './CommentSection';
import { NOTICE_TYPE_COLORS, formatFileSize, type NoticeType } from '@/types/notice';

interface NoticeDetailClientProps {
  noticeId: number;
  userId: number;
  userRole: string;
}

export default function NoticeDetailClient({ noticeId, userId, userRole }: NoticeDetailClientProps) {
  const router = useRouter();
  const { data, isLoading, isError, error } = useNotice(noticeId);
  const deleteMutation = useDeleteNotice();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');

  const notice = data?.data;

  // Permission check
  const canEdit = notice && (notice.authorId === userId || userRole === 'ADMIN');
  const canDelete = notice && (notice.authorId === userId || userRole === 'ADMIN');

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync({ id: noticeId, reason: deleteReason || undefined });
      toast.success('게시물이 삭제되었습니다');
      router.push('/notices');
    } catch (err) {
      toast.error((err as Error).message);
    }
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

  if (isLoading) {
    return <DetailSkeleton />;
  }

  if (isError || !notice) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">
          {isError ? (error as Error).message : '게시물을 찾을 수 없습니다'}
        </p>
        <Button variant="link" onClick={() => router.push('/notices')}>
          목록으로 돌아가기
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href="/notices" className="flex items-center gap-1 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          뒤로
        </Link>
        <div className="flex gap-2">
          {canEdit && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/notices/${noticeId}/edit`}>
                <Edit className="h-4 w-4 mr-1" />
                수정
              </Link>
            </Button>
          )}
          {canDelete && (
            <Button variant="destructive" size="sm" onClick={() => setDeleteDialogOpen(true)}>
              <Trash2 className="h-4 w-4 mr-1" />
              삭제
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <Card>
        <CardHeader className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge className={NOTICE_TYPE_COLORS[notice.type as NoticeType]}>
              {notice.type}
            </Badge>
          </div>
          <h1 className="text-2xl font-bold">{notice.title}</h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span>작성자: {notice.authorName}</span>
            <span>{formatDateTime(notice.createdAt)}</span>
            <span className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              {notice.viewCount}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="h-4 w-4" />
              {notice.commentCount}
            </span>
          </div>
          {/* Updated info (Decision #12) */}
          {notice.updatedById && notice.updatedByName && (
            <p className="text-sm text-muted-foreground">
              Updated by {notice.updatedByName} on {formatDateTime(notice.updatedAt)}
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Content */}
          <div className="prose prose-sm max-w-none whitespace-pre-wrap">
            {notice.content}
          </div>

          {/* Attachments */}
          {notice.attachments.length > 0 && (
            <div className="border-t pt-4">
              <h3 className="font-medium mb-3">첨부파일 ({notice.attachments.length})</h3>
              <div className="space-y-2">
                {notice.attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                  >
                    <div>
                      <p className="font-medium">{attachment.filename}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(attachment.fileSize)}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <a href={`/api/notices/${noticeId}/attachments/${attachment.id}/download`}>
                        <Download className="h-4 w-4 mr-1" />
                        다운로드
                      </a>
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Comment Section */}
      <CommentSection noticeId={noticeId} userId={userId} userRole={userRole} />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>게시물 삭제</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>정말 이 게시물을 삭제하시겠습니까?</p>
            <p className="text-sm text-muted-foreground">
              삭제된 게시물과 댓글은 복구할 수 없습니다.
            </p>
            <Textarea
              placeholder="삭제 사유 (선택)"
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <Skeleton className="h-6 w-16" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>
      <Card>
        <CardHeader className="space-y-4">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-8 w-3/4" />
          <div className="flex gap-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-32" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
