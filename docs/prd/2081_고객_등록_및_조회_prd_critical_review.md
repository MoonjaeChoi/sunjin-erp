<!-- Generated: 2026-01-25 23:45:00 KST -->

# Critical Review: 고객 등록 및 조회 (CRM) PRD (2081)

**작성일:** 2026-01-25
**검토자:** Claude Code (Critic Agent)
**상태:** Critical Review Complete

---

## Executive Summary

이 PRD는 sunjin-erp의 고객 관리(CRM) 모듈의 전체 요구사항을 포괄적으로 정의하고 있으며, 전반적으로 **구조와 기술 스택이 일관성 있게 정리**되어 있다. 다만 **8개 주요 구간에서 해결이 필요한 문제**가 있다: (1) 담당자 추가 시 필드 중복성으로 인한 데이터 모델 혼란, (2) 부서별 권한 스코핑 정의 부족, (3) "관련 업무" 기능의 구현 범위 불명확, (4) 담당자 삭제 시 참조 무결성 전략 부재, (5) 소프트 삭제 후 복구 전략 미정, (6) 대규모 고객 목록 성능 우려, (7) 타 모듈과의 통합 인터페이스 부재, (8) 비즈니스 로직과 권한 검증의 일관성 부족.

이러한 문제들은 Phase 1 구현 단계에서 **명확한 결정과 추가 스펙 작성**이 필요하다. 이 검토는 구체적인 해결 방안과 함께 각 문제를 제시한다.

---

## Critical Review Points

### 1. 담당자 필드 중복성 문제 (HIGH)

**설명:**
PRD 5.3 Database 섹션과 4.1 Scope 섹션에서 CUSTOMER_CONTACT 엔티티의 필드 정의에 **모호함과 중복성**이 있다:
- CUSTOMER 테이블에는 `created_by_id (FK → Employee)` 필드가 있음
- CUSTOMER_CONTACT 엔티티의 메타데이터 `created_by`는 명시되지 않음
- US-4에서 "담당자 추가 시 필수 필드: 이름, 직급, 이메일, 전화번호"라고 했으나, CUSTOMER 테이블의 "대표 담당자" 정보(대표 전화, 대표 이메일)와의 관계가 명확하지 않음

**영향:**
- 담당자 추가 시 `CUSTOMER.created_by_id`와 `CUSTOMER_CONTACT` 중 어느 것이 "담당 직원"인지 혼동
- API 응답에서 `managerId`와 `contactId`의 차별성 불명확
- 프로젝트/기술지원 모듈에서 "담당자"를 어느 엔티티에서 가져올지 불명확

**해결 방안:**
1. 용어 표준화:
   - `CUSTOMER.created_by_id` → **담당 직원(Manager/Employee)** 또는 삭제 후 **담당 팀/부서만 추적**
   - `CUSTOMER_CONTACT` → **고객 연락처(Contact Person)** - 고객사 측 담당자
2. CUSTOMER 테이블에 `primary_contact_id (FK → CUSTOMER_CONTACT, nullable)` 추가로 "대표 담당자" 지정 가능하게 함
3. API 응답에서 명확히 분리:
   ```json
   {
     "manager": { "id": 5, "name": "이영업", "role": "MANAGER" },
     "primaryContact": { "id": 10, "name": "김고객", "title": "과장" },
     "contacts": [...]
   }
   ```

**우선순위:** HIGH (데이터 모델 설계의 기초)

---

### 2. 부서별 권한 스코핑 불완전 (HIGH)

**설명:**
Section 5.5 & 5.6에서 "MANAGER는 자신의 부서 또는 자신이 등록/담당하는 고객에만 수정 권한"이라고 명시되어 있으나:
- **Phase 1에서는 구현하지 않음**으로 결정 (5.6)
- 그러나 API 레벨 권한 검증 코드가 어떻게 구현될지 명확하지 않음
- US-2와 US-3에서 "팀 또는 부서별 고객 관리"라는 요구사항이 있으나, Phase 1에서는 전체 고객 조회만 가능

**영향:**
- Phase 1 완료 후 Phase 2로의 마이그레이션 시 데이터 스키마 변경 필요 가능성
- 현재 MANAGER 권한의 비즈니스 로직이 명확하지 않아 테스트 작성 어려움
- 다중 부서 환경에서 운영 시 권한 범위 초과 우려

