<!-- Generated: 2026-01-25 18:05:00 KST -->

# TypeORM Entity 정의

**문서 번호**: 2061_01
**원본 PRD**: 2061_장애_현황_관리_prd_v2.md ('5. Technical Considerations & Architecture Alignment' → '5.3 Database')
**구현 범위**: Issue, IssueAttachment, IssueHistory 3개 Entity 정의
**복잡도**: S (Small)
**의존성**: Employee, Customer 엔티티 사전 구현 필요

---

## 구현 목표

Oracle XE 21c에 저장될 3개 엔티티를 TypeORM으로 정의한다. 모든 엔티티는:
- 소프트 삭제 지원 (`deleted_at` 컬럼)
- 자동 타임스탐프 기록 (`created_at`, `updated_at`)
- Oracle 규칙 준수 (`VARCHAR2`, `NUMBER`, `CLOB`, double-quote identifiers)
- **외래키는 모두 `ON DELETE RESTRICT` (CASCADE 금지)**

---

## 구현 내용

### 파일 구조

생성할 파일:
```
src/entities/Issue.ts           # Issue 엔티티
src/entities/IssueAttachment.ts # IssueAttachment 엔티티
src/entities/IssueHistory.ts    # IssueHistory 엔티티
```

### 구현 상세

#### 1. Issue 엔티티 (`src/entities/Issue.ts`)

```typescript
// Generated: 2026-01-25 18:05:00 KST

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Customer } from './Customer';
import { Employee } from './Employee';
import { IssueAttachment } from './IssueAttachment';
import { IssueHistory } from './IssueHistory';

export type IssueStatus = 'INTAKE' | 'IN_PROGRESS' | 'COMPLETED';
export type IssueSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type TreatmentMethod = 'REMOTE' | 'PHONE' | 'ONSITE' | null;

@Entity('ISSUE')
@Index(['customer_id'])
@Index(['created_by_id'])
@Index(['assigned_to_id'])
@Index(['status'])
@Index(['is_public'])
export class Issue {
  @PrimaryGeneratedColumn('increment', {
    name: 'id',
    type: 'number',
  })
  id: number;

  @Column({
    name: 'customer_id',
    type: 'number',
  })
  customer_id: number;

  @Column({
    name: 'title',
    type: 'varchar2',
    length: 255,
  })
  title: string;

  @Column({
    name: 'description',
    type: 'clob',
  })
  description: string;

  @Column({
    name: 'severity',
    type: 'varchar2',
    length: 20,
    default: 'MEDIUM',
  })
  severity: IssueSeverity;

  @Column({
    name: 'status',
    type: 'varchar2',
    length: 20,
    default: 'INTAKE',
  })
  status: IssueStatus;

  @Column({
    name: 'is_public',
    type: 'number',
    precision: 1,
    default: 0,
    comment: '부서원 공개 여부 (0=비공개, 1=공개)',
  })
  is_public: number; // 0 or 1

  @Column({
    name: 'created_by_id',
    type: 'number',
  })
  created_by_id: number;

  @Column({
    name: 'assigned_to_id',
    type: 'number',
    nullable: true,
  })
  assigned_to_id: number | null;

  @Column({
    name: 'treatment_method',
    type: 'varchar2',
    length: 50,
    nullable: true,
  })
  treatment_method: TreatmentMethod;

  @Column({
    name: 'treatment_time_minutes',
    type: 'number',
    nullable: true,
    comment: '처리 시간 (분 단위, 1~1440)',
  })
  treatment_time_minutes: number | null;

  @Column({
    name: 'treatment_result',
    type: 'clob',
    nullable: true,
  })
  treatment_result: string | null;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp',
  })
  created_at: Date;

  @Column({
    name: 'completed_at',
    type: 'timestamp',
    nullable: true,
  })
  completed_at: Date | null;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp',
  })
  updated_at: Date;

  @Column({
    name: 'deleted_at',
    type: 'timestamp',
    nullable: true,
  })
  deleted_at: Date | null;

  // Relations
  @ManyToOne(() => Customer, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'created_by_id' })
  created_by: Employee;

  @ManyToOne(() => Employee, { nullable: true })
  @JoinColumn({ name: 'assigned_to_id' })
  assigned_to: Employee | null;

  @OneToMany(() => IssueAttachment, (attachment) => attachment.issue)
  attachments: IssueAttachment[];

  @OneToMany(() => IssueHistory, (history) => history.issue)
  histories: IssueHistory[];
}
```

