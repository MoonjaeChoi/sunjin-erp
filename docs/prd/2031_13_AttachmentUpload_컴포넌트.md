<!-- Generated: 2026-01-25 05:10:00 KST -->

# AttachmentUpload 컴포넌트

**문서 번호**: 2031_13
**원본 PRD**: 2031_기술지원_관리_prd_v2.md
**PRD 참조**: 원본 PRD의 'Section 3 — US-4' 및 'Section 6.7 — File Replace' 참조
**구현 범위**: 파일 업로드/다운로드/교체/삭제 UI 컴포넌트
**복잡도**: M
**의존성**: 2031_05, 2031_07

---

## 구현 목표

기술지원 상세 Dialog 내에서 완료 보고서 파일을 업로드, 다운로드, 교체, 삭제하는 UI 컴포넌트를 구현한다. 파일 교체 시 AlertDialog 확인을 포함한다.

---

## 구현 내용

### 파일 구조

```
src/components/features/support/
└── AttachmentUpload.tsx    # 파일 첨부 컴포넌트
```

### 구현 상세

#### 상태별 UI

| 상태 | 표시 내용 | 동작 |
|------|-----------|------|
| 첨부 없음 | 파일 선택 영역 (드래그 또는 클릭) | 업로드 |
| 첨부 있음 | 파일명 + 다운로드/삭제 버튼 | 다운로드, 교체, 삭제 |
| 업로드 중 | 진행률 표시 | 취소 불가 |
| 에러 | 에러 메시지 | 재시도 |

#### 파일 교체 흐름

1. 기존 파일이 있는 상태에서 새 파일 선택
2. AlertDialog: "기존 파일이 교체됩니다. 계속하시겠습니까?"
3. 확인 → 업로드 API 호출 (서버에서 기존 파일 삭제 + 새 파일 저장)
4. 취소 → 원복

#### 클라이언트 검증

- 파일 크기 ≤ 10MB (초과 시 즉시 에러 표시)
- 확장자: pdf, docx, xlsx, jpg, jpeg, png (불가 시 즉시 에러 표시)
- 서버 검증은 별도로 API에서 수행

#### 다운로드

- `window.open('/api/support/{id}/attachment')` 또는 fetch + blob download
- 새 탭에서 다운로드 트리거

### 핵심 인터페이스

