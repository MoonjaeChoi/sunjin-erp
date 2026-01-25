<!-- Generated: 2026-01-25 21:20:00 KST -->

# 장애 생성 API

**문서 번호**: 2051_05_Issue
**원본 PRD**: 2051_장애_현황_관리_prd_v2.md (Section 5.2, US-1)
**PRD 참조**: POST /api/issues
**구현 범위**: 유효성 검증, is_public 기본값, 이력 기록
**복잡도**: M
**의존성**: 2051_01, 2051_03

---

## 구현 목표

새로운 장애를 생성한다. is_public은 기본값 false로 설정되며, 생성 이력을 기록한다.

---

## 구현 내용

### POST /api/issues

**요청 본문**
```json
{
  "customer_id": 1,
  "title": "DB 연결 오류",
  "description": "메인 DB 서버 연결 불가",
  "severity": "CRITICAL",
  "assigned_to_id": 5
}
```

**응답**
```json
{
  "id": 1,
  "title": "DB 연결 오류",
  "status": "INTAKE",
  "is_public": 0,
  "created_at": "2026-01-25T21:20:00Z"
}
```

**구현 로직**
1. 인증 확인
2. 권한 검증 (USER 이상)
3. customer_id, title, severity 필수 필드 검증
4. is_public 기본값: 0 (false)
5. status 기본값: "INTAKE"
6. 생성자(created_by_id) = session.user.id
7. 데이터 저장
8. IssueHistory 기록 (선택사항: 처음 생성만 기록 또는 최소한의 정보)

---

## Acceptance Criteria

- [ ] POST /api/issues 구현 완료
- [ ] is_public 기본값 false 확인
- [ ] status 기본값 "INTAKE" 확인
- [ ] 필수 필드 검증
- [ ] created_by_id 자동 설정
- [ ] API 응답 시간 < 200ms

---

**다음 문서**: 2051_06_Update_API_Issue.md
