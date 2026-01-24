<!-- Generated: 2026-01-25 04:55:00 KST -->

# Mediation Decisions: 기술지원 관리 PRD (2031)

원본 PRD: docs/prd/2031_기술지원_관리_prd.md
Mode: AI-Assisted (자동 중재)

---

## Decision Summary

| # | Topic | Priority | Decision | Rationale |
|---|-------|----------|----------|-----------|
| 1 | 상태 전이 매트릭스 | HIGH | **수용** | 역방향 전이 규칙을 명시하여 구현 시 모호성 제거 |
| 2 | Customer 의존성 | HIGH | **수용** | NOT NULL FK이므로 Customer 선행 구현은 필수 |
| 3 | Customer 확장 가능성 | HIGH | **부분 수용** | 최소 정의 유지하되 확장 방향 참고용 기록 |
| 4 | Customer 구현 순서 | HIGH | **수용** | Phase 1에 이미 포함된 범위, 선행 작업으로 명확화 |
| 5 | 고객사 선택 UI | MEDIUM | **수용** | Combobox가 확장성 면에서 우월 |
| 6 | 대시보드 연동 | MEDIUM | **수용** | Core와 분리하여 복잡성 감소 |
| 7 | 파일 교체 정책 | MEDIUM | **수용** | 교체 + 확인 Dialog가 사용자 친화적 |
| 8 | SC/CC 분리 | MEDIUM | **수용** | 기존 패턴 참조로 충분 |
| 9 | Attachment 메타데이터 | MEDIUM | **부분 수용** | Phase 1은 단순 유지, Phase 2에서 검토 |
| 10 | MANAGER Phase 1 | MEDIUM | **수용** | 기존 선례(업무 검색)와 일관성 |
| 11 | 등록 UI 방식 | MEDIUM | **기각** | Dialog 패턴이 Context 유지에 유리 |
| 12 | 파일 보안 강화 | MEDIUM | **부분 수용** | 이중 검증 + sanitize, magic bytes는 Phase 2 |
| 13 | Task 관계 | MEDIUM | **기각** | 불필요한 복잡성, 별개 관리가 적절 |

---

## Detailed Decisions

### Decision 1: 상태 전이 매트릭스 추가

**PRD 변경사항:**
- US-4에 상태 전이 매트릭스 추가
- 역방향: COMPLETED → IN_PROGRESS만 허용 (잘못 완료 처리 수정용)
- ADMIN: 모든 상태 전이 허용

**전이 매트릭스:**
| From \ To | RECEIVED | IN_PROGRESS | COMPLETED |
|-----------|----------|-------------|-----------|
| RECEIVED | - | USER/ADMIN | × |
| IN_PROGRESS | × | - | USER/ADMIN |
| COMPLETED | × | USER/ADMIN | - |

### Decision 2: Customer 구현을 기술지원 범위에 포함

**PRD 변경사항:**
- Scope 4.1에 "Customer 엔티티 최소 구현 (Entity + seed data + 목록 API)" 명시
- Out-of-Scope에서 "Customer 엔티티 CRUD" → "Customer 전체 CRUD (등록/수정/삭제 UI)" 명확화
- Implementation Priority Phase 1에 Customer 선행 작업 명시

### Decision 3: 확장 필드 참고 기록

**PRD 변경사항:**
- Open Questions에 "향후 확장 가능 필드: contact_person, phone, email, address, business_number, contract_info" 참고용 기록

### Decision 4: Customer 선행 작업 명확화

**PRD 변경사항:**
- Implementation Priority Phase 1의 1번 항목에 "(선행 작업, 기술지원 구현 전 완료)" 부기

### Decision 5: Combobox 확정

**PRD 변경사항:**
- 6.2 Component Library에 "Command (Combobox)" 추가
- US-2에 "검색 가능한 Combobox로 고객사 선택" 명시

### Decision 6: 대시보드 연동 Out-of-Scope

**PRD 변경사항:**
- US-7 전체를 Phase 2로 이동 (Out-of-Scope 아님, Phase 구분)
- Scope 4.1에서 "대시보드 daily-summary API 연동" 제거
- Implementation Priority Phase 2에 유지

### Decision 7: 파일 교체 정책

**PRD 변경사항:**
- US-4에 "기존 파일 존재 시 교체 확인 Dialog 표시 후 덮어쓰기" 추가
- 기존 파일 삭제 + 새 파일 업로드를 원자적 처리

### Decision 8: SC/CC 패턴 명시

**PRD 변경사항:**
- 5.1에 "기존 업무 검색(2021) 패턴 참조: page.tsx = SC, 모든 인터랙티브 컴포넌트 = CC" 추가

### Decision 9: Phase 2 Attachment 테이블 분리 검토

**PRD 변경사항:**
- Open Questions에 "Phase 2 다중 파일 확장 시 Attachment 테이블 분리 검토" 추가

### Decision 10: MANAGER = USER (Phase 1)

**PRD 변경사항:**
- 5.5에 "Phase 1: MANAGER는 USER와 동일하게 본인 건만 CRUD" 명시

### Decision 11: Dialog 패턴 유지 (기각)

**변경 없음.** 기존 TaskDetailDialog 패턴과 일관성 유지.

### Decision 12: 파일 보안 이중 검증

**PRD 변경사항:**
- 8. Security에 "파일 확장자 + MIME type 이중 검증" 추가
- "파일명 sanitize (경로 탐색 문자 제거, XSS 방지)" 추가

### Decision 13: 별개 엔티티 관리 (기각)

**변경 없음.** TechSupport와 Task는 목적이 다른 별개 엔티티.

---

## PRD v2 Output

모든 수용/부분 수용 결정을 반영한 최종 PRD:
→ `docs/prd/2031_기술지원_관리_prd_v2.md`
