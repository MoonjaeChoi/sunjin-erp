// Generated: 2026-01-25 06:30:00 KST

'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { ChevronsUpDown, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SupportTypeLabel, SupportMethodLabel } from '@/types/tech-support';
import type { SupportType, SupportMethod, CreateTechSupportRequest } from '@/types/tech-support';
import { useCreateTechSupportMutation } from '@/hooks/support';
import { useCustomerListQuery } from '@/hooks/customers';
import { cn } from '@/lib/utils';

interface TechSupportCreateDialogProps {
  open: boolean;
  onClose: () => void;
}

interface FormState {
  title: string;
  customer_id: number | null;
  support_type: SupportType | null;
  support_date: string;
  support_method: SupportMethod | null;
  start_time: string;
  end_time: string;
  description: string;
}

function getCurrentTime(): string {
  const now = new Date();
  const hh = now.getHours().toString().padStart(2, '0');
  const mm = now.getMinutes().toString().padStart(2, '0');
  return `${hh}:${mm}`;
}

function getInitialForm(): FormState {
  return {
    title: '',
    customer_id: null,
    support_type: null,
    support_date: new Date().toISOString().split('T')[0],
    support_method: null,
    start_time: getCurrentTime(),
    end_time: '',
    description: '',
  };
}

function timeToMinutes(time: string): number | undefined {
  if (!time) return undefined;
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export function TechSupportCreateDialog({ open, onClose }: TechSupportCreateDialogProps) {
  const { mutateAsync, isPending } = useCreateTechSupportMutation();
  const { data: customerData } = useCustomerListQuery();
  const customers = customerData?.customers || [];

  const [form, setForm] = useState<FormState>(getInitialForm());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [comboOpen, setComboOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [startMinuteTouched, setStartMinuteTouched] = useState(false);
  const [endMinuteTouched, setEndMinuteTouched] = useState(false);

  // 열릴 때 폼 초기화
  useEffect(() => {
    if (open) {
      setForm(getInitialForm());
      setErrors({});
      setCustomerSearch('');
      setStartMinuteTouched(false);
      setEndMinuteTouched(false);
    }
  }, [open]);

  const handleHourChange = (field: 'start_time' | 'end_time', newHour: string) => {
    const minuteTouched = field === 'start_time' ? startMinuteTouched : endMinuteTouched;
    const currentValue = form[field];
    const currentMinute = currentValue ? currentValue.split(':')[1] : '00';
    const minute = minuteTouched ? currentMinute : '00';
    setForm({ ...form, [field]: `${newHour}:${minute}` });
  };

  const handleMinuteChange = (field: 'start_time' | 'end_time', newMinute: string) => {
    if (field === 'start_time') setStartMinuteTouched(true);
    else setEndMinuteTouched(true);
    const currentValue = form[field];
    const currentHour = currentValue ? currentValue.split(':')[0] : '00';
    setForm({ ...form, [field]: `${currentHour}:${newMinute}` });
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!form.title.trim()) newErrors.title = '제목을 입력하세요.';
    else if (form.title.length > 200) newErrors.title = '제목은 200자 이하로 입력하세요.';
    if (!form.customer_id) newErrors.customer_id = '고객사를 선택하세요.';
    if (!form.support_type) newErrors.support_type = '지원 유형을 선택하세요.';
    if (!form.support_date) newErrors.support_date = '지원일을 입력하세요.';
    if (form.start_time && form.end_time) {
      const startMin = timeToMinutes(form.start_time)!;
      const endMin = timeToMinutes(form.end_time)!;
      if (startMin >= endMin) newErrors.end_time = '종료 시간은 시작 시간보다 커야 합니다.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const data: CreateTechSupportRequest = {
      title: form.title.trim(),
      customer_id: form.customer_id!,
      support_type: form.support_type!,
      support_date: form.support_date,
      support_method: form.support_method || undefined,
      start_time: timeToMinutes(form.start_time),
      end_time: timeToMinutes(form.end_time),
      description: form.description.trim() || undefined,
    };

    try {
      await mutateAsync(data);
      toast.success('기술지원이 등록되었습니다.');
      onClose();
    } catch {
      toast.error('등록에 실패했습니다.');
    }
  };

  const selectedCustomer = customers.find((c) => c.id === form.customer_id);
  const filteredCustomers = customerSearch
    ? customers.filter((c) => c.name.includes(customerSearch))
    : customers;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>기술지원 등록</DialogTitle>
          <DialogDescription>새로운 기술지원 건을 등록합니다.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 제목 */}
          <div className="space-y-1">
            <label className="text-sm font-medium">제목 *</label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="기술지원 제목을 입력하세요"
              maxLength={200}
            />
            {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
          </div>

          {/* 고객사 Combobox */}
          <div className="space-y-1">
            <label className="text-sm font-medium">고객사 *</label>
            <div className="relative">
              <Button
                type="button"
                variant="outline"
                className="w-full justify-between font-normal"
                onClick={() => setComboOpen(!comboOpen)}
              >
                <span className="truncate">
                  {selectedCustomer ? selectedCustomer.name : '고객사를 선택하세요'}
                </span>
                <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
              </Button>
              {comboOpen && (
                <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
                  <div className="p-2">
                    <Input
                      placeholder="고객사 검색..."
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      className="h-8"
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto p-1">
                    {filteredCustomers.map((customer) => (
                      <button
                        key={customer.id}
                        className={cn(
                          'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent',
                          form.customer_id === customer.id && 'font-medium'
                        )}
                        onClick={() => {
                          setForm({ ...form, customer_id: customer.id });
                          setComboOpen(false);
                          setCustomerSearch('');
                        }}
                      >
                        {form.customer_id === customer.id && <Check className="h-4 w-4" />}
                        {form.customer_id !== customer.id && <span className="w-4" />}
                        {customer.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {errors.customer_id && <p className="text-xs text-destructive">{errors.customer_id}</p>}
          </div>

          {/* 지원 유형 */}
          <div className="space-y-1">
            <label className="text-sm font-medium">지원 유형 *</label>
            <Select
              value={form.support_type || '__placeholder__'}
              onValueChange={(v) => v !== '__placeholder__' && setForm({ ...form, support_type: v as SupportType })}
            >
              <SelectTrigger>
                <SelectValue placeholder="선택하세요" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__placeholder__" disabled hidden>선택하세요</SelectItem>
                {Object.entries(SupportTypeLabel).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.support_type && <p className="text-xs text-destructive">{errors.support_type}</p>}
          </div>

          {/* 지원일 */}
          <div className="space-y-1">
            <label className="text-sm font-medium">지원일 *</label>
            <Input
              type="date"
              value={form.support_date}
              onChange={(e) => setForm({ ...form, support_date: e.target.value })}
            />
            {errors.support_date && <p className="text-xs text-destructive">{errors.support_date}</p>}
          </div>

          {/* 지원 방법 */}
          <div className="space-y-1">
            <label className="text-sm font-medium">지원 방법</label>
            <Select
              value={form.support_method || 'NONE'}
              onValueChange={(v) => setForm({ ...form, support_method: v === 'NONE' ? null : v as SupportMethod })}
            >
              <SelectTrigger>
                <SelectValue placeholder="선택하세요" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE">미선택</SelectItem>
                {Object.entries(SupportMethodLabel).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 시간 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">시작 시간</label>
              <div className="flex items-center gap-1">
                <select
                  value={form.start_time ? form.start_time.split(':')[0] : ''}
                  onChange={(e) => handleHourChange('start_time', e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-2 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="" disabled>--</option>
                  {Array.from({ length: 24 }, (_, i) => {
                    const v = String(i).padStart(2, '0');
                    return <option key={v} value={v}>{v}</option>;
                  })}
                </select>
                <span className="text-sm font-medium">:</span>
                <select
                  value={form.start_time ? form.start_time.split(':')[1] : ''}
                  onChange={(e) => handleMinuteChange('start_time', e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-2 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="" disabled>--</option>
                  {Array.from({ length: 60 }, (_, i) => {
                    const v = String(i).padStart(2, '0');
                    return <option key={v} value={v}>{v}</option>;
                  })}
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">종료 시간</label>
              <div className="flex items-center gap-1">
                <select
                  value={form.end_time ? form.end_time.split(':')[0] : ''}
                  onChange={(e) => handleHourChange('end_time', e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-2 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="" disabled>--</option>
                  {Array.from({ length: 24 }, (_, i) => {
                    const v = String(i).padStart(2, '0');
                    return <option key={v} value={v}>{v}</option>;
                  })}
                </select>
                <span className="text-sm font-medium">:</span>
                <select
                  value={form.end_time ? form.end_time.split(':')[1] : ''}
                  onChange={(e) => handleMinuteChange('end_time', e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-2 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="" disabled>--</option>
                  {Array.from({ length: 60 }, (_, i) => {
                    const v = String(i).padStart(2, '0');
                    return <option key={v} value={v}>{v}</option>;
                  })}
                </select>
              </div>
              {errors.end_time && <p className="text-xs text-destructive">{errors.end_time}</p>}
            </div>
          </div>

          {/* 설명 */}
          <div className="space-y-1">
            <label className="text-sm font-medium">설명</label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="상세 내용을 입력하세요"
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>취소</Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? '등록 중...' : '등록'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
