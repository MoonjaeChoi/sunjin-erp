<!-- Generated: 2026-01-25 21:39:00 KST -->

# 상태 롤백 버튼

**문서 번호**: 2051_24_Issue
**원본 PRD**: 2051_장애_현황_관리_prd_v2.md (Section 6.2, US-11)
**PRD 참조**: 상태 롤백 버튼
**구현 범위**: ADMIN만 표시, 확인 다이얼로그
**복잡도**: S
**의존성**: 2051_13_Hooks

---

## 구현 목표

ADMIN 사용자만 상태 롤백 버튼을 보고 사용할 수 있다.

---

## 구현 내용

### IssueRollbackButton.tsx (Client Component)

**표시 조건**
- status === "COMPLETED"
- session.user.role === "ADMIN"

**동작**
1. 버튼 클릭 시 확인 다이얼로그 표시
2. "이 Issue를 진행중 상태로 되돌리시겠습니까?"
3. 확인 시 useRollbackIssueMutation 호출
4. 성공 시 토스트 알림 + 데이터 새로고침
5. 실패 시 에러 메시지 표시

---

## Acceptance Criteria

- [ ] IssueRollbackButton.tsx 생성 완료
- [ ] ADMIN만 표시
- [ ] COMPLETED 상태만 활성화
- [ ] 확인 다이얼로그 표시
- [ ] 롤백 기능 동작

---

**다음 문서**: 2051_25_StatusBadge_Issue.md
