// Generated: 2026-01-28 16:00:00 KST

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, ControllerRenderProps } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useCreateNotice, useUpdateNotice } from '@/hooks/notices';
import FileUpload from './FileUpload';
import { NOTICE_TYPES, type NoticeType, type NoticeDetail, FILE_UPLOAD_LIMITS } from '@/types/notice';

const formSchema = z.object({
  title: z.string()
    .min(5, '제목은 5자 이상이어야 합니다')
    .max(200, '제목은 200자 이하여야 합니다'),
  content: z.string()
    .min(10, '내용은 10자 이상이어야 합니다')
    .max(10000, '내용은 10,000자 이하여야 합니다'),
  type: z.enum(['공지', '공유', '지시', '건의', '자유'] as const),
});

type FormValues = z.infer<typeof formSchema>;

interface NoticeFormProps {
  mode: 'create' | 'edit';
  notice?: NoticeDetail;
}

const DRAFT_KEY = 'notice-draft';

export default function NoticeForm({ mode, notice }: NoticeFormProps) {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);

  const createMutation = useCreateNotice();
  const updateMutation = useUpdateNotice();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: notice?.title || '',
      content: notice?.content || '',
      type: (notice?.type as NoticeType) || undefined,
    },
  });

  // Load draft (create mode only)
  useEffect(() => {
    if (mode === 'create') {
      const draft = localStorage.getItem(DRAFT_KEY);
      if (draft) {
        try {
          const parsed = JSON.parse(draft);
          form.reset(parsed);
          toast.info('임시 저장된 내용을 불러왔습니다');
        } catch {
          localStorage.removeItem(DRAFT_KEY);
        }
      }
    }
  }, [mode, form]);

  // Auto-save draft (create mode, every 30 seconds)
  useEffect(() => {
    if (mode !== 'create') return;

    const interval = setInterval(() => {
      const values = form.getValues();
      if (values.title || values.content) {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(values));
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [mode, form]);

  const handleSaveDraft = () => {
    const values = form.getValues();
    localStorage.setItem(DRAFT_KEY, JSON.stringify(values));
    toast.success('임시 저장되었습니다');
  };

  const handleClearDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
    form.reset({ title: '', content: '', type: undefined });
    setFiles([]);
    toast.info('임시 저장이 삭제되었습니다');
  };

  const onSubmit = async (values: FormValues) => {
    try {
      if (mode === 'create') {
        const formData = new FormData();
        formData.append('title', values.title);
        formData.append('content', values.content);
        formData.append('type', values.type);
        files.forEach((file) => formData.append('files', file));

        await createMutation.mutateAsync(formData);
        localStorage.removeItem(DRAFT_KEY);
        toast.success('게시물이 등록되었습니다');
        router.push('/notices');
      } else if (notice) {
        await updateMutation.mutateAsync({
          id: notice.id,
          data: values,
        });
        toast.success('게시물이 수정되었습니다');
        router.push(`/notices/${notice.id}`);
      }
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <Card>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Type */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }: { field: ControllerRenderProps<FormValues, 'type'> }) => (
                <FormItem>
                  <FormLabel>게시판 유형</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="유형 선택" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {NOTICE_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }: { field: ControllerRenderProps<FormValues, 'title'> }) => (
                <FormItem>
                  <FormLabel>제목</FormLabel>
                  <FormControl>
                    <Input placeholder="제목을 입력하세요" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Content */}
            <FormField
              control={form.control}
              name="content"
              render={({ field }: { field: ControllerRenderProps<FormValues, 'content'> }) => (
                <FormItem>
                  <FormLabel>내용</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="내용을 입력하세요"
                      className="min-h-[200px]"
                      {...field}
                    />
                  </FormControl>
                  <div className="text-xs text-muted-foreground text-right">
                    {field.value.length} / 10,000
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* File Upload (create mode only) */}
            {mode === 'create' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">첨부파일</label>
                <FileUpload
                  files={files}
                  onChange={setFiles}
                  maxFiles={FILE_UPLOAD_LIMITS.maxFileCount}
                  maxSize={FILE_UPLOAD_LIMITS.maxFileSize}
                />
              </div>
            )}

            {/* Buttons */}
            <div className="flex justify-between">
              <div className="flex gap-2">
                {mode === 'create' && (
                  <>
                    <Button type="button" variant="outline" onClick={handleSaveDraft}>
                      임시 저장
                    </Button>
                    <Button type="button" variant="ghost" onClick={handleClearDraft}>
                      초기화
                    </Button>
                  </>
                )}
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  취소
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {mode === 'create' ? '등록' : '수정'}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
