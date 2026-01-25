<!-- Generated: 2026-01-25 22:35:00 KST -->

# Discussion Topics: 고객 등록 및 조회 (CRM) PRD

문서번호: 2071
작성일: 2026-01-25
기준: 2071_고객_등록_및_조회_prd_rebuttal.md

---

## 개요

본 문서는 CRM PRD의 구현 전 논의가 필요한 10개 주요 토픽을 정리한다.
각 토픽에서 여러 선택지를 제시하고, PRD 현재 입장을 명시하며, 각 옵션의 영향을 설명한다.

---

## Topic 1: 고객 삭제 권한 (Delete Authority)

**카테고리:** RBAC (Role-Based Access Control)
**우선순위:** HIGH

### 설명

고객을 soft delete할 때 누가 권한을 가져야 하는가?
- DELETE 권한을 MANAGER에게 부여할 것인가, ADMIN만 가능하게 할 것인가?
- soft delete는 되돌리기 가능하지만, 프로젝트/기술지원 등 관련 업무에 영향을 미칠 수 있다.

### Option A: MANAGER 권한 (현재 PRD 입장)

**설명:**
- MANAGER가 고객을 soft delete 가능
- 확인 대화(confirmation dialog)로 실수 방지
- 감사 로그(CustomerHistory)로 모든 삭제 기록

**장점:**
- 현업 팀의 자율성 높음 (고객사 통합/중복 시 즉시 처리 가능)
- 데이터 정정 속도 개선
- 초기 팀 규모 작은 환경에 적합

**단점:**
- 고객이 연결된 프로젝트/기술지원 데이터 고아(orphan) 위험 낮음
- 실수로 주요 고객 삭제 가능성
- 회사 규모 커질수록 보안 리스크 증가

**영향:**
- 구현 복잡도: 낮음
- 운영 위험: 중간 (감사 로그로 보완 가능)

---

### Option B: ADMIN 권한만

**설명:**
- ADMIN만 고객 soft delete 권한 보유
- MANAGER는 "비활성화" 요청만 가능 (별도 상태 필드)
- ADMIN이 정기적으로 비활성화된 고객 정리

**장점:**
- 보안 강화 (중요 데이터 보호)
- 의도치 않은 삭제 방지
- 대기업/공공기관 규정 준수

**단점:**
- 현업 속도 저하 (ADMIN 승인 대기)
- 관리 오버헤드 증가
- 초기 팀 규모 작은 환경에는 과도한 통제

**영향:**
- 구현 복잡도: 중간 (상태 필드 추가)
- 운영 편의성: 낮음

---

### Option C: 두 가지 작업 분리

**설명:**
- PATCH /api/customers/[id]/deactivate (MANAGER) — 비활성화 표시 (별도 상태)
- DELETE /api/customers/[id] (ADMIN) — 실제 soft delete
- 고객명 unique index는 비활성화 고객도 포함하지 않음

**장점:**
- 기능 세분화로 명확한 권한 구분
- 비활성화 상태 추적 가능 (재활성화 옵션 추가 용이)
- 감사 목적으로 중간 상태 기록 가능

**단점:**
- 구현 복잡도 증가 (상태 필드 + 별도 엔드포인트)
- 담당자 권한 이해 어려움 (비활성화 vs 삭제 구분)
- 마이그레이션 스크립트 복잡

**영향:**
- 구현 복잡도: 높음 (2-3일)
- 운영 명확성: 높음

---

### 현재 PRD 입장

`DELETE /api/customers/[id]` — MANAGER 권한

### 권장 결정

**Option B (ADMIN 권한만) 추천**
- 이유: Enterprise ERP 시스템의 데이터 무결성이 우선
- soft delete는 되돌리기 가능하지만, 관련 업무에 영향 미칠 수 있음
- MANAGER 팀 규모 커질수록 보안 리스크 증가

