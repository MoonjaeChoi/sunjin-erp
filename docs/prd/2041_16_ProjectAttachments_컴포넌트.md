<!-- Generated: 2026-01-25 KST -->

# ProjectAttachments 컴포넌트

**문서 번호**: 2041_16
**원본 PRD**: 2041_프로젝트_관리_prd_v2.md
**구현 범위**: 프로젝트 첨부파일 관리 UI (복수 파일 업로드/다운로드/삭제, 카테고리 분류)
**복잡도**: M
**의존성**: 2041_15

---

## 구현 목표

프로젝트 상세 Dialog 내에서 복수 파일을 카테고리별로 관리하는 UI 컴포넌트를 구현한다. 파일 업로드(카테고리 선택 필수), 다운로드, 삭제 기능을 포함한다.

---

## 구현 내용

### 파일 구조

```
src/components/features/projects/
└── ProjectAttachments.tsx    # 복수 파일 첨부 컴포넌트
```

### 구현 상세

#### 카테고리 정의

| Category Key | 한글명 | Badge 색상 |
|-------------|--------|-----------|
| CONTRACT | 계약서 | `bg-purple-100 text-purple-800` |
| PROPOSAL | 제안서 | `bg-blue-100 text-blue-800` |
| QUOTATION | 견적서 | `bg-amber-100 text-amber-800` |
| REPORT | 보고서 | `bg-green-100 text-green-800` |
| OTHER | 기타 | `bg-gray-100 text-gray-800` |

#### UI 구조

```
┌──────────────────────────────────────────────┐
│ 첨부파일 (N)                       [+ 추가]  │
├──────────────────────────────────────────────┤
│ [FileIcon] [계약서] contract_2026.pdf [⬇][🗑] │
│ [FileIcon] [제안서] proposal_v2.docx  [⬇][🗑] │
│ [FileIcon] [기타]   참고자료.xlsx     [⬇][🗑] │
└──────────────────────────────────────────────┘
```

#### 상태별 UI

| 상태 | 표시 내용 |
|------|-----------|
| 파일 있음 | 파일 목록 (아이콘 + 카테고리 Badge + 파일명 + 다운로드/삭제 버튼) |
| 파일 없음 | "첨부파일 없음" 텍스트 |
| 업로드 영역 열림 | 파일 선택 Input + 카테고리 Select + 업로드 버튼 |
| 업로드 중 | 로딩 표시 |

#### 업로드 흐름

1. [+ 추가] 버튼 클릭 → 업로드 영역 표시
2. 카테고리 Select에서 카테고리 선택 (필수)
3. 파일 선택 (Input[type=file])
4. 클라이언트 검증 통과 → 업로드 버튼 활성화
5. 업로드 버튼 클릭 → `useUploadProjectAttachmentMutation` 호출
6. 성공: `toast.success('파일이 업로드되었습니다.')` + 업로드 영역 닫기
7. 실패: `toast.error`

#### 클라이언트 검증

- **파일 크기**: 10MB 이하 (초과 시 즉시 에러 표시)
- **확장자 whitelist**: pdf, docx, xlsx, jpg, jpeg, png
- **카테고리 필수**: 미선택 시 "카테고리를 선택해주세요." 에러
- accept 속성: `.pdf,.docx,.xlsx,.jpg,.jpeg,.png`

#### 다운로드

- `window.open(`/api/projects/${projectId}/attachments/${attachmentId}`, '_blank')`
- 새 탭에서 다운로드 트리거

#### 삭제

- 삭제 버튼 클릭 → AlertDialog 확인 ("파일을 삭제하시겠습니까?")
- 확인 → `useDeleteProjectAttachmentMutation` 호출
- 성공: `toast.success('파일이 삭제되었습니다.')`
- 실패: `toast.error`

#### 파일 아이콘

- 확장자별 아이콘 표시:
  - pdf: `FileText` (빨강)
  - docx: `FileText` (파랑)
  - xlsx: `FileSpreadsheet` (초록)
  - jpg/jpeg/png: `Image`
  - 기타: `File`

### 핵심 인터페이스

