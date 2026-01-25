<!-- Generated: 2026-01-25 21:26:00 KST -->

# 요약 배지 API

**문서 번호**: 2051_11_Issue
**원본 PRD**: 2051_장애_현황_관리_prd_v2.md (Section 5.2, US-6)
**PRD 참조**: GET /api/issues/summary
**구현 범위**: 필터 적용, RBAC 기반, AND 조합
**복잡도**: M
**의존성**: 2051_01

---

## 구현 목표

현재 필터가 적용된 상태에서 상태별(INTAKE, IN_PROGRESS, COMPLETED) 카운트를 반환한다.

---

## 구현 내용

### GET /api/issues/summary

**쿼리 파라미터**
- customer_id, status, severity, assignee_id, keyword, date_from, date_to (목록 API와 동일)

**응답**
```json
{
  "total": 12,
  "intake": 5,
  "in_progress": 4,
  "completed": 3
}
```

**로직**
1. RBAC 기반 WHERE 절 생성
2. 필터 조건 적용 (AND 조합)
3. status별 COUNT 쿼리 실행
4. 결과 반환

---

## Acceptance Criteria

- [ ] GET /api/issues/summary 구현 완료
- [ ] RBAC 필터링 정확
- [ ] 필터 AND 조합 정확
- [ ] 카운트 계산 정확

---

**다음 문서**: 2051_12_Types_Issue.md