**수정 항목:**
- Section 5.5 API 테이블: `DELETE /api/customers/[id]` → ADMIN only
- US-6 대상 사용자: "관리자(ADMIN)" 명시

---

## Topic 2: 부서별 권한 스코핑 (Department-Level RBAC)

**카테고리:** Architecture, RBAC
**우선순위:** HIGH

### 설명

MANAGER가 조회하고 수정할 수 있는 고객 범위를 어떻게 제한할 것인가?
- Phase 1: MANAGER는 모든 고객에 CRUD 권한
- Phase 2: MANAGER는 자신의 부서 또는 자신이 등록한 고객만 수정 가능?

### Option A: Phase 1 전역 권한, Phase 2 부서별 제한 (현재 PRD)

**설명:**
- Phase 1: MANAGER는 모든 고객 CRUD
- Phase 2: MANAGER는 자신의 부서 또는 자신이 담당하는 고객만 수정
- API 레벨에서 권한 필터 추가

**장점:**
- Phase 1 빠른 구현 (권한 로직 단순)
- 초기 팀 규모 작을 때 협업 용이
- 기존 고객사 관계도 직관적

**단점:**
- 팀 규모 증가 시 보안 취약점 (누군가의 고객 실수로 수정 위험)
- Phase 2 마이그레이션 필요 (기존 권한 유지 정책 결정 필요)
- 규정상 요구사항 불충족

**영향:**
- Phase 1 구현 난도: 낮음
- Phase 2 마이그레이션 복잡도: 중간

---

### Option B: Phase 1부터 부서별 스코핑

**설명:**
- 모든 MANAGER의 권한을 자신의 부서로 제한
- API: `GET /api/customers?managerId=currentUserId` 필터
- 수정/삭제도 자신이 담당하는 고객만 가능
- 부서 간 협업은 ADMIN 중재

**장점:**
- 초기부터 보안 기준 충족
- Phase 2 마이그레이션 불필요
- 대규모 팀 확장에 대비

**단점:**
- Phase 1 구현 복잡도 증가 (부서 엔티티 의존)
- MANAGER 간 고객 관리 곤란 (별도 승인 프로세스 필요)
- 초기 팀 협업 제약

**영향:**
- Phase 1 구현 난도: 높음 (2-3일 추가)
- Department 엔티티 선행 구현 필요

---

### Option C: 혼합 접근 (Hybrid)

**설명:**
- Phase 1: MANAGER는 자신이 "created_by" 또는 "manager"인 고객만 수정
- GET은 전체 조회 가능 (정보 공유)
- DELETE는 ADMIN만

**장점:**
- 초기 데이터 오염 방지 (자신이 등록한 것만 수정)
- 읽기 권한은 전사적 (정보 공유)
- Phase 2 마이그레이션 최소화

**단점:**
- 권한 규칙 복잡 (created_by vs manager 구분 필요)
- 담당자 변경 시 권한 이전 로직 필요
- 초기 설정 복잡

**영향:**
- Phase 1 구현 난도: 중간 (1-2일 추가)

---

### 현재 PRD 입장

Option A — Phase 1 전역 권한, Phase 2 부서별 제한

### 권장 결정

**Option C (혼합 접근) 또는 Option B (Phase 1 부서별)**
- 이유: 초기 데이터 무결성이 중요
- Option C가 현실적: 읽기 공유, 쓰기 제한
- Option B는 Department 엔티티 선행 구현 필요 시 검토

**필수 수정:**
- 명확한 부서별 권한 전략 정의 필요 (현재 PRD는 "Phase 2에서 정의"로만 표기)
- Phase 1/2 경계 명시

---

## Topic 3: CustomerHistory 추적 범위 (Audit Log Scope)

**카테고리:** Database, Audit Trail
**우선순위:** MEDIUM

### 설명

CustomerHistory에서 어떤 필드 변경을 추적할 것인가?
- 현재: 모든 필드 변경 기록
- 대안: 주요 필드만 추적 (name, classification, managerId)

