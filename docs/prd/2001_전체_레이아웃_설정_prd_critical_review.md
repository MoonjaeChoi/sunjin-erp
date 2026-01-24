<!-- Generated: 2026-01-24 17:00:00 KST -->

# Critical Review: 2001_전체_레이아웃_설정_prd.md

**문서번호:** 2001
**리뷰 일시:** 2026-01-24
**리뷰 방법:** Architecture Compliance Check (sunjin-erp 표준)

---

## Executive Summary

전체적으로 잘 작성된 PRD이나, 다음 영역에서 보완이 필요하다:
1. Server Component vs Client Component 경계 정의 부족
2. MANAGER 역할의 사이드바 메뉴 접근 범위 모호
3. 세션 만료 및 에러 처리 시나리오 부족
4. 성능 메트릭의 측정 방법 미정의
5. Breadcrumb 구현 상세 부족

---

## Discussion Points

### DP-1: Server Component vs Client Component 경계 미정의
**Priority:** HIGH
**Category:** Architecture Compliance

**문제:** PRD에서 `(main)/layout.tsx`가 사이드바와 헤더를 포함한다고 명시하지만, 이 레이아웃이 Server Component인지 Client Component인지 명시되지 않았다. Next.js App Router에서 layout.tsx는 기본적으로 Server Component이며, 사이드바 토글(useState)이나 Zustand store 접근은 Client Component에서만 가능하다.

**우려사항:**
- `useSidebarStore` (Zustand)를 사용하려면 Client Component가 필요
- SessionProvider는 Client Component에서만 동작
- Server Component인 layout에서 Client Component를 어떻게 구성할 것인지 전략 미정의

**제안:**
- `(main)/layout.tsx`는 Server Component로 유지하고, 내부에 `<MainShell>` Client Component를 렌더링하는 구조 명시
- 또는 `'use client'` 선언 여부를 PRD에 명시

---

### DP-2: MANAGER 역할의 메뉴 접근 범위 모호
**Priority:** HIGH
**Category:** Authorization

**문제:** 메뉴 테이블에서 직원 관리(`/employees`)만 ADMIN 전용으로 표시되어 있으나, CLAUDE.md에 따르면 MANAGER는 "부서 내 읽기/쓰기" 권한이다. US-4에서 "MANAGER: 직원 관리 메뉴 읽기 전용 (부서 내)"라고 명시하지만, 네비게이션 테이블의 최소 권한은 ADMIN으로 되어있다.

**우려사항:**
- MANAGER가 `/employees` 메뉴를 볼 수 있는지 없는지 모순
- 부서 내 읽기 전용이면 메뉴가 표시되어야 하고, 접근 시 부서 필터가 적용되어야 함
- 메뉴 표시 여부와 실제 접근 권한의 불일치 가능성

**제안:**
- 메뉴 최소 권한을 `MANAGER`로 변경하고, 페이지 내에서 ADMIN/MANAGER 권한 분기 처리
- 또는 MANAGER에게도 메뉴를 숨기고 별도 접근 경로 제공

---

### DP-3: 세션 만료 시 UX 처리 미흡
**Priority:** HIGH
**Category:** Security / UX

**문제:** Section 8에서 "세션 만료 시 자동 로그아웃 처리 및 로그인 페이지 리다이렉트"라고 간단히 언급하지만, 구체적인 시나리오가 부족하다.

**우려사항:**
- 사용자가 폼 작성 중 세션 만료 시 데이터 손실 가능
- API 호출 도중 401 응답 시 클라이언트 처리 방법 미정의
- 세션 갱신(refresh) 전략 미정의 (JWT rotation 등)
- 여러 탭에서 동시 사용 시 세션 동기화 문제

**제안:**
- TanStack Query의 global error handler에서 401 처리 전략 추가
- 세션 만료 임박 시 사전 경고 또는 자동 갱신 메커니즘 정의
- 폼 작성 중 세션 만료 시 localStorage 임시 저장 고려

---

### DP-4: Breadcrumb 구현 상세 부족
**Priority:** MEDIUM
**Category:** Completeness

**문제:** Breadcrumb이 In-Scope에 포함되어 있고 shadcn/ui 컴포넌트 목록에도 있으나, 구체적인 동작 방식이 정의되지 않았다.

**우려사항:**
- 각 페이지의 Breadcrumb 경로를 어디서 정의하는지 불명확
- 동적 라우트(예: `/customers/[id]`)에서 실제 고객명을 표시할 것인지 ID를 표시할 것인지
- Breadcrumb 데이터를 Server Component에서 fetch할 것인지 Client에서 할 것인지

**제안:**
- Breadcrumb 경로를 각 page 컴포넌트에서 metadata로 정의하거나, 라우트 구조에서 자동 생성하는 전략 명시
- 동적 세그먼트의 표시 방식 정의 (예: "고객 관리 > 삼성전자")

---

### DP-5: 성능 메트릭 측정 방법 미정의
**Priority:** MEDIUM
**Category:** Success Metrics

**문제:** Section 7에서 CLS < 0.1, FCP < 1.5s, 사이드바 인터랙션 < 50ms 등의 메트릭을 정의하지만, 이를 어떻게 측정하고 모니터링할 것인지 명시되지 않았다.

**우려사항:**
- 개발 환경과 프로덕션 환경의 성능 차이
- CI/CD 파이프라인에서 성능 회귀 테스트 방법
- "클라이언트 사이드 페이지 전환 시간 < 100ms"의 측정 기준 불명확

