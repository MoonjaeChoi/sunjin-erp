<!-- Generated: 2026-01-25 18:05:00 KST -->

# POST /api/issues — 신규 생성 API

**문서 번호**: 2051_04
**원본 PRD**: 2051_장애_현황_관리_prd_v2.md ('US-1')
**구현 범위**: 장애 신규 등록, 자동 is_public=false, 상태=INTAKE, IssueHistory 기록
**복잡도**: M (Medium)
**의존성**: 2051_02 (Migration)

---

## 구현 목표

`POST /api/issues` 엔드포인트로 새로운 장애를 등록한다. 핵심 특성:
- **is_public 기본값**: false (비공개, 보안 우선)
- **상태 자동 설정**: INTAKE (접수)
- **등록자 자동 기록**: created_by_id = 현재 세션 user
- **필수 필드 검증**: customer_id, title, severity, description
- **선택 필드**: assigned_to_id, treatment_method, treatment_time_minutes 등
- **이력 기록**: IssueHistory에 첫 기록 (등록 사실)

---

## 구현 내용

### 파일 구조

생성/수정할 파일:
```
src/app/api/issues/route.ts  # POST 메서드 추가 (GET과 동일 파일)
```

### 요청 본문 (Request Body)

```typescript
interface CreateIssueRequest {
  customer_id: number;           // 필수
  title: string;                 // 필수, 1~255자
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'; // 필수
  description: string;           // 필수, 최소 10자
  assigned_to_id?: number;       // 선택: 담당자 ID
  treatment_method?: string;     // 선택: REMOTE, PHONE, ONSITE
  treatment_time_minutes?: number; // 선택: 1~1440
  treatment_result?: string;     // 선택
}
```

### 구현 상세