### Option A: 모든 필드 추적 (현재 PRD)

**설명:**
- 모든 필드 변경을 JSON으로 기록
- created_at, updated_at, memo 등 모든 변경 포함
- 이력 조회 시 필터링 (선택적 필드만 보기)

**장점:**
- 완전한 감사 추적 (Enterprise 요구사항)
- 금융감시, 규제 대응 용이
- 분석 가능성 높음 (모든 변경 기록)

**단점:**
- 이력 레코드 증가 (저장소 비용)
- 조회 성능 영향 (JSON 파싱)
- 초기 팀 규모에는 과도함

**영향:**
- 저장소: +20-30% (고객당 이력 10-20개 예상)
- 조회 성능: 미미 (필터링은 애플리케이션 레벨)

---

### Option B: 주요 필드만 추적

**설명:**
- 선택 필드만 기록: name, classification, managerId, status
- 메모, 주소 등은 추적 제외
- 담당자 변경은 별도 로직 (CUSTOMER_CONTACT_HISTORY)

**장점:**
- 저장소 효율 (이력 레코드 50% 감소)
- 조회 성능 개선 (JSON 크기 작음)
- 핵심 변경만 집중

**단점:**
- 세부 감사 정보 손실
- 나중에 추적 범위 확대 어려움 (마이그레이션 필요)
- 규제 대응 불완전

**영향:**
- 저장소: -30%
- 조회 성능: 약간 향상

---

### Option C: 계층적 추적

**설명:**
- CUSTOMER_HISTORY: 고객 기본 정보만 (name, classification, managerId)
- CUSTOMER_CONTACT_HISTORY: 담당자 변경만
- MEMO_HISTORY (선택): 메모 변경 기록

**장점:**
- 데이터 격리로 명확성 높음
- 각 엔티티의 이력을 독립적으로 관리
- 조회 성능 최적화 (특정 변경만 빠르게 검색)

**단점:**
- 엔티티 증가 (테이블 3개)
- 구현 복잡도 높음
- 통합 조회 필요 시 조인 복잡

**영향:**
- 구현 복잡도: 높음 (1일 추가)
- 조회 유연성: 높음

---

### 현재 PRD 입장

Option A — 모든 필드 추적

### 권장 결정

**Option A 유지** (현재 PRD 입장 타당)
- 이유: Enterprise ERP는 완전한 감사 추적 필수
- 초기 이력 증가량은 미미 (고객 100개, 이력 1000개 기준 ~ 10MB)
- 나중에 필터링 추가 가능 (변경 최소)

**선택사항:** Option C로 세밀한 이력 추적 (Phase 2)

---

## Topic 4: CustomerContact와 Employee 별도 관리

**카테고리:** Architecture, Data Model
**우선순위:** MEDIUM

### 설명

CustomerContact를 Employee 테이블과 동기화할 것인가, 아니면 완전히 독립적으로 관리할 것인가?

### Option A: 완전히 독립적 (현재 PRD)

**설명:**
- CustomerContact는 Customer 전용 테이블
- Employee와 FK 관계 없음
- 고객사 담당자 정보는 자유 입력 (시스템 직원과 무관)

**장점:**
- 도메인 분리 명확 (직원 vs 외부 담당자)
- 고객사 담당자 변경이 직원 정보와 무관
- 유연한 정보 관리

**단점:**
- 중복 데이터 가능 (시스템 직원이 고객사 담당자로도 등록)
- 동기화 로직 없음 (직원 이름 변경 시 CustomerContact는 미반영)
- 업무 효율성 낮음 (담당자 검색 시 두 테이블 조회)

**영향:**
- 구현 복잡도: 낮음
- 데이터 유지보수: 중간

---

### Option B: Employee 참조 (외부 키)

**설명:**
- CustomerContact에 employee_id (nullable FK) 추가
- 시스템 직원이 담당자이면 FK 참조
- 외부 담당자는 직접 입력 (employee_id = NULL)

