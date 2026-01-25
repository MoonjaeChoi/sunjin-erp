<!-- Generated: 2026-01-25 21:41:00 KST -->

# 단위 테스트

**문서 번호**: 2051_26_Issue
**원본 PRD**: 2051_장애_현황_관리_prd_v2.md (Section 7)
**PRD 참조**: Success Metrics - 테스트 커버리지
**구현 범위**: API 테스트, Hook 테스트, Component 테스트
**복잡도**: L
**의존성**: 2051_04~25

---

## 구현 목표

API, Hook, Component의 단위 테스트를 작성하여 80% 이상의 커버리지를 달성한다.

---

## 구현 내용

### 테스트 파일 구조

```
src/__tests__/
├── api/
│   └── issues/
│       ├── list.test.ts
│       ├── create.test.ts
│       ├── update.test.ts
│       ├── delete.test.ts
│       ├── rollback.test.ts
│       └── attachments.test.ts
├── hooks/
│   └── issues.test.ts
└── components/
    ├── IssueFilters.test.tsx
    ├── IssueDataTable.test.tsx
    ├── IssueCreateForm.test.tsx
    ├── IssueDetailView.test.tsx
    └── ...
```

### API 테스트 (Jest + MSW)

**테스트 항목**
- RBAC 기반 행 필터링 (ADMIN, MANAGER, USER)
- is_public 필터링
- AND 필터 조합
- 페이지네이션
- 정렬
- 파일 업로드 검증
- ON DELETE RESTRICT 검증

### Hook 테스트 (@testing-library/react)

**테스트 항목**
- useIssueListQuery: 캐시 키, 에러 처리
- useMutation: 성공/실패, 캐시 무효화
- 낙관적 업데이트 (선택사항)

### Component 테스트 (@testing-library/react)

**테스트 항목**
- 렌더링 (초기 상태, 로딩, 에러)
- 사용자 상호작용 (입력, 클릭, 폼 제출)
- 권한별 기능 제어
- 토스트 알림

### E2E 테스트 (Playwright, 선택사항)

**테스트 시나리오**
1. 장애 신규 등록
2. 담당자 할당
3. 처리 정보 입력
4. 파일 첨부
5. 상태 변경
6. 상태 롤백 (ADMIN)

---

## Acceptance Criteria

- [ ] API 테스트 작성 완료 (RBAC 80% 이상)
- [ ] Hook 테스트 작성 완료
- [ ] Component 테스트 작성 완료
- [ ] E2E 테스트 작성 (주요 시나리오 5개)
- [ ] 테스트 커버리지 >= 80%
- [ ] 모든 테스트 통과 (`npm run test`)

---

## 테스트 실행 명령어

```bash
npm run test                    # 모든 테스트
npm run test -- --coverage      # 커버리지 리포트
npm run test:e2e               # E2E 테스트 (Playwright)
```

---

## 완료 체크리스트

- [ ] API 테스트 작성
- [ ] Hook 테스트 작성
- [ ] Component 테스트 작성
- [ ] E2E 테스트 작성
- [ ] 커버리지 >= 80%
- [ ] CI/CD 파이프라인 통과

---

**구현 완료!**
