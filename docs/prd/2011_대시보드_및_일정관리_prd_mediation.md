<!-- Generated: 2026-01-24 22:40:00 KST -->

# Mediation Report: 2011_대시보드_및_일정관리

**문서번호:** 2011
**중재 일시:** 2026-01-24
**모드:** AI-Assisted (자동 결정)
**입력 문서:**
- PRD: `docs/prd/2011_대시보드_및_일정관리_prd.md`
- Critical Review: `docs/prd/2011_대시보드_및_일정관리_prd_critical_review.md`
- Rebuttal: `docs/prd/2011_대시보드_및_일정관리_prd_rebuttal.md`

---

## Mediation Decisions

### DP-1: 캘린더 라이브러리 선택
**Decision:** ACCEPTED (리뷰어 제안 + 리버탈 보완 수용)

| 항목 | 결정 |
|------|------|
| 월간 뷰 | CSS Grid 자체 구현 (날짜 셀 + 건수/색상 배지) |
| 주간 뷰 | 시간순 정렬 리스트 (v1), 향후 시간대별 블록 확장 가능 |
| 일간 뷰 | 시간순 정렬 리스트 |
| 외부 라이브러리 | `date-fns` (날짜 계산 유틸리티만 사용) |

**근거:** ERP 시스템 특성상 데이터 정확도가 화려한 UI보다 중요하며, shadcn/ui 스타일과의 일관성을 위해 자체 구현이 적합하다. FullCalendar의 번들 사이즈와 커스터마이징 제약은 본 프로젝트에 부적합.

---

### DP-2: Phase 1 의존성 처리
**Decision:** MODIFIED (절충안)

| 항목 | 결정 |
|------|------|
| 개발 전략 | Mock 데이터 기반 병렬 개발 |
| Mock 도구 | TanStack Query의 `placeholderData` + 하드코딩 Mock 객체 |
| Interface Contract | Employee(id, name, department_id, role), Session(user.id, user.role, user.department_id) 사전 정의 |
| TechSupport 통합 | Phase 3 완료 전까지 빈 배열 반환 |

**근거:** 리버탈의 "블로킹이 아니다"라는 주장은 타당하나, 인터페이스 계약 없이 병렬 개발하면 Phase 1 완료 후 통합 시 불일치 발생 가능. 계약 정의를 PRD에 추가하여 리스크 최소화.

---

### DP-3: 시간 데이터 타입
**Decision:** MODIFIED (리버탈의 절충안 채택 + 보완)

| 항목 | 결정 |
|------|------|
| task_date | DATE (유지) — 캘린더 뷰 조회의 primary filter |
| start_time | NUMBER (분 단위, 0~1439, NULLABLE) |
| end_time | NUMBER (분 단위, 0~1439, NULLABLE) |
| CHECK 제약 | `start_time < end_time` (둘 다 NOT NULL인 경우) |
| 표시 변환 | 프론트엔드에서 분→HH:MM 변환 유틸리티 함수 제공 |

**근거:** TIMESTAMP 통합은 task_date 기반 인덱스를 무력화하고, VARCHAR2는 DB 레벨 연산이 불가하다. NUMBER(분 단위)는 정수 비교로 범위 검색이 가능하면서도 task_date의 역할을 유지한다.

---

### DP-4: 팀 캘린더 성능
**Decision:** PARTIALLY ACCEPTED

| 항목 | 결정 |
|------|------|
| 인덱스 추가 | `IDX_TASK_EMPLOYEE_DATE` (employee_id, task_date, deleted_at) 추가 |
| API 분리 | v1에서는 단일 API 유지, 성능 이슈 발생 시 분리 |
| 페이지네이션 | 불필요 (50명 이하 조직 규모) |

**근거:** 현재 조직 규모에서 API 분리는 과도한 최적화. 인덱스 추가만으로 충분하며, 성능 측정 후 필요 시 분리하는 점진적 접근이 합리적.

---

### DP-5: Optimistic Update 롤백
**Decision:** ACCEPTED

| 항목 | 결정 |
|------|------|
| 롤백 패턴 | TanStack Query `onMutate`/`onError`/`onSettled` 패턴 적용 |
| 에러 알림 | Toast 컴포넌트로 사용자 통지 |
| 중복 클릭 방지 | `mutation.isPending` 상태로 버튼/액션 비활성화 |
| 오프라인 | Out-of-Scope (네트워크 오류 시 Toast로 안내) |

**근거:** 양측 모두 동의한 사항. TanStack Query의 표준 패턴을 PRD에 구현 가이드로 추가.

---

### DP-6: TechSupport 통합 조회
**Decision:** ACCEPTED

