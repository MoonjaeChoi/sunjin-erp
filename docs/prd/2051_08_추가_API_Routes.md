<!-- Generated: 2026-01-25 18:05:00 KST -->

# 추가 API Routes (Rollback, Attachments, Summary)

**문서 번호**: 2051_08
**원본 PRD**: 2051_장애_현황_관리_prd_v2.md ('US-4, US-6, US-11')
**구현 범위**: 상태 롤백, 파일 업로드/삭제, 요약 배지
**복잡도**: L (Large)
**의존성**: 2051_02 (Migration)

---

## 구현 목표

추가 API 엔드포인트 4개를 구현한다:

1. `PUT /api/issues/[id]/rollback` — 상태 COMPLETED → IN_PROGRESS (ADMIN만)
2. `POST /api/issues/[id]/attachments` — 파일 업로드 (이중 검증)
3. `DELETE /api/issues/[id]/attachments/[attachmentId]` — 파일 삭제
4. `GET /api/issues/summary` — 상태별 카운트 (필터 적용)

---

## 구현 내용

### 파일 구조

생성할 파일:
```
src/app/api/issues/[id]/rollback/route.ts
src/app/api/issues/[id]/attachments/route.ts
src/app/api/issues/[id]/attachments/[attachmentId]/route.ts
src/app/api/issues/summary/route.ts
```

---

## 1. PUT /api/issues/[id]/rollback — 상태 롤백

### 목표

COMPLETED 상태를 IN_PROGRESS로 되돌린다. ADMIN만 가능.

### 구현

```typescript
// Generated: 2026-01-25 18:05:00 KST
// src/app/api/issues/[id]/rollback/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { getRepository } from 'typeorm';
import { Issue } from '@/entities/Issue';
import { IssueHistory } from '@/entities/IssueHistory';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    // 1. 세션 및 ADMIN 검증
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Only ADMIN can rollback status' },
        { status: 403 }
      );
    }

    const userId = session.user.id;
    const issueId = parseInt(params.id);

    if (isNaN(issueId)) {
      return NextResponse.json(
        { message: 'Invalid issue ID' },
        { status: 400 }
      );
    }

    // 2. Issue 조회
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

    // 3. 상태 검증 (COMPLETED만 가능)
    if (issue.status !== 'COMPLETED') {
      return NextResponse.json(
        { message: `Only COMPLETED issues can be rolled back. Current status: ${issue.status}` },
        { status: 400 }
      );
    }

    // 4. 상태 변경
    issue.status = 'IN_PROGRESS';
    issue.completed_at = null; // 완료일 초기화
    await issueRepo.save(issue);

    // 5. 이력 기록 (STATUS_ROLLBACK)
    const historyRepo = getRepository(IssueHistory);
    const history = new IssueHistory();
    history.issue_id = issueId;
    history.change_type = 'STATUS_ROLLBACK';
    history.old_value = 'COMPLETED';
    history.new_value = 'IN_PROGRESS';
    history.changed_by_id = userId;
    history.remark = `Rolled back by ADMIN at ${new Date().toISOString()}`;

    await historyRepo.save(history);

    // 6. 응답
    return NextResponse.json({
      message: 'Issue status rolled back successfully',
      data: {
        id: issue.id,
        status: issue.status,
        completed_at: issue.completed_at,
      },
    });
  } catch (error) {
    console.error('PUT /api/issues/[id]/rollback error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

## 2. POST /api/issues/[id]/attachments — 파일 업로드

### 목표

장애 관련 첨부파일을 업로드한다. 프론트엔드 + 서버 이중 검증.

### 제약사항

- 파일당 최대 10MB
- 장애당 최대 5개
- 허용 포맷: PDF, Excel, Word, 이미지 등 일반 문서
- MIME type 검증 (이중)
- 확장자 화이트리스트

### 구현

```typescript
// src/app/api/issues/[id]/attachments/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { getRepository } from 'typeorm';
import { Issue } from '@/entities/Issue';
import { IssueAttachment } from '@/entities/IssueAttachment';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads/issues';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES_PER_ISSUE = 5;
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'image/jpeg',
  'image/png',
  'image/gif',
];
const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.xlsx', '.pptx', '.jpg', '.jpeg', '.png', '.gif'];

interface RouteParams {
  params: {
    id: string;
  };
}