```typescript
// Generated: 2026-01-25 18:05:00 KST

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { getRepository } from 'typeorm';
import { Issue } from '@/entities/Issue';
import { IssueHistory } from '@/entities/IssueHistory';
import { Customer } from '@/entities/Customer';
import { Employee } from '@/entities/Employee';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// POST 메서드 추가
export async function POST(req: NextRequest) {
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

    // USER만 등록 가능 (또는 MANAGER/ADMIN)
    // PRD에서 USER로 장애 접수 가능하다고 명시
    // 하지만 RBAC 원칙상 최소한 권한 있는 사용자만 등록 가능
    if (userRole === 'USER' || userRole === 'MANAGER' || userRole === 'ADMIN') {
      // 허용
    } else {
      return NextResponse.json(
        { message: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // 2. 요청 본문 파싱
    const body = await req.json();
    const {
      customer_id,
      title,
      severity,
      description,
      assigned_to_id,
      treatment_method,
      treatment_time_minutes,
      treatment_result,
    } = body;

    // 3. 필드 검증
    const errors: Record<string, string> = {};

    if (!customer_id || typeof customer_id !== 'number') {
      errors.customer_id = 'customer_id is required and must be a number';
    }

    if (!title || typeof title !== 'string' || title.length < 1 || title.length > 255) {
      errors.title = 'title is required and must be 1-255 characters';
    }

    if (!severity || !['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].includes(severity)) {
      errors.severity = 'severity must be CRITICAL, HIGH, MEDIUM, or LOW';
    }

    if (!description || typeof description !== 'string' || description.length < 10) {
      errors.description = 'description is required and must be at least 10 characters';
    }

    if (
      treatment_time_minutes !== undefined &&
      (typeof treatment_time_minutes !== 'number' ||
        treatment_time_minutes < 1 ||
        treatment_time_minutes > 1440)
    ) {
      errors.treatment_time_minutes = 'treatment_time_minutes must be 1-1440 (minutes)';
    }

    if (
      treatment_method &&
      !['REMOTE', 'PHONE', 'ONSITE'].includes(treatment_method)
    ) {
      errors.treatment_method = 'treatment_method must be REMOTE, PHONE, or ONSITE';
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json(
        { message: 'Validation failed', errors },
        { status: 400 }
      );
    }

    // 4. 외래키 존재 확인 (customer_id, assigned_to_id)
    const issueRepo = getRepository(Issue);
    const customerRepo = getRepository(Customer);
    const employeeRepo = getRepository(Employee);

    const customer = await customerRepo.findOne({ where: { id: customer_id } });
    if (!customer) {
      return NextResponse.json(
        { message: 'Customer not found' },
        { status: 404 }
      );
    }

    if (assigned_to_id) {
      const assignee = await employeeRepo.findOne({ where: { id: assigned_to_id } });
      if (!assignee) {
        return NextResponse.json(
          { message: 'Assignee employee not found' },
          { status: 404 }
        );
      }

      // MANAGER는 다른 부서 직원에게 할당 불가
      if (userRole === 'MANAGER' && assignee.department_id !== userDepartmentId) {
        return NextResponse.json(
          { message: 'MANAGER can only assign to same department employees' },
          { status: 400 }
        );
      }
    }

    // 5. Issue 엔티티 생성
    const newIssue = new Issue();
    newIssue.customer_id = customer_id;
    newIssue.title = title;
    newIssue.severity = severity;
    newIssue.description = description;
    newIssue.status = 'INTAKE'; // 자동 설정
    newIssue.is_public = 0; // 자동 설정: 기본값 비공개
    newIssue.created_by_id = userId;
    newIssue.assigned_to_id = assigned_to_id || null;
    newIssue.treatment_method = treatment_method || null;
    newIssue.treatment_time_minutes = treatment_time_minutes || null;
    newIssue.treatment_result = treatment_result || null;
    newIssue.deleted_at = null;

    // 6. Issue 저장
    const savedIssue = await issueRepo.save(newIssue);

    // 7. IssueHistory 첫 기록
    const historyRepo = getRepository(IssueHistory);
    const history = new IssueHistory();
    history.issue_id = savedIssue.id;
    history.change_type = 'COMMENT_ADDED'; // 또는 별도 타입 (예: ISSUE_CREATED)
    history.old_value = null;
    history.new_value = '장애 등록됨';
    history.changed_by_id = userId;
    history.remark = `등록자: ${session.user.name || 'Unknown'}`;

    await historyRepo.save(history);

    // 8. 응답 반환
    return NextResponse.json(
      {
        message: 'Issue created successfully',
        data: {
          id: savedIssue.id,
          customer_id: savedIssue.customer_id,
          title: savedIssue.title,
          severity: savedIssue.severity,
          status: savedIssue.status,
          is_public: savedIssue.is_public,
          created_by_id: savedIssue.created_by_id,
          assigned_to_id: savedIssue.assigned_to_id,
          created_at: savedIssue.created_at,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/issues error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 주요 구현 포인트

#### 1. is_public 기본값 설정

```typescript
newIssue.is_public = 0; // 항상 0 (비공개)
```

#### 2. status 자동 설정

```typescript
newIssue.status = 'INTAKE'; // 항상 'INTAKE'
```

#### 3. 등록자 자동 기록

```typescript
newIssue.created_by_id = userId; // 세션 user
```

#### 4. MANAGER 부서 제약

```typescript
if (userRole === 'MANAGER' && assignee.department_id !== userDepartmentId) {
  return NextResponse.json(
    { message: 'MANAGER can only assign to same department employees' },
    { status: 400 }
  );
}
```

#### 5. 이력 기록

```typescript
const history = new IssueHistory();
history.issue_id = savedIssue.id;
history.change_type = 'COMMENT_ADDED'; // 또는 새 타입 추가 가능
history.new_value = '장애 등록됨';
history.changed_by_id = userId;
```

---

## 핵심 인터페이스

### 요청

```typescript
interface CreateIssueRequest {
  customer_id: number;           // 필수
  title: string;                 // 필수
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'; // 필수
  description: string;           // 필수
  assigned_to_id?: number;       // 선택
  treatment_method?: 'REMOTE' | 'PHONE' | 'ONSITE'; // 선택
  treatment_time_minutes?: number; // 선택
  treatment_result?: string;     // 선택
}
```

### 응답 (201 Created)

```typescript
interface CreateIssueResponse {
  message: string;
  data: {
    id: number;
    customer_id: number;
    title: string;
    severity: string;
    status: 'INTAKE';
    is_public: 0;
    created_by_id: number;
    assigned_to_id: number | null;
    created_at: Date;
  };
}
```

### 에러 응답

```typescript
interface ErrorResponse {
  message: string;
  errors?: Record<string, string>; // 검증 오류 시
}
```

---

## Acceptance Criteria

- [ ] POST /api/issues 엔드포인트 정상 응답 (201 Created)
- [ ] customer_id 필수 검증
- [ ] title 필수 및 길이 검증 (1-255)
- [ ] severity 필수 및 값 검증 (CRITICAL/HIGH/MEDIUM/LOW)
- [ ] description 필수 및 최소 길이 검증
- [ ] treatment_time_minutes 범위 검증 (1-1440)
- [ ] treatment_method 값 검증
- [ ] is_public 자동으로 0 설정
- [ ] status 자동으로 INTAKE 설정
- [ ] created_by_id 자동으로 세션 user 설정
- [ ] MANAGER는 다른 부서 직원 할당 불가 (400)
- [ ] 고객사 존재 검증 (404)
- [ ] 담당자 존재 검증 (404)
- [ ] IssueHistory 첫 기록 생성됨
- [ ] 인증 없으면 401 응답
- [ ] 권한 없으면 403 응답

---

## 테스트 전략

### 테스트 케이스

| 테스트 | 입력 | 예상 결과 |
|--------|------|----------|
| 정상 등록 | 필수 필드 O | 201, Issue 생성 |
| customer_id 누락 | customer_id 없음 | 400 Validation failed |
| title 길이 초과 | title > 255자 | 400 Validation failed |
| description 너무 짧음 | description < 10자 | 400 Validation failed |
| severity 오류 | severity=INVALID | 400 Validation failed |
| treatment_time 범위 오류 | treatment_time=9999 | 400 Validation failed |
| 고객사 미존재 | customer_id=9999 | 404 Customer not found |
| 담당자 미존재 | assigned_to_id=9999 | 404 Assignee not found |
| MANAGER 다른 부서 할당 | MANAGER + 다른 부서 담당자 | 400 Same department required |
| 미인증 | session=null | 401 Unauthorized |

### 검증 방법

```bash
# 정상 등록
curl -X POST http://localhost:3000/api/issues \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": 1,
    "title": "데이터베이스 연결 오류",
    "severity": "CRITICAL",
    "description": "메인 DB 서버에 연결이 되지 않고 있습니다. 긴급 조치 바랍니다.",
    "assigned_to_id": 5
  }'

# 검증 오류 확인
curl -X POST http://localhost:3000/api/issues \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": 1,
    "title": "테스트",
    "severity": "INVALID"
  }'
```

---

## 완료 체크리스트

- [ ] POST 메서드 구현 (src/app/api/issues/route.ts)
- [ ] 필드 검증 로직 완료
- [ ] is_public 자동 설정 (0)
- [ ] status 자동 설정 (INTAKE)
- [ ] created_by_id 자동 설정
- [ ] MANAGER 부서 제약 검증
- [ ] 외래키 존재 검증 (customer_id, assigned_to_id)
- [ ] IssueHistory 이력 기록
- [ ] 201 상태 코드 응답
- [ ] 에러 처리 (400, 401, 403, 404, 500)
- [ ] TypeScript 빌드 성공
- [ ] ESLint 통과

---

**다음 문서**: 2051_05_GET_issues_id_상세_조회_API.md
