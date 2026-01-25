<!-- Generated: 2026-01-25 21:23:00 KST -->

# 상태 롤백 API

**문서 번호**: 2051_08_Issue
**원본 PRD**: 2051_장애_현황_관리_prd_v2.md (Section 5.2, US-11)
**PRD 참조**: PUT /api/issues/[id]/rollback
**구현 범위**: ADMIN만, COMPLETED→IN_PROGRESS, 이력 기록
**복잡도**: M
**의존성**: 2051_01, 2051_03

---

## 구현 목표

ADMIN만이 COMPLETED 상태를 IN_PROGRESS로 되돌릴 수 있다.

---

## 구현 내용

### PUT /api/issues/[id]/rollback

**로직**
1. 인증 확인
2. ADMIN 권한만 허용
3. Issue 조회
4. status가 "COMPLETED"인지 확인
5. status = "IN_PROGRESS", completed_at = NULL
6. IssueHistory 기록 (change_type: "STATUS_ROLLBACK")

**응답**
```json
{
  "id": 1,
  "status": "IN_PROGRESS",
  "completed_at": null
}
```

---

## Acceptance Criteria

- [ ] PUT /api/issues/[id]/rollback 구현 완료
- [ ] ADMIN 권한만 허용
- [ ] COMPLETED 상태만 가능
- [ ] STATUS_ROLLBACK 이력 기록

---

**다음 문서**: 2051_09_FileUpload_API_Issue.md