#### 2. IssueAttachment 엔티티 (`src/entities/IssueAttachment.ts`)

```typescript
// Generated: 2026-01-25 18:05:00 KST

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Issue } from './Issue';
import { Employee } from './Employee';

@Entity('ISSUE_ATTACHMENT')
@Index(['issue_id'])
@Index(['uploaded_by_id'])
export class IssueAttachment {
  @PrimaryGeneratedColumn('increment', {
    name: 'id',
    type: 'number',
  })
  id: number;

  @Column({
    name: 'issue_id',
    type: 'number',
  })
  issue_id: number;

  @Column({
    name: 'file_name',
    type: 'varchar2',
    length: 255,
  })
  file_name: string;

  @Column({
    name: 'file_path',
    type: 'varchar2',
    length: 512,
  })
  file_path: string;

  @Column({
    name: 'file_size',
    type: 'number',
    comment: '파일 크기 (바이트)',
  })
  file_size: number;

  @Column({
    name: 'uploaded_by_id',
    type: 'number',
  })
  uploaded_by_id: number;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp',
  })
  created_at: Date;

  @Column({
    name: 'deleted_at',
    type: 'timestamp',
    nullable: true,
  })
  deleted_at: Date | null;

  // Relations (ON DELETE RESTRICT)
  @ManyToOne(() => Issue, (issue) => issue.attachments, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'issue_id' })
  issue: Issue;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'uploaded_by_id' })
  uploaded_by: Employee;
}
```

#### 3. IssueHistory 엔티티 (`src/entities/IssueHistory.ts`)

```typescript
// Generated: 2026-01-25 18:05:00 KST

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Issue } from './Issue';
import { Employee } from './Employee';

export type IssueHistoryChangeType =
  | 'STATUS_CHANGE'
  | 'ASSIGNEE_CHANGE'
  | 'SEVERITY_CHANGE'
  | 'STATUS_ROLLBACK'
  | 'ATTACHMENT_UPLOADED'
  | 'ATTACHMENT_DELETED'
  | 'COMMENT_ADDED';

@Entity('ISSUE_HISTORY')
@Index(['issue_id'])
@Index(['changed_by_id'])
@Index(['changed_at'])
export class IssueHistory {
  @PrimaryGeneratedColumn('increment', {
    name: 'id',
    type: 'number',
  })
  id: number;

  @Column({
    name: 'issue_id',
    type: 'number',
  })
  issue_id: number;

  @Column({
    name: 'change_type',
    type: 'varchar2',
    length: 50,
  })
  change_type: IssueHistoryChangeType;

  @Column({
    name: 'old_value',
    type: 'varchar2',
    length: 255,
    nullable: true,
  })
  old_value: string | null;

  @Column({
    name: 'new_value',
    type: 'varchar2',
    length: 255,
    nullable: true,
  })
  new_value: string | null;

  @Column({
    name: 'changed_by_id',
    type: 'number',
  })
  changed_by_id: number;

  @CreateDateColumn({
    name: 'changed_at',
    type: 'timestamp',
  })
  changed_at: Date;

  @Column({
    name: 'remark',
    type: 'clob',
    nullable: true,
  })
  remark: string | null;

  // Relations
  @ManyToOne(() => Issue, (issue) => issue.histories)
  @JoinColumn({ name: 'issue_id' })
  issue: Issue;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'changed_by_id' })
  changed_by: Employee;
}
```

### 핵심 설계 결정

