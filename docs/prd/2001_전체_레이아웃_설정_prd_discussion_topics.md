<!-- Generated: 2026-01-24 17:05:00 KST -->

# Discussion Topics: 2001_전체_레이아웃_설정_prd.md

**문서번호:** 2001
**생성 일시:** 2026-01-24
**원본 PRD:** docs/prd/2001_전체_레이아웃_설정_prd.md
**Critical Review:** docs/prd/2001_전체_레이아웃_설정_prd_critical_review.md

---

## Rebuttal Summary

Critical Review에서 제기한 10개 포인트에 대한 검토 결과:

| ID | 비평 핵심 | 반론/수용 | 결론 |
|----|----------|----------|------|
| DP-1 | SC/CC 경계 미정의 | **수용** — 구현에 필수적인 아키텍처 결정 | 토론 필요 |
| DP-2 | MANAGER 메뉴 접근 모순 | **수용** — PRD 내 불일치 존재 | 토론 필요 |
| DP-3 | 세션 만료 처리 부족 | **부분 수용** — 레이아웃 PRD의 범위를 넘을 수 있음 | 토론 필요 |
| DP-4 | Breadcrumb 상세 부족 | **수용** — 동적 라우트 처리 전략 필요 | 토론 필요 |
| DP-5 | 성능 측정 방법 미정의 | **반론** — 현 단계에서는 목표값 정의로 충분 | 토론 필요 |
| DP-6 | max-w-7xl 적절성 | **수용** — ERP 데이터 테이블 특성 고려 필요 | 토론 필요 |
| DP-7 | 메뉴 그룹핑 미결정 | **수용** — Open Question Q1에 해당 | 토론 필요 |
| DP-8 | 키보드 접근성 미정의 | **부분 수용** — shadcn/ui 기본 제공분으로 충분할 수 있음 | 토론 필요 |
| DP-9 | 로딩 상태 미정의 | **수용** — Next.js loading.tsx 전략 필요 | 토론 필요 |
| DP-10 | 사이드바 하단 미결정 | **수용** — Open Question Q2에 해당 | 토론 필요 |

---

## Discussion Topics (Prioritized)

### HIGH Priority

---

#### DT-1: Server Component / Client Component 분리 전략
**원본:** DP-1
**Priority:** HIGH
**영향도:** 전체 레이아웃 아키텍처

**배경:**
- Next.js App Router에서 layout.tsx는 기본 Server Component
- Zustand store, useState, event handler는 Client Component에서만 사용 가능
- SessionProvider (NextAuth)도 Client Component 필요

**선택지:**

**Option A: Server Layout + Client Shell 패턴 (권장)**
```
(main)/layout.tsx (Server Component)
  └── <MainShell> (Client Component - 'use client')
        ├── <Sidebar />
        ├── <Header />
        └── <main>{children}</main>
```
- 장점: Server Component의 이점(번들 크기 감소) 활용
- 장점: Session을 서버에서 가져와 props로 전달 가능
- 단점: 약간의 구조적 복잡도 증가

**Option B: Client Layout 전체**
```
(main)/layout.tsx ('use client')
  ├── <Sidebar />
  ├── <Header />
  └── <main>{children}</main>
```
- 장점: 단순한 구조
- 단점: layout이 Client Bundle에 포함됨
- 단점: 하위 페이지의 Server Component 사용 제한 없음 (children은 독립)

**Option C: Parallel Routes 활용**
```
(main)/layout.tsx (Server Component)
  ├── @sidebar/default.tsx (Client Component)
  ├── @header/default.tsx (Client Component)
  └── {children}
```
- 장점: 각 섹션 독립 로딩 가능
- 단점: 과도한 복잡도, 일반적이지 않은 패턴

**결정 필요:** A / B / C 중 선택

---

#### DT-2: MANAGER 역할의 직원 관리 메뉴 표시 정책
**원본:** DP-2
**Priority:** HIGH
**영향도:** 네비게이션 메뉴, 권한 시스템

**배경:**
- 네비게이션 테이블: `/employees` 최소 권한 = ADMIN
- US-4: "MANAGER: 직원 관리 메뉴 읽기 전용 (부서 내)"
- 이 두 정의가 상충함

**선택지:**

**Option A: MANAGER에게 메뉴 표시 (읽기 전용 모드)**
- 메뉴 최소 권한을 `MANAGER`로 변경
- MANAGER 접근 시 부서 내 직원만 표시, 수정 불가
- 장점: US-4와 일치
- 단점: 네비게이션 테이블 수정 필요

**Option B: MANAGER에게 메뉴 숨김 (ADMIN 전용 유지)**
- US-4의 MANAGER 관련 내용 삭제
- MANAGER는 별도 경로(대시보드 내 위젯 등)로 부서 직원 정보 확인
- 장점: 단순한 권한 구조
- 단점: MANAGER의 부서 직원 확인 경로 별도 정의 필요