**해결 방안:**
1. Phase 1 결정을 명시적으로 재정의:
   ```
   Phase 1 권한 모델:
   - USER: 모든 고객 조회 (read-only)
   - MANAGER: 모든 고객 CRUD (제약 없음)
   - ADMIN: 모든 권한 + hard delete (Phase 2)
   ```
2. Phase 2 마이그레이션 계획 작성 (별도 문서):
   - 부서 FK 추가 시 기존 MANAGER의 부서 자동 할당 규칙
   - API 권한 검증 로직 리팩토링 (예: `canUpdateCustomer(userId, customerId, departmentId)`)

**우선순위:** HIGH (아키텍처 일관성)

---

### 3. "관련 업무" 기능의 모호한 범위 (MEDIUM)

**설명:**
US-3에서 "관련 업무" 섹션 요구사항:
```
"관련 업무" 섹션에서 프로젝트, 기술지원, 유지보수 건 수 요약 표시
각 항목 클릭 시 해당 모듈의 필터된 페이지로 이동 가능
```

그러나:
- 이 기능이 **이 PRD의 범위에 포함되는가?** (Section 4.1에 없음)
- 프로젝트/기술지원/유지보수 모듈이 **아직 구현되지 않았는가?** (현재 개발 단계 기준 2081은 Phase 1 모듈)
- 링크 생성 시 필터링 로직 (`GET /api/projects?customerId=X` 등)이 존재하는가?

**영향:**
- 고객 상세 페이지 개발 시 미완성 기능으로 인한 개발 지연
- 타 모듈과의 통합 API 계약 부재
- 향후 "관련 업무" 추가 시 고객 상세 컴포넌트 다시 수정 필요

**해결 방안:**
1. 범위 재정의:
   - **Option A (현재 범위 축소):** "관련 업무"를 Phase 2로 미연기 → US-3 수정 (기본정보, 담당자만)
   - **Option B (현재 포함):** 타 모듈 API 계약 명시
     ```
     GET /api/projects?customerId={id}&status=active → { totalCount, list }
     GET /api/techsupport?customerId={id} → { totalCount, list }
     GET /api/maintenance?customerId={id} → { totalCount, list }
     ```
2. 선택한 옵션에 따라 Section 4.1 및 UI Layout (6.2) 업데이트

**우선순위:** MEDIUM (구현 일정에 영향)

---

### 4. 담당자 삭제 시 참조 무결성 전략 부재 (MEDIUM)

**설명:**
US-4에서 담당자 삭제 규칙:
```
담당자 삭제 시 soft delete (deleted_at) 처리하되, 과거 프로젝트/기술지원에는 영향 없음
```

그러나:
- 담당자가 **프로젝트의 담당자로 지정**되어 있으면 어떻게 하는가?
- `CUSTOMER_CONTACT`에 FK가 없으므로 상세 설명 불가능
- "과거"와 "현재" 프로젝트의 구분 기준이 무엇인가?
- 담당자 삭제 후 프로젝트 상세 페이지에서 담당자 정보 조회 시 어떻게 표시할 것인가?

**영향:**
- 타 모듈(프로젝트, 기술지원)의 데이터 무결성 관리 불명확
- API 개발 시 에러 처리 전략 부재 (삭제 불가 vs 강제 삭제)

**해결 방안:**
1. 참조 무결성 정책 정의:
   ```
   정책 A (강제 soft delete):
   - 담당자 삭제 시 참조하는 모든 프로젝트/이슈에서
     contact_id를 NULL로 변경 후 로그 기록

   정책 B (삭제 방지):
   - 담당자가 현재 활성 프로젝트에 참조되면
     HTTP 409 Conflict 응답 (담당자 변경 후 재시도 유도)

   정책 C (감정 추적):
   - 삭제된 담당자를 "비활성" 상태로 보존
     (deleted_at 대신 status='INACTIVE' 사용)
   ```
2. 선택한 정책에 따라 API 응답 스키마 및 에러 메시지 작성

**우선순위:** MEDIUM (타 모듈 통합 시 필수)

---

### 5. 소프트 삭제 후 복구 전략 미정 (MEDIUM)

