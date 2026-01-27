// Generated: 2026-01-28 00:30:00 KST

'use client';

import { useState } from 'react';
import { AccountInfo, UserRoleLabel, UserRoleColors } from '@/types/employee';
import { useDeactivateEmployee, useReactivateEmployee } from '@/hooks/useEmployees';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AccountForm } from './AccountForm';
import { RoleChangeDialog } from './RoleChangeDialog';
import { toast } from 'sonner';
import { Loader2, Shield, ShieldOff, KeyRound } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface EmployeeAccountTabProps {
  employeeId: number;
  account?: AccountInfo;
}

export function EmployeeAccountTab({ employeeId, account }: EmployeeAccountTabProps) {
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [isDeactivateDialogOpen, setIsDeactivateDialogOpen] = useState(false);

  const deactivateMutation = useDeactivateEmployee(employeeId);
  const reactivateMutation = useReactivateEmployee(employeeId);

  const handleDeactivate = async () => {
    try {
      await deactivateMutation.mutateAsync();
      toast.success('계정이 비활성화되었습니다.');
      setIsDeactivateDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || '계정 비활성화에 실패했습니다.');
    }
  };

  const handleReactivate = async () => {
    try {
      await reactivateMutation.mutateAsync();
      toast.success('계정이 활성화되었습니다.');
    } catch (error: any) {
      toast.error(error.message || '계정 활성화에 실패했습니다.');
    }
  };

  // 계정이 없으면 생성 폼 표시
  if (!account) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>계정 생성</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 mb-4">
            이 직원은 아직 시스템 계정이 없습니다. 아래 폼을 통해 계정을 생성해주세요.
          </p>
          <AccountForm employeeId={employeeId} />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>계정 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">사용자명</dt>
              <dd className="mt-1 font-mono">{account.username}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">역할</dt>
              <dd className="mt-1">
                <Badge className={UserRoleColors[account.role]}>
                  {UserRoleLabel[account.role]}
                </Badge>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">상태</dt>
              <dd className="mt-1">
                <Badge className={account.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                  {account.isActive ? '활성' : '비활성'}
                </Badge>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">마지막 로그인</dt>
              <dd className="mt-1">
                {account.lastLoginAt
                  ? new Date(account.lastLoginAt).toLocaleString('ko-KR')
                  : '없음'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">비밀번호 변경일</dt>
              <dd className="mt-1">
                {account.passwordChangedAt
                  ? new Date(account.passwordChangedAt).toLocaleString('ko-KR')
                  : '-'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">계정 생성일</dt>
              <dd className="mt-1">
                {account.createdAt
                  ? new Date(account.createdAt).toLocaleDateString('ko-KR')
                  : '-'}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>계정 관리</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={() => setIsRoleDialogOpen(true)}
            className="gap-2"
          >
            <KeyRound className="h-4 w-4" />
            권한 변경
          </Button>

          {account.isActive ? (
            <Button
              variant="destructive"
              onClick={() => setIsDeactivateDialogOpen(true)}
              className="gap-2"
            >
              <ShieldOff className="h-4 w-4" />
              비활성화
            </Button>
          ) : (
            <Button
              variant="default"
              onClick={handleReactivate}
              disabled={reactivateMutation.isPending}
              className="gap-2"
            >
              {reactivateMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Shield className="h-4 w-4" />
              )}
              활성화
            </Button>
          )}
        </CardContent>
      </Card>

      {/* 권한 변경 다이얼로그 */}
      <RoleChangeDialog
        open={isRoleDialogOpen}
        onOpenChange={setIsRoleDialogOpen}
        employeeId={employeeId}
        accountId={account.id}
        currentRole={account.role}
      />

      {/* 비활성화 확인 다이얼로그 */}
      <AlertDialog open={isDeactivateDialogOpen} onOpenChange={setIsDeactivateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>계정 비활성화</AlertDialogTitle>
            <AlertDialogDescription>
              이 계정을 비활성화하시겠습니까? 비활성화된 계정은 로그인할 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeactivate}
              disabled={deactivateMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deactivateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              비활성화
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
