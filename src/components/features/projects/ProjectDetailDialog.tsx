// Generated: 2026-01-25 15:52:00 KST

'use client';

import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useProjectDetailQuery,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
} from '@/hooks/projects';
import {
  ProjectStatus,
  ProjectStatusLabel,
  ProjectStatusColor,
  PROJECT_STAGES_ORDER,
} from '@/types/project';
import { ProjectChecklist } from './ProjectChecklist';
import { ProjectAttachments } from './ProjectAttachments';
import { cn } from '@/lib/utils';

interface ProjectDetailDialogProps {
  projectId: number | null;
  open: boolean;
  onClose: () => void;
}

// 상태 전이 매핑 (RBAC 미적용 사용자용)
const STATUS_TRANSITIONS: Record<ProjectStatus, ProjectStatus[]> = {
  PREPARING: ['IN_PROGRESS', 'ON_HOLD'],
  IN_PROGRESS: ['PREPARING', 'COMPLETED', 'ON_HOLD'],
  COMPLETED: ['IN_PROGRESS', 'ON_HOLD'],
  ON_HOLD: ['PREPARING', 'IN_PROGRESS', 'COMPLETED'],
};

/**
 * 프로젝트 상세 정보 Dialog 컴포넌트
 * 상태 변경, 수정, 삭제, 8단계 체크리스트를 포함합니다.
 */
export function ProjectDetailDialog({
  projectId,
  open,
  onClose,
}: ProjectDetailDialogProps) {
  // ============================================================================
  // 1. 상태 관리
  // ============================================================================
  const [deleteOpen, setDeleteOpen] = useState(false);

  // ============================================================================
  // 2. 인증 및 쿼리
  // ============================================================================
  const { data: session } = useSession();
  const { data: project, isLoading } = useProjectDetailQuery(projectId);
  const { mutateAsync: updateProject, isPending: isUpdating } =
    useUpdateProjectMutation();
  const { mutateAsync: deleteProject, isPending: isDeleting } =
    useDeleteProjectMutation();

  // ============================================================================
  // 3. 권한 확인
  // ============================================================================
  const canEdit = useMemo(() => {
    if (!session?.user || !project) return false;

    const user = session.user as any;
    const userRole = user.role as string | undefined;

    if (userRole === 'ADMIN') return true;

    if (userRole === 'MANAGER') {
      // 같은 부서의 프로젝트만 수정 가능
      return (project as any).department_id === user.department_id;
    }

    // USER는 본인 담당 프로젝트만 수정 가능
    return project.employee_id === user.id;
  }, [session, project]);

  // ============================================================================
  // 4. 허용된 상태 전이 계산
  // ============================================================================
  const allowedStatuses = useMemo(() => {
    if (!project) return [];

    const user = session?.user as any;
    const userRole = user?.role as string | undefined;

    // ADMIN은 모든 상태 전이 허용
    if (userRole === 'ADMIN') {
      return Object.keys(ProjectStatusLabel) as ProjectStatus[];
    }

    // 다른 사용자는 상태 전이 규칙 준수
    return STATUS_TRANSITIONS[project.status] || [];
  }, [project, session?.user]);

  // ============================================================================
  // 5. 이벤트 핸들러
  // ============================================================================
  const handleStatusChange = async (newStatus: ProjectStatus) => {
    if (!projectId) return;

    try {
      await updateProject({
        id: projectId,
        data: { status: newStatus },
      });
      toast.success('상태가 변경되었습니다.');
    } catch (error: any) {
      toast.error(error.message || '상태 변경에 실패했습니다.');
    }
  };

  const handleDelete = async () => {
    if (!projectId) return;

    try {
      await deleteProject(projectId);
      toast.success('프로젝트가 삭제되었습니다.');
      setDeleteOpen(false);
      onClose();
    } catch (error: any) {
      toast.error(error.message || '삭제에 실패했습니다.');
    }
  };

  // ============================================================================
  // 6. 포맷팅 헬퍼
  // ============================================================================
  const formatDateRange = (
    startDate: string | null,
    endDate: string | null
  ): string => {
    if (!startDate && !endDate) return '-';
    if (startDate && endDate) return `${startDate} ~ ${endDate}`;
    return startDate || endDate || '-';
  };

  const formatContractAmount = (amount: number | null): string => {
    if (!amount) return '-';
    return `${amount.toLocaleString('ko-KR')}원`;
  };

  // ============================================================================
  // 7. 렌더링
  // ============================================================================
  if (!projectId) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <DialogTitle>프로젝트 상세</DialogTitle>
            {canEdit && (
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setDeleteOpen(true)}
                  disabled={isDeleting}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  삭제
                </Button>
              </div>
            )}
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
          </div>
        ) : project ? (
          <div className="space-y-6">
            {/* 기본 정보 */}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">
                  프로젝트명
                </label>
                <p className="text-base font-medium">{project.project_name}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">
                    프로젝트 코드
                  </label>
                  <p className="text-sm">{project.project_code || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">
                    고객사
                  </label>
                  <p className="text-sm">{project.customer_name}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">
                    담당자
                  </label>
                  <p className="text-sm">
                    {project.employee_name} ({project.department_name})
                  </p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">
                    계약 기간
                  </label>
                  <p className="text-sm">
                    {formatDateRange(project.start_date, project.end_date)}
                  </p>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground">
                  계약 금액
                </label>
                <p className="text-sm">{formatContractAmount(project.contract_amount)}</p>
              </div>
            </div>

            {/* 상태 */}
            <div className="space-y-2 border-t pt-4">
              <label className="text-xs font-semibold text-muted-foreground">상태</label>
              <div className="flex items-center gap-3">
                <Badge
                  className={cn(
                    ProjectStatusColor[project.status].bg,
                    ProjectStatusColor[project.status].text
                  )}
                >
                  {ProjectStatusLabel[project.status]}
                </Badge>

                {canEdit && (
                  <Select
                    value={project.status}
                    onValueChange={(value) =>
                      handleStatusChange(value as ProjectStatus)
                    }
                    disabled={isUpdating}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {allowedStatuses.map((status) => (
                        <SelectItem key={status} value={status}>
                          {ProjectStatusLabel[status]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            {/* 체크리스트 */}
            <div className="border-t pt-4">
              <ProjectChecklist
                projectId={project.id}
                stages={Object.fromEntries(
                  PROJECT_STAGES_ORDER.map((stage) => [
                    stage,
                    (project.checklist as any).find((c: any) => c.stage === stage)
                      ?.completed_at || null,
                  ])
                )}
                canEdit={canEdit}
              />
            </div>

            {/* 설명 */}
            {project.description && (
              <div className="border-t pt-4">
                <label className="text-xs font-semibold text-muted-foreground">
                  설명
                </label>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {project.description}
                </p>
              </div>
            )}

            {/* 첨부파일 */}
            <ProjectAttachments
              projectId={project.id}
              attachments={project.attachments}
              canEdit={canEdit}
            />
          </div>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isUpdating}>
            닫기
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* 삭제 확인 Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>프로젝트 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              <p>정말로 &quot;{project?.project_name}&quot;를 삭제하시겠습니까?</p>
              <p className="text-xs text-muted-foreground mt-2">
                이 작업은 취소할 수 없습니다.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel disabled={isDeleting}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? '삭제 중...' : '삭제'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