**설명:**
Section 4.2에서 "삭제된 고객 복구 기능"을 Phase 2로 미연기했으나:
- **현재 Phase 1에서 soft delete를 하면 데이터가 물리적으로 남음** → 저장 공간 낭비 (미래 문제)
- 관리자가 실수로 삭제한 고객을 조회할 방법이 없음 (includeDeleted는 ADMIN만)
- "복구" 기능 없이 soft delete만 하면 규정 준수 차원에서 **감사 추적 불완전** (삭제 후 복구 이력 부재)

**영향:**
- Phase 2에서 "복구" 기능 추가 시 고객 상세 페이지 다시 수정
- 현재 권한 모델 (ADMIN만 볼 수 있음)이 비즈니스 요구 불일치

**해결 방안:**
1. Phase 1 내 최소 기능 추가 (비활성화 표시만):
   ```
   상세 페이지:
   - 삭제된 고객: 헤더에 [비활성] 배지 표시
   - ADMIN만 [복구] 버튼 표시 (Phase 2 구현)
   - 관련 업무/담당자는 조회 가능하되 "비활성 고객" 표시
   ```
2. Phase 2 계획 문서에 "복구 API" 스펙 추가

**우선순위:** MEDIUM (향후 운영 효율성)

---

### 6. 대규모 고객 목록 성능 우려 (MEDIUM)

**설명:**
Section 5.8 성능 최적화에서:
- **API Response Time 목표:** p95 < 200ms
- **Pagination:** 기본 20개, 최대 100개
- **Index:** name, classification, deleted_at, customer_id 정의

그러나:
- 고객이 **수 만 건 규모**로 증가했을 때 `name` LIKE 검색 성능 고려?
  - Oracle의 LIKE 쿼리는 INDEX를 활용하지 못할 수 있음 (선행 와일드카드 미사용)
- `classification` 필터 + `name` 검색 조합 시 복합 인덱스 필요?
- 고객 목록 조회 시 담당자(managerId) 정보도 조인하는데, N+1 쿼리 문제?

**영향:**
- 수 만 건 이상 고객이 있을 때 응답 시간 200ms 초과 가능성
- 검색 성능 저하로 사용자 경험 악화

**해결 방안:**
1. 인덱스 전략 상세화:
   ```sql
   -- 기존
   CREATE INDEX idx_customer_name ON CUSTOMER(name);
   CREATE INDEX idx_customer_classification ON CUSTOMER(classification);

   -- 추가
   CREATE INDEX idx_customer_search
     ON CUSTOMER(name, classification, created_by_id)
     WHERE deleted_at IS NULL;

   -- 전문(Full-text) 검색 고려 (Phase 2)
   CREATE INDEX idx_customer_name_fulltext ON CUSTOMER(name);
   ```
2. 쿼리 최적화:
   ```sql
   -- 담당자 정보 JOIN 고려 (N+1 방지)
   SELECT c.*, e.id manager_id, e.name manager_name
   FROM CUSTOMER c
   LEFT JOIN EMPLOYEE e ON c.created_by_id = e.id
   WHERE c.deleted_at IS NULL
   ORDER BY c.name
   LIMIT 20;
   ```
3. 성능 테스트 계획 추가 (10만 건 이상 데이터로 p95 측정)

**우선순위:** MEDIUM (구현 전 사전 검토 필요)

---

### 7. 타 모듈 통합 인터페이스 부재 (MEDIUM)

**설명:**
PRD는 "고객 관리" 자체에만 초점을 맞추고, **프로젝트, 기술지원, 유지보수 모듈과의 통합 인터페이스가 명시되지 않음**:
- 프로젝트 등록 시 "고객 선택" 필드가 있어야 하는데, API 계약 부재
- 고객 자동 완성 (`useCustomerSearch` Hook)의 응답 형식이 다른 모듈에서 기대하는 형식과 일치하는가?
- 고객 삭제(soft) 후 타 모듈에서 삭제된 고객을 제외하고 조회하는 로직이 각 모듈마다 다르면 일관성 문제

**영향:**
- 타 모듈 개발팀이 고객 선택 UI를 중복 구현할 가능성
- API 응답 형식 불일치로 인한 통합 오류
- 소프트 삭제 고객 필터링 로직 분산