**제안:**
- Lighthouse CI 또는 Web Vitals 측정 도구 명시
- 성능 메트릭을 자동화된 테스트로 검증할 것인지, 수동 확인인지 결정

---

### DP-6: max-w-7xl 콘텐츠 영역 제한 적절성
**Priority:** MEDIUM
**Category:** UI/UX

**문제:** 콘텐츠 영역에 `max-w-7xl` (1280px) 제한이 명시되어 있으나, ERP 시스템의 데이터 테이블은 넓은 화면을 활용하는 것이 일반적이다.

**우려사항:**
- 재고 관리, 기술지원 목록 등 컬럼이 많은 테이블에서 가로 스크롤 발생 가능
- 1280px 이상 모니터에서 좌우 여백이 과도하게 남을 수 있음
- 모듈마다 최적 너비가 다를 수 있음

**제안:**
- `max-w-7xl`을 기본값으로 하되, 각 모듈 페이지에서 `max-w-full` 옵션을 제공
- 또는 ERP 특성을 고려하여 `max-w-full`로 변경하고 개별 페이지에서 너비 제한

---

### DP-7: 사이드바 메뉴 그룹핑 전략 미결정
**Priority:** MEDIUM
**Category:** UX / Open Questions

**문제:** Q1에서 "사이드바 메뉴 그룹핑이 필요한가?"라고 열린 질문으로 남겨두었으나, 10개 메뉴 항목은 그룹핑 없이 나열하면 인지 부하가 높을 수 있다.

**우려사항:**
- 메뉴가 10개 이상으로 증가할 경우 확장성 문제
- 관련 기능 간의 시각적 연관성 부족 (예: 기술지원/장애현황은 유사 그룹)
- 사이드바 축소 시 그룹 구분 방법

**제안:**
- 최소한의 그룹핑 도입: 영업(기술지원, 프로젝트), 운영(재고, 유지보수, 장애), 관리(직원, 공지)
- 그룹은 Separator 컴포넌트로 시각적 구분, 그룹 레이블은 축소 시 숨김

---

### DP-8: 키보드 네비게이션 및 접근성(Accessibility) 미정의
**Priority:** MEDIUM
**Category:** Accessibility

**문제:** 사이드바 네비게이션의 키보드 접근성이 전혀 언급되지 않았다.

**우려사항:**
- Tab 키로 메뉴 항목 순회 가능 여부
- 사이드바 토글의 키보드 단축키
- Screen reader를 위한 ARIA 레이블
- 포커스 관리 (사이드바 열기/닫기 시)

**제안:**
- WAI-ARIA Navigation 패턴 적용 명시
- 사이드바 토글 단축키 (예: `Ctrl+B` 또는 `Cmd+B`) 정의
- shadcn/ui 컴포넌트가 기본 제공하는 접근성 기능 활용 명시

---

### DP-9: 로딩 상태 및 스켈레톤 UI 미정의
**Priority:** LOW
**Category:** UX

**문제:** 페이지 전환 시 콘텐츠 영역의 로딩 상태 처리가 정의되지 않았다.

**우려사항:**
- 페이지 전환 시 빈 화면이 표시될 수 있음
- 사이드바/헤더는 유지되지만 콘텐츠 영역의 로딩 피드백 부재
- Next.js `loading.tsx` 활용 여부 미정의

**제안:**
- `(main)/loading.tsx`에 스켈레톤 UI 정의
- 또는 각 모듈별 `loading.tsx` 사용 여부 결정

---

### DP-10: 사이드바 하단 영역 활용 미결정
**Priority:** LOW
**Category:** UX / Open Questions

**문제:** Q2에서 "사이드바 하단에 시스템 버전 정보 또는 회사 로고를 표시할 것인가?"가 미결정이다.

**우려사항:**
- 사이드바 하단은 로그아웃 버튼이나 사용자 간략 정보를 표시하는 패턴이 일반적
- 현재 로그아웃은 헤더에 있으므로, 하단 영역의 용도 불명확

**제안:**
- 사이드바 하단에 축소된 사용자 아바타 + 버전 정보 표시
- 또는 빈 상태로 두고 향후 기능(설정, 도움말) 추가 시 활용

---

## Summary Table

| ID | Priority | Category | 핵심 이슈 |
|----|----------|----------|-----------|
| DP-1 | HIGH | Architecture | Server/Client Component 경계 미정의 |
| DP-2 | HIGH | Authorization | MANAGER 역할 메뉴 접근 모순 |
| DP-3 | HIGH | Security/UX | 세션 만료 처리 시나리오 부족 |
| DP-4 | MEDIUM | Completeness | Breadcrumb 구현 상세 부족 |
| DP-5 | MEDIUM | Metrics | 성능 측정 방법 미정의 |
| DP-6 | MEDIUM | UI/UX | max-w-7xl 제한 적절성 |
| DP-7 | MEDIUM | UX | 메뉴 그룹핑 전략 미결정 |
| DP-8 | MEDIUM | Accessibility | 키보드 접근성 미정의 |
| DP-9 | LOW | UX | 로딩 상태/스켈레톤 미정의 |
| DP-10 | LOW | UX | 사이드바 하단 영역 미결정 |

---

## Conclusion

PRD 2001은 전체 레이아웃의 기본 구조를 잘 정의하고 있으나, Next.js App Router의 Server/Client Component 분리 전략(DP-1)과 MANAGER 권한의 메뉴 접근 정책(DP-2)은 구현 전 반드시 해결해야 할 사항이다. 세션 만료 처리(DP-3)도 사용자 경험에 직접 영향을 미치므로 높은 우선순위로 다루어야 한다.
