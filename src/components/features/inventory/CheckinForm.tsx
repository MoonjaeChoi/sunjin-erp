// Generated: 2026-01-26 17:15:00 KST

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCheckinInventoryMutation, useInventoryListQuery } from '@/hooks/inventory';
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';
import { CheckinInventoryRequest } from '@/types/inventory';
import { inventoryKeys } from '@/hooks/inventory';

const checkinSchema = z.object({
  inventory_id: z.number().min(1, '장비를 선택하세요'),
  new_location: z.string().min(1, '반납 위치는 필수입니다').max(200),
  reason: z.string().max(200).optional(),
});

interface CheckinFormProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function CheckinForm({ open, onOpenChange }: CheckinFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const checkinMutation = useCheckinInventoryMutation(0);
  const { data: inventoryList } = useInventoryListQuery({ statuses: ['출고'], pageSize: 1000 });

  const form = useForm<CheckinInventoryRequest>({
    resolver: zodResolver(checkinSchema),
    defaultValues: {
      inventory_id: 0,
      new_location: '',
      reason: '',
    },
  });

  async function onSubmit(data: CheckinInventoryRequest) {
    const selectedInventory = inventoryList?.data.find((item: any) => item.id === data.inventory_id);
    if (!selectedInventory || selectedInventory.current_status !== '출고') {
      toast({ variant: 'destructive', title: '오류', description: '선택된 장비의 상태가 변경되었습니다' });
      return;
    }

    checkinMutation.mutate(data, {
      onSuccess: () => {
        toast({ title: '완료', description: '장비 반납이 완료되었습니다' });
        queryClient.invalidateQueries({ queryKey: inventoryKeys.lists() });
        queryClient.invalidateQueries({ queryKey: inventoryKeys.stats() });
        form.reset();
        onOpenChange?.(false);
      },
      onError: (error: any) => {
        toast({ variant: 'destructive', title: '반납 실패', description: error.message });
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>장비 반납</DialogTitle>
          <DialogDescription>사용 중이던 장비를 반납합니다</DialogDescription>
        </DialogHeader>

        {checkinMutation.isPending === false && checkinMutation.error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>반납 실패</AlertTitle>
            <AlertDescription>{checkinMutation.error?.message}</AlertDescription>
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
                        <SelectValue placeholder="출고 중인 장비 선택" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {inventoryList?.data.map((item: any) => (
                        <SelectItem key={item.id} value={String(item.id)}>
                          {item.category} - {item.model} (SN: {item.serial_number})
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
              name="new_location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>반납 위치 *</FormLabel>
                  <FormControl>
                    <Input placeholder="예: 창고 A-1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>비고 (선택)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="추가 정보..." className="resize-none h-16" {...field} />
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
                {form.formState.isSubmitting ? '처리 중...' : '반납'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