**해결 방안:**
1. 공유 인터페이스 문서 작성 (별도 파일: `2081_integration_guide.md`):
   ```
   모든 모듈이 고객 선택 UI로 사용할 수 있는 공용 컴포넌트:
   - <CustomerCombobox customerId={id} onSelect={handleSelect} />

   API 계약:
   - GET /api/customers/search?q=name → { id, name, classification, email }
   - GET /api/customers?status=active → 삭제되지 않은 고객만 반환
   ```
2. `useCustomerSearch` Hook의 응답 형식 명시:
   ```typescript
   interface CustomerSearchResult {
     id: number;
     name: string;
     code: string;
     classification: 'RESELLER' | 'END_USER' | 'MAINTENANCE' | 'GENERAL';
     email?: string;
     phone?: string;
   }
   ```

**우선순위:** MEDIUM (Phase 2 이상 모듈 개발 시 필수)

---

### 8. 비즈니스 로직과 권한 검증의 일관성 부족 (MEDIUM)

**설명:**
Section 5.5 & 5.7에서 권한 검증 규칙이 혼재:
- "API 레벨에서 권한 검증"이라고 했으나, 예를 들어:
  - `PUT /api/customers/[id]` 수정 시 "자신이 등록한 고객만" 수정 가능한가?
  - 아니면 "모든 MANAGER가 모든 고객을 수정" 가능한가? (5.6에서는 Phase 2라고 했으나)
  - **담당자 추가/수정/삭제도 같은 규칙인가?**

**영향:**
- API 개발자가 권한 검증 로직을 모호하게 해석할 가능성
- 단위 테스트 케이스 작성 시 기준점 부재

**해결 방안:**
1. API별 상세 권한 규칙 작성:
   ```
   PUT /api/customers/[id]:
   - 권한: MANAGER 이상
   - 추가 조건 (Phase 1):
     * MANAGER: 제약 없음 (모든 고객 수정 가능)
     * ADMIN: 제약 없음
   - 추가 조건 (Phase 2 계획):
     * MANAGER: 자신의 부서 또는 자신이 등록한 고객만

   PUT /api/customers/[id]/contacts/[contactId]:
   - 권한: MANAGER 이상
   - 추가 조건: 해당 고객(customerId) 수정 권한이 있어야 함
   ```
2. API Route Handler 템플릿에 권한 검증 치크리스트 포함

**우선범위:** MEDIUM (구현 단계 오류 방지)

---

### 9. 고객 코드 자동 생성 규칙의 동시성 문제 (LOW)

**설명:**
Section 5.3 & 9 Open Questions에서 고객 코드를 Oracle SEQUENCE로 자동 생성한다고 했으나:
```
코드 생성 규칙: CUST-{5digit-seq}
예: CUST-00001, CUST-00002, ...
```

그러나:
- Oracle SEQUENCE의 `CACHE` 설정에 따라 동시 다중 고객 등록 시 **번호가 연속되지 않을 수 있음**
  - 예: CUST-00001, CUST-00003, CUST-00005 (CACHE=2인 경우)
- 프론트엔드에서 "다음 코드 미리 보기" 기능을 원할 수 있는데, SEQUENCE는 실시간 조회 어려움

**영향:**
- 사용자가 예상과 다른 코드 시퀀스를 볼 수 있음 (그러나 비즈니스 로직상 문제 없음)
- 코드 자동 생성 로직 테스트 시 일관성 문제

**해결 방안:**
1. SEQUENCE 설정 명시:
   ```sql
   CREATE SEQUENCE cust_code_seq
     INCREMENT BY 1
     CACHE 20
     NOCYCLE;
   ```
2. 동시성 테스트 포함 (동시 다중 요청 시 번호 할당 검증)
3. "코드 미리 보기"는 구현하지 않음 (또는 Phase 2에서만)

**우선순위:** LOW (비즈니스상 심각하지 않음)

---

### 10. 고객명 중복 검사의 소프트 삭제 처리 (LOW)

**설명:**
Section 4.1에서 고객명 유일성 검사:
```
고객사명 필수 및 고유성 검증 (soft delete 제외)
```

그리고 Section 5.3:
```
UNIQUE (name) WHERE deleted_at IS NULL
```

즉, **삭제된 고객과 같은 이름으로 새 고객 등록 가능**. 그러나:
- 비즈니스상 "삭제된 고객과 같은 이름의 고객을 다시 등록"할 수 있는가?
  - 만약 "삼성전자" 고객을 삭제했다가, 새로운 부서에서 "삼성전자" 다시 등록 시도?

