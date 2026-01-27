// Generated: 2026-01-28 00:30:00 KST

'use client';

import { useState } from 'react';
import { useUpdateAccountRole } from '@/hooks/useEmployees';
import { UserRole, USER_ROLES, UserRoleLabel } from '@/types/employee';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface RoleChangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeId: number;
  accountId: number;
  currentRole: UserRole;
}

export function RoleChangeDialog({
  open,
  onOpenChange,
  employeeId,
  accountId,
  currentRole,
}: RoleChangeDialogProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole>(currentRole);

  const updateMutation = useUpdateAccountRole(employeeId, accountId);

  const handleSubmit = async () => {
    if (selectedRole === currentRole) {
      toast.info('변경할 역할이 현재 역할과 동일합니다.');
      return;
    }

    try {
      await updateMutation.mutateAsync({ role: selectedRole });
      toast.success(`역할이 ${UserRoleLabel[selectedRole]}(으)로 변경되었습니다.`);
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || '역할 변경에 실패했습니다.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>권한 변경</DialogTitle>
          <DialogDescription>
            이 계정의 역할을 변경합니다. 역할에 따라 접근 가능한 기능이 달라집니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>현재 역할</Label>
            <p className="text-sm text-gray-600">{UserRoleLabel[currentRole]}</p>
          </div>

          <div className="space-y-2">
            <Label>변경할 역할</Label>
            <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as UserRole)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {USER_ROLES.map((role) => (
                  <SelectItem key={role} value={role}>
                    {UserRoleLabel[role]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="text-xs text-gray-500 mt-2">
              <p><strong>관리자(ADMIN):</strong> 모든 기능 접근, 직원/부서 관리</p>
              <p><strong>매니저(MANAGER):</strong> 자부서 직원 조회/관리</p>
              <p><strong>사용자(USER):</strong> 본인 정보만 조회/수정</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button onClick={handleSubmit} disabled={updateMutation.isPending}>
            {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            변경
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
