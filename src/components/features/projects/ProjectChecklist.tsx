// Generated: 2026-01-25 15:52:00 KST

'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';
import { useToggleChecklistMutation } from '@/hooks/projects';
import { ProjectStage, PROJECT_STAGES_ORDER, ProjectStageLabel } from '@/types/project';
import { cn } from '@/lib/utils';

interface ProjectChecklistProps {
  projectId: number;
  stages: Record<string, string | null>;
  canEdit: boolean;
}

/**
 * 프로젝트 8단계 Sales Pipeline 체크리스트 컴포넌트
 * 비순차 체크를 지원하며, 이후 단계가 완료된 미완료 단계를 강조 표시합니다.
 */
export function ProjectChecklist({
  projectId,
  stages,
  canEdit,
}: ProjectChecklistProps) {
  // ============================================================================
  // 1. 뮤테이션
  // ============================================================================
  const { mutate: toggleChecklist, isPending } = useToggleChecklistMutation();

  // ============================================================================
  // 2. 하이라이트 로직
  // ============================================================================
  const shouldHighlight = (stageIndex: number): boolean => {
    const currentStage = PROJECT_STAGES_ORDER[stageIndex];
    const currentCompleted = stages[currentStage] !== null;

    // 이미 완료되었으면 하이라이트 없음
    if (currentCompleted) return false;

    // 이후 단계 중 완료된 것이 있는지 확인
    return PROJECT_STAGES_ORDER.slice(stageIndex + 1).some(
      (stage) => stages[stage] !== null
    );
  };

  // ============================================================================
  // 3. 체크박스 토글 핸들러
  // ============================================================================
  const handleToggle = (stage: ProjectStage, currentCompleted: boolean) => {
    toggleChecklist({
      projectId,
      stage,
      completed: !currentCompleted,
    });
  };

  // ============================================================================
  // 4. Effect - 모든 단계 완료 체크
  // ============================================================================
  useEffect(() => {
    const allCompleted = PROJECT_STAGES_ORDER.every(
      (stage) => stages[stage] !== null
    );

    if (allCompleted && Object.values(stages).some((v) => v !== null)) {
      toast('모든 단계가 완료되었습니다. 상태를 완료로 변경하시겠습니까?');
    }
  }, [stages]);

  // ============================================================================
  // 5. 렌더링
  // ============================================================================
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-foreground">Sales Pipeline</h3>
      <div className="space-y-1">
        {PROJECT_STAGES_ORDER.map((stage, idx) => {
          const completedAt = stages[stage];
          const isCompleted = completedAt !== null;
          const highlight = shouldHighlight(idx);

          return (
            <div
              key={stage}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors',
                highlight
                  ? 'bg-orange-50 border border-orange-200'
                  : 'hover:bg-muted/30'
              )}
            >
              <Checkbox
                checked={isCompleted}
                disabled={!canEdit || isPending}
                onCheckedChange={() => handleToggle(stage, isCompleted)}
              />
              <span className={cn('text-sm flex-1 font-medium')}>
                {ProjectStageLabel[stage]}
              </span>
              {completedAt && (
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(completedAt).toLocaleString('ko-KR', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