```typescript
interface AttachmentUploadProps {
  supportId: number;
  attachmentName: string | null;  // 현재 첨부 파일명
  canEdit: boolean;               // 편집 권한
}

export function AttachmentUpload({ supportId, attachmentName, canEdit }: AttachmentUploadProps) {
  const { mutateAsync: upload, isPending: isUploading } = useUploadAttachmentMutation();
  const { mutateAsync: deleteAttachment } = useDeleteAttachmentMutation();

  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [replaceOpen, setReplaceOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 허용 확장자
  const ALLOWED_EXTENSIONS = ['pdf', 'docx', 'xlsx', 'jpg', 'jpeg', 'png'];
  const MAX_SIZE = 10 * 1024 * 1024;

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_SIZE) return '파일 크기는 10MB를 초과할 수 없습니다.';
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
      return `허용된 파일 형식: ${ALLOWED_EXTENSIONS.join(', ')}`;
    }
    return null;
  };

  const handleFileSelect = (file: File) => {
    const err = validateFile(file);
    if (err) { setError(err); return; }
    setError(null);

    if (attachmentName) {
      // 기존 파일 있음 → 교체 확인
      setPendingFile(file);
      setReplaceOpen(true);
    } else {
      // 새 파일 업로드
      doUpload(file);
    }
  };

  const doUpload = async (file: File) => {
    try {
      await upload({ id: supportId, file });
      toast.success('파일이 업로드되었습니다.');
    } catch (e: any) {
      toast.error(e.message || '업로드에 실패했습니다.');
    }
  };

  const handleReplace = async () => {
    if (pendingFile) {
      await doUpload(pendingFile);
      setPendingFile(null);
    }
    setReplaceOpen(false);
  };

  const handleDelete = async () => {
    try {
      await deleteAttachment(supportId);
      toast.success('파일이 삭제되었습니다.');
    } catch {
      toast.error('삭제에 실패했습니다.');
    }
    setDeleteOpen(false);
  };

  const handleDownload = () => {
    window.open(`/api/support/${supportId}/attachment`, '_blank');
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">첨부파일</label>

      {attachmentName ? (
        // 파일 있음: 파일명 + 다운로드/교체/삭제
        <div className="flex items-center gap-2 p-3 border rounded-md">
          <FileIcon />
          <span className="flex-1 text-sm truncate">{attachmentName}</span>
          <Button size="sm" variant="outline" onClick={handleDownload}>다운로드</Button>
          {canEdit && (
            <>
              <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()}>교체</Button>
              <Button size="sm" variant="destructive" onClick={() => setDeleteOpen(true)}>삭제</Button>
            </>
          )}
        </div>
      ) : canEdit ? (
        // 파일 없음 + 편집 가능: 업로드 영역
        <div
          className="border-2 border-dashed rounded-md p-6 text-center cursor-pointer hover:bg-muted/50"
          onClick={() => fileInputRef.current?.click()}
        >
          <UploadIcon />
          <p className="text-sm text-muted-foreground">클릭하여 파일 선택</p>
          <p className="text-xs text-muted-foreground">PDF, DOCX, XLSX, JPG, PNG (최대 10MB)</p>
        </div>
      ) : (
        // 파일 없음 + 읽기 전용
        <p className="text-sm text-muted-foreground">첨부파일 없음</p>
      )}

      {isUploading && <Progress />}
      {error && <p className="text-sm text-destructive">{error}</p>}

      <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.docx,.xlsx,.jpg,.jpeg,.png" onChange={(e) => { /* ... */ }} />

      {/* 교체 확인 AlertDialog */}
      <AlertDialog open={replaceOpen} onOpenChange={setReplaceOpen}>
        <AlertDialogContent>
          <AlertDialogTitle>파일 교체</AlertDialogTitle>
          <AlertDialogDescription>기존 파일이 교체됩니다. 계속하시겠습니까?</AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleReplace}>교체</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 삭제 확인 AlertDialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        {/* ... */}
      </AlertDialog>
    </div>
  );
}
```

---

## Acceptance Criteria

- [ ] 파일 없음: 업로드 영역 표시 (canEdit 시)
- [ ] 파일 있음: 파일명 + 다운로드/교체/삭제 버튼
- [ ] 파일 없음 + 읽기 전용: "첨부파일 없음" 텍스트
- [ ] 클라이언트 검증: 크기 초과 에러 표시
- [ ] 클라이언트 검증: 허용되지 않은 확장자 에러 표시
- [ ] 업로드 성공: toast + 화면 갱신
- [ ] 교체 시: AlertDialog 확인 → 업로드
- [ ] 교체 취소: 파일 선택 취소
- [ ] 삭제 시: AlertDialog 확인 → 삭제
- [ ] 다운로드: 새 탭에서 파일 다운로드
- [ ] 업로드 중: 로딩 상태 표시
- [ ] canEdit=false: 업로드/교체/삭제 버튼 숨김

---

## 테스트 전략

### 단위 테스트

**테스트 파일**: `src/__tests__/components/features/support/AttachmentUpload.test.tsx`

```typescript
describe('AttachmentUpload', () => {
  it('should render upload area when no file and canEdit');
  it('should render "no file" text when no file and readOnly');
  it('should render file info when attachment exists');
  it('should show download button for existing file');
  it('should show replace/delete buttons when canEdit');
  it('should hide replace/delete when not canEdit');
  it('should show error for oversized file');
  it('should show error for invalid extension');
  it('should show replace AlertDialog when file exists');
  it('should upload on replace confirm');
  it('should cancel replace on AlertDialog cancel');
  it('should show delete AlertDialog');
  it('should call deleteAttachment on confirm');
});
```

---

## 완료 체크리스트

- [ ] TypeScript 빌드 성공
- [ ] ESLint/Prettier 통과
- [ ] 업로드/다운로드/교체/삭제 동작
- [ ] AlertDialog 확인 흐름
- [ ] 클라이언트 검증 동작
- [ ] 권한 기반 UI 표시

---

**다음 문서**: 2031_14_단위_테스트.md