**장점:**
- 유연성 (시스템 직원 + 외부 담당자 모두 지원)
- 직원 정보 동기화 (이름, 부서 Employee에서 읽음)
- 담당자 검색 통합

**단점:**
- 엔티티 복잡도 증가 (nullable FK)
- 데이터 일관성 위험 (employee 삭제 시 FK 처리)
- 마이그레이션 필요 (Phase 1 후 추가)

**영향:**
- 구현 복잡도: 중간 (0.5일)
- 데이터 무결성: 중간

---

### Option C: 완전 동기화 (Employee 필수)

**설명:**
- CustomerContact는 employee_id (NOT NULL FK) 필수
- 모든 담당자는 먼저 Employee로 등록
- 외부 담당자도 Employee 테이블에 생성

**장점:**
- 완전한 동기화 (모든 담당자가 Employee)
- 직원 관리 시스템과 일원화
- 담당자 통합 검색 용이

**단점:**
- 외부 담당자도 Employee 등록 필수 (UX 복잡)
- 조직도 오염 (외부 담당자가 Employee에 섞임)
- 직원 삭제 불가능 (FK 제약)

**영향:**
- 구현 복잡도: 높음 (다단계 등록)
- 운영 오버헤드: 높음

---

### 현재 PRD 입장

Option A — 완전히 독립적

### 권장 결정

**Option B (Employee 참조, nullable FK) 권장**
- 이유: 유연성과 동기화의 균형
- 시스템 직원은 자동 동기화, 외부 담당자는 자유 입력
- Phase 2에서 구현 가능 (현재는 Option A 진행)

**현재 PRD:** Option A 유지 (적절)

---

## Topic 5: 고객 코드 생성 전략 (Customer Code Generation)

**카테고리:** Database, Architecture
**우선순위:** MEDIUM

### 설명

고객 코드(CUST-0001)를 누가 생성하는가?
- Oracle SEQUENCE: 데이터베이스에서 생성
- 애플리케이션: Node.js 로직에서 생성

### Option A: Oracle SEQUENCE (현재 PRD)

**설명:**
```sql
CREATE SEQUENCE cust_code_seq
INCREMENT BY 1
START WITH 1;

INSERT INTO customer (code) VALUES ('CUST-' || LPAD(cust_code_seq.nextval, 5, '0'));
```

**장점:**
- 동시성 보장 (여러 요청이 동시 등록해도 코드 중복 없음)
- 데이터베이스 기본 기능
- 다른 언어/앱에서도 동일 코드 생성

**단점:**
- Oracle 의존성 (마이그레이션 어려움)
- 코드 포맷 변경 시 데이터베이스 수정 필요
- TypeORM에서 지원 복잡 (raw query 필요)

**영향:**
- 구현: 중간 (마이그레이션 + 서비스 로직)
- 유연성: 낮음

---

### Option B: 애플리케이션 로직 (Nanoid)

**설명:**
```typescript
import { customAlphabet } from 'nanoid';

const generateCustomerCode = () => {
  const seq = sequenceGenerator.next('customer');
  return `CUST-${String(seq).padStart(5, '0')}`;
};
```

**장점:**
- TypeORM과 자연스러운 통합
- 코드 포맷 유연성 (언제든 변경 가능)
- 테스트 용이 (mock generator)

**단점:**
- 동시성 관리 필수 (Redis/Cache 필요)
- 여러 인스턴스에서 중복 가능 (클러스터 환경)
- 데이터베이스 독립성 없음

**영향:**
- 구현: 중간 (Cache 기반 sequence 구현)
- 확장성: 낮음

---

### Option C: UUID 기반 (고유 ID 활용)

**설명:**
- 고객 코드를 UUID로 생성 (CUST-{short-uuid})
- 또는 고객 ID 자체를 사용 (이미 unique)
- 사용자 입력은 "Display Name" 별도 필드

