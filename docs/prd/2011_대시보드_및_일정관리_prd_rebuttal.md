<!-- Generated: 2026-01-24 22:35:00 KST -->

# Rebuttal: 2011_대시보드_및_일정관리_prd_critical_review.md

**문서번호:** 2011
**리뷰 응답 일시:** 2026-01-24
**원본 PRD:** docs/prd/2011_대시보드_및_일정관리_prd.md
**Critical Review:** docs/prd/2011_대시보드_및_일정관리_prd_critical_review.md

---

## Rebuttal Responses

### DP-1: 캘린더 라이브러리 선택 미결정
**Reviewer Priority:** HIGH
**Response:** AGREE (수용)

리뷰어의 분석에 동의한다. 월간 뷰는 CSS Grid 자체 구현이 적합하고, 주간/일간 뷰는 초기 버전에서 리스트 형태로 단순화하는 접근이 합리적이다. FullCalendar는 번들 사이즈 대비 실제 사용하는 기능이 제한적이며, shadcn/ui와의 스타일 통합도 어려움이 있다. 다만 주간 뷰의 시간대별 배치는 향후 필요 시 CSS Grid로 확장 가능하므로, 아키텍처 확장성은 유지된다.

**결론:** 월간 뷰는 CSS Grid 자체 구현, 주간/일간 뷰는 리스트 형태로 단순화 (Phase 2 초기)

---

### DP-2: Phase 1 미구현 의존성으로 인한 개발 블로킹
**Reviewer Priority:** HIGH
**Response:** PARTIALLY AGREE (부분 수용)

의존성 존재는 사실이나, "블로킹"이라는 표현은 과도하다. 다음과 같은 이유로 병렬 개발이 가능하다:
1. **UI 개발**: Mock 데이터로 모든 프론트엔드 컴포넌트 개발 가능
2. **API 레이어**: TypeORM Entity를 먼저 정의하고, 실제 DB 연결은 Phase 1 완료 후 활성화
3. **TechSupport 통합**: 이미 Out-of-Scope에 "기술지원 건의 CRUD"가 포함되어 있으며, 조회만 필요

다만 리뷰어의 "인터페이스 계약 정의" 제안은 타당하다. Employee 엔티티의 최소 필드(id, name, department_id, role)와 session 객체 구조를 사전 합의해야 한다.

**결론:** Mock 전략 + 인터페이스 계약 정의를 PRD에 추가

---

### DP-3: 시간 데이터 타입 설계 부적절
**Reviewer Priority:** HIGH
**Response:** PARTIALLY AGREE (부분 수용)

VARCHAR2(5)의 한계는 인정하나, TIMESTAMP로 변경 시 다음 고려사항이 있다:
1. `task_date`와 `start_datetime`이 별도 컬럼이면 날짜만으로 조회할 때 DATE 추출이 필요
2. 시작/종료 시간이 선택 입력이므로, TIMESTAMP로 통합하면 날짜만 있는 업무와 시간 지정 업무의 구분이 모호해질 수 있음
3. 사용자 입력 형태가 "HH:MM"이므로 UI/API 변환 로직 필요

그러나 DB 레벨에서 시간 연산이 불가능한 것은 장기적으로 불리하다. 절충안으로:
- `task_date` (DATE): 업무 날짜 — 캘린더 뷰 조회의 primary key 역할 유지
- `start_time` / `end_time`: NUMBER (분 단위, 0~1439) — 정수 비교로 범위 검색 가능

**결론:** VARCHAR2 → NUMBER(분 단위) 변경 권장. 또는 현행 VARCHAR2 유지하되 CHECK 제약조건 추가

---

### DP-4: 팀 캘린더 쿼리 성능 미고려
**Reviewer Priority:** HIGH
**Response:** AGREE (수용)

리뷰어의 분석이 정확하다. 특히 인덱스 순서 문제(employee_id 기반 필터인데 date가 선행)는 실행 계획에 직접 영향을 미친다.

