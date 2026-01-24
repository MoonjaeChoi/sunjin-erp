<!-- Generated: 2026-01-25 04:45:00 KST -->

# Critical Review: 기술지원 관리 PRD (2031)

원본 PRD: docs/prd/2031_기술지원_관리_prd.md
리뷰일: 2026-01-25

---

## 1. Clarity & Ambiguity

### HIGH: Tier Bar 상태 전이 규칙 불명확
- PRD에서 "접수 → 진행 → 완료 순서로 진행 가능"이라고 명시하지만, 역방향 전이(완료 → 진행, 진행 → 접수)가 가능한지 명시되지 않음
- 잘못 완료 처리한 경우 되돌리기가 필요할 수 있음
- ADMIN은 임의 상태 변경이 가능한지 여부도 불명확

### MEDIUM: 고객사 선택 UI 방식 미정의
- "고객사는 등록된 고객 목록에서 선택한다"고 명시하지만, Select dropdown인지 검색 가능한 Combobox인지 미정의
- 고객사 수가 많을 경우(100+) 단순 Select는 UX 문제 발생

### LOW: "단일 파일" 첨부의 제약 명시 부족
- Phase 1에서 단일 파일만 지원한다고 명시하지만, 기존 파일이 있을 때 새 파일 업로드 시 덮어쓰기인지 교체 확인이 필요한지 불명확

---

## 2. Completeness & Edge Cases

### HIGH: Customer 엔티티 의존성 해결 전략 부재
- TechSupport는 customer_id FK가 NOT NULL이므로 Customer 엔티티가 반드시 선행 구현되어야 함
- 현재 Customer 엔티티가 존재하지 않음 (탐색 결과 확인)
- "최소 정의"라고 했지만, seed data 생성 전략과 고객사 등록 UI가 없으면 기술지원 등록 자체가 불가능
- Customer CRUD를 별도 PRD로 분리할 경우 구현 순서 문제 발생

### HIGH: 대시보드 연동 범위 모호
- US-7에서 "대시보드 daily-summary API에 기술지원 건수가 포함된다"고 명시
- 기존 daily-summary API (`/api/dashboard/daily-summary`)의 현재 구조와의 호환성 미검토
- 대시보드 컴포넌트(DayDetailPanel 등) 수정 범위 불명확
- Implementation Priority Phase 2로 분류했으나, 별도 iteration으로 분리하는 것이 적절할 수 있음

### MEDIUM: 파일 업로드 시 중복/충돌 처리
- 동일 기술지원 건에 이미 파일이 있을 때 새 파일 업로드 시 동작 미정의
- 기존 파일 삭제 후 업로드인지, 교체 확인 Dialog가 필요한지

### MEDIUM: 삭제된 고객사의 기술지원 건 처리
- Customer가 soft delete된 경우, 해당 고객사의 기술지원 건 표시/검색 방식 미정의
- FK에 ON DELETE RESTRICT이므로 삭제 자체는 차단되지만, soft delete된 고객사 참조 시 UI 표현 방법 필요

---

## 3. Architecture Compliance

### MEDIUM: Server/Client Component 분리 상세화 필요
- TaskSearchClient 패턴을 따른다고 암시하지만, 명시적으로 SC/CC 분리 전략이 기술되지 않음
- `page.tsx`가 SC인지, metadata export가 있는지 명시 필요
- Dialog 컴포넌트들이 Client Component인 것은 자명하나, 데이터 fetching 패턴이 명확하지 않음

### LOW: API Route에서의 파일 업로드 처리
- Next.js 14 App Router에서 multipart/form-data 처리 시 `request.formData()` 사용이 적절한지
- 파일 크기 제한(10MB)을 Next.js config의 `bodyParser` 설정과 연동해야 함
- `next.config.js`의 `api.bodyParser.sizeLimit` 설정 필요

---

## 4. Database Design

### HIGH: Customer 엔티티 최소 정의의 확장 가능성
- PRD에서 Customer를 id, name, category, timestamps만으로 정의
- 향후 고객 관리 PRD에서 확장 시 migration 충돌 가능성
- 초기부터 CLAUDE.md의 Entity Relationships에 정의된 CustomerContact, MaintenanceContract 관계를 고려해야 함

### MEDIUM: attachment_path 단일 컬럼 설계
- 단일 파일이라도 원본 파일명과 저장 경로를 분리한 것은 적절
- 그러나 파일 크기, MIME type, 업로드 일시 등 메타데이터 저장이 없음
- Phase 2에서 다중 파일로 확장 시 별도 Attachment 테이블이 필요할 수 있으며, 초기 설계와 충돌 가능

### LOW: support_date DATE 타입
- Oracle DATE 타입은 시간 정보를 포함하는데, 날짜만 필요하다면 TRUNC 처리가 필요
- Task 엔티티와 동일 패턴이므로 일관성은 유지됨

---

