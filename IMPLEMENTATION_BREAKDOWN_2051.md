# 재고 관리 (Inventory Management) 구현 분석 완료

**생성일**: 2026-01-25
**원본 PRD**: docs/prd/2051_재고_관리_prd_v2.md
**문서 위치**: docs/prd/2051_*.md (총 26개 문서)

## 구현 분석 요약

sunjin-erp 프로젝트의 "재고 관리" 모듈에 대한 완전한 구현 분석 자료를 생성했습니다. 이 자료는 즉시 개발을 시작할 수 있는 상세한 스펙으로 구성되어 있습니다.

## 생성된 문서 목록

### 1. 구현 개요 (1개 문서)
- **2051_00**: 재고 관리 구현 개요
  - 전체 구현 항목 26개 목록
  - 의존성 그래프
  - 복잡도 분포 및 예상 기간
  - 기술적 고려사항 6가지

### 2. Database Layer (2개 문서)
- **2051_01**: Inventory + InventoryHistory Entity 정의
  - TypeORM Entity 정의 (복잡도: M)
  - InventoryStatus 타입 정의
  - ChangeType 타입 정의
  - 관계 설정 (ManyToOne, OneToMany)

- **2051_02**: Migration 생성
  - INVENTORY, INVENTORY_HISTORY 테이블 생성 (복잡도: M)
  - 부분 고유 인덱스 (serial_number active only)
  - 11개 성능 최적화 인덱스
  - CHECK 제약 조건
  - ON DELETE RESTRICT 외래키

### 3. API Layer (9개 문서)
- **2051_03**: 재고 목록 조회 API (GET /api/inventory) - M
  - 필터링 (카테고리, 상태, 위치)
  - 검색 (시리얼번호, 모델명 접두사)
  - 정렬 (6가지 컬럼)
  - 페이지네이션 (최대 100개/페이지)
  - HATEOAS Links

- **2051_04**: 재고 상세 조회 API (GET /api/inventory/[id]) - M
  - 과기 판정 계산 (overdue_days)
  - 이동 이력 조회 (오름차순 정렬)
  - 기본 정보 + created_by, updated_by 정보

- **2051_05**: 입고 등록 API (POST /api/inventory) - M
  - 필드 검증 (7개 필드)
  - 시리얼 번호 중복 검증
  - DTO validation + custom validator
  - 입고 이력 자동 생성

- **2051_06**: 출고 처리 API (POST /api/inventory/[id]/checkout) - M
  - 상태 전이 검증 (재고→출고)
  - expected_checkin_date 검증 (미래일만)
  - checkout_location 기록 (논리적 사용처)
  - current_location 변경 없음 (물리적 위치 유지)

- **2051_07**: 반납 처리 API (POST /api/inventory/[id]/checkin) - M
  - 상태 전이 검증 (출고→재고)
  - current_location 업데이트 (반납 위치)
  - checkout_location 초기화

- **2051_08**: 위치 변경 API (POST /api/inventory/[id]/relocate) - S
  - 재고 상태만 가능
  - current_location 업데이트
  - 변경 사유 기록 (선택)

- **2051_09**: 상태 변경 API (POST /api/inventory/[id]/status) - M
  - 상태 전이 규칙 검증 (5가지 규칙)
  - 고장/폐기만 가능
  - reason 필수 필드 (1-500자)

- **2051_10**: 재고 통계 API (GET /api/inventory/stats) - M
  - 전체 수량 + 상태별 집계 (4가지)
  - 카테고리별 집계 (상태별 분포)
  - Cache-Control: max-age=60 (1분 캐시)

- **2051_11**: 기본 정보 수정 + 소프트 삭제 API - M
  - PUT: 기본 정보 수정 (ADMIN only, 선택적 필드)
  - DELETE: 소프트 삭제 (deleted_at 설정)
  - InventoryHistory 유지 (ON DELETE RESTRICT)

### 4. Frontend Layer (11개 문서)
- **2051_12**: TypeScript 타입 정의 - S
  - InventoryStatus, ChangeType union types
  - 한글 라벨 맵 (3개)
  - 상태별 색상 맵 (UI용)
  - 10개 인터페이스 + 헬퍼 함수
  
- **2051_13**: Inventory Service - S
  - validateStateTransition (5가지 규칙)
  - canCheckout, canCheckin, canRelocate
  - calculateOverdueStatus (과기 판정)
  - getAvailableActions (종합)

- **2051_14**: TanStack Query Hooks - L
  - useInventoryList (필터 포함)
  - useInventoryDetail (id 기반)
  - useInventoryStats
  - useInventoryMutations (7가지: create, checkout, checkin, relocate, status change, update, delete)
  - 캐시 무효화 전략 정확 구현 (Decision 7)

- **2051_15**: 재고 목록 페이지 - L
  - Server Component (인증 검증)
  - Client Component (InventoryPage)
  - Loading Skeleton
  - 필터 상태 관리 + URL 동기화
  - 입고 버튼 (MANAGER/ADMIN only)

- **2051_16~20**: UI 컴포넌트 5개 (M × 5)
  - InventoryFilters (필터 패널)
  - InventoryTable (목록 테이블)
  - InventoryStats (통계 패널)
  - InventoryDetailView (상세 페이지)
  - InventoryHistory (타임라인)

- **2051_21~25**: Form 컴포넌트 5개 (M × 5)
  - CreateInventoryForm (입고, 7개 필드)
  - CheckoutForm (출고, 3개 필드)
  - CheckinForm (반납, 2개 필드)
  - RelocateForm (위치변경, 2개 필드)
  - StatusChangeForm (상태변경, 2개 필드)
  - 모두 React Hook Form + zod

