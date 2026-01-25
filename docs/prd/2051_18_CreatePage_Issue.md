<!-- Generated: 2026-01-25 21:33:00 KST -->

# 신규 등록 페이지

**문서 번호**: 2051_18_Issue
**원본 PRD**: 2051_장애_현황_관리_prd_v2.md (Section 6.2, US-1)
**PRD 참조**: 신규 등록 페이지 레이아웃
**구현 범위**: 폼 검증, 선택 사항, is_public 기본값
**복잡도**: M
**의존성**: 2051_13_Hooks, 2051_12_Types

---

## 구현 목표

새로운 장애를 신규 등록하는 페이지를 구현한다.

---

## 구현 내용

### 파일 구조

```
src/app/(main)/issues/new/
├── page.tsx              # Server Component
└── _components/
    └── IssueCreateForm.tsx   # Client Component
```

### IssueCreateForm.tsx (Client Component)

**필드**
| 필드 | 유형 | 필수 | 기본값 |
|------|------|------|--------|
| 고객사 | Combobox | ✓ | — |
| 제목 | Input | ✓ | — |
| 심각도 | Radio Group | ✓ | MEDIUM |
| 설명 | Textarea | ✓ | — |
| 담당자 | Select | ✗ | (미지정) |

**검증**
- 고객사: 필수
- 제목: 필수, 최대 255자
- 설명: 필수, 최대 4000자
- 심각도: 필수

**제출 로직**
1. 폼 유효성 검증 (React Hook Form + Zod)
2. useCreateIssueMutation 호출
3. 성공 시: 토스트 알림 + 상세 페이지로 이동
4. 실패 시: 에러 메시지 표시

---

## Acceptance Criteria

- [ ] IssueCreateForm.tsx 생성 완료
- [ ] 모든 필드 검증
- [ ] is_public 기본값 false (자동)
- [ ] 제출 후 상세 페이지 이동
- [ ] 토스트 알림 표시

---

**다음 문서**: 2051_19_DetailPage_Issue.md