## 5. Authentication & Authorization

### MEDIUM: MANAGER 역할 범위 미확정
- "MANAGER: 본인 건 CRUD + 부서 내 읽기 (Phase 2-B 확장)"이라고 기술
- Phase 1에서 MANAGER는 USER와 동일하게 동작하는지 명시 필요
- Department 기반 필터링 로직이 Employee 엔티티에 department_id가 있으므로 가능하지만, 구현 시점 불명확

### LOW: 파일 다운로드 권한
- 파일 다운로드 시 소유권 검증이 필요한지
- 다른 사용자의 기술지원 건 상세를 볼 수 있는 경우(ADMIN) 파일도 다운로드 가능해야 함
- 상세 조회 권한과 파일 다운로드 권한을 동일하게 처리하는 것이 적절

---

## 6. UI/UX & Responsive Design

### MEDIUM: 등록 Dialog vs 전용 페이지
- 업무 검색(2021)에서는 상세/수정만 Dialog로 처리
- 기술지원은 입력 필드가 더 많고(고객사 선택, 파일 첨부 등) Dialog에 담기에 복잡할 수 있음
- 전용 등록/수정 페이지(`/support/new`, `/support/[id]/edit`)를 고려할 필요 있음

### LOW: 필터에 고객사명 검색 UX
- 고객사명 LIKE 검색을 Input에서 직접 입력하는 방식인지, 별도 고객사 선택 UI인지 불명확
- 필터의 고객사 검색과 등록 시 고객사 선택이 다른 UX일 수 있음

---

## 7. Performance & Scalability

### MEDIUM: 파일 저장소 확장성
- 로컬 스토리지(UPLOAD_DIR)에 저장하는 방식은 단일 서버에서만 동작
- Docker container에서 volume mount 필요
- 향후 S3/MinIO 등 오브젝트 스토리지 전환 시 추상화 레이어 부재

### LOW: 고객사 목록 API 캐싱
- 기술지원 등록 시마다 고객사 목록을 fetch하는 것은 비효율적일 수 있음
- TanStack Query의 staleTime을 길게 설정하거나, 고객사 목록 전용 캐시 전략 필요

---

## 8. Security

### MEDIUM: 파일 업로드 보안 강화 필요
- MIME type 검증만으로는 불충분 — magic bytes 검증 고려
- 업로드된 파일의 실행 권한 제거 필요
- 파일명에 경로 탐색 문자(../, /) 포함 시 처리 방법 명시 필요
- UUID 변환 저장은 적절하나, 원본 파일명의 XSS sanitize도 필요

### LOW: API Rate Limiting
- 파일 업로드 API에 대한 rate limiting 미언급
- DoS 방지를 위한 동시 업로드 제한 고려

---

## 9. Dependencies & Integration

### HIGH: Customer 모듈 구현 순서
- 기술지원 관리는 Customer FK가 NOT NULL이므로, Customer 엔티티 + seed data + 선택 API가 선행 필요
- CLAUDE.md의 Module Implementation Order에서 Phase 1에 Customers가 있지만, 아직 구현되지 않음
- 기술지원은 Phase 3에 해당하는데, Customer가 없으면 구현 불가
- 해결 방안: Customer 엔티티 최소 구현을 기술지원 PRD의 일부로 포함하거나, customer_id를 nullable로 변경

### MEDIUM: Task 엔티티와의 관계
- CLAUDE.md에서 Employee → Task, Employee → TechSupport 관계가 정의됨
- 기술지원 건이 자동으로 Task를 생성하는지, 별개 엔티티로 관리하는지 명확히 해야 함
- Open Questions에 언급되었으나, PRD 확정 전에 결정 필요

---

## Discussion Points Summary

| # | Priority | Topic | Section |
|---|----------|-------|---------|
| 1 | HIGH | 상태 전이 규칙 (역방향, ADMIN 권한) | Clarity |
| 2 | HIGH | Customer 의존성 해결 전략 | Completeness |
| 3 | HIGH | Customer 엔티티 확장 가능성 설계 | Database |
| 4 | HIGH | Customer 모듈 구현 순서 | Dependencies |
| 5 | MEDIUM | 고객사 선택 UI (Select vs Combobox) | Clarity |
| 6 | MEDIUM | 대시보드 연동 범위 | Completeness |
| 7 | MEDIUM | 파일 업로드 중복/교체 처리 | Completeness |
| 8 | MEDIUM | SC/CC 분리 명시화 | Architecture |
| 9 | MEDIUM | attachment 메타데이터 저장 | Database |
| 10 | MEDIUM | MANAGER 역할 Phase 1 동작 | Authorization |
| 11 | MEDIUM | 등록 UI: Dialog vs 전용 페이지 | UI/UX |
| 12 | MEDIUM | 파일 업로드 보안 상세화 | Security |
| 13 | MEDIUM | Task 엔티티와의 관계 정의 | Dependencies |
