// Generated: 2026-01-28 00:30:00 KST

'use client';

import { useState } from 'react';
import { useDepartments, useDeleteDepartment } from '@/hooks/useEmployees';
import { DepartmentWithChildren } from '@/types/employee';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DepartmentTree } from './DepartmentTree';
import { DepartmentForm } from './DepartmentForm';
import { toast } from 'sonner';
import { Plus, Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export function DepartmentManager() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<DepartmentWithChildren | null>(null);
  const [deletingDepartment, setDeletingDepartment] = useState<DepartmentWithChildren | null>(null);

  const { data: departments, isLoading, error } = useDepartments();
  const deleteMutation = useDeleteDepartment();

  const handleEdit = (department: DepartmentWithChildren) => {
    setEditingDepartment(department);
    setIsFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingDepartment) return;

    try {
      await deleteMutation.mutateAsync(deletingDepartment.id);
      toast.success(`'${deletingDepartment.name}' 부서가 삭제되었습니다.`);
      setDeletingDepartment(null);
    } catch (error: any) {
      toast.error(error.message || '부서 삭제에 실패했습니다.');
    }
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingDepartment(null);
  };

  if (error) {
    return <div className="text-red-600 p-4 border border-red-300 rounded-lg">오류: {error.message}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">부서 목록</h2>
        <Button onClick={() => setIsFormOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          새 부서
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : !departments || departments.length === 0 ? (
            <p className="text-center text-gray-500 py-8">부서가 없습니다.</p>
          ) : (
            <DepartmentTree
              departments={departments}
              onEdit={handleEdit}
              onDelete={setDeletingDepartment}
            />
          )}
        </CardContent>
      </Card>

      {/* 부서 생성/수정 다이얼로그 */}
      <DepartmentForm
        open={isFormOpen}
        onOpenChange={handleFormClose}
        department={editingDepartment}
        departments={departments || []}
      />

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog open={!!deletingDepartment} onOpenChange={() => setDeletingDepartment(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>부서 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              &apos;{deletingDepartment?.name}&apos; 부서를 삭제하시겠습니까?
              하위 부서나 소속 직원이 있으면 삭제할 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
