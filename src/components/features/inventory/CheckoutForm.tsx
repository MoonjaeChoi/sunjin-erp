// Generated: 2026-01-26 17:15:00 KST

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCheckoutInventoryMutation, useInventoryListQuery } from '@/hooks/inventory';
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
  FormDescription,
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
import { CheckoutInventoryRequest } from '@/types/inventory';
import { inventoryKeys } from '@/hooks/inventory';

const checkoutSchema = z.object({
  inventory_id: z.number().min(1, '장비를 선택하세요'),
  checkout_location: z.string().min(1, '출고 위치는 필수입니다').max(200),
  expected_checkin_date: z.string().optional().refine(
    (date) => {
      if (!date) return true;
      const d = new Date(date);
      return !isNaN(d.getTime()) && d >= new Date();
    },
    '반납일은 미래 날짜여야 합니다'
  ),
  reason: z.string().max(200).optional(),
});

interface CheckoutFormProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function CheckoutForm({ open, onOpenChange }: CheckoutFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const checkoutMutation = useCheckoutInventoryMutation(0); // inventoryId will be set dynamically
  const { data: inventoryList } = useInventoryListQuery({ statuses: ['재고'], pageSize: 1000 });

  const form = useForm<CheckoutInventoryRequest>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      inventory_id: 0,
      checkout_location: '',
      expected_checkin_date: '',
      reason: '',
    },
  });

  async function onSubmit(data: CheckoutInventoryRequest) {
    const selectedInventory = inventoryList?.data.find((item: any) => item.id === data.inventory_id);
    if (!selectedInventory || selectedInventory.current_status !== '재고') {
      toast({ variant: 'destructive', title: '오류', description: '선택된 장비의 상태가 변경되었습니다' });
      return;
    }

    checkoutMutation.mutate(data, {
      onSuccess: () => {
        toast({ title: '완료', description: '장비 출고가 완료되었습니다' });
        queryClient.invalidateQueries({ queryKey: inventoryKeys.lists() });
        queryClient.invalidateQueries({ queryKey: inventoryKeys.stats() });
        form.reset();
        onOpenChange?.(false);
      },
      onError: (error: any) => {
        toast({ variant: 'destructive', title: '출고 실패', description: error.message });
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>장비 출고 처리</DialogTitle>
          <DialogDescription>장비를 사용처로 출고합니다</DialogDescription>
        </DialogHeader>

        {checkoutMutation.isPending === false && checkoutMutation.error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>출고 실패</AlertTitle>
            <AlertDescription>{checkoutMutation.error?.message}</AlertDescription>
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
                        <SelectValue placeholder="재고 중인 장비 선택" />
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
              name="checkout_location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>출고 위치 *</FormLabel>
                  <FormControl>
                    <Input placeholder="예: 프로젝트 A, 홍길동" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="expected_checkin_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>예상 반납일 (선택)</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormDescription>지정하지 않으면 반납일이 없는 상태로 등록됩니다</FormDescription>
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
                {form.formState.isSubmitting ? '처리 중...' : '출고'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
