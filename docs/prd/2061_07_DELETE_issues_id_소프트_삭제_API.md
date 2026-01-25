<!-- Generated: 2026-01-25 18:05:00 KST -->

# DELETE /api/issues/[id] — 소프트 삭제 API

**문서 번호**: 2061_07
**원본 PRD**: 2061_장애_현황_관리_prd_v2.md ('US-4', '5.3 Database')
**구현 범위**: 소프트 삭제, 첨부파일 검증 (ON DELETE RESTRICT), ADMIN만 삭제 가능
**복잡도**: M (Medium)
**의존성**: 2061_02 (Migration)

---

## 구현 목표

`DELETE /api/issues/[id]` 엔드포인트로 장애를 소프트 삭제한다. 핵심 특성:
- **ADMIN만 삭제 가능**: 다른 역할 시 403 Forbidden
- **첨부파일 검증**: Issue 삭제 전 첨부파일이 있으면 409 Conflict
- **소프트 삭제**: deleted_at에 현재 시각 기록 (물리 삭제 금지)
- **증거 보존**: ON DELETE RESTRICT 정책으로 데이터 무결성 유지
- **이력 기록**: 삭제 사실을 IssueHistory에 기록할 수 있음 (선택)

---

## 구현 내용

### 파일 구조

생성/수정할 파일:
```
src/app/api/issues/[id]/route.ts  # DELETE 메서드 추가 (GET, PUT과 동일 파일)
```

### 구현 상세

```typescript
// Generated: 2026-01-25 18:05:00 KST

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    // 1. 세션 확인
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const userRole = session.user.role;
    const issueId = parseInt(params.id);

    if (isNaN(issueId)) {
      return NextResponse.json(
        { message: 'Invalid issue ID' },
        { status: 400 }
      );
    }

    // 2. ADMIN만 삭제 가능
    if (userRole !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Only ADMIN can delete issues' },
        { status: 403 }
      );
    }

    // 3. Issue 조회
    const issueRepo = getRepository(Issue);
    const issue = await issueRepo.findOne({
      where: { id: issueId, deleted_at: null },
    });

    if (!issue) {
      return NextResponse.json(
        { message: 'Issue not found' },
        { status: 404 }
      );
    }

    // 4. 첨부파일 존재 여부 확인 (ON DELETE RESTRICT)
    const attachmentRepo = getRepository(IssueAttachment);
    const attachmentCount = await attachmentRepo.count({
      where: { issue_id: issueId, deleted_at: null },
    });

    if (attachmentCount > 0) {
      return NextResponse.json(
        {
          message: 'Cannot delete issue with attachments',
          error_code: 'ATTACHMENTS_EXIST',
          attachments_count: attachmentCount,
        },
        { status: 409 }
      );
    }

    // 5. 소프트 삭제 (deleted_at 설정)
    issue.deleted_at = new Date();
    await issueRepo.save(issue);

    // 6. 선택: 삭제 이력 기록
    const historyRepo = getRepository(IssueHistory);
    const history = new IssueHistory();
    history.issue_id = issueId;
    history.change_type = 'STATUS_CHANGE'; // 또는 별도 타입
    history.old_value = 'ACTIVE';
    history.new_value = 'DELETED';
    history.changed_by_id = userId;
    history.remark = `Soft deleted at ${new Date().toISOString()}`;

    await historyRepo.save(history);

    // 7. 응답 반환 (204 No Content 또는 200 OK)
    return NextResponse.json(
      {
        message: 'Issue deleted successfully',
        data: {
          id: issue.id,
          deleted_at: issue.deleted_at,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE /api/issues/[id] error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

## 에러 응답 상세

### 409 Conflict (첨부파일 존재)

```json
{
  "message": "Cannot delete issue with attachments",
  "error_code": "ATTACHMENTS_EXIST",
  "attachments_count": 2
}
```

**클라이언트 처리**: "먼저 모든 첨부파일을 삭제해주세요." 메시지 표시

### 403 Forbidden (권한 없음)

```json
{
  "message": "Only ADMIN can delete issues"
}
```

---

## 핵심 인터페이스

### 응답 (200 OK)

```typescript
interface DeleteIssueResponse {
  message: string;
  data: {
    id: number;
    deleted_at: Date;
  };
}
```

### 에러 응답 (409 Conflict)

```typescript
interface DeleteConflictResponse {
  message: string;
  error_code: string; // 'ATTACHMENTS_EXIST'
  attachments_count: number;
}
```

---

## Acceptance Criteria

- [ ] DELETE /api/issues/[id] 엔드포인트 정상 응답 (200 OK)
- [ ] ADMIN만 삭제 가능
- [ ] ADMIN 아닌 역할은 403 Forbidden
- [ ] Issue 없으면 404 Not Found
- [ ] 첨부파일 있으면 409 Conflict
- [ ] deleted_at에 현재 시각 기록 (소프트 삭제)
- [ ] 물리 삭제 없음 (SELECT 시 deleted_at IS NULL만)
- [ ] IssueHistory에 삭제 이력 기록 (선택)
- [ ] 미인증 시 401 Unauthorized
- [ ] 잘못된 ID 형식 시 400 Bad Request

---

## 테스트 전략

### 테스트 케이스

| 테스트 | 조건 | 예상 결과 |
|--------|------|----------|
| 정상 삭제 | ADMIN + 첨부파일 없음 | 200 OK, deleted_at 설정 |
| 첨부파일 있음 | 첨부파일 2개 존재 | 409 Conflict, attachments_count=2 |
| 권한 없음 (MANAGER) | MANAGER 역할 | 403 Forbidden |
| 권한 없음 (USER) | USER 역할 | 403 Forbidden |
| Issue 미존재 | id=9999 | 404 Not Found |
| 이미 삭제됨 | deleted_at 이미 있음 | 404 Not Found |
| 미인증 | session=null | 401 Unauthorized |

### 검증 방법

```bash
# 정상 삭제 (첨부파일 없을 때)
curl -X DELETE http://localhost:3000/api/issues/1 \
  -H "Authorization: Bearer <admin_token>"

# 첨부파일 있을 때 (예상: 409)
curl -X DELETE http://localhost:3000/api/issues/2 \
  -H "Authorization: Bearer <admin_token>"

# 응답 예상
{
  "message": "Cannot delete issue with attachments",
  "error_code": "ATTACHMENTS_EXIST",
  "attachments_count": 2
}

# MANAGER 시도 (예상: 403)
curl -X DELETE http://localhost:3000/api/issues/1 \
  -H "Authorization: Bearer <manager_token>"
```

---

## 완료 체크리스트

- [ ] DELETE 메서드 구현 (src/app/api/issues/[id]/route.ts)
- [ ] ADMIN 역할 검증
- [ ] Issue 존재 여부 검증
- [ ] 첨부파일 개수 확인
- [ ] 첨부파일 있으면 409 Conflict 응답
- [ ] 소프트 삭제 (deleted_at 설정)
- [ ] deleted_at 시각 기록
- [ ] IssueHistory 이력 기록 (선택)
- [ ] 200 OK 응답
- [ ] 에러 처리 (400, 401, 403, 404, 409)
- [ ] TypeScript 빌드 성공
- [ ] ESLint 통과

---

## 주의사항

### ON DELETE RESTRICT 정책 준수

이 API는 다음 규칙을 따름:
- **첨부파일 있으면 삭제 불가** (409 Conflict)
- **클라이언트에서 먼저 파일 삭제 요청**해야 함
- **증거 보존 원칙** 유지

---

**다음 문서**: 2061_08_추가_API_Routes.md