**영향:**
- 데이터 품질 관점에서 혼동 가능성 (같은 이름 = 다른 고객)
- 사용자가 실수로 중복 등록할 가능성

**해결 방안:**
1. 비즈니스 규칙 재정의:
   - **규칙 A (현재):** 삭제된 고객명 재사용 가능 → 명시적 허용
   - **규칙 B (대안):** 삭제된 고객명도 예약 → 고객명 변경 후 삭제 필수
2. 규칙을 선택해서 고객 등록 폼에 메시지 추가:
   ```
   "삼성전자"는 이미 등록되어 있습니다. (다른 이름으로 등록 하거나 기존 고객 복구)
   ```

**우선순위:** LOW (규칙 명시로 충분)

---

### 11. 메모(CLOB) 필드의 성능 고려 부족 (LOW)

**설명:**
Section 5.3에서 고객 메모를 CLOB으로 정의:
```
memo (CLOB)
```

그러나:
- CLOB은 대용량 데이터 저장 시 성능 저하 가능 (특히 SELECT 시)
- 고객 목록 페이지 조회 시 메모를 가져오면 불필요한 데이터 전송
- 메모는 상세 페이지에서만 필요한데, 목록 조회와 상세 조회를 분리하는가?

**영향:**
- 고객 목록 조회 응답 시간 증가 가능성
- 네트워크 대역폭 낭비

**해결 방안:**
1. 쿼리 분리:
   ```
   GET /api/customers (목록):
     SELECT id, name, classification, ... (memo 제외)

   GET /api/customers/[id] (상세):
     SELECT * (memo 포함)
   ```
2. Section 5.8 인덱스 전략에 명시

**우선순위:** LOW (최적화 수준)

---

### 12. 담당자 email/phone 중 하나 필수 규칙의 모호함 (LOW)

**설명:**
Section 4.1에서:
```
담당자 이메일/전화 중 최소 하나 필수
```

그러나 API 응답에서 이메일 또는 전화가 **빈 값으로 표시될 수 있는가?**
```json
{
  "name": "김고객",
  "email": "kim@samsung.com",
  "phone": null  // 이 경우 API 응답에서 제외할 것인가?
}
```

**영향:**
- 프론트엔드 렌더링 시 null/undefined 처리 로직 필요
- API 일관성 (항상 두 필드를 포함할 것 vs 선택적으로 제외할 것)

**해결 방안:**
1. API 응답 스키마 명시:
   ```typescript
   interface CustomerContact {
     id: number;
     name: string;
     title: string;
     email: string; // 항상 포함 (빈 문자열 가능)
     phone: string; // 항상 포함 (빈 문자열 가능)
   }
   ```
2. 유효성 검사 규칙:
   ```
   - 이메일: 필수 또는 전화번호 필수 (OR 조건)
   - 직급: 필수
   ```

**우선순위:** LOW (구현 시 선택 사항)

---

### 13. 고객 검색 debounce 시간 합리성 검토 (LOW)

**설명:**
US-5에서:
```
검색 필드에 입력하면 고객사명 또는 고객 코드로 실시간(debounce 300ms) 자동 완성
최대 10개 항목까지 드롭다운으로 표시
```

debounce 300ms이 적절한가?
- **300ms는 사용자 입력 후 0.3초 대기** → 빠른 입력 시 지연감 가능
- 반대로 너무 짧으면 (100ms) 불필요한 API 호출 증가

**영향:**
- 사용자 경험 (체감 성능)

**해결 방안:**
1. 권장사항:
   - 네트워크 지연 < 100ms인 경우: debounce 200-300ms
   - 입력 필드 길이 3글자 이상일 때만 검색 시작 (예: `q.length >= 2`)
2. 성능 테스트 후 조정

**우선순위:** LOW (구현 후 조정 가능)

---

### 14. 역할 기반 접근 제어의 세분화 부족 (LOW)

**설명:**
Section 5.5에서:
```
GET: USER 이상
POST/PUT/DELETE: MANAGER 이상
이력 조회: MANAGER 이상
```

그러나:
- **USER가 DELETE 또는 PUT 실행 시 API가 거부하는가?** (400/401/403 어떤 상태 코드?)
- **USER가 다른 사용자의 고객 정보 조회 시 제약이 있는가?** (현재는 없는 것 같음)

