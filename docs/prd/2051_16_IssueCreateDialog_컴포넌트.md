<!-- Generated: 2026-01-25 18:05:00 KST -->

# IssueCreateDialog 컴포넌트

**문서 번호**: 2051_16
**원본 PRD**: 2051_장애_현황_관리_prd_v2.md ('US-1')
**구현 범위**: 신규 등록 폼 다이얼로그 (고객사, 제목, 심각도, 설명, 담당자)
**복잡도**: M (Medium)
**의존성**: 2051_10 (Hooks)

---

## 구현 목표

신규 등록 폼을 Dialog로 구현한다:
- 고객사, 제목, 심각도, 설명, 담당자 (선택)
- is_public은 기본값 false (숨김)
- 폼 검증 (React Hook Form + Zod)
- 제출 후 목록 새로고침

---

## 구현 상세

```typescript
// Generated: 2026-01-25 18:05:00 KST
// src/components/features/issues/IssueCreateDialog.tsx

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateIssueMutation } from '@/hooks/issues';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const createIssueSchema = z.object({
  customer_id: z.number().min(1, '고객사를 선택해주세요'),
  title: z.string().min(1, '제목은 필수입니다').max(255),
  severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']),
  description: z.string().min(10, '설명은 최소 10자 이상이어야 합니다'),
  assigned_to_id: z.number().optional(),
});

type CreateIssueFormData = z.infer<typeof createIssueSchema>;

interface IssueCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customers?: Array<{ id: number; name: string }>;
  employees?: Array<{ id: number; name: string }>;
}

export default function IssueCreateDialog({
  open,
  onOpenChange,
  customers = [],
  employees = [],
}: IssueCreateDialogProps) {
  const router = useRouter();
  const createMutation = useCreateIssueMutation();

  const form = useForm<CreateIssueFormData>({
    resolver: zodResolver(createIssueSchema),
    defaultValues: {
      severity: 'MEDIUM',
    },
  });

  const onSubmit = async (data: CreateIssueFormData) => {
    try {
      await createMutation.mutateAsync({
        ...data,
        assigned_to_id: data.assigned_to_id || undefined,
      });

      toast.success('장애가 등록되었습니다.');
      form.reset();
      onOpenChange(false);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || '등록 중 오류가 발생했습니다.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>신규 장애 등록</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* 고객사 */}
            <FormField
              control={form.control}
              name="customer_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>고객사 *</FormLabel>
                  <Select onValueChange={(v) => field.onChange(parseInt(v))} value={field.value?.toString()}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="선택" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {customers.map((c) => (
                        <SelectItem key={c.id} value={c.id.toString()}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 제목 */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>제목 *</FormLabel>
                  <FormControl>
                    <Input placeholder="장애 제목" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 심각도 */}
            <FormField
              control={form.control}
              name="severity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>심각도 *</FormLabel>
                  <FormControl>
                    <RadioGroup value={field.value} onValueChange={field.onChange}>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="CRITICAL" id="severity_critical" />
                        <label htmlFor="severity_critical">심각 (P1)</label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="HIGH" id="severity_high" />
                        <label htmlFor="severity_high">높음 (P2)</label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="MEDIUM" id="severity_medium" />
                        <label htmlFor="severity_medium">보통 (P3)</label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="LOW" id="severity_low" />
                        <label htmlFor="severity_low">낮음 (P4)</label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 설명 */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>설명 *</FormLabel>
                  <FormControl>
                    <Textarea placeholder="장애 내용" className="min-h-24" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 담당자 (선택) */}
            <FormField
              control={form.control}
              name="assigned_to_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>담당자</FormLabel>
                  <Select
                    onValueChange={(v) => field.onChange(v ? parseInt(v) : undefined)}
                    value={field.value?.toString() || ''}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="미지정" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">미지정</SelectItem>
                      {employees.map((e) => (
                        <SelectItem key={e.id} value={e.id.toString()}>
                          {e.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 버튼 */}
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                취소
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? '등록중...' : '등록'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
```

---

## 검증 스키마

```typescript
const createIssueSchema = z.object({
  customer_id: z.number().min(1),
  title: z.string().min(1).max(255),
  severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']),
  description: z.string().min(10),
  assigned_to_id: z.number().optional(),
});
```

---

## Acceptance Criteria

- [ ] Dialog 열기/닫기
- [ ] 고객사 필수 검증
- [ ] 제목 필수 및 길이 검증
- [ ] 심각도 라디오 버튼
- [ ] 설명 필수 및 최소 길이 검증
- [ ] 담당자 선택 (선택사항)
- [ ] 폼 제출 및 API 호출
- [ ] 로딩 상태 표시
- [ ] 성공/실패 toast 알림
- [ ] TypeScript 빌드 성공

---

**다음 문서**: 2051_17_단위_테스트.md
