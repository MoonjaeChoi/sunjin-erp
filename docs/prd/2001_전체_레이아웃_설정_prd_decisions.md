<!-- Generated: 2026-01-24 17:10:00 KST -->

# Decision Record: 2001_전체_레이아웃_설정_prd.md

**문서번호:** 2001
**결정 일시:** 2026-01-24
**결정 모드:** AI-Assisted (Claude 추천 + 사용자 확인)

---

## Decision Summary

| ID | Priority | 주제 | 선택된 Option | 결정 |
|----|----------|------|--------------|------|
| DT-1 | HIGH | SC/CC 분리 전략 | **Option A** | Server Layout + Client Shell 패턴 |
| DT-2 | HIGH | MANAGER 메뉴 접근 | **Option A** | MANAGER에게 표시, 읽기 전용 |
| DT-3 | HIGH | 세션 만료 처리 | **Option C** | 최소 정의 + 상세 별도 |
| DT-4 | MEDIUM | Breadcrumb 전략 | **Option C** | 라우트 설정 + 동적 resolver |
| DT-5 | MEDIUM | 성능 검증 | **Option A** | 수동 Lighthouse 검증 |
| DT-6 | MEDIUM | 콘텐츠 너비 | **Option C** | 기본 max-w-full, 페이지별 선택 |
| DT-7 | MEDIUM | 메뉴 그룹핑 | **Option B** | Separator로 시각적 구분 |
| DT-8 | MEDIUM | 키보드 접근성 | **Option B** | 기본 + Ctrl/Cmd+B 단축키 |
| DT-9 | LOW | 로딩 UI | **Option A** | 공통 loading.tsx 스켈레톤 |
| DT-10 | LOW | 사이드바 하단 | **Option B** | 버전 정보 + 토글 버튼 |

---

## Detailed Decisions

### DT-1: Server Component / Client Component 분리 전략
**Decision:** Option A — Server Layout + Client Shell 패턴

**Rationale:**
- `(main)/layout.tsx`를 Server Component로 유지하여 번들 크기 최적화
- 내부에 `<MainShell>` Client Component를 렌더링
- Server에서 `getServerSession()`으로 세션을 가져와 props로 전달 가능
- children (각 모듈 페이지)은 독립적으로 SC/CC 선택 가능

**구조:**
```
(main)/layout.tsx (Server Component)
  └── <MainShell session={session}> (Client Component)
        ├── <Sidebar />
        ├── <Header />
        └── <main>{children}</main>
```

---

### DT-2: MANAGER 역할의 직원 관리 메뉴
**Decision:** Option A — MANAGER에게 메뉴 표시, 읽기 전용

**Rationale:**
- US-4의 명세와 일치 ("MANAGER: 직원 관리 메뉴 읽기 전용")
- 부서 내 직원 확인은 MANAGER의 핵심 업무
- 네비게이션 테이블의 최소 권한을 ADMIN → MANAGER로 변경
- 페이지 내에서 MANAGER는 부서 필터 고정 + 수정/삭제 버튼 비활성화

**변경사항:**
- 메뉴 테이블: `/employees` 최소 권한 = `MANAGER`
- 페이지 레벨: MANAGER 접근 시 `department_id` 필터 강제 적용, CUD 비활성화

---

### DT-3: 세션 만료 처리 범위
**Decision:** Option C — 레이아웃에서 최소 정의 + 상세는 별도

**Rationale:**
- 관심사 분리: 레이아웃 PRD는 UI 쉘에 집중
- TanStack Query global onError에서 401 응답 시 로그인 리다이렉트는 레이아웃의 책임
- 세션 갱신 전략, 폼 임시 저장 등 상세는 Auth PRD 범위

**레이아웃 PRD에 추가할 내용:**
- TanStack Query QueryClient 설정에 `onError: (error) => { if (error.status === 401) redirect('/login') }` 포함
- SessionProvider의 `refetchOnWindowFocus: true` 설정

---