**영향:**
- API 에러 응답의 일관성
- 향후 부서별 권한 추가 시 혼동

**해결 방안:**
1. HTTP 상태 코드 명시:
   ```
   권한 부족: 403 Forbidden
   인증 실패: 401 Unauthorized

   예시:
   USER가 DELETE /api/customers/1 실행
   → 403 Forbidden { message: "This operation requires MANAGER role" }
   ```
2. 에러 응답 스키마:
   ```json
   {
     "error": "INSUFFICIENT_PERMISSION",
     "message": "고객 삭제는 매니저 이상의 권한이 필요합니다.",
     "requiredRole": "MANAGER",
     "userRole": "USER"
   }
   ```

**우선순위:** LOW (구현 표준화)

---

### 15. TanStack Query 캐시 무효화 전략의 세분화 부족 (LOW)

**설명:**
Section 5.4에서:
```
고객 추가/수정/삭제 시: customers-list, customers-detail, customers-search 캐시 무효화
담당자 추가/수정/삭제 시: customers-detail, customers-contacts 캐시 무효화
```

그러나:
- **"부분 무효화"의 구체적 구현이 없음** ("부분 무효화 지원"이라고만 함)
- 예를 들어, 고객 1의 정보를 수정했을 때, 다른 고객들의 캐시도 모두 지울 것인가?
- 아니면 `customers-detail-1` 캐시만 지울 것인가?

**영향:**
- 불필요한 API 재호출로 성능 저하 가능
- 또는 오래된 데이터가 UI에 표시될 가능성

**해결 방안:**
1. 부분 무효화 규칙 명시:
   ```typescript
   // 고객 1 수정 시
   queryClient.invalidateQueries({
     queryKey: ['customers', 'detail', customerId], // 해당 고객만
     exact: true,
   });

   // 또는 목록도 무효화할 필요 있으면
   queryClient.invalidateQueries({
     queryKey: ['customers', 'list'],
     refetchType: 'stale', // 백그라운드 재페치
   });
   ```
2. Section 5.4 업데이트 (구현 코드 예시 포함)

**우선순위:** LOW (최적화 수준)

---

### 16. 고객 상세 페이지 로딩 상태 미정의 (LOW)

**설명:**
Section 5.1에서:
```
src/app/(main)/customers/[id]/loading.tsx — 상세 페이지 로딩 스켈레톤
```

명시되어 있으나:
- 로딩 중에 어떤 스켈레톤을 표시할 것인가? (기본정보? 담당자? 이력?)
- 부분 로딩 (기본정보는 먼저, 담당자는 나중)을 지원할 것인가?

**영향:**
- 고객 상세 페이지 UX 품질

**해결 방안:**
1. 로딩 상태 분리:
   ```
   Phase 1 (초기 로딩):
   - 기본정보 로딩 중: Skeleton (회사명, 주소, 전화 등)

   Phase 2 (탭 별 로딩):
   - 담당자 탭 클릭 시: 별도 Skeleton
   - 이력 탭 클릭 시: 별도 Skeleton (필요한 경우만)
   ```
2. Section 6.4 업데이트

**우선순위:** LOW (UX 개선)

---

### 17. 테스트 전략의 구체성 부족 (LOW)

**설명:**
Section 4.1에서:
```
Unit Testing
- API Route 테스트 (등록, 수정, 삭제, 권한 검증)
- Service 로직 테스트 (유효성 검증, 중복 검사)
- React Component 테스트 (렌더링, 사용자 인터랙션)
```

그러나:
- **테스트 커버리지 목표는 무엇인가?** (70%? 80%?)
- **E2E 테스트는 포함되는가?** (현재 명시 없음)
- **성능 테스트는 포함되는가?** (Section 5.8 목표는 있으나 테스트 방법 없음)

**영향:**
- 테스트 범위의 모호함
- 구현 후 품질 검증 어려움

**해결 방안:**
1. 테스트 전략 상세화 (별도 섹션 추가):
   ```
   단위 테스트 (Jest):
   - 커버리지 목표: 80% (비즈니스 로직)

   통합 테스트 (Supertest + TypeORM):
   - API 엔드포인트별 테스트 (happy path + edge case)
   - 권한 검증 (USER, MANAGER, ADMIN)

   E2E 테스트 (Playwright):
   - 고객 생성-조회-수정-삭제 전체 흐름
   - 필터링 및 검색 기능

   성능 테스트:
   - 10만 건 데이터로 p95 < 200ms 검증
   ```
