// Generated: 2026-01-28 00:30:00 KST

'use client';

import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { useCreateEmployee, useUpdateEmployee, useDepartments, usePositions } from '@/hooks/useEmployees';
import { useEmployeeListQuery } from '@/hooks/employees';
import { EmployeeDetail, EmployeeFormData } from '@/types/employee';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface EmployeeFormProps {
  employee?: EmployeeDetail;
}

export function EmployeeForm({ employee }: EmployeeFormProps) {
  const router = useRouter();
  const isEdit = !!employee;

  const { data: departments } = useDepartments();
  const { data: positions } = usePositions();
  const { data: employeesData } = useEmployeeListQuery();

  const createMutation = useCreateEmployee();
  const updateMutation = useUpdateEmployee(employee?.id || 0);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<EmployeeFormData>({
    defaultValues: {
      name: employee?.name || '',
      email: employee?.email || '',
      phone: employee?.phone || '',
      jobTitle: employee?.jobTitle || '',
      departmentId: employee?.departmentId?.toString() || '',
      positionId: employee?.positionId?.toString() || '',
      managerId: employee?.managerId?.toString() || '',
      hiredAt: employee?.hiredAt ? employee.hiredAt.split('T')[0] : '',
      birthday: employee?.birthday ? employee.birthday.split('T')[0] : '',
    },
  });

  const watchDepartmentId = watch('departmentId');
  const watchPositionId = watch('positionId');
  const watchManagerId = watch('managerId');

  // 부서 목록 평탄화
  const flattenDepartments = (depts: typeof departments, level = 0): { id: number; name: string; level: number }[] => {
    if (!depts) return [];
    return depts.flatMap(dept => [
      { id: dept.id, name: dept.name, level },
      ...flattenDepartments(dept.children, level + 1),
    ]);
  };
  const flatDepartments = flattenDepartments(departments);

  const onSubmit = async (data: EmployeeFormData) => {
    try {
      const payload = {
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        phone: data.phone?.trim() || undefined,
        jobTitle: data.jobTitle?.trim() || undefined,
        departmentId: parseInt(data.departmentId, 10),
        positionId: parseInt(data.positionId, 10),
        managerId: data.managerId ? parseInt(data.managerId, 10) : undefined,
        hiredAt: data.hiredAt,
        birthday: data.birthday || undefined,
      };

      if (isEdit) {
        await updateMutation.mutateAsync(payload);
        toast.success('직원 정보가 수정되었습니다.');
        router.push(`/employees/${employee.id}`);
      } else {
        const result = await createMutation.mutateAsync(payload);
        toast.success('직원이 등록되었습니다.');
        router.push(`/employees/${result.id}`);
      }
    } catch (error: any) {
      toast.error(error.message || '오류가 발생했습니다.');
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending || isSubmitting;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>기본 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">이름 *</Label>
              <Input
                id="name"
                {...register('name', {
                  required: '이름은 필수입니다.',
                  maxLength: { value: 100, message: '이름은 100자 이내여야 합니다.' },
                })}
                placeholder="홍길동"
              />
              {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">이메일 *</Label>
              <Input
                id="email"
                type="email"
                {...register('email', {
                  required: '이메일은 필수입니다.',
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: '유효한 이메일 형식이 아닙니다.',
                  },
                })}
                placeholder="hong@company.com"
              />
              {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">전화번호</Label>
              <Input
                id="phone"
                {...register('phone', {
                  pattern: {
                    value: /^(02|0[3-9]\d)-?\d{3,4}-?\d{4}$/,
                    message: '유효한 전화번호 형식이 아닙니다. (예: 010-1234-5678)',
                  },
                })}
                placeholder="010-1234-5678"
              />
              {errors.phone && <p className="text-sm text-red-500">{errors.phone.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="jobTitle">직무</Label>
              <Input
                id="jobTitle"
                {...register('jobTitle')}
                placeholder="소프트웨어 엔지니어"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>소속 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>부서 *</Label>
              <Select
                value={watchDepartmentId}
                onValueChange={(v) => setValue('departmentId', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="부서 선택" />
                </SelectTrigger>
                <SelectContent>
                  {flatDepartments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id.toString()}>
                      {'　'.repeat(dept.level)}{dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!watchDepartmentId && <p className="text-sm text-red-500">부서를 선택해주세요.</p>}
            </div>

            <div className="space-y-2">
              <Label>직급 *</Label>
              <Select
                value={watchPositionId}
                onValueChange={(v) => setValue('positionId', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="직급 선택" />
                </SelectTrigger>
                <SelectContent>
                  {(positions || []).map((pos) => (
                    <SelectItem key={pos.id} value={pos.id.toString()}>
                      {pos.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!watchPositionId && <p className="text-sm text-red-500">직급을 선택해주세요.</p>}
            </div>

            <div className="space-y-2">
              <Label>상위 매니저</Label>
              <Select
                value={watchManagerId || 'NONE'}
                onValueChange={(v) => setValue('managerId', v === 'NONE' ? '' : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="매니저 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">없음</SelectItem>
                  {(employeesData?.employees || [])
                    .filter((emp: { id: number }) => emp.id !== employee?.id)
                    .map((emp: { id: number; name: string; departmentName?: string }) => (
                      <SelectItem key={emp.id} value={emp.id.toString()}>
                        {emp.name} ({emp.departmentName})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>추가 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hiredAt">입사일 *</Label>
              <Input
                id="hiredAt"
                type="date"
                {...register('hiredAt', {
                  required: '입사일은 필수입니다.',
                  validate: (value) => {
                    const date = new Date(value);
                    const today = new Date();
                    today.setHours(23, 59, 59, 999);
                    return date <= today || '입사일은 미래 날짜일 수 없습니다.';
                  },
                })}
              />
              {errors.hiredAt && <p className="text-sm text-red-500">{errors.hiredAt.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="birthday">생일</Label>
              <Input
                id="birthday"
                type="date"
                {...register('birthday')}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          취소
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEdit ? '수정' : '등록'}
        </Button>
      </div>
    </form>
  );
}