### 5. Testing Layer (1개 문서)
- **2051_26**: 단위 테스트 - L
  - API handler 테스트 (7개 endpoint × 3-5 테스트)
  - Service 테스트 (상태 전이 규칙, 과기 판정)
  - Hook 테스트 (쿼리, 뮤테이션, 캐시)
  - Component 테스트 (렌더링, 상호작용)
  - Form 테스트 (검증, 제출, 에러)
  - 목표 커버리지: ≥ 80%

## 핵심 기술 결정사항

### 1. 상태 전이 규칙 (State Transition Diagram)
```
[재고] ↔ [출고] (반납 가능)
[재고]/[출고] → [고장]
[고장] → [폐기] (유일한 경로)
[폐기] → FINAL (변경 불가)
[출고] → [폐기] (불가, 반납 후만)
```

### 2. 부분 고유 인덱스 (Partial Unique Index)
- Oracle 12c+ 지원
- `CREATE UNIQUE INDEX idx_inventory_serial_active ON inventory(serial_number) WHERE deleted_at IS NULL`
- 소프트 삭제된 레코드의 시리얼번호 재사용 가능

### 3. 이력 관리 전략 (Audit Trail)
- Inventory: soft delete 지원 (deleted_at)
- InventoryHistory: soft delete 불가 (불변 audit trail)
- 부모 삭제 후에도 이력 조회 가능

### 4. 위치 관리 이중 개념
- **current_location**: 물리적 보관 위치 (창고, 사무실)
- **checkout_location**: 논리적 사용처 (프로젝트, 사람)

### 5. 캐시 무효화 전략 (Decision 7)
| 작업 | inventory-list | inventory-detail | inventory-stats |
|------|---|---|---|
| 입고 등록 | ✓ | — | ✓ |
| 출고 처리 | ✓ | ✓ | ✓ |
| 반납 처리 | ✓ | ✓ | ✓ |
| 위치 변경 | ✓ | ✓ | ✗ |
| 상태 변경 | ✓ | ✓ | ✓ |
| 소프트 삭제 | ✓ | ✗ | ✓ |

## 복잡도 분포

| 범주 | 문서 수 | 예상 기간 |
|------|--------|---------|
| S (Simple: 0.5-1일) | 10 | 5-10 days |
| M (Medium: 1-2일) | 12 | 12-24 days |
| L (Large: 2-3일) | 4 | 8-12 days |
| **전체** | **26** | **25-46 days** |

## 권한 검증

| 기능 | USER | MANAGER | ADMIN |
|------|------|---------|-------|
| 목록 조회 | ✓ | ✓ | ✓ |
| 상세 조회 | ✓ | ✓ | ✓ (삭제된 기록 포함) |
| 입고 등록 | ✗ | ✓ | ✓ |
| 출고 처리 | ✗ | ✓ | ✓ |
| 반납 처리 | ✗ | ✓ | ✓ |
| 위치 변경 | ✗ | ✓ | ✓ |
| 상태 변경 | ✗ | ✓ | ✓ |
| 통계 조회 | ✗ | ✓ | ✓ |
| 정보 수정 | ✗ | ✗ | ✓ |
| 소프트 삭제 | ✗ | ✗ | ✓ |

## 성공 메트릭

### 기능 완성도
- 모든 User Story 구현 (9/9)
- API 테스트 커버리지 ≥ 80%

### 사용성
- 재고 목록 로드 시간 < 500ms (p95)
- 필터 적용 반응 < 200ms
- 입고 폼 제출 성공률 > 99%
- 통계 패널 갱신 시간 < 200ms (캐시 무효화 후)

### 데이터 무결성
- 중복 시리얼 번호 등록 시도 차단 (100%)
- 상태 전이 규칙 위반 방지 (100%)
- 이력 기록 완전성 (모든 변경 기록)

### 기술 성능
- API Response Time: p95 < 200ms
- Page Load (FCP): < 1.5s
- Cumulative Layout Shift (CLS): < 0.1

## 구현 시작 가이드

1. **Database Layer 우선 구현** (2051_01~02)
   - Entity 정의 후 TypeScript 검증
   - Migration 생성 및 실행

2. **API Layer 구현** (2051_03~11)
   - 각 endpoint를 순차적으로 구현
   - InventoryService 통해 비즈니스 로직 중앙화

3. **Frontend Types & Hooks** (2051_12~14)
   - 타입 정의로 TypeScript 안정성 확보
   - Hooks로 데이터 페칭 및 상태 관리

4. **Frontend Components** (2051_15~25)
   - 페이지 → 컴포넌트 → 폼 순서로 구현
   - shadcn/ui 활용하여 UI 구현

5. **Testing** (2051_26)
   - 각 레이어별 단위 테스트 작성
   - 목표 커버리지 달성 후 통합 테스트

## 파일 위치

모든 문서는 `docs/prd/` 디렉토리에 있습니다:

```
docs/prd/
├── 2051_00_구현_개요.md
├── 2051_01_Entity_정의.md
├── 2051_02_Migration_생성.md
├── 2051_03_재고_목록_조회_API.md
├── ... (23개 추가 문서)
└── 2051_26_단위_테스트.md
```

## 다음 단계

1. 각 문서를 검토하여 요구사항 확인
2. Database Layer부터 순차적으로 구현
3. API 테스트 (Postman 또는 Jest)로 검증
4. Frontend 구현 및 E2E 테스트
5. 배포 전 성공 메트릭 확인

---

**문서 생성 완료**: 2026-01-25 21:30:00 KST
**총 26개 구현 분석 문서**