2. 테스트 케이스 작성 가이드 (별도 문서)

**우선순위:** LOW (운영 단계 개선)

---

### 18. 감사 추적(Audit Trail)의 세부 규칙 부재 (LOW)

**설명:**
Section 8 Security에서:
```
모든 CRUD 작업 이력 기록 (CustomerHistory)
변경자, 변경 시각, 변경 내용 기록
```

그러나:
- **삭제된 담당자 복구는 이력에 기록되는가?** (Phase 2 기능)
- **메모 수정이력도 기록되는가?** (US-8에서는 "선택사항, Phase 2"라고 함)
- **대량 작업(향후 import 등)의 이력은?**

**영향:**
- 감사 추적 완전성의 모호함
- Phase 2에서 메모 이력 추가 시 스키마 변경 필요

**해결 방안:**
1. CUSTOMER_HISTORY 스키마 검토:
   ```sql
   CREATE TABLE CUSTOMER_HISTORY (
     id NUMBER PRIMARY KEY,
     customer_id NUMBER NOT NULL,
     change_type VARCHAR2(20), -- CREATE | UPDATE | DELETE | CONTACT_ADD | CONTACT_DELETE
     changed_fields CLOB, -- JSON
     changed_by_id NUMBER NOT NULL,
     changed_at TIMESTAMP NOT NULL,
     -- 추가 필드 (Phase 2)
     -- memo_history (별도 테이블?)
   );
   ```
2. 이력 기록 범위 재정의

**우선순위:** LOW (감사 정책 문제)

---

### 19. 고객 담당자(primaryContact)와 생성자(createdBy)의 구분 불명확 (MEDIUM)

**설명:**
고객을 등록할 때:
- `created_by_id` → 누가 고객을 시스템에 등록했는가? (직원)
- 고객 상세 페이지에서 보여야 할 "담당자"는:
  - 고객을 등록한 직원? (`created_by`)
  - 고객사의 연락처? (`CUSTOMER_CONTACT`)
  - 현재 담당하는 직원? (별도 필드?)

**US-1에서:**
```
등록 시 담당 직원(MANAGER) 자동 지정 또는 선택 지정 가능
```

이 "담당 직원"이 `created_by`와 같은가?

**영향:**
- API 응답에서 "manager" vs "contact" 표시 혼동
- 프로젝트/기술지원에서 "담당자"를 누구로 할 것인가?

**해결 방안:**
1. 용어 정리:
   ```
   - 등록자 (Creator): created_by_id (직원)
   - 담당자 (Manager): created_by_id와 동일 (초기),
     또는 별도 assigned_manager_id (Phase 2에서 변경 가능)
   - 고객사 담당자 (Contact): CUSTOMER_CONTACT 엔티티
   ```
2. US-1 수정: "담당 직원"을 명확히 정의

**우선순위:** MEDIUM (API 설계의 기초)

---

### 20. 응답 형식의 일관성 검토 부족 (LOW)

**설명:**
Section 5.2에서 응답 형식 예시:
```json
{
  "id": 1,
  "name": "삼성전자",
  "managerId": 5,
  "managerName": "이영업"
}
```

그러나:
- **모든 응답에서 `managerName`을 포함할 것인가?** (중복 정보)
- 아니면 `manager: { id, name }` 구조가 나을 것인가?
- 담당자 목록 API의 응답도 같은 형식인가?

**영향:**
- 프론트엔드에서 매번 ID → 이름 매핑 필요
- API 일관성 부족

**해결 방안:**
1. 응답 형식 통일:
   ```json
   // 권장: 관계를 명시적으로
   {
     "id": 1,
     "name": "삼성전자",
     "classification": "END_USER",
     "manager": {
       "id": 5,
       "name": "이영업"
     },
     "contacts": [
       { "id": 10, "name": "김고객", "title": "과장", ... }
     ]
   }
   ```
2. API 응답 스키마 명시 (TypeScript interface 제공)

**우선순위:** LOW (API 설계 개선)

---

## Summary Table

