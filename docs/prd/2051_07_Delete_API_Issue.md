<!-- Generated: 2026-01-25 21:22:00 KST -->

# 장애 삭제 API

**문서 번호**: 2051_07_Issue
**원본 PRD**: 2051_장애_현황_관리_prd_v2.md (Section 4.1, 5.2, US-4)
**PRD 참조**: DELETE /api/issues/[id]
**구현 범위**: ON DELETE RESTRICT 검증, 소프트 삭제
**복잡도**: M
**의존성**: 2051_01, 2051_02

---

## 구현 목표

장애를 소프트 삭제하되, 첨부파일이 있으면 삭제 불가(ON DELETE RESTRICT 정책).

---

## 구현 내용

### DELETE /api/issues/[id]

**로직**
1. 인증 확인
2. 권한 검증 (ADMIN만)
3. Issue 조회
4. IssueAttachment 개수 확인
5. 첨부파일 있으면: 409 Conflict 응답
6. 소프트 삭제 (deleted_at 설정)
7. IssueHistory 기록

**응답**
- 성공: 204 No Content 또는 200 { message: "삭제됨" }
- 첨부파일 있음: 409 { message: "첨부파일을 먼저 삭제하세요", attachment_count: 2 }
- 권한 없음: 403 Forbidden

---

## Acceptance Criteria

- [ ] DELETE /api/issues/[id] 구현 완료
- [ ] 첨부파일 확인 로직
- [ ] ON DELETE RESTRICT 정책 확인
- [ ] 소프트 삭제 동작
- [ ] ADMIN 권한 검증

---

**다음 문서**: 2051_08_Rollback_API_Issue.md
