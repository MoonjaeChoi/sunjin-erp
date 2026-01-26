// Generated: 2026-01-28 01:40:00 KST

'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useCustomer, useDeleteCustomer } from '@/hooks/useCustomers';
import { ClassificationLabel, ClassificationColors } from '@/types/customer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Edit2, Trash2, Loader2 } from 'lucide-react';

interface CustomerDetailProps {
  customerId: number;
}

export function CustomerDetail({ customerId }: CustomerDetailProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const { data: customer, isLoading, error } = useCustomer(customerId);
  const deleteMutation = useDeleteCustomer();

  const isAdmin = (session?.user as any)?.role === 'ADMIN';

  if (error) {
    return <div className="text-red-600 p-4 border border-red-300 rounded-lg">오류: {error.message}</div>;
  }

  if (isLoading) {
    return <div className="text-gray-500 text-center py-8">로딩 중...</div>;
  }

  if (!customer) {
    return <div className="text-gray-500 text-center py-8">고객을 찾을 수 없습니다.</div>;
  }

  const handleDelete = () => {
    deleteMutation.mutate(customerId, {
      onSuccess: () => {
        router.push('/customers');
      },
      onError: (error) => {
        alert(`오류: ${error.message}`);
      },
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4 flex-col md:flex-row">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            뒤로
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{customer.name}</h1>
            <p className="text-sm text-gray-500">{customer.code}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Link href={`/customers/${customerId}/edit`}>
            <Button className="gap-2">
              <Edit2 className="h-4 w-4" />
              수정
            </Button>
          </Link>
          {isAdmin && (
            <Button
              variant="destructive"
              onClick={() => setDeleteDialogOpen(true)}
              disabled={deleteMutation.isPending}
              className="gap-2"
            >
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              <Trash2 className="h-4 w-4" />
              삭제
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic">기본정보</TabsTrigger>
          <TabsTrigger value="contacts">담당자</TabsTrigger>
          <TabsTrigger value="history">이력</TabsTrigger>
        </TabsList>

        <TabsContent value="basic">
          <Card className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">분류</label>
                <div className="mt-1">
                  <Badge className={ClassificationColors[customer.classification]}>
                    {ClassificationLabel[customer.classification]}
                  </Badge>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">코드</label>
                <p className="mt-1">{customer.code}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">주소</label>
                <p className="mt-1">{customer.address || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">전화</label>
                <p className="mt-1">{customer.phone || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">이메일</label>
                <p className="mt-1 break-all">{customer.email || '-'}</p>
              </div>
            </div>
            {customer.memo && (
              <div className="border-t pt-4">
                <label className="text-sm font-medium text-gray-600">메모</label>
                <p className="mt-2 whitespace-pre-wrap">{customer.memo}</p>
              </div>
            )}
            <div className="border-t pt-4 text-xs text-gray-500 space-y-1">
              <p>등록: {new Date(customer.createdAt).toLocaleString('ko-KR')} {customer.createdBy?.name}</p>
              <p>수정: {new Date(customer.updatedAt).toLocaleString('ko-KR')} {customer.updatedBy?.name}</p>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="contacts">
          <Card className="p-6">
            <p className="text-gray-500">담당자 기능은 별도 컴포넌트에서 구현됩니다.</p>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card className="p-6">
            <p className="text-gray-500">이력 기능은 별도 컴포넌트에서 구현됩니다.</p>
          </Card>
        </TabsContent>
      </Tabs>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>고객을 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              고객명: <strong>{customer.name}</strong>
              <br />
              이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="bg-red-600 hover:bg-red-700"
          >
            {deleteMutation.isPending ? '삭제 중...' : '삭제'}
          </AlertDialogAction>
          <AlertDialogCancel>취소</AlertDialogCancel>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