export async function POST(req: NextRequest, { params }: RouteParams) {
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
    const issueId = parseInt(params.id);

    if (isNaN(issueId)) {
      return NextResponse.json(
        { message: 'Invalid issue ID' },
        { status: 400 }
      );
    }

    // 2. Issue 조회
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

    // 3. 현재 파일 개수 확인
    const attachmentRepo = getRepository(IssueAttachment);
    const currentFileCount = await attachmentRepo.count({
      where: { issue_id: issueId, deleted_at: null },
    });

    if (currentFileCount >= MAX_FILES_PER_ISSUE) {
      return NextResponse.json(
        {
          message: `Maximum ${MAX_FILES_PER_ISSUE} files per issue`,
          error_code: 'MAX_FILES_EXCEEDED',
        },
        { status: 400 }
      );
    }

    // 4. 폼 데이터 파싱
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { message: 'No file provided' },
        { status: 400 }
      );
    }

    // 5. 파일 검증 (서버 재검증)
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          message: `File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit`,
          error_code: 'FILE_TOO_LARGE',
          file_size: file.size,
        },
        { status: 400 }
      );
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          message: 'File type not allowed',
          error_code: 'UNSUPPORTED_FILE_TYPE',
          mime_type: file.type,
        },
        { status: 400 }
      );
    }

    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(fileExtension)) {
      return NextResponse.json(
        {
          message: 'File extension not allowed',
          error_code: 'UNSUPPORTED_EXTENSION',
          extension: fileExtension,
        },
        { status: 400 }
      );
    }

    // 6. 파일 저장
    await mkdir(UPLOAD_DIR, { recursive: true });
    const fileName = `${issueId}_${Date.now()}_${uuidv4()}${fileExtension}`;
    const filePath = join(UPLOAD_DIR, fileName);
    const buffer = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(buffer));

    // 7. IssueAttachment 엔티티 생성
    const attachment = new IssueAttachment();
    attachment.issue_id = issueId;
    attachment.file_name = file.name;
    attachment.file_path = filePath;
    attachment.file_size = file.size;
    attachment.uploaded_by_id = userId;

    await attachmentRepo.save(attachment);

    // 8. 응답
    return NextResponse.json(
      {
        message: 'File uploaded successfully',
        data: {
          id: attachment.id,
          file_name: attachment.file_name,
          file_size: attachment.file_size,
          created_at: attachment.created_at,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/issues/[id]/attachments error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

## 3. DELETE /api/issues/[id]/attachments/[attachmentId] — 파일 삭제

### 목표

특정 첨부파일을 소프트 삭제한다.

### 구현

```typescript
// src/app/api/issues/[id]/attachments/[attachmentId]/route.ts

interface AttachmentRouteParams {
  params: {
    id: string;
    attachmentId: string;
  };
}

export async function DELETE(req: NextRequest, { params }: AttachmentRouteParams) {
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
    const issueId = parseInt(params.id);
    const attachmentId = parseInt(params.attachmentId);

    if (isNaN(issueId) || isNaN(attachmentId)) {
      return NextResponse.json(
        { message: 'Invalid IDs' },
        { status: 400 }
      );
    }

    // 2. IssueAttachment 조회
    const attachmentRepo = getRepository(IssueAttachment);
    const attachment = await attachmentRepo.findOne({
      where: { id: attachmentId, issue_id: issueId, deleted_at: null },
    });

    if (!attachment) {
      return NextResponse.json(
        { message: 'Attachment not found' },
        { status: 404 }
      );
    }

    // 3. 소프트 삭제
    attachment.deleted_at = new Date();
    await attachmentRepo.save(attachment);

    // 4. 이력 기록 (선택)
    const historyRepo = getRepository(IssueHistory);
    const history = new IssueHistory();
    history.issue_id = issueId;
    history.change_type = 'ATTACHMENT_DELETED';
    history.old_value = attachment.file_name;
    history.new_value = null;
    history.changed_by_id = userId;

    await historyRepo.save(history);

    // 5. 응답
    return NextResponse.json({
      message: 'Attachment deleted successfully',
      data: {
        id: attachment.id,
        deleted_at: attachment.deleted_at,
      },
    });
  } catch (error) {
    console.error('DELETE attachment error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

## 4. GET /api/issues/summary — 요약 배지

### 목표

상태별 카운트 반환 (필터 적용, RBAC 기반).

### 구현

```typescript
// src/app/api/issues/summary/route.ts

export async function GET(req: NextRequest) {
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
    const userDepartmentId = session.user.department_id;

    // 2. 쿼리 파라미터 파싱 (필터)
    const searchParams = req.nextUrl.searchParams;
    const customer_id = searchParams.get('customer_id')
      ? parseInt(searchParams.get('customer_id')!)
      : undefined;
    const severity = searchParams.get('severity')
      ? searchParams.get('severity')!.split(',')
      : undefined;

    // 3. WHERE 절 구성 (RLS + 필터)
    let whereClause = 'WHERE i.deleted_at IS NULL';
    const params: any = {};

    if (userRole === 'ADMIN') {
      // 모든 데이터
    } else if (userRole === 'MANAGER') {
      whereClause += ` AND i.assigned_to_id IS NOT NULL
        AND e_assigned.department_id = :userDepartmentId`;
      params.userDepartmentId = userDepartmentId;
    } else if (userRole === 'USER') {
      whereClause += ` AND (
        i.created_by_id = :userId
        OR i.assigned_to_id = :userId
        OR (i.is_public = 1 AND e_assigned.department_id = :userDepartmentId)
      )`;
      params.userId = userId;
      params.userDepartmentId = userDepartmentId;
    }

    // 필터 적용
    if (customer_id) {
      whereClause += ' AND i.customer_id = :customer_id';
      params.customer_id = customer_id;
    }

    if (severity && severity.length > 0) {
      whereClause += ` AND i.severity IN (${severity.map((_, i) => `:severity_${i}`).join(',')})`;
      severity.forEach((s, i) => {
        params[`severity_${i}`] = s;
      });
    }

    // 4. 쿼리 실행 (상태별 카운트)
    const connection = getRepository(Issue).manager.connection;

    const query = `
      SELECT
        i.status,
        COUNT(*) as count
      FROM ISSUE i
      LEFT JOIN EMPLOYEE e_assigned ON i.assigned_to_id = e_assigned.id
      ${whereClause}
      GROUP BY i.status
    `;

    const results = await connection.query(query, [
      ...Object.entries(params).map(([k, v]) => v),
    ]);

    // 5. 결과 정리
    const statusCounts: Record<string, number> = {
      INTAKE: 0,
      IN_PROGRESS: 0,
      COMPLETED: 0,
    };

    results.forEach((r: any) => {
      statusCounts[r.STATUS] = r.COUNT;
    });

    const total = Object.values(statusCounts).reduce((a: number, b: number) => a + b, 0);

    // 6. 응답
    return NextResponse.json({
      data: {
        total,
        intake: statusCounts.INTAKE,
        in_progress: statusCounts.IN_PROGRESS,
        completed: statusCounts.COMPLETED,
      },
    });
  } catch (error) {
    console.error('GET /api/issues/summary error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

## Acceptance Criteria

### 롤백 (PUT /api/issues/[id]/rollback)
- [ ] ADMIN만 실행 가능
- [ ] COMPLETED 상태만 롤백 가능
- [ ] 상태 COMPLETED → IN_PROGRESS
- [ ] completed_at 초기화
- [ ] IssueHistory STATUS_ROLLBACK 기록

### 파일 업로드 (POST /api/issues/[id]/attachments)
- [ ] 파일 크기 검증 (최대 10MB)
- [ ] 파일 개수 검증 (최대 5개)
- [ ] MIME type 검증 (이중)
- [ ] 확장자 화이트리스트 검증
- [ ] 파일 저장 (UPLOAD_DIR 사용)
- [ ] IssueAttachment 엔티티 생성
- [ ] 201 Created 응답

### 파일 삭제 (DELETE /api/issues/[id]/attachments/[attachmentId])
- [ ] 첨부파일 소프트 삭제
- [ ] deleted_at 설정
- [ ] IssueHistory ATTACHMENT_DELETED 기록

### 요약 배지 (GET /api/issues/summary)
- [ ] RBAC 기반 필터링
- [ ] 필터 적용 (customer_id, severity)
- [ ] 상태별 카운트 반환
- [ ] total, intake, in_progress, completed 필드

---

## 완료 체크리스트

- [ ] PUT /api/issues/[id]/rollback 구현
- [ ] POST /api/issues/[id]/attachments 구현
- [ ] DELETE /api/issues/[id]/attachments/[attachmentId] 구현
- [ ] GET /api/issues/summary 구현
- [ ] 파일 검증 (프론트 + 서버)
- [ ] 이력 기록
- [ ] RBAC 검증
- [ ] 필터 적용
- [ ] TypeScript 빌드 성공
- [ ] ESLint 통과

---

**다음 문서**: 2051_09_TypeScript_타입_정의.md
