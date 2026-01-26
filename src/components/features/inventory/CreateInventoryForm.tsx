// Generated: 2026-01-26 17:15:00 KST

'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateInventoryMutation } from '@/hooks/inventory';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
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
import { INVENTORY_CATEGORIES } from '@/types/inventory';
import { CreateInventoryRequest } from '@/types/inventory';
import { useDebounce } from '@/hooks/use-debounce';
import { inventoryKeys } from '@/hooks/inventory';

const createInventorySchema = z.object({
  category: z.string().min(1, '카테고리를 선택하세요'),
  model: z.string().min(1, '모델명은 필수입니다').max(100, '모델명은 100자 이내여야 합니다'),
  serial_number: z.string().min(1, '시리얼번호는 필수입니다').max(100),
  purchase_date: z.string()
    .min(1, '구매일은 필수입니다')
    .refine((date) => {
      const d = new Date(date);
      return !isNaN(d.getTime()) && d <= new Date();
    }, '유효한 과거 날짜를 입력하세요'),
  purchase_from: z.string().min(1, '구매처는 필수입니다').max(100),
  current_location: z.string().min(1, '초기 위치는 필수입니다').max(200),
  notes: z.string().max(500, '비고는 500자 이내여야 합니다').optional(),
});

interface CreateInventoryFormProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function CreateInventoryForm({ open, onOpenChange }: CreateInventoryFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createMutation = useCreateInventoryMutation();
  const [isCheckingSerial, setIsCheckingSerial] = useState(false);
  const [serialCheckError, setSerialCheckError] = useState<string | null>(null);

  const form = useForm<CreateInventoryRequest>({
    resolver: zodResolver(createInventorySchema),
    defaultValues: {
      category: '',
      model: '',
      serial_number: '',
      purchase_date: '',
      purchase_from: '',
      current_location: '',
      notes: '',
    },
  });

  const debouncedSerial = useDebounce(form.watch('serial_number'), 500);

  useEffect(() => {
    const checkSerial = async () => {
      const serial = debouncedSerial?.trim();
      if (!serial || serial.length < 3) {
        setSerialCheckError(null);
        return;
      }

      setIsCheckingSerial(true);
      try {
        const response = await fetch(`/api/inventory/check-serial?serial=${encodeURIComponent(serial)}`);
        if (response.ok) {
          setSerialCheckError(null);
        } else if (response.status === 409) {
          setSerialCheckError('이미 등록된 시리얼번호입니다');
        }
      } catch (error) {
        console.error('Serial check failed:', error);
      } finally {
        setIsCheckingSerial(false);
      }
    };

    checkSerial();
  }, [debouncedSerial]);

  async function onSubmit(data: CreateInventoryRequest) {
    if (serialCheckError) {
      toast({ variant: 'destructive', title: '검증 실패', description: serialCheckError });
      return;
    }

    createMutation.mutate(data, {
      onSuccess: (result) => {
        toast({ title: '완료', description: `장비 입고 등록 완료 (ID: ${result.id})` });
        queryClient.invalidateQueries({ queryKey: inventoryKeys.lists() });
        queryClient.invalidateQueries({ queryKey: inventoryKeys.stats() });
        form.reset();
        onOpenChange?.(false);
        router.push(`/inventory/${result.id}`);
      },
      onError: (error: any) => {
        if (error.response?.status === 409) {
          setSerialCheckError('시리얼번호가 이미 존재합니다');
        } else {
          toast({ variant: 'destructive', title: '등록 실패', description: error.message });
        }
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>장비 입고 등록</DialogTitle>
          <DialogDescription>새로운 장비를 시스템에 등록합니다</DialogDescription>
        </DialogHeader>

        {createMutation.isPending === false && createMutation.error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>등록 실패</AlertTitle>
            <AlertDescription>{createMutation.error?.message || '알 수 없는 오류가 발생했습니다'}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>카테고리 *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="카테고리 선택" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {INVENTORY_CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
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
                name="model"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>모델명 *</FormLabel>
                    <FormControl>
                      <Input placeholder="예: Dell U2720Q" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="serial_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>시리얼번호 *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input placeholder="예: SN1234567890" {...field} />
                      {isCheckingSerial && <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin" />}
                    </div>
                  </FormControl>
                  {serialCheckError && <FormMessage>{serialCheckError}</FormMessage>}
                  {isCheckingSerial && <FormDescription>중복 검사 중...</FormDescription>}
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="purchase_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>구매일 *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="purchase_from"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>구매처 *</FormLabel>
                    <FormControl>
                      <Input placeholder="예: Amazon Korea" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="current_location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>초기 위치 *</FormLabel>
                  <FormControl>
                    <Input placeholder="예: 창고 A-1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>비고 (선택)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="추가 정보..." className="resize-none h-20" {...field} />
                  </FormControl>
                  <FormDescription>{(field.value?.length || 0)}/500 자</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange?.(false)} disabled={form.formState.isSubmitting}>
                취소
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting || !!serialCheckError}>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {form.formState.isSubmitting ? '등록 중...' : '등록'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