**장점:**
- 코드 생성 로직 불필요
- 동시성 보장 (UUID 본질)
- 분산 시스템에 적합

**단점:**
- 사용자 친화성 낮음 (UUID는 기억하기 어려움)
- 기존 고객 관리 관례 위반
- "고객 코드"의 의미 퇴색

**영향:**
- 구현: 낮음
- UX: 낮음

---

### 현재 PRD 입장

Option A — Oracle SEQUENCE

### 권장 결정

**Option A 유지** (현재 PRD 입장 타당)
- 이유: 보수적이고 확실한 방식
- SEQUENCE는 Oracle 표준 기능
- TypeORM migration에서 raw SQL로 구현 가능

**대안:** Option B (나중에 마이크로서비스로 확장 시 고려)

---

## Topic 6: 부분 고유 인덱스 (Partial Unique Index)

**카테고리:** Database
**우선순위:** MEDIUM

### 설명

고객명 중복을 방지하되, soft delete된 고객은 제외하는 방법?

### Option A: Partial Unique Index (현재 PRD)

**설명:**
```sql
CREATE UNIQUE INDEX idx_customer_name_active
ON customer(name) WHERE deleted_at IS NULL;
```

**장점:**
- 데이터베이스 차원의 무결성 보장
- 쿼리 성능 우수
- Oracle 21c에서 완전 지원

**단점:**
- Oracle 특화 기능 (다른 DB 호환성 낮음)
- TypeORM에서 직접 지원 안 함 (migration raw SQL 필요)
- Index 생성 문법 복잡

**영향:**
- 구현: 중간 (migration 파일)
- 유지보수: 낮음

---

### Option B: 애플리케이션 검증

**설명:**
```typescript
const checkDuplicate = async (name: string, excludeId?: number) => {
  const existing = await customerRepo.findOne({
    where: {
      name,
      deletedAt: IsNull(),
      ...(excludeId && { id: Not(excludeId) })
    }
  });
  if (existing) throw new Error('중복된 고객명');
};
```

**장점:**
- 구현 간단 (SQL 생성 불필요)
- 모든 DB에서 동작
- TypeORM 표준 쿼리 사용

**단점:**
- 동시성 이상(race condition) 가능 (두 요청이 동시에 중복 체크)
- Race condition 방지하려면 별도 트랜잭션 필요
- 성능: 매번 쿼리 필요

**영향:**
- 구현: 낮음
- 동시성 안정성: 위험

---

### Option C: Unique Constraint + Trigger

**설명:**
```sql
CREATE UNIQUE INDEX idx_customer_name_all ON customer(name);

CREATE TRIGGER tr_customer_name_check
BEFORE INSERT ON customer
FOR EACH ROW
BEGIN
  IF new.deleted_at IS NOT NULL THEN
    new.name := CONCAT(new.name, '_', new.id);
  END IF;
END;
```

**장점:**
- 데이터베이스 무결성
- 동시성 보장

**단점:**
- Trigger 복잡 (유지보수 어려움)
- 삭제된 고객명 변조 (UX 문제)
- Oracle 전용

**영향:**
- 구현: 높음
- 유지보수: 매우 어려움

---

### 현재 PRD 입장

Option A — Partial Unique Index

### 권장 결정

**Option A 유지** (타당)
- 이유: Oracle 표준 기능, 가장 확실한 방식
- Migration에서 raw SQL 구현 필요 (문서화 필수)

**참고:** TypeORM에서 partial index 미지원 시 다음과 같이 처리:
```typescript
// src/database/migrations/[timestamp]-CreateCustomerTable.ts
await queryRunner.query(`
  CREATE UNIQUE INDEX idx_customer_name_active
  ON customer(name) WHERE deleted_at IS NULL
`);
```

---

## Topic 7: 캐시 전략 (Caching Strategy)

**카테고리:** Performance, State Management
**우선순위:** MEDIUM

### 설명