| 항목 | 결정 |
|------|------|
| 쿼리 전략 | 병렬 쿼리 (Task + TechSupport 별도 조회) |
| 응답 구조 | `{ date, tasks: [...], techSupports: [...] }` |
| Phase 3 전 | `techSupports: []` 빈 배열 반환 |
| TechSupport 인터페이스 | support_date, employee_id, customer_id, title, status (최소 계약) |

**근거:** 양측 동의. UNION은 스키마 불일치로 부적합, 병렬 쿼리가 유지보수와 성능 모두 유리.

---

### DP-7: URL과 Zustand 상태 관리
**Decision:** ACCEPTED (리뷰어 제안 전면 수용)

| 항목 | 결정 |
|------|------|
| View mode | URL query param (`?view=month`) — `useSearchParams()` |
| Selected date | URL query param (`?date=2026-01-24`) — `useSearchParams()` |
| Zustand store | `selectedEmployeeFilter` (팀 캘린더 필터) 등 일시적 UI 상태만 |
| 라이브러리 | Next.js 내장 `useSearchParams()` + `useRouter()` |

**근거:** CLAUDE.md의 "Never duplicate server state in Zustand" 원칙의 확장. URL은 일종의 "서버 상태"(북마크 가능, 공유 가능)이므로 Zustand와 중복하면 안 된다.

---

### DP-8: 업무 시간 겹침 정책
**Decision:** ACCEPTED

| 항목 | 결정 |
|------|------|
| 겹침 허용 | Yes (강제 차단 없음) |
| 경고 표시 | 폼에서 non-blocking 경고 메시지 |
| 시간 미지정 | 겹침 검증 대상 제외 |
| 뷰 표시 | 겹침 시 나란히 배치 (column stacking) |

**근거:** 실제 업무 환경에서 동시 진행 업무가 존재하므로 강제 차단은 사용성을 저해한다.

---

### DP-9: 모바일 대응
**Decision:** MODIFIED (리버탈 기반 축소)

| 항목 | 결정 |
|------|------|
| 기본 대응 | 768px 미만: 일간 뷰 기본 + 리스트 형태 |
| 업무 등록 | Dialog → Sheet (shadcn/ui) 컴포넌트 |
| 팀 캘린더 | 768px 미만 시 데스크톱 전용 안내 표시 |
| 스와이프 | 미지원 (v1) |

**근거:** 주 사용 환경이 데스크톱이며, 모바일 최적화에 과도한 공수를 투입하는 것은 비효율적. 최소 대응으로 조회는 가능하되, 복잡한 인터랙션은 데스크톱 유도.

---

### DP-10: completed_at 자동 기록
**Decision:** ACCEPTED

| 항목 | 결정 |
|------|------|
| 트리거 위치 | API Route Handler (서버 사이드) |
| DONE 전환 시 | `completed_at = new Date()` (서버 시간) |
| 상태 역행 시 | `completed_at = null` |
| 클라이언트 | 읽기 전용 (수정 불가) |

**근거:** 서버 사이드 처리가 데이터 무결성을 보장하는 유일한 방법.

---

### DP-11: 삭제 전 의존성 확인
**Decision:** PARTIALLY ACCEPTED

| 항목 | 결정 |
|------|------|
| DONE 상태 삭제 | 추가 확인 다이얼로그 표시 |
| 의존성 확인 | 현재 불필요, 향후 확장 시 추가 |
| Soft delete | 유지 (복구 가능) |

**근거:** 현재 Task에 하위 엔티티가 없으므로 의존성 확인은 과도. 완료 업무 삭제 시 추가 경고만 적용.

---

## PRD v2 변경사항 요약

1. **Section 5.1**: 캘린더 라이브러리 결정 사항 추가 (CSS Grid + date-fns)
2. **Section 5.3**: `start_time`/`end_time` 타입 NUMBER(분 단위)로 변경, 인덱스 추가
3. **Section 5.4**: Zustand store에서 뷰 모드/날짜 제거, URL param 기반으로 변경
4. **Section 5.4**: Optimistic Update 롤백 패턴 추가
5. **Section 5.2**: daily-summary 응답 구조 명시, TechSupport Phase 3 전 빈 배열
6. **Section 9**: Open Questions 해결 (Q1~Q4), Interface Contract 추가
7. **Section 6**: 모바일 대응 구체화 (Sheet, 팀 캘린더 데스크톱 전용)
8. **Appendix**: 시간 변환 유틸리티 명세 추가

---

## Next Steps

1. PRD v2 문서 생성 (`docs/prd/2011_대시보드_및_일정관리_prd_v2.md`)
2. Phase 1 인터페이스 계약 확정 (Employee Entity, Session 객체)
3. Implementation Task 분해 (IMB)