```typescript
interface ProjectAttachmentsProps {
  projectId: number;
  attachments: ProjectAttachment[];
  canEdit: boolean;
}

export function ProjectAttachments({ projectId, attachments, canEdit }: ProjectAttachmentsProps) {
  const { mutateAsync: uploadAttachment, isPending: isUploading } = useUploadProjectAttachmentMutation();
  const { mutateAsync: deleteAttachment } = useDeleteProjectAttachmentMutation();

  const [showUpload, setShowUpload] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<AttachmentCategory | ''>('');
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 허용 확장자 / 크기
  const ALLOWED_EXTENSIONS = ['pdf', 'docx', 'xlsx', 'jpg', 'jpeg', 'png'];
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB

  // 파일 검증
  const validateFile = (file: File): string | null => {
    if (file.size > MAX_SIZE) return '파일 크기는 10MB를 초과할 수 없습니다.';
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
      return `허용된 파일 형식: ${ALLOWED_EXTENSIONS.join(', ')}`;
    }
    return null;
  };

  // 파일 선택
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const err = validateFile(file);
    if (err) {
      setError(err);
      setSelectedFile(null);
      return;
    }
    setError(null);
    setSelectedFile(file);
  };

  // 업로드
  const handleUpload = async () => {
    if (!selectedFile) return;
    if (!selectedCategory) {
      setError('카테고리를 선택해주세요.');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('category', selectedCategory);

    try {
      await uploadAttachment({ projectId, formData });
      toast.success('파일이 업로드되었습니다.');
      resetUploadForm();
    } catch (e: any) {
      toast.error(e.message || '업로드에 실패했습니다.');
    }
  };

  // 다운로드
  const handleDownload = (attachmentId: number) => {
    window.open(`/api/projects/${projectId}/attachments/${attachmentId}`, '_blank');
  };

  // 삭제
  const handleDelete = async () => {
    if (deleteTarget === null) return;
    try {
      await deleteAttachment({ projectId, attachmentId: deleteTarget });
      toast.success('파일이 삭제되었습니다.');
    } catch {
      toast.error('삭제에 실패했습니다.');
    }
    setDeleteTarget(null);
  };

  // 업로드 폼 초기화
  const resetUploadForm = () => {
    setShowUpload(false);
    setSelectedFile(null);
    setSelectedCategory('');
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // 카테고리 Badge
  const getCategoryBadge = (category: AttachmentCategory) => {
    const map: Record<AttachmentCategory, { label: string; className: string }> = {
      CONTRACT: { label: '계약서', className: 'bg-purple-100 text-purple-800' },
      PROPOSAL: { label: '제안서', className: 'bg-blue-100 text-blue-800' },
      QUOTATION: { label: '견적서', className: 'bg-amber-100 text-amber-800' },
      REPORT: { label: '보고서', className: 'bg-green-100 text-green-800' },
      OTHER: { label: '기타', className: 'bg-gray-100 text-gray-800' },
    };
    return map[category];
  };

  return (
    <div className="space-y-3">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">첨부파일 ({attachments.length})</h3>
        {canEdit && (
          <Button size="sm" variant="outline" onClick={() => setShowUpload(true)}>
            <Plus className="h-4 w-4 mr-1" /> 추가
          </Button>
        )}
      </div>

      {/* 파일 목록 */}
      {attachments.length === 0 ? (
        <p className="text-sm text-muted-foreground">첨부파일 없음</p>
      ) : (
        <div className="space-y-2">
          {attachments.map((att) => (
            <div key={att.id} className="flex items-center gap-2 p-2 border rounded-md">
              {/* 파일 아이콘 */}
              <Badge className={getCategoryBadge(att.category).className}>
                {getCategoryBadge(att.category).label}
              </Badge>
              <span className="flex-1 text-sm truncate">{att.file_name}</span>
              <Button size="sm" variant="ghost" onClick={() => handleDownload(att.id)}>
                <Download className="h-4 w-4" />
              </Button>
              {canEdit && (
                <Button size="sm" variant="ghost" onClick={() => setDeleteTarget(att.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 업로드 영역 */}
      {showUpload && (
        <div className="border rounded-md p-3 space-y-2">
          <Select value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as AttachmentCategory)}>
            {/* CONTRACT, PROPOSAL, QUOTATION, REPORT, OTHER */}
          </Select>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.xlsx,.jpg,.jpeg,.png"
            onChange={handleFileChange}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-2">
            <Button size="sm" onClick={handleUpload} disabled={!selectedFile || !selectedCategory || isUploading}>
              {isUploading ? '업로드 중...' : '업로드'}
            </Button>
            <Button size="sm" variant="outline" onClick={resetUploadForm}>취소</Button>
          </div>
        </div>
      )}

      {/* 삭제 확인 AlertDialog */}
      <AlertDialog open={deleteTarget !== null} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogTitle>파일 삭제</AlertDialogTitle>
          <AlertDialogDescription>파일을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.</AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>삭제</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
```

---

## Acceptance Criteria

- [ ] 헤더에 파일 개수 표시 ("첨부파일 (N)")
- [ ] canEdit 시 [+ 추가] 버튼 표시
- [ ] 파일 목록: 아이콘 + 카테고리 Badge + 파일명 + 다운로드/삭제 버튼
- [ ] 카테고리 Badge 5종 색상 정확 적용
- [ ] 파일 없을 때 "첨부파일 없음" 표시
- [ ] [+ 추가] 클릭 시 업로드 영역 표시
- [ ] 카테고리 미선택 시 에러 메시지
- [ ] 파일 크기 10MB 초과 시 에러 메시지
- [ ] 허용되지 않은 확장자 시 에러 메시지
- [ ] 업로드 성공: toast + 업로드 영역 닫기
- [ ] 업로드 실패: toast.error
- [ ] 업로드 중: 버튼 disabled
- [ ] 다운로드: 새 탭에서 파일 다운로드
- [ ] 삭제: AlertDialog 확인 후 삭제
- [ ] 삭제 성공: toast.success
- [ ] canEdit=false: 추가/삭제 버튼 숨김, 다운로드만 가능

---

## 테스트 전략

### 단위 테스트

**테스트 파일**: `src/__tests__/components/features/projects/ProjectAttachments.test.tsx`

```typescript
describe('ProjectAttachments', () => {
  it('should render attachment count in header');
  it('should show "+ 추가" button when canEdit is true');
  it('should hide "+ 추가" button when canEdit is false');
  it('should render "첨부파일 없음" when no attachments');
  it('should render attachment list with category badges');
  it('should show correct category badge colors');
  it('should show download button for each attachment');
  it('should show delete button only when canEdit');
  it('should open upload area on "+ 추가" click');
  it('should show error for file exceeding 10MB');
  it('should show error for invalid extension');
  it('should show error when category not selected');
  it('should call upload mutation with FormData');
  it('should show success toast on upload');
  it('should show error toast on upload failure');
  it('should disable upload button while uploading');
  it('should call window.open on download click');
  it('should show delete AlertDialog on delete click');
  it('should call delete mutation on confirm');
  it('should show success toast on delete');
  it('should close upload area on cancel');
});
```

---

**다음 문서**: 2041_17_단위_테스트.md
