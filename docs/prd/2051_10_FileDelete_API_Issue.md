<!-- Generated: 2026-01-25 21:25:00 KST -->

# 파일 삭제 API

**문서 번호**: 2051_10_Issue
**원본 PRD**: 2051_장애_현황_관리_prd_v2.md (Section 5.6, US-4)
**PRD 참조**: DELETE /api/issues/[id]/attachments/[attachmentId]
**구현 범위**: 소프트 삭제, 이력 기록
**복잡도**: S
**의존성**: 2051_02, 2051_03

---

## 구현 목표

첨부파일을 소프트 삭제하고, ATTACHMENT_DELETED 이력을 기록한다.

---

## 구현 내용

### DELETE /api/issues/[id]/attachments/[attachmentId]

**로직**
1. IssueAttachment 조회
2. 권한 검증 (ADMIN 또는 업로드자)
3. deleted_at 설정 (소프트 삭제)
4. IssueHistory 기록 (change_type: "ATTACHMENT_DELETED")

**응답**
- 성공: 204 No Content

---

## Acceptance Criteria

- [ ] DELETE /api/issues/[id]/attachments/[attachmentId] 구현
- [ ] 권한 검증
- [ ] 소프트 삭제 동작
- [ ] ATTACHMENT_DELETED 이력 기록

---

**다음 문서**: 2051_11_Summary_API_Issue.md
