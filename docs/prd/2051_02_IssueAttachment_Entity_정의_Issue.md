<!-- Generated: 2026-01-25 21:17:00 KST -->

# IssueAttachment Entity 정의

**문서 번호**: 2051_02_Issue
**원본 PRD**: 2051_장애_현황_관리_prd_v2.md (Section 5.3, 5.6)
**PRD 참조**: IssueAttachment 테이블 정의
**구현 범위**: IssueAttachment 엔티티, ON DELETE RESTRICT 정책
**복잡도**: S
**의존성**: 2051_01_Issue (Issue Entity)

---

## 구현 목표

장애 첨부파일 정보를 저장하는 IssueAttachment 엔티티를 정의한다.
ON DELETE RESTRICT 정책으로 Issue 삭제 전 파일 제거를 강제한다.

---

## 구현 내용

### 파일 구조

```
src/
├── entities/
│   └── IssueAttachment.ts           # IssueAttachment Entity
└── migrations/
    └── XXXXXX-CreateIssueAttachment.ts
```

### IssueAttachment Entity (src/entities/IssueAttachment.ts)

```typescript
// Generated: 2026-01-25 21:17:00 KST

import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, DeleteDateColumn,
  Index, ManyToOne, JoinColumn,
} from 'typeorm';
import { Issue } from './Issue';
import { Employee } from './Employee';

@Entity('ISSUE_ATTACHMENT')
@Index('IDX_ISSUE_ATTACHMENT_ISSUE_ID', ['issue_id'])
@Index('IDX_ISSUE_ATTACHMENT_DELETED_AT', ['deleted_at'])
export class IssueAttachment {
  @PrimaryGeneratedColumn({ type: 'number' })
  id!: number;

  @Column({ type: 'number', nullable: false })
  issue_id!: number;

  @Column({ type: 'varchar', length: 255, nullable: false })
  file_name!: string;

  @Column({ type: 'varchar', length: 512, nullable: false })
  file_path!: string;

  @Column({ type: 'number', nullable: false })
  file_size!: number; // bytes

  @Column({ type: 'number', nullable: false })
  uploaded_by_id!: number;

  @CreateDateColumn({ type: 'timestamp' })
  created_at!: Date;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deleted_at!: Date | null;

  // Relations
  @ManyToOne(() => Issue, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'issue_id' })
  issue!: Issue;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'uploaded_by_id' })
  uploadedBy!: Employee;
}
```

#### Migration 핵심 내용

```sql
CREATE TABLE ISSUE_ATTACHMENT (
  id NUMBER DEFAULT ISSUE_ATTACHMENT_ID_SEQ.NEXTVAL PRIMARY KEY,
  issue_id NUMBER NOT NULL,
  file_name VARCHAR2(255) NOT NULL,
  file_path VARCHAR2(512) NOT NULL,
  file_size NUMBER NOT NULL,
  uploaded_by_id NUMBER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  deleted_at TIMESTAMP,
  CONSTRAINT FK_ISSUE_ATTACHMENT_ISSUE FOREIGN KEY (issue_id) REFERENCES ISSUE(id) ON DELETE RESTRICT,
  CONSTRAINT FK_ISSUE_ATTACHMENT_EMPLOYEE FOREIGN KEY (uploaded_by_id) REFERENCES EMPLOYEE(id)
);

CREATE INDEX IDX_ISSUE_ATTACHMENT_ISSUE_ID ON ISSUE_ATTACHMENT(issue_id);
CREATE INDEX IDX_ISSUE_ATTACHMENT_DELETED_AT ON ISSUE_ATTACHMENT(deleted_at);
```

---

## Acceptance Criteria

- [ ] IssueAttachment Entity 생성 완료
- [ ] Migration 생성 및 실행 성공
- [ ] ON DELETE RESTRICT 동작 확인 (Issue 삭제 시도 시 오류)
- [ ] 파일 메타정보 저장 확인
- [ ] `npm run build` 성공
- [ ] `npm run type-check` 통과

---

## 완료 체크리스트

- [ ] TypeScript 빌드 성공
- [ ] Migration 실행 성공
- [ ] ON DELETE RESTRICT FK 검증
- [ ] 인덱스 생성 확인

---

**다음 문서**: 2051_03_IssueHistory_Entity_정의_Issue.md
