<!-- Generated: 2026-01-25 04:50:00 KST -->

# Discussion Topics: 기술지원 관리 PRD (2031)

원본 PRD: docs/prd/2031_기술지원_관리_prd.md
리뷰: docs/prd/2031_기술지원_관리_prd_critical_review.md
반론: docs/prd/2031_기술지원_관리_prd_rebuttal.md

---

## Mode: AI-Assisted (자동 결정)

아래 토픽들은 Critical Review에서 제기되고 Rebuttal에서 응답된 논점입니다.
AI-Assisted 모드에서는 Rebuttal의 결정을 기반으로 자동 중재됩니다.

---

## HIGH Priority Topics

### Topic 1: 상태 전이 매트릭스
- **Issue**: 역방향 전이 가능 여부, ADMIN 권한 범위
- **Rebuttal Decision**: 수용 — COMPLETED → IN_PROGRESS만 허용, ADMIN은 모든 전이 가능
- **Action Required**: PRD에 상태 전이 매트릭스 추가

### Topic 2: Customer 의존성 해결
- **Issue**: Customer 엔티티 없이 기술지원 등록 불가
- **Rebuttal Decision**: 수용 — Customer 엔티티 + seed data + 선택 API를 구현 범위에 포함
- **Action Required**: 구현 범위에 Customer 최소 구현 명시

### Topic 3: Customer 엔티티 확장 가능성
- **Issue**: 최소 정의가 향후 고객 관리 PRD와 충돌 가능
- **Rebuttal Decision**: 부분 수용 — 확장 필드 목록을 Open Questions에 참고용 기록
- **Action Required**: Open Questions에 확장 가능 필드 명시

### Topic 4: Customer 모듈 구현 순서
- **Issue**: Phase 순서 위반 가능성
- **Rebuttal Decision**: 수용 — Customer 최소 구현을 선행 작업으로 정의
- **Action Required**: Implementation Priority에 선행 작업 명시

---

## MEDIUM Priority Topics

### Topic 5: 고객사 선택 UI
- **Issue**: Select vs Combobox
- **Rebuttal Decision**: 수용 — Combobox로 확정
- **Action Required**: UI 스펙에 Combobox 명시

### Topic 6: 대시보드 연동 범위
- **Issue**: daily-summary API 수정 범위 불명확
- **Rebuttal Decision**: 수용 — Out-of-Scope로 이동
- **Action Required**: Scope에서 대시보드 연동 제거

### Topic 7: 파일 업로드 교체 처리
- **Issue**: 기존 파일 있을 때 새 파일 업로드 동작
- **Rebuttal Decision**: 수용 — 교체 정책 + 확인 Dialog
- **Action Required**: 파일 업로드 섹션에 교체 정책 추가

### Topic 8: SC/CC 분리 명시화
- **Issue**: Server/Client Component 분리 전략 미기술
- **Rebuttal Decision**: 수용 — 기존 패턴 참조 명시
- **Action Required**: Architecture 섹션에 SC/CC 패턴 추가

### Topic 9: Attachment 메타데이터
- **Issue**: 파일 크기, MIME type 등 메타데이터 없음
- **Rebuttal Decision**: 부분 수용 — Phase 1 inline, Phase 2 분리 검토
- **Action Required**: Open Questions에 Phase 2 Attachment 테이블 분리 기록

### Topic 10: MANAGER 역할 Phase 1
- **Issue**: Phase 1에서 MANAGER 동작 미명시
- **Rebuttal Decision**: 수용 — MANAGER = USER (Phase 1) 명시
- **Action Required**: Authorization 섹션에 Phase 1 MANAGER 동작 추가

### Topic 11: 등록 UI 방식
- **Issue**: Dialog vs 전용 페이지
- **Rebuttal Decision**: 기각 — Dialog 패턴 유지
- **Action Required**: 없음 (기존 유지)

### Topic 12: 파일 업로드 보안
- **Issue**: MIME type 검증만으로 불충분
- **Rebuttal Decision**: 부분 수용 — 확장자 + MIME 이중 검증, 파일명 sanitize
- **Action Required**: Security 섹션에 이중 검증 + sanitize 추가

### Topic 13: Task 엔티티 관계
- **Issue**: TechSupport와 Task 자동 연동 여부
- **Rebuttal Decision**: 기각 — 별개 엔티티, 자동 연동 없음
- **Action Required**: 없음 (기존 유지)

---

## Summary of Actions

| Decision | Count | Topics |
|----------|-------|--------|
| 수용 | 7 | #1, #2, #4, #5, #6, #7, #8, #10 |
| 부분 수용 | 3 | #3, #9, #12 |
| 기각 | 2 | #11, #13 |

**Total PRD modifications required**: 11 topics (수용 + 부분 수용)