TanStack Query 캐시의 staleTime과 gcTime을 어떻게 설정할 것인가?

### Option A: 현재 PRD (보수적)

**설명:**
- customers-list: staleTime 5분, gcTime 30분
- customers-detail: staleTime 10분, gcTime 30분
- customers-search: staleTime 1분, gcTime 10분

**장점:**
- 데이터 신선도 높음 (5분 후 stale)
- 사용자 기대 만족 (항상 최신)
- 구현 단순

**단점:**
- 서버 부하 높음 (자주 리페치)
- API 호출 증가
- 네트워크 대역폭 소비

**영향:**
- 서버 부하: 중간
- 사용자 경험: 우수

---

### Option B: 공격적 캐싱

**설명:**
- customers-list: staleTime 30분, gcTime 1시간
- customers-detail: staleTime 30분, gcTime 1시간
- customers-search: staleTime 5분, gcTime 30분

**장점:**
- 서버 부하 감소 (리페치 최소화)
- API 호출 감소
- 네트워크 효율성

**단점:**
- 데이터 신선도 낮음 (30분 구 데이터 가능)
- 협업 환경에서 동기화 문제 (A가 수정해도 B는 캐시된 구 데이터 봄)
- 사용자 혼란

**영향:**
- 서버 부하: 낮음
- 사용자 경험: 낮음

---

### Option C: 상황별 캐싱 (Adaptive)

**설명:**
- 목록 페이지: staleTime 5분 (자주 변경)
- 상세 페이지 (조회만): staleTime 10분 (변경 후 상세 이동)
- 상세 페이지 (수정 중): staleTime 0 (즉시 stale)
- 검색: staleTime 1분 (자동 완성은 빠름)

**장점:**
- 컨텍스트별 최적화
- 사용자 경험 + 서버 효율 균형
- 수정 후 자동 리페치

**단점:**
- 구현 복잡 (상황 분기 필요)
- 테스트 어려움
- 캐시 전략 이해 필요

**영향:**
- 구현: 중간 (1일)
- 유지보수: 중간

---

### 현재 PRD 입장

Option A (보수적 캐싱)

### 권장 결정

**Option A 유지** (현재 PRD 입장 타당)
- 이유: 초기 구현은 보수적으로 시작, 성능 메트릭 기반 조정
- Phase 2에서 성능 분석 후 Option C로 전환 가능

**성능 모니터링:**
- API 호출 수 / 시간 추적
- 캐시 hit rate 모니터링
- 필요 시 Phase 2에서 adaptive caching 도입

---

## Topic 8: MANAGER 권한 범위 재검토 (MANAGER Scope)

**카테고리:** RBAC, Architecture
**우선순위:** HIGH

### 설명

현재 PRD에서 MANAGER는 모든 API에서 POST/PUT/DELETE 권한을 가진다.
다음 작업별로 권한을 다시 정의할 필요가 있는가?

1. 고객 등록 (POST) — MANAGER?
2. 고객명/분류 수정 (PUT) — MANAGER?
3. 담당자 추가/수정/삭제 — MANAGER?
4. 고객 soft delete (DELETE) — MANAGER? or ADMIN?

### Option A: 현재 PRD (균등한 MANAGER 권한)

**설명:**
```
USER: GET only
MANAGER: GET, POST, PUT, DELETE (모두 권한)
ADMIN: GET, POST, PUT, DELETE + future hard delete
```

**장점:**
- 명확한 권한 구조 (USER vs MANAGER vs ADMIN)
- 초기 구현 간단
- MANAGER 자율성

**단점:**
- 고객 등록과 삭제가 같은 권한 (불균형)
- 실수로 인한 고객 삭제 위험
- 세밀한 권한 제어 불가

**영향:**
- 구현: 낮음

---

### Option B: 작업별 권한 분리