**Option C: 조건부 메뉴 표시 (MANAGER는 '내 부서' 레이블)**
- MANAGER에게는 "내 부서 직원" 메뉴로 변형 표시
- 동일 경로(`/employees`)이지만 UI에서 부서 필터 고정
- 장점: 역할별 맞춤 UX
- 단점: 조건부 메뉴 레이블 로직 추가

**결정 필요:** A / B / C 중 선택

---

#### DT-3: 세션 만료 처리 전략 범위
**원본:** DP-3
**Priority:** HIGH
**영향도:** 전체 시스템 UX, 데이터 안전성

**배경:**
- 현재 PRD는 "세션 만료 시 리다이렉트"만 언급
- 실제 운영 환경에서는 다양한 세션 만료 시나리오 존재
- 레이아웃 PRD의 범위인지, 별도 인증 PRD의 범위인지 판단 필요

**선택지:**

**Option A: 레이아웃 PRD에 기본 전략 포함**
- 401 응답 시 global error handler에서 로그인 리다이렉트
- 세션 만료 5분 전 toast 알림
- 폼 데이터 임시 저장은 각 모듈 PRD에서 정의
- 장점: 핵심 UX를 레이아웃과 함께 정의
- 단점: 레이아웃 PRD 범위 확장

**Option B: 별도 인증/세션 PRD로 분리**
- 레이아웃 PRD에서는 "세션 만료 시 리다이렉트" 유지
- 상세 전략은 Auth PRD(1001번 등)에서 정의
- 장점: 관심사 분리
- 단점: 구현 시 두 PRD를 참조해야 함

**Option C: 레이아웃에서 최소한의 정의 + 상세는 별도**
- 레이아웃 PRD: 401 시 로그인 리다이렉트 (기본)
- 레이아웃 PRD: TanStack Query global onError 설정 명시
- 세션 갱신, 폼 저장 등 상세는 별도 문서
- 장점: 균형 잡힌 접근
- 단점: 없음 (권장)

**결정 필요:** A / B / C 중 선택

---

### MEDIUM Priority

---

#### DT-4: Breadcrumb 데이터 소스 전략
**원본:** DP-4
**Priority:** MEDIUM
**영향도:** 네비게이션 UX, 컴포넌트 설계

**선택지:**

**Option A: 라우트 기반 자동 생성**
- URL 경로에서 자동으로 Breadcrumb 생성
- `/customers/123` → "고객 관리 > 123"
- 장점: 별도 설정 불필요, 자동화
- 단점: 동적 세그먼트에서 의미 있는 이름 표시 어려움

**Option B: 각 페이지에서 메타데이터 정의**
- 각 page.tsx에서 breadcrumb 배열을 Context 또는 Zustand로 전달
- 장점: 정확한 레이블 표시 가능 ("고객 관리 > 삼성전자")
- 단점: 각 페이지마다 boilerplate 코드

**Option C: 라우트 설정 파일 + 동적 세그먼트 resolver**
- 정적 경로는 설정 파일에서 매핑
- 동적 세그먼트는 resolver 함수로 이름 조회
- 장점: 유연하고 정확함
- 단점: 초기 구현 복잡도 높음

**결정 필요:** A / B / C 중 선택

---

#### DT-5: 성능 메트릭 검증 전략
**원본:** DP-5
**Priority:** MEDIUM
**영향도:** 품질 보증, CI/CD

**선택지:**

**Option A: 수동 검증 (초기 단계)**
- Chrome DevTools / Lighthouse로 수동 측정
- 릴리스 전 체크리스트 항목으로 관리
- 장점: 도구 추가 불필요, 빠른 시작
- 단점: 회귀 감지 어려움

**Option B: Lighthouse CI 자동화**
- CI 파이프라인에 Lighthouse CI 통합
- PR마다 성능 리포트 생성, 임계값 미달 시 경고
- 장점: 자동 회귀 감지
- 단점: CI 설정 추가 작업 필요

**Option C: 성능 메트릭 조항 삭제 (현 단계 불필요)**
- 구체적 수치 대신 "성능 저하 없이 동작" 정도로 완화
- 추후 최적화 단계에서 구체적 목표 설정
- 장점: 초기 개발 속도 우선
- 단점: 성능 기준 모호

**결정 필요:** A / B / C 중 선택

---

#### DT-6: 콘텐츠 영역 최대 너비 정책
**원본:** DP-6
**Priority:** MEDIUM
**영향도:** UI 레이아웃, 데이터 테이블 사용성

**선택지:**

**Option A: max-w-7xl 유지 (현행)**
- 모든 페이지에 1280px 최대 너비 적용
- 장점: 일관된 레이아웃, 읽기 편한 콘텐츠 너비
- 단점: 넓은 테이블에서 가로 스크롤 가능성

**Option B: max-w-full 기본 (제한 없음)**
- 콘텐츠 영역을 전체 너비로 사용
- 장점: ERP 데이터 테이블에 최적
- 단점: 좁은 콘텐츠(폼, 상세 페이지)에서 과도하게 넓음

