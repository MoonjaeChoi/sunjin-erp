<!-- Generated: 2026-01-25 21:30:00 KST -->

# CreateInventoryForm 컴포넌트 (입고)

**문서 번호**: 2051_21
**원본 PRD**: 2051_재고_관리_prd_v2.md (User Story 4)
**구현 범위**: `src/components/features/inventory/forms/CreateInventoryForm.tsx`
**복잡도**: M
**의존성**: 2051_12 (Types), 2051_14 (Hooks)

---

## 구현 목표

신규 장비 입고 폼을 구현한다. React Hook Form + zod 검증, 서버 에러 처리, 제출 성공 시 상세 페이지로 이동한다.

---

## 파일 구조

```
src/components/features/inventory/
└── forms/
    └── CreateInventoryForm.tsx
```

## 구현 상세

### 폼 필드

| 필드 | 타입 | 필수 | 검증 | 비고 |
|------|------|------|------|------|
| category | enum | ✓ | enum | 모니터, 노트북, 라우터, 프린터, 기타 |
| model | text | ✓ | 1-255자 | 모델명 |
| serial_number | text | ✓ | 1-100자, 고유 | 중복 검증 포함 |
| purchase_date | date | ✓ | ISO date, 미래일 불가 | |
| purchase_from | text | ✓ | 1-255자 | 구매처 |
| current_location | text | ✓ | 1-255자 | 초기 위치 |
| notes | textarea | ✗ | 최대 4000자 | 비고 |

### Props

```typescript
interface CreateInventoryFormProps {
  onSuccess?: (id: number) => void;
}
```

### 구현 예시

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useInventoryMutations } from '@/hooks/useInventory*';
import { CreateInventoryRequest, INVENTORY_CATEGORIES } from '@/types/inventory';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';

const createInventorySchema = z.object({
  category: z.enum(INVENTORY_CATEGORIES),
  model: z.string().min(1).max(255),
  serial_number: z.string().min(1).max(100),
  purchase_date: z.string().date(), // YYYY-MM-DD
  purchase_from: z.string().min(1).max(255),
  current_location: z.string().min(1).max(255),
  notes: z.string().max(4000).optional(),
});

export function CreateInventoryForm({
  onSuccess,
}: CreateInventoryFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { createMutation } = useInventoryMutations();

  const form = useForm<z.infer<typeof createInventorySchema>>({
    resolver: zodResolver(createInventorySchema),
    defaultValues: {
      category: '모니터',
      model: '',
      serial_number: '',
      purchase_date: '',
      purchase_from: '',
      current_location: '',
      notes: '',
    },
  });

  const onSubmit = async (data: CreateInventoryRequest) => {
    try {
      const result = await createMutation.mutateAsync(data);
      toast({
        title: '성공',
        description: '장비가 입고 등록되었습니다.',
      });

      if (onSuccess) {
        onSuccess(result.id);
      } else {
        router.push(`/inventory/${result.id}`);
      }
    } catch (error) {
      toast({
        title: '에러',
        description: error instanceof Error ? error.message : '입고 등록에 실패했습니다.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* category */}
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>카테고리 *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
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

        {/* model */}
        <FormField
          control={form.control}
          name="model"
          render={({ field }) => (
            <FormItem>
              <FormLabel>모델명 *</FormLabel>
              <Input placeholder="예: Dell U2720Q" {...field} />
              <FormMessage />
            </FormItem>
          )}
        />

        {/* serial_number */}
        <FormField
          control={form.control}
          name="serial_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>시리얼 번호 *</FormLabel>
              <Input placeholder="예: SN123456" {...field} />
              <FormMessage />
            </FormItem>
          )}
        />

        {/* purchase_date */}
        <FormField
          control={form.control}
          name="purchase_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>구매일 *</FormLabel>
              <Input type="date" {...field} />
              <FormMessage />
            </FormItem>
          )}
        />

        {/* purchase_from */}
        <FormField
          control={form.control}
          name="purchase_from"
          render={({ field }) => (
            <FormItem>
              <FormLabel>구매처 *</FormLabel>
              <Input placeholder="예: 서울 컴퓨터" {...field} />
              <FormMessage />
            </FormItem>
          )}
        />

        {/* current_location */}
        <FormField
          control={form.control}
          name="current_location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>초기 위치 *</FormLabel>
              <Input placeholder="예: 창고 A-1" {...field} />
              <FormMessage />
            </FormItem>
          )}
        />

        {/* notes */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>비고</FormLabel>
              <Textarea placeholder="추가 정보..." {...field} />
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={createMutation.isPending}
          className="w-full"
        >
          {createMutation.isPending ? '등록 중...' : '입고 등록'}
        </Button>
      </form>
    </Form>
  );
}
```

---

## Acceptance Criteria

- [ ] CreateInventoryForm 컴포넌트 구현
- [ ] React Hook Form + zod 통합
- [ ] 모든 필드 렌더링 (7개 필드)
- [ ] 필드 검증 실시간 표시
- [ ] 서버 에러 처리 (시리얼번호 중복 등)
- [ ] 제출 성공 → 상세 페이지 이동
- [ ] 로딩 상태 처리 (isPending)
- [ ] Toast 메시지 (성공/에러)
- [ ] 기본값 설정
- [ ] Accessible form (FormField labels)

---

**다음 문서**: 2051_22_CheckoutForm_컴포넌트.md