| 항목 | 결정 | 근거 |
|------|------|------|
| **is_public 타입** | NUMBER(1) (0/1) | Oracle 호환성, boolean 미지원 |
| **외래키 정책** | ON DELETE RESTRICT | 증거 보존, 데이터 무결성 |
| **CLOB 사용** | description, treatment_result, remark | Oracle에서 TEXT 미지원, 길이 제한 없음 |
| **status default** | 'INTAKE' | 새로운 장애는 항상 접수 상태 시작 |
| **is_public default** | 0 (비공개) | 보안 우선 원칙 |
| **treatment_time_minutes 범위** | 1~1440 | 최소 1분, 최대 24시간 |
| **soft delete** | deleted_at 컬럼 | sunjin-erp 정책, 물리 삭제 금지 |

---

## 핵심 인터페이스

### Issue 엔티티

```typescript
interface Issue {
  id: number;
  customer_id: number;
  title: string;
  description: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'INTAKE' | 'IN_PROGRESS' | 'COMPLETED';
  is_public: number; // 0=비공개, 1=공개
  created_by_id: number;
  assigned_to_id: number | null;
  treatment_method: 'REMOTE' | 'PHONE' | 'ONSITE' | null;
  treatment_time_minutes: number | null; // 1~1440
  treatment_result: string | null;
  created_at: Date;
  completed_at: Date | null;
  updated_at: Date;
  deleted_at: Date | null;
}
```

### IssueAttachment 엔티티

```typescript
interface IssueAttachment {
  id: number;
  issue_id: number;
  file_name: string;
  file_path: string;
  file_size: number;
  uploaded_by_id: number;
  created_at: Date;
  deleted_at: Date | null;
}
```

### IssueHistory 엔티티

```typescript
interface IssueHistory {
  id: number;
  issue_id: number;
  change_type:
    | 'STATUS_CHANGE'
    | 'ASSIGNEE_CHANGE'
    | 'SEVERITY_CHANGE'
    | 'STATUS_ROLLBACK'
    | 'ATTACHMENT_UPLOADED'
    | 'ATTACHMENT_DELETED'
    | 'COMMENT_ADDED';
  old_value: string | null;
  new_value: string | null;
  changed_by_id: number;
  changed_at: Date;
  remark: string | null;
}
```

---

## Acceptance Criteria

- [ ] 3개 TypeORM Entity 클래스 생성 완료
- [ ] 모든 컬럼명 Oracle 규칙 준수 (double-quote, VARCHAR2, NUMBER, CLOB)
- [ ] 외래키 관계 설정 완료 (ON DELETE RESTRICT 적용)
- [ ] soft delete 지원 (deleted_at 컬럼)
- [ ] 자동 타임스탐프 (@CreateDateColumn, @UpdateDateColumn)
- [ ] 타입 안전성: TypeScript 타입 정의 완료
- [ ] 인덱스 추가 (성능: customer_id, created_by_id, assigned_to_id, status, is_public 등)

---

## 테스트 전략

### TypeScript & Lint

```bash
npm run build      # Entity 타입 검증
npm run type-check # TypeORM 타입 체크
npm run lint       # ESLint 검증
```

### 검증 방법

1. **Entity 컴파일 확인**
   - Entity 파일이 TypeScript 오류 없이 컴파일되는지 확인

2. **관계 설정 확인**
   - ManyToOne 관계가 정확히 설정되는지 확인
   - ON DELETE RESTRICT 정책이 나타나는지 확인

3. **컬럼 메타데이터 확인**
   - Oracle 규칙 준수 (VARCHAR2, NUMBER, CLOB)
   - nullable, default 설정 정확

---

## 완료 체크리스트

- [ ] src/entities/Issue.ts 생성
- [ ] src/entities/IssueAttachment.ts 생성
- [ ] src/entities/IssueHistory.ts 생성
- [ ] TypeScript 빌드 성공 (`npm run build`)
- [ ] ESLint 통과 (`npm run lint`)
- [ ] type-check 성공 (`npm run type-check`)
- [ ] Entity 관계도 문서화 (선택)

---

**다음 문서**: 2061_02_Migration_생성_및_실행.md
