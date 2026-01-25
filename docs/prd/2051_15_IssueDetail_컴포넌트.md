<!-- Generated: 2026-01-25 18:05:00 KST -->

# IssueDetail 컴포넌트

**문서 번호**: 2051_15
**원본 PRD**: 2051_장애_현황_관리_prd_v2.md ('6.2 페이지 레이아웃, US-7, US-8')
**구현 범위**: 상세 정보 표시, 수정 폼, 파일 첨부, 이력, 롤백 버튼
**복잡도**: L (Large)
**의존성**: 2051_10 (Hooks)

---

## 구현 목표

Issue 상세 컴포넌트를 구현한다:
- 기본 정보 (제목, 고객사, 심각도, 상태, 담당자)
- is_public 토글 (MANAGER/ADMIN만)
- 처리 정보 (방법, 소요 시간 포맷팅, 결과)
- 첨부파일 리스트 및 업로드
- 변경 이력
- 상태 롤백 버튼 (ADMIN만, COMPLETED일 때)

---

## 구현 상세

```typescript
// Generated: 2026-01-25 18:05:00 KST
// src/components/features/issues/IssueDetail.tsx

'use client';

import { useSession } from 'next-auth/react';
import { Issue } from '@/types/issue';
import { useUpdateIssueMutation, useRollbackIssueMutation } from '@/hooks/issues';
import { formatTreatmentTime, getStatusLabel, getSeverityLabel, getTreatmentMethodLabel } from '@/types/issue';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { useState } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import IssueDetailForm from './IssueDetailForm';
import FileUploadArea from './FileUploadArea';
import IssueHistoryList from './IssueHistoryList';

interface IssueDetailProps {
  issue: Issue & {
    attachments: any[];
    histories: any[];
  };
}

export default function IssueDetail({ issue }: IssueDetailProps) {
  const session = useSession();
  const [isEditing, setIsEditing] = useState(false);
  const [showRollbackConfirm, setShowRollbackConfirm] = useState(false);

  const updateMutation = useUpdateIssueMutation(issue.id);
  const rollbackMutation = useRollbackIssueMutation(issue.id);

  const canEdit = session.data?.user?.role === 'ADMIN' || session.data?.user?.role === 'MANAGER';
  const canRollback = session.data?.user?.role === 'ADMIN' && issue.status === 'COMPLETED';

  const handleRollback = async () => {
    try {
      await rollbackMutation.mutateAsync();
      setShowRollbackConfirm(false);
    } catch (error) {
      console.error('Rollback failed:', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">{issue.title}</h1>
          <p className="text-gray-500 mt-1">ID: {issue.id}</p>
        </div>
        <div className="flex gap-2">
          {canEdit && !isEditing && (
            <Button onClick={() => setIsEditing(true)}>수정</Button>
          )}
          {canRollback && (
            <Button variant="destructive" onClick={() => setShowRollbackConfirm(true)}>
              상태 되돌리기
            </Button>
          )}
        </div>
      </div>

      {/* 기본 정보 */}
      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-4">기본 정보</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-gray-600">고객사</label>
            <p>{issue.customer?.name}</p>
          </div>
          <div>
            <label className="text-gray-600">심각도</label>
            <Badge className="mt-1">{getSeverityLabel(issue.severity)}</Badge>
          </div>
          <div>
            <label className="text-gray-600">상태</label>
            <Badge className="mt-1">{getStatusLabel(issue.status)}</Badge>
          </div>
          <div>
            <label className="text-gray-600">담당자</label>
            <p>{issue.assigned_to?.name || '-'}</p>
          </div>
          <div>
            <label className="text-gray-600">생성자</label>
            <p>{issue.created_by?.name}</p>
          </div>
          <div>
            <label className="text-gray-600">생성일</label>
            <p>{format(new Date(issue.created_at), 'yyyy-MM-dd HH:mm', { locale: ko })}</p>
          </div>
        </div>

        {/* is_public 토글 (MANAGER/ADMIN만) */}
        {canEdit && (
          <div className="mt-4 pt-4 border-t">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={issue.is_public === 1}
                onChange={(e) => updateMutation.mutate({ is_public: e.target.checked ? 1 : 0 })}
              />
              <span>같은 부서원 조회 가능</span>
            </label>
          </div>
        )}
      </Card>

      {/* 설명 */}
      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-2">설명</h2>
        <p className="whitespace-pre-wrap text-gray-700">{issue.description}</p>
      </Card>

      {/* 처리 정보 */}
      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-4">처리 정보</h2>
        {isEditing ? (
          <IssueDetailForm issue={issue} onSuccess={() => setIsEditing(false)} />
        ) : (
          <div className="space-y-2">
            <div>
              <label className="text-gray-600">처리 방법</label>
              <p>{getTreatmentMethodLabel(issue.treatment_method as any)}</p>
            </div>
            <div>
              <label className="text-gray-600">소요 시간</label>
              <p>{formatTreatmentTime(issue.treatment_time_minutes)}</p>
            </div>
            <div>
              <label className="text-gray-600">처리 결과</label>
              <p className="whitespace-pre-wrap text-gray-700">{issue.treatment_result || '-'}</p>
            </div>
          </div>
        )}
      </Card>

      {/* 첨부파일 */}
      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-4">첨부파일</h2>
        <div className="space-y-3">
          {issue.attachments?.map((att) => (
            <div key={att.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <div>
                <p className="font-medium">{att.file_name}</p>
                <p className="text-sm text-gray-500">{(att.file_size / 1024).toFixed(1)}KB</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline">다운로드</Button>
                <Button size="sm" variant="ghost">삭제</Button>
              </div>
            </div>
          ))}
        </div>
        <FileUploadArea issueId={issue.id} />
      </Card>

      {/* 변경 이력 */}
      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-4">변경 이력</h2>
        <IssueHistoryList histories={issue.histories} />
      </Card>

      {/* 롤백 확인 다이얼로그 */}
      <AlertDialog open={showRollbackConfirm} onOpenChange={setShowRollbackConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>상태 되돌리기</AlertDialogTitle>
            <AlertDialogDescription>
              이 Issue를 진행중 상태로 되돌리시겠습니까?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleRollback}>확인</AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
```

---

## Acceptance Criteria

- [ ] 기본 정보 표시
- [ ] is_public 토글 (MANAGER/ADMIN만)
- [ ] 처리 정보 표시 (포맷팅 포함)
- [ ] 첨부파일 리스트 표시
- [ ] 첨부파일 업로드 폼
- [ ] 변경 이력 표시
- [ ] 롤백 버튼 (ADMIN만, COMPLETED일 때)
- [ ] 롤백 확인 다이얼로그
- [ ] 수정 폼 표시/숨김
- [ ] TypeScript 빌드 성공

---

**다음 문서**: 2051_16_IssueCreateDialog_컴포넌트.md