### DT-4: Breadcrumb 데이터 소스
**Decision:** Option C — 라우트 설정 파일 + 동적 resolver

**Rationale:**
- ERP에서 `/customers/123` → "고객 관리 > 삼성전자"처럼 의미 있는 표시 중요
- 정적 경로는 메뉴 설정과 동일한 소스에서 매핑
- 동적 세그먼트는 각 모듈에서 제공하는 resolver 함수로 이름 조회

**구현 방향:**
- `src/lib/breadcrumb-config.ts`: 정적 경로 → 레이블 매핑
- 각 모듈 페이지에서 동적 세그먼트의 display name을 Context로 설정
- Breadcrumb 컴포넌트에서 합성하여 렌더링

---

### DT-5: 성능 메트릭 검증
**Decision:** Option A — 수동 Lighthouse 검증 (초기 단계)

**Rationale:**
- MVP 단계에서 CI 자동화는 과도한 인프라 투자
- 릴리스 전 Chrome DevTools / Lighthouse로 수동 측정
- 안정화 후 Lighthouse CI 도입 검토

---

### DT-6: 콘텐츠 영역 최대 너비
**Decision:** Option C — 기본 max-w-full, 페이지별 선택

**Rationale:**
- ERP 시스템은 데이터 테이블이 주요 UI → 넓은 화면 활용이 기본
- 폼, 상세 페이지에서는 `max-w-5xl` 등으로 가독성 확보
- 콘텐츠 영역에 padding (p-6)은 유지

**변경사항:**
- Section 6.2의 `max-w-7xl` → `max-w-full` (기본값) 변경
- 각 페이지 컴포넌트에서 필요 시 `<div className="max-w-5xl">` 래핑

---

### DT-7: 사이드바 메뉴 그룹핑
**Decision:** Option B — Separator로 시각적 구분

**Rationale:**
- 레이블 없이 Separator만으로 관련 메뉴를 시각적으로 구분
- 축소 시에도 Separator 라인이 자연스럽게 표시됨
- 향후 메뉴 추가 시 레이블 도입도 용이

**그룹 구성:**
```
[대시보드, 업무 검색]
--- separator ---
[기술지원, 프로젝트, 장애 현황]
--- separator ---
[재고 관리, 유지보수]
--- separator ---
[고객 관리, 직원 관리, 공지사항]
```

---

### DT-8: 키보드 접근성
**Decision:** Option B — 기본 + Ctrl/Cmd+B 단축키

**Rationale:**
- shadcn/ui 컴포넌트가 기본 제공하는 Tab 순회, ARIA 속성 활용
- 추가로 `Ctrl+B` (Mac: `Cmd+B`) 사이드바 토글 단축키 제공
- 완전한 WAI-ARIA Navigation은 향후 접근성 개선 단계에서 적용

---

### DT-9: 페이지 전환 로딩 UI
**Decision:** Option A — (main)/loading.tsx 공통 스켈레톤

**Rationale:**
- `src/app/(main)/loading.tsx`에 기본 스켈레톤 UI 정의
- 사이드바/헤더는 유지되고, 콘텐츠 영역만 스켈레톤으로 대체
- 각 모듈에서 필요 시 모듈별 `loading.tsx`로 재정의 가능

---

### DT-10: 사이드바 하단 영역
**Decision:** Option B — 버전 정보 + 축소 토글 버튼

**Rationale:**
- 하단에 앱 버전 표시 (개발/디버깅 시 유용)
- 축소/확장 토글 버튼을 하단에 배치 (VS Code 스타일)
- 사용자 프로필은 헤더에 있으므로 중복 방지

---

## Open Questions Resolved

| 원본 질문 | 결정 |
|----------|------|
| Q1: 메뉴 그룹핑 필요? | **Yes** — Separator로 시각적 구분 (DT-7) |
| Q2: 사이드바 하단 활용? | **Yes** — 버전 정보 + 토글 버튼 (DT-10) |
| Q3: 다크 모드? | **Out-of-Scope 유지** — 향후 확장 |