**설명:**
```
USER: GET only
MANAGER:
  - GET /api/customers (모두)
  - POST /api/customers (등록 가능)
  - PUT /api/customers/[id] (수정 가능)
  - DELETE /api/customers/[id] — 불가 ❌
  - POST /api/customers/[id]/contacts (담당자 추가)
  - PUT /api/customers/[id]/contacts/[contactId] (담당자 수정)
  - DELETE /api/customers/[id]/contacts/[contactId] (담당자 삭제)

ADMIN: 모두 + DELETE /api/customers/[id]
```

**장점:**
- 고객 삭제는 ADMIN만 (데이터 보호)
- 담당자 관리는 MANAGER (운영 자율성)
- 균형잡힌 권한

**단점:**
- 권한 규칙 복잡 (기억하기 어려움)
- 구현 복잡도 증가

**영향:**
- 구현: 중간
- 명확성: 높음

---

### Option C: 역할별 세분화

**설명:**
```
USER: 조회 전용
SALES_MANAGER: 고객 등록/수정, 담당자 관리 (영업 관점)
ADMIN: 모든 작업 + 고객 삭제
```

**장점:**
- 역할 명확 (SALES_MANAGER의 책임 한정)
- 확장 가능 (다른 역할 추가 용이)

**단점:**
- 역할 증가 (관리 복잡)
- NextAuth.js에서 역할 정의 필요
- 마이그레이션 고민

**영향:**
- 구현: 높음
- 유지보수: 복잡

---

### 현재 PRD 입장

Option A (균등한 MANAGER 권한)

### 권장 결정

**Option B 추천** (작업별 권한 분리)
- DELETE는 ADMIN만
- 나머지 MANAGER는 유지
- 이유: Topic 1과 일관성 (고객 삭제는 ADMIN 결정)

**실행 항목:**
- Section 5.5 API 테이블 수정: DELETE 권한 ADMIN으로 상향
- 코드 구현 시 권한 체크 분리

---

## Topic 9: 담당자 주요 담당자 플래그 (Primary Contact Flag)

**카테고리:** Database, UX
**우선순위:** LOW

### 설명

CustomerContact.primary_contact 필드의 사용 방법?
- 고객당 주요 담당자 1명만?
- 여러 명 가능?
- 자동 지정 또는 수동?

### Option A: 하나의 primary contact (현재 PRD)

**설명:**
- 고객당 정확히 1명만 primary_contact = true
- 새로운 담당자가 primary로 지정되면, 기존 primary는 자동 false
- API: 담당자 추가 시 "주요 담당자로 설정" 체크박스

**장점:**
- 단순하고 명확
- 고객의 "대표 담당자" 개념 일관성
- 목록에서 주요 담당자만 표시 가능

**단점:**
- 동일 비중 담당자들 중복 가능성
- 변경 시마다 업데이트 필요

**영향:**
- 구현: 낮음

---

### Option B: 여러 primary contacts 가능

**설명:**
- primary_contact boolean을 관리자가 필요한 만큼 true로 설정
- 고객 목록에서 모든 primary 담당자 표시

**장점:**
- 유연성 높음 (다양한 담당자 조합)
- 부서별 담당자 등록 가능

**단점:**
- 의미 모호 (primary가 아니게 될 수 있음)
- 뷰 로직 복잡 (모든 primary 필터링)

**영향:**
- 구현: 낮음
- 유지보수: 중간

---

### Option C: primary_contact 제거, 등록 순서로 결정

**설명:**
- primary_contact 필드 삭제
- 첫 등록된 담당자 = 주요 담당자 (정렬 순서)
- 담당자 목록에서 첫 번째만 강조

**장점:**
- DB 간단화
- 자동 지정 (결정 없음)

**단점:**
- 주요 담당자 변경 불가 (삭제 후 재등록 필요)
- 불명확한 기준

**영향:**
- 구현: 낮음
- 유연성: 낮음

---

### 현재 PRD 입장

Option A (하나의 primary contact)

### 권장 결정

