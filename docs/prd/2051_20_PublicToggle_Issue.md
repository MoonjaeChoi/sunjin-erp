<!-- Generated: 2026-01-25 21:35:00 KST -->

# 공개 여부 토글

**문서 번호**: 2051_20_Issue
**원본 PRD**: 2051_장애_현황_관리_prd_v2.md (Section 6.2, US-7)
**PRD 참조**: is_public 토글
**구현 범위**: 체크박스, MANAGER/ADMIN만 수정, 이력 기록
**복잡도**: S
**의존성**: 2051_13_Hooks

---

## 구현 목표

is_public 토글을 구현하고, 변경 시 이력을 기록한다.

---

## 구현 내용

### IssuePublicToggle.tsx (Client Component)

**UI**
```
[ ] 같은 부서원 조회 가능
```

**기능**
1. MANAGER/ADMIN만 수정 가능
2. USER는 읽기만 가능 (disabled)
3. 토글 변경 시 useUpdateIssueMutation 호출
4. IS_PUBLIC_CHANGE 이력 기록 (old: 0/1, new: 0/1)
5. 성공 시 토스트 알림

---

## Acceptance Criteria

- [ ] IssuePublicToggle.tsx 생성 완료
- [ ] RBAC 기반 수정 권한
- [ ] 토글 상태 변경
- [ ] IS_PUBLIC_CHANGE 이력 기록
- [ ] 토스트 알림 표시

---

**다음 문서**: 2051_21_TreatmentInput_Issue.md
