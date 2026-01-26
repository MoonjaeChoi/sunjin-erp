// Generated: 2026-01-26 17:15:00 KST

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSession } from 'next-auth/react';
import { useStatusChangeInventoryMutation, useInventoryListQuery } from '@/hooks/inventory';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Lock, Loader2 } from 'lucide-react';
import { StatusChangeInventoryRequest, InventoryStatus } from '@/types/inventory';
import { InventoryService } from '@/lib/inventory-service';
import { inventoryKeys } from '@/hooks/inventory';

const statusChangeSchema = z.object({
  inventory_id: z.number().min(1, '장비를 선택하세요'),
  new_status: z.enum(['고장', '폐기'] as const, {
    errorMap: () => ({ message: '유효한 상태를 선택하세요' }),
  }),
  reason: z.string().min(1, '사유는 필수입니다').max(200),
});

interface StatusChangeFormProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function StatusChangeForm({ open, onOpenChange }: StatusChangeFormProps) {
  const { data: session } = useSession();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const statusChangeMutation = useStatusChangeInventoryMutation(0);
  const { data: inventoryList } = useInventoryListQuery({ pageSize: 1000 });

  const isAdmin = session?.user?.role === 'ADMIN';
  const selectedInventoryId = 0;
  const selectedInventory = inventoryList?.data.find((item: any) => item.id === selectedInventoryId);

  const form = useForm<StatusChangeInventoryRequest>({
    resolver: zodResolver(statusChangeSchema),
    defaultValues: {
      inventory_id: 0,
      new_status: '고장',
      reason: '',
    },
  });

  const availableStatuses = selectedInventory
    ? Object.entries(InventoryService.getAvailableStatusTransitions(selectedInventory.current_status))
        .filter(([_key, statuses]) => statuses.length > 0)
        .flatMap(([_key, statuses]) => statuses) as ('고장' | '폐기')[]
    : [];

  async function onSubmit(data: StatusChangeInventoryRequest) {
    if (!isAdmin) {
      toast({ variant: 'destructive', title: '권한 없음', description: 'ADMIN 권한만 상태 변경이 가능합니다' });
      return;
    }

    const selectedInv = inventoryList?.data.find((item: any) => item.id === data.inventory_id);
    if (!selectedInv || !InventoryService.validateStateTransition(selectedInv.current_status, data.new_status)) {
      toast({ variant: 'destructive', title: '오류', description: '불가능한 상태 변경입니다' });
      return;
    }

    statusChangeMutation.mutate(data, {
      onSuccess: () => {
        toast({ title: '완료', description: '장비 상태 변경이 완료되었습니다' });
        queryClient.invalidateQueries({ queryKey: inventoryKeys.lists() });
        queryClient.invalidateQueries({ queryKey: inventoryKeys.stats() });
        form.reset();
        onOpenChange?.(false);
      },
      onError: (error: any) => {
        toast({ variant: 'destructive', title: '상태 변경 실패', description: error.message });
      },
    });
  }

  if (!isAdmin) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>장비 상태 변경</DialogTitle>
          </DialogHeader>
          <Alert variant="destructive">
            <Lock className="h-4 w-4" />
            <AlertTitle>권한 없음</AlertTitle>
            <AlertDescription>ADMIN 권한만 장비 상태를 변경할 수 있습니다</AlertDescription>
          </Alert>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>장비 상태 변경</DialogTitle>
          <DialogDescription>장비의 상태를 고장 또는 폐기로 변경합니다</DialogDescription>
        </DialogHeader>

        {statusChangeMutation.isPending === false && statusChangeMutation.error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>상태 변경 실패</AlertTitle>
            <AlertDescription>{statusChangeMutation.error?.message}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="inventory_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>장비 선택 *</FormLabel>
                  <Select onValueChange={(val) => field.onChange(Number(val))} defaultValue={field.value?.toString()}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="장비 선택" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {inventoryList?.data
                        .filter((item: any) => item.current_status !== '폐기')
                        .map((item: any) => (
                          <SelectItem key={item.id} value={String(item.id)}>
                            {item.category} - {item.model} ({item.current_status})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="new_status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>변경할 상태 *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="상태 선택" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableStatuses.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>사유 *</FormLabel>
                  <FormControl>
                    <Textarea placeholder="상태 변경 사유..." className="resize-none h-16" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange?.(false)} disabled={form.formState.isSubmitting}>
                취소
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {form.formState.isSubmitting ? '변경 중...' : '상태 변경'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
