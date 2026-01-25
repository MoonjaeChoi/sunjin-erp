<!-- Generated: 2026-01-25 21:24:00 KST -->

# 파일 업로드 API

**문서 번호**: 2051_09_Issue
**원본 PRD**: 2051_장애_현황_관리_prd_v2.md (Section 5.6, US-4)
**PRD 참조**: POST /api/issues/[id]/attachments
**구현 범위**: 이중 검증(MIME, 크기, 개수), multipart 처리
**복잡도**: L
**의존성**: 2051_01, 2051_02, 2051_03

---

## 구현 목표

첨부파일을 업로드하고, 프론트엔드와 서버에서 모두 검증한다.

---

## 구현 내용

### POST /api/issues/[id]/attachments

**서버 검증**
1. 파일당 최대 10MB
2. 장애당 최대 5개 파일
3. MIME type 검증 (application/pdf, application/vnd.ms-excel, ...)
4. 확장자 화이트리스트 (.pdf, .xlsx, .docx, .png, .jpg, ...)

**저장 로직**
1. 파일명 난독화: `{issueId}_{timestamp}_{UUID}.{extension}`
2. `UPLOAD_DIR/issues/{issueId}/` 디렉토리에 저장
3. IssueAttachment 레코드 생성
4. IssueHistory 기록 (ATTACHMENT_UPLOADED)

**응답**
```json
{
  "id": 1,
  "file_name": "완료_리포트.pdf",
  "file_size": 512000,
  "created_at": "2026-01-25T21:24:00Z"
}
```

---

## Acceptance Criteria

- [ ] POST /api/issues/[id]/attachments 구현 완료
- [ ] MIME type 검증
- [ ] 파일 크기 검증 (10MB)
- [ ] 개수 제한 검증 (5개)
- [ ] 파일 저장 경로 생성
- [ ] IssueAttachment 레코드 생성
- [ ] ATTACHMENT_UPLOADED 이력 기록

---

**다음 문서**: 2051_10_FileDelete_API_Issue.md
