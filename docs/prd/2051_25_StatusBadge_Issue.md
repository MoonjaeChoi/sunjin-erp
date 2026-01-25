<!-- Generated: 2026-01-25 21:40:00 KST -->

# 배지 컴포넌트

**문서 번호**: 2051_25_Issue
**원본 PRD**: 2051_장애_현황_관리_prd_v2.md (Section 6.3)
**PRD 참조**: 상태 및 심각도 배지 색상
**구현 범위**: 상태 배지, 심각도 배지, 색상/아이콘 매핑
**복잡도**: S
**의존성**: 2051_12_Types

---

## 구현 목표

상태와 심각도를 색상으로 구분되는 배지로 표시한다.

---

## 구현 내용

### IssueStatusBadge.tsx, SeverityBadge.tsx

**상태 배지**
| 상태 | 배지 색 | 아이콘 | 배경색 |
|------|--------|--------|--------|
| INTAKE | 회색 | ○ | bg-slate-100 |
| IN_PROGRESS | 파랑 | ⏳ | bg-blue-100 |
| COMPLETED | 초록 | ✓ | bg-green-100 |

**심각도 배지**
| 심각도 | 배지 색 | 텍스트색 | 배경색 |
|--------|--------|---------|--------|
| CRITICAL | 빨강 🔴 | text-red-700 | bg-red-100 |
| HIGH | 주황 🟠 | text-orange-700 | bg-orange-100 |
| MEDIUM | 노랑 🟡 | text-yellow-700 | bg-yellow-100 |
| LOW | 초록 🟢 | text-green-700 | bg-green-100 |

**구현**
```typescript
export function IssueStatusBadge({ status }: { status: IssueStatus }) {
  const config = {
    INTAKE: { label: '접수', variant: 'secondary' },
    IN_PROGRESS: { label: '진행중', variant: 'default' },
    COMPLETED: { label: '완료', variant: 'outline' },
  };
  return <Badge>{config[status].label}</Badge>;
}
```

---

## Acceptance Criteria

- [ ] IssueStatusBadge.tsx 생성 완료
- [ ] SeverityBadge.tsx 생성 완료
- [ ] 색상 매핑 정확
- [ ] 아이콘 표시
- [ ] 텍스트 라벨

---

**다음 문서**: 2051_26_Tests_Issue.md
