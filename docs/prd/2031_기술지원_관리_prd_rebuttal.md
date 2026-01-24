<!-- Generated: 2026-01-25 04:45:00 KST -->

# Rebuttal: 기술지원 관리 PRD Critical Review

원본 PRD: docs/prd/2031_기술지원_관리_prd.md
리뷰 문서: docs/prd/2031_기술지원_관리_prd_critical_review.md

---

## 1. 상태 전이 규칙 (HIGH)

**비평:** 역방향 전이 가능 여부와 ADMIN 권한 불명확

**반론:**
- 실무적으로 역방향 전이는 필요함 (잘못 완료 처리한 경우)
- 단, 무제한 역방향은 데이터 무결성 위험 → "COMPLETED → IN_PROGRESS"만 허용하는 것이 적절
- ADMIN은 모든 상태 전이를 허용하되, audit log 차원에서 status 변경 이력을 기록하는 것은 Phase 2 고려
- **수용:** PRD에 상태 전이 매트릭스를 명시해야 함

## 2. Customer 의존성 해결 (HIGH)

**비평:** Customer 엔티티 없이 기술지원 등록 불가

**반론:**
- 이미 PRD Section 5.3에서 Customer 최소 정의를 포함함
- Implementation Priority Phase 1에 "Customer 엔티티 최소 정의 + seed data"를 1번으로 명시함
- customer_id를 nullable로 변경하면 데이터 무결성이 저하됨 → NOT NULL 유지가 적절
- **수용:** Customer 엔티티 + seed data + 선택 API를 기술지원 PRD의 구현 범위에 명확히 포함

## 3. Customer 엔티티 확장 가능성 (HIGH)

**비평:** 최소 정의가 향후 고객 관리 PRD와 충돌 가능

**반론:**
- 최소 정의(id, name, category, timestamps)는 모든 확장의 기본이 되는 필드임
- 향후 CustomerContact, address 등 추가 시 ALTER TABLE ADD COLUMN으로 충돌 없이 확장 가능
- TypeORM migration은 incremental이므로 초기 최소 정의 후 확장하는 것이 표준 패턴
- **부분 수용:** 고객 관리 PRD에서 확장할 필드 목록을 Open Questions에 참고용으로 명시

## 4. Customer 모듈 구현 순서 (HIGH)

**비평:** Phase 순서 위반 가능성

**반론:**
- CLAUDE.md의 Phase 순서는 "Phase 1: Auth + Employees + Customers"이며, Customers는 Phase 1에 이미 포함됨
- 기술지원은 Phase 3이지만, Customer 최소 구현(Entity + seed + 목록 API)은 Phase 1의 일부로 볼 수 있음
- 전체 Customer CRUD가 아닌 "선택 목록용 API"만 구현하므로 범위가 작음
- **수용:** Customer 최소 구현을 기술지원 구현의 선행 작업으로 명확히 정의

## 5. 고객사 선택 UI (MEDIUM)

**비평:** Select vs Combobox 미정의

**반론:**
- 고객사 수가 적은 초기 단계에서는 Select로 충분
- 다만 확장성을 고려하면 처음부터 검색 가능한 Combobox가 적절
- shadcn/ui의 Command(Combobox) 컴포넌트 활용 가능
- **수용:** Combobox 방식으로 확정

## 6. 대시보드 연동 범위 (MEDIUM)

**비평:** daily-summary API 수정 범위 불명확

**반론:**
- 이미 Implementation Priority에서 Phase 2로 분류함
- 기술지원 Core 기능과 대시보드 연동은 분리하는 것이 적절
- 기존 daily-summary API 구조를 변경하면 기존 대시보드 컴포넌트에 영향
- **수용:** 대시보드 연동은 Out-of-Scope로 이동, 별도 integration PRD로 분리

## 7. 파일 업로드 중복/교체 처리 (MEDIUM)

**비평:** 기존 파일이 있을 때 새 파일 업로드 동작 미정의

**반론:**
- 단일 파일 정책에서는 "교체" 동작이 가장 직관적
- 기존 파일 삭제 + 새 파일 업로드를 원자적으로 처리
- 사용자에게 "기존 파일이 교체됩니다" 확인 Dialog 표시
- **수용:** 교체 정책을 명시하고, 확인 Dialog 포함

## 8. SC/CC 분리 명시화 (MEDIUM)

**비평:** Server/Client Component 분리 전략 미기술