| # | 이슈 | 우선순위 | 카테고리 | 해결 방법 |
|---|------|---------|---------|---------|
| 1 | 담당자 필드 중복성 | HIGH | 데이터 모델 | 용어 표준화 + CustomerContact.created_by 명확화 |
| 2 | 부서별 권한 스코핑 | HIGH | 아키텍처 | Phase 1/2 결정 명시화 |
| 3 | "관련 업무" 범위 모호 | MEDIUM | 기능 범위 | Phase 2로 미연기 또는 타 모듈 API 계약 |
| 4 | 담당자 삭제 참조 무결성 | MEDIUM | 데이터 무결성 | 정책 A/B/C 중 선택 및 명시화 |
| 5 | 소프트 삭제 후 복구 미정 | MEDIUM | 운영 | Phase 1 최소 표시 + Phase 2 계획 |
| 6 | 성능 우려 (대규모) | MEDIUM | 성능 | 복합 인덱스 설계 + 성능 테스트 |
| 7 | 타 모듈 통합 인터페이스 부재 | MEDIUM | 통합 | 공유 컴포넌트 + API 계약 문서 |
| 8 | 권한 검증 일관성 | MEDIUM | 보안 | API별 상세 권한 규칙 |
| 9 | 고객 코드 동시성 | LOW | 구현 | SEQUENCE 설정 명시 + 테스트 |
| 10 | 고객명 중복 검사 | LOW | 데이터 | 비즈니스 규칙 재정의 |
| 11 | CLOB 성능 고려 | LOW | 성능 | 쿼리 분리 |
| 12 | Email/Phone 필드 모호 | LOW | API 설계 | 응답 스키마 명시 |
| 13 | Debounce 시간 | LOW | UX | 성능 테스트 후 조정 |
| 14 | HTTP 상태 코드 | LOW | API 설계 | 에러 응답 스키마 명시 |
| 15 | TanStack Query 부분 무효화 | LOW | 성능 | 구현 규칙 명시화 |
| 16 | 로딩 상태 미정의 | LOW | UX | 로딩 상태 분리 |
| 17 | 테스트 전략 구체성 | LOW | 품질 | 테스트 전략 상세화 |
| 18 | 감사 추적 세부 규칙 | LOW | 보안 | 이력 기록 범위 재정의 |
| 19 | 담당자 정의 혼동 | MEDIUM | 데이터 모델 | 용어 정리 (등록자 vs 담당자 vs 연락처) |
| 20 | 응답 형식 일관성 | LOW | API 설계 | 응답 형식 통일 |

---

## 권장 실행 계획

### Immediate (구현 전, 1-2일)

1. **Critical Point 1, 2, 19 해결:** 담당자와 권한 관련 용어 정의 → 데이터 모델 확정
2. **Critical Point 3 해결:** "관련 업무" 기능을 Phase 2로 공식 미연기 → US-3 수정
3. **Critical Point 4, 5 해결:** 참조 무결성 정책 (A/B/C) 선택 → 삭제 로직 확정

### Pre-Implementation (구현 초기, 2-3일)

4. 타 모듈 통합 인터페이스 문서 작성 (2081_integration_guide.md)
5. API 응답 스키마 정의 (TypeScript types)
6. 복합 인덱스 설계 및 성능 테스트 계획

### Implementation (진행 중)

7. 단위 테스트 작성 시 권한 검증 테스트 케이스 포함 (Point 8)
8. API 에러 응답 스키마 구현 (Point 14)

### Post-Implementation (릴리스 후)

9. 성능 테스트 실행 (p95 < 200ms 검증)
10. 사용자 피드백 수집 (debounce 시간 조정 등)

---

## 결론

이 PRD는 **고객 관리 모듈의 핵심 요구사항을 체계적으로 정의**했으나, **8개 HIGH/MEDIUM 우선순위 이슈**가 있어 구현 전 명확화가 필요하다. 특히 **담당자 필드 정의(#1), 부서별 권한 스코핑(#2), 담당자 정의 혼동(#19)**은 데이터 모델과 API 설계에 직접 영향을 미치므로 **우선 해결**되어야 한다.

이러한 이슈들을 해결하면 **일관성 있고 확장 가능한 CRM 모듈**이 완성될 수 있다.

---

**검토 완료:** 2026-01-25 23:45:00 KST
**다음 단계:** PRD 작성자와 함께 이슈 토론 및 해결 방안 선택
