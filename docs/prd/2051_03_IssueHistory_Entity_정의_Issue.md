<!-- Generated: 2026-01-25 21:18:00 KST -->

# IssueHistory Entity 정의

**문서 번호**: 2051_03_Issue
**원본 PRD**: 2051_장애_현황_관리_prd_v2.md (Section 5.3, US-7)
**PRD 참조**: IssueHistory 테이블, 변경 이력 추적
**구현 범위**: IssueHistory 엔티티, 확장된 변경 타입
**복잡도**: S
**의존성**: 2051_01_Issue

---

## 구현 목표

장애의 모든 변경 사항을 기록하는 IssueHistory 엔티티를 정의한다.
불변 감사 추적(audit trail) 패턴을 따른다.

---

## 구현 내용

### IssueHistory Entity (src/entities/IssueHistory.ts)

```typescript
// Generated: 2026-01-25 21:18:00 KST

import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, Index, ManyToOne, JoinColumn,
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
  | 'IS_PUBLIC_CHANGE';

@Entity('ISSUE_HISTORY')
@Index('IDX_ISSUE_HISTORY_ISSUE_ID', ['issue_id'])
@Index('IDX_ISSUE_HISTORY_CHANGED_AT', ['changed_at'])
export class IssueHistory {
  @PrimaryGeneratedColumn({ type: 'number' })
  id!: number;

  @Column({ type: 'number', nullable: false })
  issue_id!: number;

  @Column({ type: 'varchar', length: 50, nullable: false })
  change_type!: IssueHistoryChangeType;

  @Column({ type: 'varchar', length: 255, nullable: true })
  old_value!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  new_value!: string | null;

  @Column({ type: 'number', nullable: false })
  changed_by_id!: number;

  @Column({ type: 'clob', nullable: true })
  remark!: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  changed_at!: Date;

  // Relations
  @ManyToOne(() => Issue)
  @JoinColumn({ name: 'issue_id' })
  issue!: Issue;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'changed_by_id' })
  changedBy!: Employee;
}
```

#### Migration

```sql
CREATE SEQUENCE ISSUE_HISTORY_ID_SEQ START WITH 1 INCREMENT BY 1;

CREATE TABLE ISSUE_HISTORY (
  id NUMBER DEFAULT ISSUE_HISTORY_ID_SEQ.NEXTVAL PRIMARY KEY,
  issue_id NUMBER NOT NULL,
  change_type VARCHAR2(50) NOT NULL,
  old_value VARCHAR2(255),
  new_value VARCHAR2(255),
  changed_by_id NUMBER NOT NULL,
  remark CLOB,
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT FK_ISSUE_HISTORY_ISSUE FOREIGN KEY (issue_id) REFERENCES ISSUE(id),
  CONSTRAINT FK_ISSUE_HISTORY_EMPLOYEE FOREIGN KEY (changed_by_id) REFERENCES EMPLOYEE(id)
);

CREATE INDEX IDX_ISSUE_HISTORY_ISSUE_ID ON ISSUE_HISTORY(issue_id);
CREATE INDEX IDX_ISSUE_HISTORY_CHANGED_AT ON ISSUE_HISTORY(changed_at);
```

---

## Acceptance Criteria

- [ ] IssueHistory Entity 생성 완료
- [ ] Migration 실행 성공
- [ ] 모든 변경 타입 enum 정의
- [ ] `npm run build` 성공

---

**다음 문서**: 2051_04_List_Detail_API_Issue.md
