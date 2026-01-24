// Generated: 2026-01-25 06:30:00 KST

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
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
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SupportTypeLabel, SupportMethodLabel } from '@/types/tech-support';
import type { SupportType, SupportMethod, SupportStatus, UpdateTechSupportRequest } from '@/types/tech-support';
import { useTechSupportDetailQuery, useUpdateTechSupportMutation, useDeleteTechSupportMutation } from '@/hooks/support';
import { useCustomerListQuery } from '@/hooks/customers';
import { TierBar } from './TierBar';
import { AttachmentUpload } from './AttachmentUpload';
import { cn } from '@/lib/utils';

interface TechSupportDetailDialogProps {
  supportId: number | null;
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
  status: SupportStatus;
}

function minutesToTime(minutes: number | null): string {
  if (minutes === null) return '';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function timeToMinutes(time: string): number | null {
  if (!time) return null;
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toISOString().split('T')[0];
}

export function TechSupportDetailDialog({ supportId, onClose }: TechSupportDetailDialogProps) {
  const { data: session } = useSession();
  const { data: support, isLoading } = useTechSupportDetailQuery(supportId);
  const { mutateAsync: updateSupport, isPending: isUpdating } = useUpdateTechSupportMutation();
  const { mutateAsync: deleteSupport } = useDeleteTechSupportMutation();
  const { data: customerData } = useCustomerListQuery();
  const customers = customerData?.customers || [];

  const [form, setForm] = useState<FormState>({
    title: '',
    customer_id: null,
    support_type: null,
    support_date: '',
    support_method: null,
    start_time: '',
    end_time: '',
    description: '',
    status: 'RECEIVED',
  });
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [comboOpen, setComboOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');

  const user = session?.user as any;
  const canEdit = user?.role === 'ADMIN' || support?.employee_id === user?.id;
  const isAdmin = user?.role === 'ADMIN';

  // 데이터 로드 시 폼 동기화
  useEffect(() => {
    if (support) {
      setForm({
        title: support.title,
        customer_id: support.customer_id,
        support_type: support.support_type,
        support_date: formatDate(support.support_date),
        support_method: support.support_method,
        start_time: minutesToTime(support.start_time),
        end_time: minutesToTime(support.end_time),
        description: support.description || '',
        status: support.status,
      });
    }
  }, [support]);

  const handleStatusChange = async (newStatus: SupportStatus) => {
    if (!supportId) return;
    try {
      await updateSupport({ id: supportId, data: { status: newStatus } });
      toast.success('상태가 변경되었습니다.');
    } catch (e: any) {
      toast.error(e.message || '상태 변경에 실패했습니다.');
    }
  };

  const handleSave = async () => {
    if (!supportId || !support) return;

    const data: UpdateTechSupportRequest = {};
    if (form.title !== support.title) data.title = form.title.trim();
    if (form.customer_id !== support.customer_id) data.customer_id = form.customer_id!;
    if (form.support_type !== support.support_type) data.support_type = form.support_type!;
    if (form.support_date !== formatDate(support.support_date)) data.support_date = form.support_date;
    if (form.support_method !== support.support_method) data.support_method = form.support_method;
    const newStart = timeToMinutes(form.start_time);
    const newEnd = timeToMinutes(form.end_time);
    if (newStart !== support.start_time) data.start_time = newStart;
    if (newEnd !== support.end_time) data.end_time = newEnd;
    if (form.description !== (support.description || '')) data.description = form.description || null;

    if (Object.keys(data).length === 0) {
      toast.info('변경된 내용이 없습니다.');
      return;
    }

    // 시간 검증
    if (data.start_time !== undefined && data.end_time !== undefined) {
      if (data.start_time !== null && data.end_time !== null && data.start_time >= data.end_time) {
        toast.error('종료 시간은 시작 시간보다 커야 합니다.');
        return;
      }
    }

    try {
      await updateSupport({ id: supportId, data });
      toast.success('저장되었습니다.');
    } catch (e: any) {
      toast.error(e.message || '저장에 실패했습니다.');
    }
  };

  const handleDelete = async () => {
    if (!supportId) return;
    try {
      await deleteSupport(supportId);
      toast.success('기술지원이 삭제되었습니다.');
      onClose();
    } catch {
      toast.error('삭제에 실패했습니다.');
    }
  };

  const selectedCustomer = customers.find((c) => c.id === form.customer_id);
  const filteredCustomers = customerSearch
    ? customers.filter((c) => c.name.includes(customerSearch))
    : customers;

  return (
    <Dialog open={supportId !== null} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>기술지원 상세</DialogTitle>
          <DialogDescription>기술지원 건의 상세 내용을 확인합니다.</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4 py-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : support ? (
          <div className="space-y-4 py-4">
            {/* TierBar */}
            <TierBar
              status={form.status}
              canEdit={canEdit}
              role={user?.role || 'USER'}
              onStatusChange={handleStatusChange}
            />

            {/* 완료일시 */}
            {support.status === 'COMPLETED' && support.completed_at && (
              <p className="text-xs text-muted-foreground">
                완료: {new Date(support.completed_at).toLocaleString('ko-KR')}
              </p>
            )}

            {/* 제목 */}
            <div className="space-y-1">
              <label className="text-sm font-medium">제목</label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                disabled={!canEdit}
                maxLength={200}
              />
            </div>

            {/* 고객사 */}
            <div className="space-y-1">
              <label className="text-sm font-medium">고객사</label>
              {canEdit ? (
                <div className="relative">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-between font-normal"
                    onClick={() => setComboOpen(!comboOpen)}
                  >
                    <span className="truncate">
                      {selectedCustomer ? selectedCustomer.name : '선택하세요'}
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
              ) : (
                <Input value={support.customer_name || ''} disabled />
              )}
            </div>

            {/* 지원 유형 */}
            <div className="space-y-1">
              <label className="text-sm font-medium">지원 유형</label>
              <Select
                value={form.support_type || ''}
                onValueChange={(v) => setForm({ ...form, support_type: v as SupportType })}
                disabled={!canEdit}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SupportTypeLabel).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 지원일 */}
            <div className="space-y-1">
              <label className="text-sm font-medium">지원일</label>
              <Input
                type="date"
                value={form.support_date}
                onChange={(e) => setForm({ ...form, support_date: e.target.value })}
                disabled={!canEdit}
              />
            </div>

            {/* 지원 방법 */}
            <div className="space-y-1">
              <label className="text-sm font-medium">지원 방법</label>
              <Select
                value={form.support_method || 'NONE'}
                onValueChange={(v) => setForm({ ...form, support_method: v === 'NONE' ? null : v as SupportMethod })}
                disabled={!canEdit}
              >
                <SelectTrigger>
                  <SelectValue />
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
                <Input
                  type="time"
                  value={form.start_time}
                  onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                  disabled={!canEdit}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">종료 시간</label>
                <Input
                  type="time"
                  value={form.end_time}
                  onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                  disabled={!canEdit}
                />
              </div>
            </div>

            {/* 설명 */}
            <div className="space-y-1">
              <label className="text-sm font-medium">설명</label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                disabled={!canEdit}
                rows={4}
              />
            </div>

            {/* ADMIN 담당자 변경 */}
            {isAdmin && (
              <div className="space-y-1">
                <label className="text-sm font-medium">담당자 ID</label>
                <Input
                  type="number"
                  value={support.employee_id}
                  disabled
                  className="text-muted-foreground"
                />
              </div>
            )}

            {/* 첨부파일 */}
            <AttachmentUpload
              supportId={supportId!}
              attachmentName={support.attachment_name}
              canEdit={canEdit}
            />
          </div>
        ) : null}

        {canEdit && !isLoading && support && (
          <DialogFooter className="gap-2">
            <Button variant="destructive" onClick={() => setDeleteOpen(true)}>삭제</Button>
            <Button variant="outline" onClick={onClose}>취소</Button>
            <Button onClick={handleSave} disabled={isUpdating}>
              {isUpdating ? '저장 중...' : '저장'}
            </Button>
          </DialogFooter>
        )}

        {/* 삭제 확인 Dialog */}
        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>기술지원 삭제</DialogTitle>
              <DialogDescription>이 기술지원 건을 삭제합니다. 이 작업은 취소할 수 없습니다.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteOpen(false)}>취소</Button>
              <Button variant="destructive" onClick={handleDelete}>삭제</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}
