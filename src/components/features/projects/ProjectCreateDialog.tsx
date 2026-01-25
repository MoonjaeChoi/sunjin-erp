// Generated: 2026-01-25 15:48:00 KST

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import { useCreateProjectMutation, useGenerateProjectCodeMutation } from '@/hooks/projects';
import { useCustomerListQuery } from '@/hooks/customers';
import { useEmployeeListQuery } from '@/hooks/employees';
import { CreateProjectRequest, PROJECT_CODE_REGEX } from '@/types/project';
import { cn } from '@/lib/utils';

interface ProjectCreateDialogProps {
  open: boolean;
  onClose: () => void;
}

interface FormState {
  project_name: string;
  customer_id: number | null;
  employee_id: number | null;
  project_code: string;
  start_date: string;
  end_date: string;
  contract_amount: string;
  description: string;
}

/**
 * 프로젝트 신규 등록 Dialog 컴포넌트
 * 필수 필드 검증, 코드 자동 생성, 날짜 범위 검증을 지원합니다.
 */
export function ProjectCreateDialog({ open, onClose }: ProjectCreateDialogProps) {
  // ============================================================================
  // 1. 상태 관리
  // ============================================================================
  const [form, setForm] = useState<FormState>({
    project_name: '',
    customer_id: null,
    employee_id: null,
    project_code: '',
    start_date: '',
    end_date: '',
    contract_amount: '',
    description: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [customerOpen, setCustomerOpen] = useState(false);

  // ============================================================================
  // 2. 뮤테이션, 쿼리, 세션
  // ============================================================================
  const { mutateAsync: createProject, isPending } = useCreateProjectMutation();
  const { mutateAsync: generateCode, isPending: isGenerating } = useGenerateProjectCodeMutation();
  const { data: customerData } = useCustomerListQuery();
  const { data: employeeData } = useEmployeeListQuery();
  const { data: session } = useSession();

  // ============================================================================
  // 3. Effect - Dialog 열릴 때 폼 초기화 (담당자는 현재 사용자로 설정)
  // ============================================================================
  useEffect(() => {
    if (open) {
      setForm({
        project_name: '',
        customer_id: null,
        employee_id: session?.user?.id ? Number(session.user.id) : null,
        project_code: '',
        start_date: '',
        end_date: '',
        contract_amount: '',
        description: '',
      });
      setErrors({});
    }
  }, [open, session]);

  // ============================================================================
  // 4. 유효성 검증
  // ============================================================================
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    // 프로젝트명 검증
    if (!form.project_name.trim()) {
      newErrors.project_name = '프로젝트명을 입력해주세요.';
    } else if (form.project_name.length > 200) {
      newErrors.project_name = '프로젝트명은 200자 이내로 입력해주세요.';
    }

    // 고객사 검증
    if (!form.customer_id) {
      newErrors.customer_id = '고객사를 선택해주세요.';
    }

    // 담당자 검증
    if (!form.employee_id) {
      newErrors.employee_id = '담당자를 선택해주세요.';
    }

    // 프로젝트 코드 검증 (선택 필드지만 입력시에만 검증)
    if (form.project_code && !PROJECT_CODE_REGEX.test(form.project_code)) {
      newErrors.project_code = '프로젝트 코드 형식이 올바르지 않습니다. (PJT-YYYYMMDD-NNN)';
    }

    // 날짜 범위 검증
    if (form.start_date && form.end_date && form.start_date > form.end_date) {
      newErrors.end_date = '종료일은 시작일 이후여야 합니다.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ============================================================================
  // 5. 필드 변경 핸들러
  // ============================================================================
  const handleFieldChange = (field: keyof FormState, value: any) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
    // 필드 수정 시 해당 필드의 에러 제거
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleContractAmountChange = (value: string) => {
    // 숫자만 허용
    const numericValue = value.replace(/[^0-9]/g, '');
    handleFieldChange('contract_amount', numericValue);
  };

  const handleCustomerSelect = (customerId: number) => {
    handleFieldChange('customer_id', customerId);
    setCustomerOpen(false);
  };

  // ============================================================================
  // 6. 코드 생성
  // ============================================================================
  const handleGenerateCode = async () => {
    try {
      const result = await generateCode();
      handleFieldChange('project_code', result.code);
    } catch (error) {
      toast.error('코드 생성에 실패했습니다.');
    }
  };

  // ============================================================================
  // 7. 폼 제출
  // ============================================================================
  const handleSubmit = async () => {
    if (!validate()) return;

    const data: CreateProjectRequest = {
      project_name: form.project_name.trim(),
      customer_id: form.customer_id!,
      employee_id: form.employee_id!,
      ...(form.project_code && { project_code: form.project_code }),
      ...(form.start_date && { start_date: form.start_date }),
      ...(form.end_date && { end_date: form.end_date }),
      ...(form.contract_amount && {
        contract_amount: Number(form.contract_amount),
      }),
      ...(form.description && { description: form.description.trim() }),
    };

    try {
      await createProject(data);
      toast.success('프로젝트가 등록되었습니다.');
      onClose();
    } catch (error: any) {
      toast.error(error.message || '등록에 실패했습니다.');
    }
  };

  // ============================================================================
  // 8. 포맷팅 헬퍼
  // ============================================================================
  const formatContractAmount = (value: string): string => {
    if (!value) return '';
    return Number(value).toLocaleString('ko-KR');
  };

  // ============================================================================
  // 9. 렌더링
  // ============================================================================
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>신규 프로젝트 등록</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 프로젝트명 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              프로젝트명 <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="프로젝트 이름 입력"
              value={form.project_name}
              onChange={(e) => handleFieldChange('project_name', e.target.value)}
              maxLength={200}
              disabled={isPending}
            />
            {errors.project_name && (
              <p className="text-xs text-red-500">{errors.project_name}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {form.project_name.length} / 200자
            </p>
          </div>

          {/* 고객사 Combobox */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              고객사 <span className="text-red-500">*</span>
            </label>
            <Popover open={customerOpen} onOpenChange={setCustomerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={customerOpen}
                  className="w-full justify-between"
                  disabled={isPending}
                >
                  {form.customer_id
                    ? customerData?.customers.find((c) => c.id === form.customer_id)?.name ||
                      '고객사'
                    : '고객사 선택'}
                  <span className="ml-2">↓</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="고객사 검색..." />
                  <CommandEmpty>검색 결과 없음</CommandEmpty>
                  <CommandGroup>
                    {customerData?.customers.map((customer) => (
                      <CommandItem
                        key={customer.id}
                        value={customer.name}
                        onSelect={() => handleCustomerSelect(customer.id)}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={cn(
                              'h-4 w-4 border border-gray-300 rounded',
                              form.customer_id === customer.id && 'bg-blue-500'
                            )}
                          />
                          {customer.name}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
            {errors.customer_id && (
              <p className="text-xs text-red-500">{errors.customer_id}</p>
            )}
          </div>

          {/* 담당자 Select */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              담당자 <span className="text-red-500">*</span>
            </label>
            <Select
              value={form.employee_id ? String(form.employee_id) : ''}
              onValueChange={(value) => handleFieldChange('employee_id', Number(value))}
              disabled={isPending}
            >
              <SelectTrigger>
                <SelectValue placeholder="담당자 선택" />
              </SelectTrigger>
              <SelectContent>
                {employeeData?.employees.map((emp) => (
                  <SelectItem key={emp.id} value={String(emp.id)}>
                    {emp.name} ({emp.department_name})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.employee_id && (
              <p className="text-xs text-red-500">{errors.employee_id}</p>
            )}
          </div>

          {/* 프로젝트 코드 + 생성 버튼 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">프로젝트 코드</label>
            <div className="flex gap-2">
              <Input
                placeholder="PJT-YYYYMMDD-NNN (선택사항)"
                value={form.project_code}
                onChange={(e) => handleFieldChange('project_code', e.target.value)}
                disabled={isPending}
              />
              <Button
                variant="outline"
                onClick={handleGenerateCode}
                disabled={isPending || isGenerating}
              >
                {isGenerating ? '생성 중...' : '코드 생성'}
              </Button>
            </div>
            {errors.project_code && (
              <p className="text-xs text-red-500">{errors.project_code}</p>
            )}
          </div>

          {/* 계약 시작일 / 종료일 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">계약 시작일</label>
              <Input
                type="date"
                value={form.start_date}
                onChange={(e) => handleFieldChange('start_date', e.target.value)}
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">계약 종료일</label>
              <Input
                type="date"
                value={form.end_date}
                onChange={(e) => handleFieldChange('end_date', e.target.value)}
                disabled={isPending}
              />
              {errors.end_date && (
                <p className="text-xs text-red-500">{errors.end_date}</p>
              )}
            </div>
          </div>

          {/* 계약 금액 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">계약 금액</label>
            <div className="relative">
              <Input
                type="text"
                placeholder="0"
                value={formatContractAmount(form.contract_amount)}
                onChange={(e) => handleContractAmountChange(e.target.value)}
                disabled={isPending}
              />
              {form.contract_amount && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  원
                </span>
              )}
            </div>
          </div>

          {/* 설명 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">설명</label>
            <Textarea
              placeholder="프로젝트에 대한 추가 설명을 입력해주세요."
              value={form.description}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              disabled={isPending}
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            취소
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? '저장 중...' : '저장'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
