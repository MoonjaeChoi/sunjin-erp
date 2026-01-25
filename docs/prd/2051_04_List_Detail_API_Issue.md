<!-- Generated: 2026-01-25 21:19:00 KST -->

# 목록/상세 조회 API

**문서 번호**: 2051_04_Issue
**원본 PRD**: 2051_장애_현황_관리_prd_v2.md (Section 5.2, US-5, US-7)
**PRD 참조**: GET /api/issues, GET /api/issues/[id]
**구현 범위**: 권한별 필터링, AND 조합, is_public 기반 RLS
**복잡도**: L
**의존성**: 2051_01, 2051_02, 2051_03

---

## 구현 목표

권한별(RBAC) 행 필터링과 is_public 기반 공개 여부 제어가 적용된 목록/상세 조회 API를 구현한다.

---

## 구현 내용

### Route Handlers

**GET /api/issues**
- RBAC 기반 WHERE 절 동적 생성
  - ADMIN: 모든 행
  - MANAGER: 같은 부서(assigned_to_id의 부서) Issue만
  - USER: 자신 생성 + 자신 할당 + 부서 공개(is_public=1)
- 필터: customer_id, status, severity, assignee_id, keyword, date_from, date_to (AND 조합)
- 정렬: created_at(기본), status, severity, assigned_to_id
- 페이지네이션: page(기본 1), page_size(기본 20, 최대 100)

**GET /api/issues/[id]**
- 상세 조회 + 권한 검증
- 첨부파일 목록 포함
- 변경 이력 포함

### 핵심 코드 구조

```typescript
export async function GET(req: NextRequest) {
  // 1. 세션 확인
  // 2. 쿼리 파라미터 파싱
  // 3. RBAC 기반 WHERE 절 생성
  // 4. is_public 필터링 추가
  // 5. QueryBuilder로 데이터 조회
  // 6. 페이지네이션 적용
  // 7. 응답 반환
}
```

---

## Acceptance Criteria

- [ ] GET /api/issues 구현 완료
- [ ] GET /api/issues/[id] 구현 완료
- [ ] ADMIN 권한: 모든 데이터 조회
- [ ] MANAGER 권한: 같은 부서 데이터만
- [ ] USER 권한: 제한된 데이터만
- [ ] is_public 필터링 정확
- [ ] AND 필터 조합 정확
- [ ] 페이지네이션 동작
- [ ] API 응답 시간 p95 < 200ms

---

## 테스트 전략

- [ ] 권한별 데이터 범위 검증
- [ ] is_public 필터링 테스트
- [ ] 필터 조합 테스트
- [ ] 페이지네이션 테스트
- [ ] 정렬 옵션 테스트

---

**다음 문서**: 2051_05_Create_API_Issue.md
