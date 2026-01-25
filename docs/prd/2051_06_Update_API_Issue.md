<!-- Generated: 2026-01-25 21:21:00 KST -->

# 장애 수정 API

**문서 번호**: 2051_06_Issue
**원본 PRD**: 2051_장애_현황_관리_prd_v2.md (Section 5.2, US-2, US-3, US-4, US-8)
**PRD 참조**: PUT /api/issues/[id]
**구현 범위**: 담당자 변경(부서 제약), 상태 변경, 심각도 변경, is_public 변경
**복잡도**: L
**의존성**: 2051_01, 2051_03

---

## 구현 목표

장애 정보를 수정하고, 각 변경사항을 IssueHistory에 기록한다.

---

## 구현 내용

### PUT /api/issues/[id]

**권한별 수정 가능 필드**
| 필드 | ADMIN | MANAGER | USER |
|------|-------|---------|------|
| title | ✓ | ✓ | ✗ |
| description | ✓ | ✓ | ✗ |
| severity | ✓ | ✓ (완료 제외) | ✗ |
| status | ✓ | ✓ | ✗ |
| assigned_to_id | ✓ (전체) | ✓ (부서내만) | ✗ |
| is_public | ✓ | ✓ | ✗ |
| treatment_method | ✓ | ✓ | ✓ |
| treatment_time_minutes | ✓ | ✓ | ✓ |
| treatment_result | ✓ | ✓ | ✓ |

**특수 로직**
1. MANAGER가 담당자 변경 시: 같은 부서 직원만 할당 가능
2. IN_PROGRESS 상태에서도 담당자 변경 가능 (MANAGER도)
3. status 변경 시: 상태 전이 규칙 검증
4. severity 변경 시: COMPLETED 상태 제외
5. 변경사항마다 IssueHistory 기록 (old_value, new_value)

---

## Acceptance Criteria

- [ ] PUT /api/issues/[id] 구현 완료
- [ ] RBAC 기반 수정 권한 검증
- [ ] 부서 제약 검증 (MANAGER)
- [ ] 변경 이력 기록
- [ ] 상태 전이 규칙 검증

---

**다음 문서**: 2051_07_Delete_API_Issue.md