**Option A 유지** (현재 PRD 입장 타당)
- 이유: 명확하고 구현 간단
- 고객 목록에서 primary 담당자 표시 가능
- Phase 2에서 필요시 Option B로 확장

---

## Topic 10: 메모 히스토리 추적 (Memo History)

**카테고리:** Audit Trail, Database
**우선순위:** LOW

### 설명

고객 메모 변경을 별도로 추적할 것인가?
- 현재: CustomerHistory의 changed_fields에 포함
- 대안: 별도 테이블 (CUSTOMER_MEMO_HISTORY)

### Option A: CustomerHistory에 포함 (현재 PRD)

**설명:**
```json
{
  "fieldName": "memo",
  "before": "이전 메모...",
  "after": "새로운 메모..."
}
```

**장점:**
- 테이블 수 최소화
- 모든 변경을 한 곳에서 조회
- 구현 간단

**단점:**
- JSON 크기 증가 (메모는 최대 1000자)
- 메모만 따로 조회 불편
- Phase 1에서 메모 이력 기록 미실장 (Phase 2 계획)

**영향:**
- 구현: 낮음

---

### Option B: 별도 테이블 (CUSTOMER_MEMO_HISTORY)

**설명:**
```sql
CREATE TABLE customer_memo_history (
  id NUMBER PRIMARY KEY,
  customer_id NUMBER NOT NULL,
  memo CLOB,
  changed_at TIMESTAMP,
  changed_by_id NUMBER
);
```

**장점:**
- 메모 히스토리만 빠르게 조회
- 메모와 다른 필드 변경 구분
- Phase 2 "메모 변경 이력 보기" 기능 용이

**단점:**
- 테이블 증가 (관리 복잡)
- CustomerHistory와 분리된 감사 로그
- 구현 복잡도 증가

**영향:**
- 구현: 중간 (별도 엔티티, API)

---

### Option C: 메모 히스토리 추적 안 함

**설명:**
- Phase 1: 메모는 최신 버전만 저장
- Phase 2: 메모 히스토리 추가 검토

**장점:**
- Phase 1 범위 축소
- 초기 구현 빠름

**단점:**
- 메모 감사 추적 없음 (요구사항 부분 미충족)
- Phase 2에서 마이그레이션 필요

**영향:**
- 구현: 낮음 (기능 생략)

---

### 현재 PRD 입장

Option A (CustomerHistory에 포함, Phase 2 고려)

### 권장 결정

**Option A 유지** (현재 PRD 입장 타당)
- 이유: Phase 1은 메모 필드만, 이력 기록은 Phase 2
- 통합 감사 로그 유지
- 나중에 별도 테이블로 분리 가능

**Phase 2 고려:**
- 메모 이력 조회 기능 추가 시 Option B 검토

---

## 종합 의사결정 제안

### 현재 PRD 유지 항목 (Approved)
- CustomerHistory 모든 필드 추적 (Topic 3)
- CustomerContact 독립 엔티티 (Topic 4)
- Oracle SEQUENCE 기반 고객 코드 (Topic 5)
- Partial Unique Index (Topic 6)
- 캐시 전략 (Topic 7)
- Primary contact 하나 제한 (Topic 9)
- 메모 히스토리 통합 (Topic 10)

### 권장 수정 항목 (Recommended Changes)
1. **DELETE 권한 → ADMIN** (Topic 1 & 8)
2. **부서별 권한 전략 명확화** (Topic 2) — Phase 1/2 경계 정의 필요
3. **MANAGER 권한 분리:** DELETE 제외 (Topic 8)

### 향후 검토 항목 (Future Phases)
- Employee 참조 추가 (Topic 4, Phase 2)
- Adaptive caching (Topic 7, Phase 2)
- 메모 별도 히스토리 테이블 (Topic 10, Phase 2)

---

**작성자:** Claude Code (Rebuttal Agent)
**작성일:** 2026-01-25
**상태:** Ready for Discussion & Decision
