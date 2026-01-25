'use client';

// Generated: 2026-01-25 22:55:00 KST

import { useState } from 'react';
import { useRollbackIssueMutation } from '@/hooks/issues';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';

interface IssueRollbackButtonProps {
  issueId: number;
  status: string;
  userRole: string;
}

export default function IssueRollbackButton({
  issueId,
  status,
  userRole,
}: IssueRollbackButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const rollbackMutation = useRollbackIssueMutation(issueId);

  // Only show for ADMIN with COMPLETED status
  if (userRole !== 'ADMIN' || status !== 'COMPLETED') {
    return null;
  }

  const handleRollback = async () => {
    try {
      await rollbackMutation.mutateAsync();
      setShowConfirm(false);
    } catch (error) {
      console.error('Rollback failed:', error);
    }
  };

  return (
    <>
      <Button
        variant="destructive"
        onClick={() => setShowConfirm(true)}
        disabled={rollbackMutation.isPending}
      >
        {rollbackMutation.isPending ? '처리중...' : '상태 되돌리기'}
      </Button>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>상태 되돌리기</AlertDialogTitle>
            <AlertDialogDescription>
              이 Issue를 진행중 상태로 되돌리시겠습니까?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleRollback}>
              확인
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