제안된 대로:
1. `IDX_TASK_EMPLOYEE_DATE` (employee_id, task_date, deleted_at) 인덱스 추가
2. 월간 요약 API 분리 (`/api/dashboard/team/summary`)
3. 상세 데이터는 날짜 클릭 시 lazy loading

다만 현재 대상 사용자 규모(추정 50명 이하)에서는 즉시 성능 이슈가 발생하지 않을 수 있으므로, 인덱스 추가를 우선하고 API 분리는 성능 측정 후 결정해도 된다.

**결론:** 인덱스 추가 수용, API 분리는 성능 측정 후 결정

---

### DP-5: Optimistic Update 실패 시 롤백 전략 부재
**Reviewer Priority:** HIGH
**Response:** AGREE (수용)

Optimistic Update를 명시했으면 실패 롤백도 정의해야 한다. TanStack Query의 표준 패턴을 적용한다:

```typescript
useMutation({
  onMutate: async (newTask) => {
    await queryClient.cancelQueries(['tasks']);
    const previous = queryClient.getQueryData(['tasks']);
    queryClient.setQueryData(['tasks'], (old) => [...old, newTask]);
    return { previous };
  },
  onError: (err, newTask, context) => {
    queryClient.setQueryData(['tasks'], context.previous);
    toast.error('업무 등록에 실패했습니다.');
  },
  onSettled: () => {
    queryClient.invalidateQueries(['tasks']);
  },
});
```

연속 클릭 방지는 mutation의 `isPending` 상태로 버튼 비활성화하면 충분하다.

**결론:** 롤백 패턴 + Toast 에러 알림 + isPending 기반 버튼 비활성화를 PRD에 추가

---

### DP-6: TechSupport 통합 조회의 조인 전략 미정의
**Reviewer Priority:** MEDIUM
**Response:** AGREE (수용)

두 개의 병렬 쿼리로 구성하는 것이 적절하다. UNION은 컬럼 구조가 다르므로 부적합하고, 별도 쿼리 결과를 응답에서 구분하는 것이 클라이언트 처리에도 유리하다.

```json
{
  "date": "2026-01-24",
  "tasks": [...],
  "techSupports": []  // Phase 3 전까지 빈 배열
}
```

Phase 3 구현 전까지 `techSupports`를 빈 배열로 반환하는 접근도 동의한다.

**결론:** 병렬 쿼리 + 응답 구분, Phase 3 전까지 빈 배열 반환

---

### DP-7: URL Query Param 기반 상태 관리와 Zustand Store 중복
**Reviewer Priority:** MEDIUM
**Response:** AGREE (수용)

이는 CLAUDE.md의 State Management Philosophy를 정확히 적용한 지적이다. URL query param이 "뷰 모드"와 "선택 날짜"의 source of truth가 되어야 하며, Zustand에서 이를 중복 관리하면 안 된다.

다만 `useSearchParams()`는 Client Component에서만 사용 가능하므로, 구현 시 캘린더 컴포넌트 트리에서 적절한 위치에서 호출해야 한다. `nuqs`는 추가 의존성이므로, Next.js 내장 `useSearchParams()` + `useRouter()`로 충분하다.

Zustand `useCalendarStore`는 "선택된 직원 필터" (팀 캘린더용) 등 URL에 적합하지 않은 일시적 UI 상태만 관리하도록 축소한다.

**결론:** URL param = source of truth, Zustand에서 뷰 모드/날짜 제거, 일시적 UI 상태만 유지

---

### DP-8: 업무 시간 겹침 검증 정책 미결정
**Reviewer Priority:** MEDIUM
**Response:** AGREE (수용)

리뷰어의 제안(경고 표시 + 등록 허용)이 실용적이다. 실제 업무 환경에서 동시에 진행하는 업무(예: 회의 중 문서작성)가 있을 수 있으므로 강제 차단은 부적절하다.

- 시간 겹침 발생 시 폼에 경고 메시지 표시 (non-blocking)
- 시간 미지정 업무는 검증 제외
- 주간/일간 뷰에서 겹침 시 나란히 표시 (CSS Grid column)

