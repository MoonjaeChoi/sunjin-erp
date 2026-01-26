// Generated: 2026-01-26 17:15:00 KST

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRelocateInventoryMutation, useInventoryListQuery } from '@/hooks/inventory';
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
import { RelocateInventoryRequest } from '@/types/inventory';
import { inventoryKeys } from '@/hooks/inventory';

const relocateSchema = z.object({
  inventory_id: z.number().min(1, '장비를 선택하세요'),
  new_location: z.string().min(1, '새 위치는 필수입니다').max(200),
  reason: z.string().max(200).optional(),
});

interface RelocateFormProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function RelocateForm({ open, onOpenChange }: RelocateFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const relocateMutation = useRelocateInventoryMutation(0);
  const { data: inventoryList } = useInventoryListQuery({ statuses: ['재고', '출고', '고장'], pageSize: 1000 });

  const form = useForm<RelocateInventoryRequest>({
    resolver: zodResolver(relocateSchema),
    defaultValues: {
      inventory_id: 0,
      new_location: '',
      reason: '',
    },
  });

  async function onSubmit(data: RelocateInventoryRequest) {
    const selectedInventory = inventoryList?.data.find((item: any) => item.id === data.inventory_id);
    if (!selectedInventory || selectedInventory.current_status === '폐기') {
      toast({ variant: 'destructive', title: '오류', description: '폐기된 장비는 위치 변경이 불가능합니다' });
      return;
    }

    relocateMutation.mutate(data, {
      onSuccess: () => {
        toast({ title: '완료', description: '장비 위치 변경이 완료되었습니다' });
        queryClient.invalidateQueries({ queryKey: inventoryKeys.lists() });
        form.reset();
        onOpenChange?.(false);
      },
      onError: (error: any) => {
        toast({ variant: 'destructive', title: '위치 변경 실패', description: error.message });
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>장비 위치 변경</DialogTitle>
          <DialogDescription>장비의 보관 위치를 변경합니다</DialogDescription>
        </DialogHeader>

        {relocateMutation.isPending === false && relocateMutation.error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>위치 변경 실패</AlertTitle>
            <AlertDescription>{relocateMutation.error?.message}</AlertDescription>
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
                  <FormLabel>새 위치 *</FormLabel>
                  <FormControl>
                    <Input placeholder="예: 창고 B-2" {...field} />
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
                  <FormLabel>사유 (선택)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="위치 변경 사유..." className="resize-none h-16" {...field} />
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
                {form.formState.isSubmitting ? '변경 중...' : '변경'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