**Option C: 페이지별 선택 가능 (max-w 옵션 제공)**
- 기본값은 `max-w-full`, 각 페이지에서 `max-w-7xl` 등 선택 가능
- 또는 기본값 `max-w-7xl`, 테이블 페이지에서 `max-w-full` 선택
- 장점: 유연한 대응
- 단점: 일관성 규칙 정의 필요

**결정 필요:** A / B / C 중 선택

---

#### DT-7: 사이드바 메뉴 그룹핑 전략
**원본:** DP-7 (Open Question Q1)
**Priority:** MEDIUM
**영향도:** 네비게이션 UX, 확장성

**선택지:**

**Option A: 그룹핑 없이 플랫 목록 유지**
- 현재 10개 메뉴를 순서대로 나열
- 장점: 단순함, 초기 구현 빠름
- 단점: 메뉴 증가 시 인지 부하

**Option B: 시각적 그룹핑 (Separator 활용)**
- 그룹 간 Separator 추가, 그룹 레이블은 없음
- 그룹: [대시보드, 업무] | [기술지원, 프로젝트, 장애] | [재고, 유지보수] | [고객, 직원, 공지]
- 장점: 시각적 구분, 레이블 없이 간결
- 단점: 그룹 의미 직관적이지 않을 수 있음

**Option C: 레이블 있는 그룹핑**
- 그룹 레이블 + Separator
- "일반", "영업/지원", "운영", "관리" 등
- 사이드바 축소 시 그룹 레이블 숨김
- 장점: 명확한 그룹 인지
- 단점: 사이드바 높이 증가, 축소 시 정보 손실

**결정 필요:** A / B / C 중 선택

---

#### DT-8: 키보드 접근성 수준
**원본:** DP-8
**Priority:** MEDIUM
**영향도:** 접근성, 사용 편의성

**선택지:**

**Option A: shadcn/ui 기본 접근성만 활용**
- shadcn/ui 컴포넌트가 제공하는 기본 ARIA 속성 사용
- Tab 키 순회는 자동 지원됨
- 장점: 추가 작업 최소, shadcn/ui 표준 준수
- 단점: 사이드바 토글 단축키 없음

**Option B: 기본 + 사이드바 토글 단축키 추가**
- Option A + `Ctrl/Cmd+B`로 사이드바 토글
- 장점: 파워 유저 UX 개선
- 단점: 단축키 충돌 가능성 확인 필요

**Option C: 완전한 WAI-ARIA Navigation 패턴**
- 전체 ARIA navigation landmark
- 키보드 방향키 네비게이션
- 포커스 트랩 (모바일 사이드바)
- 장점: 최고 수준 접근성
- 단점: 상당한 추가 구현 노력

**결정 필요:** A / B / C 중 선택

---

### LOW Priority

---

#### DT-9: 페이지 전환 시 로딩 UI 전략
**원본:** DP-9
**Priority:** LOW
**영향도:** UX, 체감 성능

**선택지:**

**Option A: (main)/loading.tsx 공통 스켈레톤**
- 전체 콘텐츠 영역에 적용되는 기본 스켈레톤 UI
- 장점: 한 번 정의로 전체 적용
- 단점: 각 페이지 특성에 맞지 않을 수 있음

**Option B: 모듈별 loading.tsx 개별 정의**
- 각 모듈 폴더에 맞춤 loading.tsx 정의
- 장점: 페이지별 최적화된 스켈레톤
- 단점: 각 모듈 PRD에서 정의해야 하므로 현 PRD 범위 외

**Option C: NProgress 상단 진행 바만 적용**
- 상단에 얇은 진행 바만 표시 (GitHub 스타일)
- 장점: 최소한의 구현으로 피드백 제공
- 단점: 콘텐츠 영역이 잠시 비어 보일 수 있음

**결정 필요:** A / B / C 중 선택

---

#### DT-10: 사이드바 하단 영역 활용
**원본:** DP-10 (Open Question Q2)
**Priority:** LOW
**영향도:** 사이드바 UX

**선택지:**

**Option A: 빈 상태 유지 (향후 확장)**
- 현재는 하단 영역 비워둠
- 장점: 단순함, 향후 유연성
- 단점: 시각적으로 허전할 수 있음

**Option B: 버전 정보 + 축소 토글 버튼**
- 하단에 앱 버전 (예: "v0.1.0")
- 사이드바 축소/확장 토글 버튼을 하단에 배치
- 장점: 유용한 정보 제공, 토글 위치 직관적
- 단점: 헤더의 토글과 중복 가능

**Option C: 간소화된 사용자 프로필 카드**
- 하단에 아바타 + 이름 (축소 시 아바타만)
- 클릭 시 프로필/로그아웃 메뉴
- 장점: 많은 SaaS 앱의 익숙한 패턴
- 단점: 헤더 드롭다운과 기능 중복

**결정 필요:** A / B / C 중 선택

---

## Next Step

이 Discussion Topics를 기반으로 `/prd-mediator`를 실행하여 각 항목에 대한 결정을 진행한다.

**실행 명령:**
```bash
/prd-mediator --dis docs/prd/2001_전체_레이아웃_설정_prd_discussion_topics.md --mode ai-assisted --priority all
```