**결론:** 겹침 허용 + 경고 표시 (non-blocking validation)

---

### DP-9: 모바일 대응 전략의 구체성 부족
**Reviewer Priority:** MEDIUM
**Response:** PARTIALLY AGREE (부분 수용)

모바일 UX 구체화는 필요하나, 본 ERP 시스템의 주 사용 환경은 데스크톱이다. 모바일은 조회 위주로 최소 대응하는 것이 현실적이다.

- Dialog → Sheet (하단에서 올라오는 UI, shadcn/ui Sheet 컴포넌트)로 변경
- 스와이프 제스처는 구현 복잡도 대비 효용이 낮으므로 제외
- 팀 캘린더 모바일: 초기 버전에서는 데스크톱 전용으로 제한 (768px 미만 시 접근 불가 안내)

**결론:** 모바일은 조회 중심 최소 대응, Dialog→Sheet 변경, 팀 캘린더는 데스크톱 전용

---

### DP-10: completed_at 자동 기록의 트리거 메커니즘 미정의
**Reviewer Priority:** LOW
**Response:** AGREE (수용)

API 레벨에서 처리하는 것이 유일한 정답이다. DB 트리거는 Oracle XE에서 관리 복잡도를 높이고, 클라이언트에서 보내면 시간 조작 가능.

```typescript
// PUT /api/tasks/[id] handler
if (updateDto.status === 'DONE' && existingTask.status !== 'DONE') {
  updateDto.completed_at = new Date();
}
if (updateDto.status !== 'DONE') {
  updateDto.completed_at = null;
}
```

**결론:** API 레벨 자동 설정, 상태 역행 시 NULL 처리

---

### DP-11: DELETE API 호출 전 의존성 확인 미정의
**Reviewer Priority:** LOW
**Response:** PARTIALLY AGREE (부분 수용)

현재 Task에 하위 엔티티가 없으므로 의존성 확인은 불필요하다. 다만 DONE 상태 업무 삭제 시 추가 확인은 합리적이다.

- Soft delete이므로 복구 가능 → 경고 수준으로 충분
- "완료된 업무입니다. 정말 삭제하시겠습니까?" 추가 확인 메시지
- 향후 첨부파일/코멘트 추가 시 의존성 확인 로직 추가

**결론:** DONE 상태 삭제 시 추가 확인만 적용, 의존성 확인은 향후 확장 시

---

## Rebuttal Summary

| ID | Priority | Reviewer 제안 | 응답 | 결론 |
|----|----------|--------------|------|------|
| DP-1 | HIGH | CSS Grid + 리스트 단순화 | AGREE | 월간 CSS Grid, 주간/일간 리스트 |
| DP-2 | HIGH | Mock + Interface Contract | PARTIAL | Mock 전략 추가, 블로킹은 아님 |
| DP-3 | HIGH | TIMESTAMP 통합 | PARTIAL | NUMBER(분 단위) 또는 VARCHAR2+CHECK |
| DP-4 | HIGH | 인덱스 추가 + API 분리 | AGREE | 인덱스 추가, API 분리는 성능 측정 후 |
| DP-5 | HIGH | 롤백 패턴 명시 | AGREE | TanStack Query 롤백 + Toast + 버튼 비활성화 |
| DP-6 | MEDIUM | 병렬 쿼리 + 빈 배열 | AGREE | 수용 |
| DP-7 | MEDIUM | URL = source of truth | AGREE | Zustand에서 뷰/날짜 제거 |
| DP-8 | MEDIUM | 겹침 허용 + 경고 | AGREE | non-blocking validation |
| DP-9 | MEDIUM | 모바일 구체화 | PARTIAL | 최소 대응, 팀 캘린더 데스크톱 전용 |
| DP-10 | LOW | API 레벨 자동 설정 | AGREE | 수용 |
| DP-11 | LOW | 의존성 확인 패턴 | PARTIAL | DONE 삭제 시 추가 확인만 |
