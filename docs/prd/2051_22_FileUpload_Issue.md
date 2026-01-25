<!-- Generated: 2026-01-25 21:37:00 KST -->

# 첨부파일 컴포넌트

**문서 번호**: 2051_22_Issue
**원본 PRD**: 2051_장애_현황_관리_prd_v2.md (Section 6.2, US-4)
**PRD 참조**: 파일 업로드, 드래그앤드롭, 이중 검증
**구현 범위**: 드래그앤드롭, 파일 선택, 이중 검증, 목록
**복잡도**: L
**의존성**: 2051_13_Hooks

---

## 구현 목표

파일을 업로드하고, 프론트엔드와 서버에서 모두 검증한다.

---

## 구현 내용

### IssueFileUpload.tsx (Client Component)

**기능**
1. 파일 입력 필드 (클릭 선택)
2. 드래그앤드롭 영역
3. 프론트엔드 실시간 검증
   - MIME type 확인 (pdf, xlsx, docx, png, jpg, ...)
   - 파일 크기 확인 (max 10MB)
   - 개수 확인 (max 5개)
4. 검증 실패 시 즉시 피드백
5. 성공 시 파일 목록 표시
6. 파일 다운로드, 삭제 버튼

**허용 MIME types**
```typescript
const ALLOWED_MIMES = [
  'application/pdf',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'image/gif',
];
```

**에러 메시지**
- "파일은 10MB 이하여야 합니다"
- "지원하지 않는 파일 형식입니다"
- "최대 5개까지 업로드할 수 있습니다"

---

## Acceptance Criteria

- [ ] IssueFileUpload.tsx 생성 완료
- [ ] 드래그앤드롭 구현
- [ ] 파일 선택 구현
- [ ] 프론트 검증 구현
- [ ] 파일 목록 표시
- [ ] 다운로드/삭제 기능

---

**다음 문서**: 2051_23_HistoryLog_Issue.md
