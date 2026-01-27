// Generated: 2026-01-28 00:30:00 KST

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useCreateAccount } from '@/hooks/useEmployees';
import { AccountFormData, UserRole, USER_ROLES, UserRoleLabel } from '@/types/employee';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Copy, Check } from 'lucide-react';

interface AccountFormProps {
  employeeId: number;
}

export function AccountForm({ employeeId }: AccountFormProps) {
  const [createdPassword, setCreatedPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const createMutation = useCreateAccount(employeeId);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AccountFormData>({
    defaultValues: {
      username: '',
      password: '',
      confirmPassword: '',
      role: 'USER',
    },
  });

  const watchRole = watch('role');
  const watchPassword = watch('password');

  const onSubmit = async (data: AccountFormData) => {
    if (data.password !== data.confirmPassword) {
      toast.error('비밀번호가 일치하지 않습니다.');
      return;
    }

    try {
      const result = await createMutation.mutateAsync({
        username: data.username,
        password: data.password,
        role: data.role,
      });

      if (result.temporaryPassword) {
        setCreatedPassword(result.temporaryPassword);
        toast.success('계정이 생성되었습니다. 임시 비밀번호를 복사해주세요.');
      } else {
        toast.success('계정이 생성되었습니다.');
      }
    } catch (error: any) {
      toast.error(error.message || '계정 생성에 실패했습니다.');
    }
  };

  const handleCopyPassword = () => {
    if (createdPassword) {
      navigator.clipboard.writeText(createdPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // 계정이 생성되면 비밀번호 표시
  if (createdPassword) {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="font-medium text-green-800 mb-2">계정이 생성되었습니다!</h3>
          <p className="text-sm text-green-700 mb-3">
            아래 임시 비밀번호를 직원에게 전달해주세요. 이 비밀번호는 다시 확인할 수 없습니다.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-2 bg-white border rounded font-mono text-sm">
              {createdPassword}
            </code>
            <Button variant="outline" size="sm" onClick={handleCopyPassword}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        <Button variant="outline" onClick={() => setCreatedPassword(null)}>
          확인
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="username">사용자명 *</Label>
        <Input
          id="username"
          {...register('username', {
            required: '사용자명은 필수입니다.',
            minLength: { value: 6, message: '사용자명은 6자 이상이어야 합니다.' },
            maxLength: { value: 20, message: '사용자명은 20자 이하여야 합니다.' },
            pattern: {
              value: /^[a-zA-Z0-9]+$/,
              message: '사용자명은 영문과 숫자만 사용 가능합니다.',
            },
          })}
          placeholder="예: hong1234"
        />
        {errors.username && <p className="text-sm text-red-500">{errors.username.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">비밀번호 *</Label>
        <Input
          id="password"
          type="password"
          {...register('password', {
            required: '비밀번호는 필수입니다.',
            minLength: { value: 8, message: '비밀번호는 8자 이상이어야 합니다.' },
            validate: (value) => {
              if (!/[a-zA-Z]/.test(value)) return '영문을 포함해야 합니다.';
              if (!/[0-9]/.test(value)) return '숫자를 포함해야 합니다.';
              if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) return '특수문자를 포함해야 합니다.';
              return true;
            },
          })}
          placeholder="영문, 숫자, 특수문자 포함 8자 이상"
        />
        {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">비밀번호 확인 *</Label>
        <Input
          id="confirmPassword"
          type="password"
          {...register('confirmPassword', {
            required: '비밀번호 확인은 필수입니다.',
            validate: (value) => value === watchPassword || '비밀번호가 일치하지 않습니다.',
          })}
          placeholder="비밀번호를 다시 입력하세요"
        />
        {errors.confirmPassword && <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>}
      </div>

      <div className="space-y-2">
        <Label>역할 *</Label>
        <Select
          value={watchRole}
          onValueChange={(v) => setValue('role', v as UserRole)}
        >
          <SelectTrigger>
            <SelectValue placeholder="역할 선택" />
          </SelectTrigger>
          <SelectContent>
            {USER_ROLES.map((role) => (
              <SelectItem key={role} value={role}>
                {UserRoleLabel[role]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" disabled={createMutation.isPending} className="w-full">
        {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        계정 생성
      </Button>
    </form>
  );
}
