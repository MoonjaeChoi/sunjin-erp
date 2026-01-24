<!-- Generated: 2026-01-25 05:10:00 KST -->

# TechSupport Entity 정의

**문서 번호**: 2031_03
**원본 PRD**: 2031_기술지원_관리_prd_v2.md
**PRD 참조**: 원본 PRD의 'Section 5.3 — TechSupport Entity' 참조
**구현 범위**: TechSupport 엔티티 정의, TypeORM Migration
**복잡도**: S
**의존성**: 2031_01 (Customer Entity)

---

## 구현 목표

기술지원 이력을 저장하는 TechSupport 엔티티를 정의하고, Oracle DB에 테이블을 생성한다.

---

## 구현 내용

### 파일 구조

```
src/
├── entities/
│   └── TechSupport.ts                  # TechSupport Entity 정의
└── migrations/
    └── XXXXXX-CreateTechSupport.ts     # TECH_SUPPORT 테이블 생성
```

### 구현 상세

#### TechSupport Entity

- Table: `TECH_SUPPORT`
- 17 columns (PRD Section 5.3 참조)
- 4 indexes, 2 FK constraints, 3 CHECK constraints
- Task Entity 패턴 참조 (동일한 time 필드, CHECK 패턴)

### 핵심 인터페이스

```typescript
// src/entities/TechSupport.ts
import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, DeleteDateColumn,
  Index, Check, ManyToOne, JoinColumn,
} from 'typeorm';

export type SupportType = 'INSTALL' | 'TEST' | 'TRAINING' | 'MAINTENANCE' | 'GENERAL';
export type SupportMethod = 'ONSITE' | 'REMOTE' | 'PHONE';
export type SupportStatus = 'RECEIVED' | 'IN_PROGRESS' | 'COMPLETED';

@Entity('TECH_SUPPORT')
@Check('CHK_TS_START_TIME', '"start_time" IS NULL OR ("start_time" >= 0 AND "start_time" <= 1439)')
@Check('CHK_TS_END_TIME', '"end_time" IS NULL OR ("end_time" >= 0 AND "end_time" <= 1439)')
@Check('CHK_TS_TIME_ORDER', '("start_time" IS NULL OR "end_time" IS NULL) OR "start_time" < "end_time"')
@Index('IDX_TECHSUPPORT_DATE_EMPLOYEE', ['support_date', 'employee_id'])
@Index('IDX_TECHSUPPORT_CUSTOMER', ['customer_id'])
@Index('IDX_TECHSUPPORT_STATUS', ['status'])
@Index('IDX_TECHSUPPORT_DELETED_AT', ['deleted_at'])
export class TechSupport {
  @PrimaryGeneratedColumn({ type: 'int' })
  id!: number;

  @Column({ type: 'varchar', length: 200, nullable: false })
  title!: string;

  @Column({ type: 'clob', nullable: true })
  description!: string | null;

  @Column({ type: 'date', nullable: false })
  support_date!: Date;

  @Column({ type: 'int', nullable: true })
  start_time!: number | null;

  @Column({ type: 'int', nullable: true })
  end_time!: number | null;

  @Column({ type: 'varchar', length: 20, nullable: false })
  support_type!: SupportType;

  @Column({ type: 'varchar', length: 20, nullable: true })
  support_method!: SupportMethod | null;

  @Column({ type: 'varchar', length: 20, nullable: false, default: "'RECEIVED'" })
  status!: SupportStatus;

  @Column({ type: 'int', nullable: false })
  employee_id!: number;

  @Column({ type: 'int', nullable: false })
  customer_id!: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  attachment_path!: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  attachment_name!: string | null;

  @Column({ type: 'timestamp', nullable: true })
  completed_at!: Date | null;

  @CreateDateColumn({ type: 'timestamp' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at!: Date;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deleted_at!: Date | null;
}
```

#### Migration 핵심 내용

```sql
-- Sequence
CREATE SEQUENCE TECH_SUPPORT_SEQ START WITH 1 INCREMENT BY 1;

-- Table
CREATE TABLE TECH_SUPPORT (
  id NUMBER DEFAULT TECH_SUPPORT_SEQ.NEXTVAL PRIMARY KEY,
  title VARCHAR2(200) NOT NULL,
  description CLOB,
  support_date DATE NOT NULL,
  start_time NUMBER,
  end_time NUMBER,
  support_type VARCHAR2(20) NOT NULL,
  support_method VARCHAR2(20),
  status VARCHAR2(20) DEFAULT 'RECEIVED' NOT NULL,
  employee_id NUMBER NOT NULL,
  customer_id NUMBER NOT NULL,
  attachment_path VARCHAR2(500),
  attachment_name VARCHAR2(200),
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  deleted_at TIMESTAMP,
  CONSTRAINT FK_TS_EMPLOYEE FOREIGN KEY (employee_id) REFERENCES EMPLOYEE(id),
  CONSTRAINT FK_TS_CUSTOMER FOREIGN KEY (customer_id) REFERENCES CUSTOMER(id),
  CONSTRAINT CHK_TS_START_TIME CHECK (start_time IS NULL OR (start_time >= 0 AND start_time <= 1439)),
  CONSTRAINT CHK_TS_END_TIME CHECK (end_time IS NULL OR (end_time >= 0 AND end_time <= 1439)),
  CONSTRAINT CHK_TS_TIME_ORDER CHECK ((start_time IS NULL OR end_time IS NULL) OR start_time < end_time)
);

-- Indexes
CREATE INDEX IDX_TECHSUPPORT_DATE_EMPLOYEE ON TECH_SUPPORT(support_date, employee_id);
CREATE INDEX IDX_TECHSUPPORT_CUSTOMER ON TECH_SUPPORT(customer_id);
CREATE INDEX IDX_TECHSUPPORT_STATUS ON TECH_SUPPORT(status);
CREATE INDEX IDX_TECHSUPPORT_DELETED_AT ON TECH_SUPPORT(deleted_at);
```

---

## Acceptance Criteria

- [ ] TechSupport Entity 파일 생성 완료
- [ ] Migration 생성 및 실행 성공
- [ ] Oracle DB에 TECH_SUPPORT 테이블 생성 확인
- [ ] FK 제약조건 동작 확인 (존재하지 않는 employee_id/customer_id 거부)
- [ ] CHECK 제약조건 동작 확인 (시간 범위 위반 거부)
- [ ] `npm run build` 성공
- [ ] `npm run type-check` 통과

---

## 테스트 전략

### TypeScript & Lint

```bash
npm run build
npm run type-check
npm run lint
```

### 검증 방법

1. Migration 실행 후 `DESCRIBE TECH_SUPPORT` 확인
2. 유효하지 않은 FK 값 INSERT 시도 → 제약조건 오류 확인
3. start_time > end_time INSERT 시도 → CHECK 오류 확인

---

## 완료 체크리스트

- [ ] TypeScript 빌드 성공
- [ ] ESLint/Prettier 통과
- [ ] Migration 실행 성공 (Oracle)
- [ ] FK 제약조건 동작 확인
- [ ] CHECK 제약조건 동작 확인
- [ ] 인덱스 생성 확인

---

**다음 문서**: 2031_04_기술지원_CRUD_API.md
