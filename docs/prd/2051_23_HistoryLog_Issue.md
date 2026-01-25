<!-- Generated: 2026-01-25 21:38:00 KST -->

# 변경 이력 섹션

**문서 번호**: 2051_23_Issue
**원본 PRD**: 2051_장애_현황_관리_prd_v2.md (Section 6.2, US-7)
**PRD 참조**: 변경 이력 섹션
**구현 범위**: 테이블 표시, 타입별 포맷팅
**복잡도**: M
**의존성**: 2051_13_Hooks

---

## 구현 목표

장애의 모든 변경 사항을 시간순으로 표시한다.

---

## 구현 내용

### IssueHistoryLog.tsx (Client Component)

**컬럼**
| 컬럼 | 콘텐츠 |
|------|--------|
| 시간 | changed_at (YYYY-MM-DD HH:MM:SS) |
| 변경 타입 | "상태 변경", "담당자 변경", "심각도 변경", "파일 업로드", "파일 삭제", "롤백" |
| 변경 내용 | old_value → new_value (타입에 따라 포맷팅) |
| 변경자 | changed_by_name |

**포맷팅 예시**
- STATUS_CHANGE: "접수 → 진행중"
- ASSIGNEE_CHANGE: "미지정 → 김철수"
- SEVERITY_CHANGE: "높음 → 보통"
- ATTACHMENT_UPLOADED: "파일: 완료_리포트.pdf"
- ATTACHMENT_DELETED: "파일: 스크린샷.png"
- STATUS_ROLLBACK: "진행중으로 되돌림"

**표시**
- 최신순으로 정렬
- 시간대별 구분 (선택사항)
- 실시간 상대 시간 표시 가능 (예: "2시간 전")

---

## Acceptance Criteria

- [ ] IssueHistoryLog.tsx 생성 완료
- [ ] 변경 이력 테이블 표시
- [ ] 타입별 포맷팅
- [ ] 최신순 정렬
- [ ] 로딩 상태 표시

---

**다음 문서**: 2051_24_RollbackButton_Issue.md
