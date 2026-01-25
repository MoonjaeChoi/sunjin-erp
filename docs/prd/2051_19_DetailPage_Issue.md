<!-- Generated: 2026-01-25 21:34:00 KST -->

# 상세 페이지

**문서 번호**: 2051_19_Issue
**원본 PRD**: 2051_장애_현황_관리_prd_v2.md (Section 6.2, US-7)
**PRD 참조**: 상세 페이지 레이아웃
**구현 범위**: 5개 섹션 (기본정보, 설명, 처리정보, 첨부파일, 변경이력)
**복잡도**: L
**의존성**: 2051_13_Hooks, 2051_20-25

---

## 구현 목표

장애 상세 정보를 여러 섹션으로 표시하고, 권한에 따라 수정 기능을 제공한다.

---

## 구현 내용

### 파일 구조

```
src/app/(main)/issues/[id]/
├── page.tsx              # Server Component
└── _components/
    ├── IssueDetailView.tsx
    ├── IssuePublicToggle.tsx
    ├── IssueTreatmentInput.tsx
    ├── IssueFileUpload.tsx
    ├── IssueHistoryLog.tsx
    └── IssueRollbackButton.tsx
```

### IssueDetailView.tsx (Client Component)

**5개 섹션**
1. 기본 정보: 제목, 고객사, 심각도, 상태, 생성일, 담당자, 완료일
2. 설명: 설명 텍스트
3. 처리 정보: 처리 방법, 소요 시간, 처리 결과
4. 첨부파일: 파일 리스트, 업로드, 다운로드, 삭제
5. 변경 이력: 변경 로그 타임라인

**권한별 기능**
- ADMIN/MANAGER: 모든 필드 수정 가능
- USER: 처리 정보만 입력 가능

---

## Acceptance Criteria

- [ ] IssueDetailView.tsx 생성 완료
- [ ] 5개 섹션 구현
- [ ] 권한별 수정 기능 제어
- [ ] 상세 데이터 로드 및 표시
- [ ] 수정 후 캐시 무효화

---

**다음 문서**: 2051_20_PublicToggle_Issue.md
