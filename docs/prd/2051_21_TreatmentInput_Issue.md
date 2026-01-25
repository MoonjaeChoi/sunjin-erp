<!-- Generated: 2026-01-25 21:36:00 KST -->

# 처리 정보 입력

**문서 번호**: 2051_21_Issue
**원본 PRD**: 2051_장애_현황_관리_prd_v2.md (Section 6.2, US-3, US-4)
**PRD 참조**: 처리 방법 라디오, 소요 시간 입력, 포맷팅
**구현 범위**: 라디오 버튼, 분 단위 입력, 실시간 포맷팅
**복잡도**: M
**의존성**: 2051_13_Hooks

---

## 구현 목표

처리 정보(방법, 소요 시간, 결과)를 입력하고, 소요 시간을 "약 2시간 30분" 형식으로 포맷팅한다.

---

## 구현 내용

### IssueTreatmentInput.tsx (Client Component)

**필드**
1. 처리 방법 - Radio Group (원격, 전화, 현장)
2. 소요 시간 - Number Input (1~1440 분)
3. 포맷팅 표시 - "약 X시간 Y분" (실시간)
4. 처리 결과 - Textarea

**포맷팅 함수**
```typescript
function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `약 ${mins}분`;
  if (mins === 0) return `약 ${hours}시간`;
  return `약 ${hours}시간 ${mins}분`;
}
```

**검증**
- treatment_time_minutes: 1~1440 범위
- treatment_method: 필수
- treatment_result: 최대 4000자

**제출**
- useUpdateIssueMutation으로 저장
- 성공 시 토스트 알림

---

## Acceptance Criteria

- [ ] IssueTreatmentInput.tsx 생성 완료
- [ ] 라디오 버튼 선택
- [ ] 소요 시간 입력 및 검증
- [ ] 실시간 포맷팅 표시
- [ ] 처리 결과 입력
- [ ] 저장 기능

---

**다음 문서**: 2051_22_FileUpload_Issue.md