**반론:**
- 업무 검색(2021) 구현에서 이미 확립된 패턴을 따름
- page.tsx = SC (metadata + Suspense + Client Component 렌더링)
- 모든 인터랙티브 컴포넌트 = CC
- **수용:** PRD에 기존 패턴 참조를 명시

## 9. Attachment 메타데이터 저장 (MEDIUM)

**비평:** 파일 크기, MIME type 등 메타데이터 없음

**반론:**
- 단일 파일에서 attachment_path와 attachment_name으로 충분히 운용 가능
- MIME type은 다운로드 시 확장자에서 유추 가능
- 파일 크기는 서버에서 stat으로 확인 가능
- 다만 Phase 2 다중 파일 확장을 고려하면 초기부터 Attachment 테이블을 분리하는 것이 나을 수 있음
- **부분 수용:** Phase 1은 inline 필드 유지, Phase 2 확장 시 Attachment 테이블 분리 검토를 Open Questions에 기록

## 10. MANAGER 역할 Phase 1 동작 (MEDIUM)

**비평:** Phase 1에서 MANAGER 동작 미명시

**반론:**
- 업무 검색(2021)에서 이미 "MANAGER = USER와 동일 (Phase 2-A)"로 처리한 선례 있음
- 동일한 패턴을 따르면 됨
- **수용:** "Phase 1에서 MANAGER는 USER와 동일하게 본인 건만 CRUD" 명시

## 11. 등록 UI: Dialog vs 전용 페이지 (MEDIUM)

**비평:** 입력 필드가 많아 Dialog에 담기 어려울 수 있음

**반론:**
- 기술지원 등록 필드: 제목, 고객사, 유형, 방법, 날짜, 시간, 설명, 파일
- 업무 등록(TaskForm)도 유사한 필드 수로 Dialog/Sheet 패턴 사용 중
- Dialog 내 스크롤이 가능하므로(max-h-[90vh] overflow-y-auto) 처리 가능
- 전용 페이지는 URL 변경으로 인한 상태 유실 위험, Dialog는 목록 context 유지 가능
- **기각:** Dialog 패턴 유지 (기존 TaskDetailDialog 패턴과 일관성)

## 12. 파일 업로드 보안 상세화 (MEDIUM)

**비평:** MIME type 검증만으로 불충분, magic bytes 등 필요

**반론:**
- 내부 ERP 시스템으로 공격 표면이 제한적 (인증된 직원만 사용)
- 다만 기본적인 보안 강화는 적용해야 함
- **부분 수용:** 파일 확장자 + MIME type 이중 검증, 파일명 sanitize 추가. Magic bytes는 Phase 2

## 13. Task 엔티티와의 관계 (MEDIUM)

**비평:** TechSupport와 Task 자동 연동 여부 미결정

**반론:**
- 현재 Task 엔티티에 customer_id FK가 이미 존재 (nullable)
- 기술지원과 업무는 별개 엔티티로 관리하는 것이 적절 (목적이 다름)
- 자동 연동은 불필요한 복잡성 추가 — 사용자가 필요 시 수동으로 업무 등록
- **기각:** 별개 엔티티로 관리, 자동 연동 없음

---

## Summary

| # | Priority | Decision |
|---|----------|----------|
| 1 | HIGH | 수용 - 상태 전이 매트릭스 추가 |
| 2 | HIGH | 수용 - Customer 구현을 기술지원 범위에 명확히 포함 |
| 3 | HIGH | 부분 수용 - 확장 필드 참고용 기록 |
| 4 | HIGH | 수용 - Customer 선행 작업으로 정의 |
| 5 | MEDIUM | 수용 - Combobox로 확정 |
| 6 | MEDIUM | 수용 - 대시보드 연동 Out-of-Scope |
| 7 | MEDIUM | 수용 - 교체 정책 + 확인 Dialog |
| 8 | MEDIUM | 수용 - 기존 패턴 참조 명시 |
| 9 | MEDIUM | 부분 수용 - Phase 1 inline, Phase 2 분리 검토 |
| 10 | MEDIUM | 수용 - MANAGER = USER (Phase 1) 명시 |
| 11 | MEDIUM | 기각 - Dialog 패턴 유지 |
| 12 | MEDIUM | 부분 수용 - 확장자+MIME 이중 검증 |
| 13 | MEDIUM | 기각 - 별개 엔티티, 자동 연동 없음 |
