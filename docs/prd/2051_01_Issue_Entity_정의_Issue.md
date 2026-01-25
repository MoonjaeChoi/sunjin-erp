<!-- Generated: 2026-01-25 21:16:00 KST -->

# Issue Entity 정의

**문서 번호**: 2051_01_Issue
**원본 PRD**: 2051_장애_현황_관리_prd_v2.md (Section 5.3)
**PRD 참조**: Issue 테이블 정의
**구현 범위**: Issue 엔티티 정의, TypeORM 마이그레이션
**복잡도**: S
**의존성**: 없음

---

## 구현 목표

장애 정보를 저장하는 Issue 엔티티를 정의하고, Oracle DB에 테이블을 생성한다.

---

## 구현 내용

### 파일 구조

```
src/
├── entities/
│   └── Issue.ts                    # Issue Entity 정의
└── migrations/
    └── XXXXXX-CreateIssueTable.ts  # ISSUE 테이블 생성
```

### 구현 상세

#### Issue Entity (src/entities/Issue.ts)

```typescript
// Generated: 2026-01-25 21:16:00 KST

import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, DeleteDateColumn,
  Index, Check, ManyToOne, JoinColumn, OneToMany,
} from 'typeorm';
import { Customer } from './Customer';
import { Employee } from './Employee';
import { IssueAttachment } from './IssueAttachment';
import { IssueHistory } from './IssueHistory';

export type IssueSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type IssueStatus = 'INTAKE' | 'IN_PROGRESS' | 'COMPLETED';
export type TreatmentMethod = 'REMOTE' | 'PHONE' | 'ONSITE';

@Entity('ISSUE')
@Check('CHK_ISSUE_TREATMENT_TIME', '"treatment_time_minutes" IS NULL OR ("treatment_time_minutes" >= 1 AND "treatment_time_minutes" <= 1440)')
@Index('IDX_ISSUE_CUSTOMER_ID', ['customer_id'])
@Index('IDX_ISSUE_STATUS', ['status'])
@Index('IDX_ISSUE_ASSIGNED_TO_ID', ['assigned_to_id'])
@Index('IDX_ISSUE_DELETED_AT', ['deleted_at'])
export class Issue {
  @PrimaryGeneratedColumn({ type: 'number' })
  id!: number;

  @Column({ type: 'varchar', length: 255, nullable: false })
  title!: string;

  @Column({ type: 'clob', nullable: true })
  description!: string | null;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: false,
    default: "'CRITICAL'",
  })
  severity!: IssueSeverity;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: false,
    default: "'INTAKE'",
  })
  status!: IssueStatus;

  @Column({ type: 'number', nullable: false, default: 0 })
  is_public!: number; // 0=false, 1=true

  @Column({ type: 'number', nullable: false })
  customer_id!: number;

  @Column({ type: 'number', nullable: false })
  created_by_id!: number;

  @Column({ type: 'number', nullable: true })
  assigned_to_id!: number | null;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  treatment_method!: TreatmentMethod | null;

  @Column({
    type: 'number',
    nullable: true,
  })
  treatment_time_minutes!: number | null;

  @Column({ type: 'clob', nullable: true })
  treatment_result!: string | null;

  @Column({ type: 'timestamp', nullable: true })
  completed_at!: Date | null;

  @CreateDateColumn({ type: 'timestamp' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at!: Date;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deleted_at!: Date | null;

  // Relations
  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customer_id' })
  customer!: Customer;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'created_by_id' })
  createdBy!: Employee;

  @ManyToOne(() => Employee, { nullable: true })
  @JoinColumn({ name: 'assigned_to_id' })
  assignedTo!: Employee | null;

  @OneToMany(() => IssueAttachment, (attachment) => attachment.issue)
  attachments!: IssueAttachment[];

  @OneToMany(() => IssueHistory, (history) => history.issue)
  histories!: IssueHistory[];
}
```

#### Migration 핵심 내용

```sql
-- Sequence
CREATE SEQUENCE ISSUE_ID_SEQ START WITH 1 INCREMENT BY 1;

-- Table
CREATE TABLE ISSUE (
  id NUMBER DEFAULT ISSUE_ID_SEQ.NEXTVAL PRIMARY KEY,
  title VARCHAR2(255) NOT NULL,
  description CLOB,
  severity VARCHAR2(20) DEFAULT 'CRITICAL' NOT NULL,
  status VARCHAR2(20) DEFAULT 'INTAKE' NOT NULL,
  is_public NUMBER(1) DEFAULT 0 NOT NULL,
  customer_id NUMBER NOT NULL,
  created_by_id NUMBER NOT NULL,
  assigned_to_id NUMBER,
  treatment_method VARCHAR2(50),
  treatment_time_minutes NUMBER,
  treatment_result CLOB,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  deleted_at TIMESTAMP,
  CONSTRAINT FK_ISSUE_CUSTOMER FOREIGN KEY (customer_id) REFERENCES CUSTOMER(id) ON DELETE RESTRICT,
  CONSTRAINT FK_ISSUE_CREATED_BY FOREIGN KEY (created_by_id) REFERENCES EMPLOYEE(id),
  CONSTRAINT FK_ISSUE_ASSIGNED_TO FOREIGN KEY (assigned_to_id) REFERENCES EMPLOYEE(id),
  CONSTRAINT CHK_ISSUE_TREATMENT_TIME CHECK (treatment_time_minutes IS NULL OR (treatment_time_minutes >= 1 AND treatment_time_minutes <= 1440))
);

-- Indexes
CREATE INDEX IDX_ISSUE_CUSTOMER_ID ON ISSUE(customer_id);
CREATE INDEX IDX_ISSUE_STATUS ON ISSUE(status);
CREATE INDEX IDX_ISSUE_ASSIGNED_TO_ID ON ISSUE(assigned_to_id);
CREATE INDEX IDX_ISSUE_DELETED_AT ON ISSUE(deleted_at);
```

---

## Acceptance Criteria

- [ ] Issue Entity 파일 생성 완료
- [ ] Migration 생성 및 실행 성공
- [ ] Oracle DB에 ISSUE 테이블 생성 확인
- [ ] FK 제약조건 동작 확인
- [ ] CHECK 제약조건 동작 확인 (1~1440 분 제약)
- [ ] `npm run build` 성공
- [ ] `npm run type-check` 통과

---

## 테스트 전략

```bash
npm run build
npm run type-check
npm run lint
npx typeorm migration:run
```

---

## 완료 체크리스트

- [ ] TypeScript 빌드 성공
- [ ] ESLint/Prettier 통과
- [ ] Migration 실행 성공
- [ ] FK/CHECK 제약조건 검증
- [ ] 인덱스 생성 확인

---

**다음 문서**: 2051_02_IssueAttachment_Entity_정의_Issue.md
