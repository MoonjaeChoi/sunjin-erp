<!-- Generated: 2026-01-25 KST -->

# Migration 생성 (PROJECT + PROJECT_ATTACHMENT)

**문서 번호**: 2041_02
**원본 PRD**: 2041_프로젝트_관리_prd_v2.md
**구현 범위**: TypeORM Migration - 시퀀스, 테이블, FK, CHECK, 인덱스 생성
**복잡도**: M
**의존성**: 2041_01

---

## 구현 목표

Project 및 ProjectAttachment 테이블을 Oracle XE 21c에 생성하는 TypeORM Migration을 작성한다. 시퀀스, 테이블, 외래키, CHECK 제약조건, 인덱스를 포함하며, Down 메서드에서는 역순으로 삭제한다.

---

## 구현 내용

### 파일 구조

```
src/
├── migrations/
│   └── XXXXXXXX-CreateProjectTable.ts   # PROJECT + PROJECT_ATTACHMENT Migration
```

### 구현 상세

#### Up 메서드 (생성 순서)

1. **Sequences 생성**
   - `PROJECT_ID_SEQ` — PROJECT.id 자동 생성
   - `PROJECT_CODE_SEQ` — 프로젝트 코드 NNN 부분 생성
   - `PROJECT_ATTACHMENT_ID_SEQ` — PROJECT_ATTACHMENT.id 자동 생성

2. **PROJECT 테이블 생성**
   - 모든 컬럼 정의 (Entity 스펙 반영)
   - `id` DEFAULT: `PROJECT_ID_SEQ.NEXTVAL`
   - `status` DEFAULT: `'PREPARING'`
   - `created_at` / `updated_at` DEFAULT: `CURRENT_TIMESTAMP`

3. **PROJECT_ATTACHMENT 테이블 생성**
   - 모든 컬럼 정의
   - `id` DEFAULT: `PROJECT_ATTACHMENT_ID_SEQ.NEXTVAL`
   - `created_at` DEFAULT: `CURRENT_TIMESTAMP`

4. **Foreign Keys 생성**
   - `FK_PROJECT_CUSTOMER`: PROJECT.customer_id → CUSTOMER.id (ON DELETE 생략 = restrict)
   - `FK_PROJECT_EMPLOYEE`: PROJECT.employee_id → EMPLOYEE.id (ON DELETE 생략 = restrict)
   - `FK_ATTACH_PROJECT`: PROJECT_ATTACHMENT.project_id → PROJECT.id (ON DELETE 생략 = restrict)

5. **CHECK Constraints 생성**
   - `CHK_PROJECT_STATUS`: `status IN ('PREPARING', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD')`
   - `CHK_PROJECT_DATE_ORDER`: `start_date IS NULL OR end_date IS NULL OR start_date <= end_date`
   - `CHK_ATTACH_CATEGORY`: `category IN ('CONTRACT', 'PROPOSAL', 'QUOTATION', 'REPORT', 'OTHER')`

6. **Indexes 생성**
   - `IDX_PROJECT_CUSTOMER` — PROJECT(customer_id)
   - `IDX_PROJECT_EMPLOYEE` — PROJECT(employee_id)
   - `IDX_PROJECT_STATUS` — PROJECT(status)
   - `IDX_PROJECT_CODE` — PROJECT(project_code), UNIQUE (Oracle은 NULL 값에 대해 unique index 미적용)
   - `IDX_PROJECT_DELETED_AT` — PROJECT(deleted_at)
   - `IDX_PROJECT_ATTACH_PROJECT` — PROJECT_ATTACHMENT(project_id)

#### Down 메서드 (삭제 역순)

1. Indexes 삭제 (IDX_PROJECT_ATTACH_PROJECT, IDX_PROJECT_DELETED_AT, IDX_PROJECT_CODE, IDX_PROJECT_STATUS, IDX_PROJECT_EMPLOYEE, IDX_PROJECT_CUSTOMER)
2. CHECK Constraints 삭제 (CHK_ATTACH_CATEGORY, CHK_PROJECT_DATE_ORDER, CHK_PROJECT_STATUS)
3. Foreign Keys 삭제 (FK_ATTACH_PROJECT, FK_PROJECT_EMPLOYEE, FK_PROJECT_CUSTOMER)
4. Tables 삭제 (PROJECT_ATTACHMENT, PROJECT)
5. Sequences 삭제 (PROJECT_ATTACHMENT_ID_SEQ, PROJECT_CODE_SEQ, PROJECT_ID_SEQ)

### 핵심 인터페이스

```typescript
// src/migrations/XXXXXXXX-CreateProjectTable.ts
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProjectTable implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Sequences
    await queryRunner.query(`CREATE SEQUENCE PROJECT_ID_SEQ START WITH 1 INCREMENT BY 1`);
    await queryRunner.query(`CREATE SEQUENCE PROJECT_CODE_SEQ START WITH 1 INCREMENT BY 1`);
    await queryRunner.query(`CREATE SEQUENCE PROJECT_ATTACHMENT_ID_SEQ START WITH 1 INCREMENT BY 1`);

    // 2. PROJECT table
    await queryRunner.query(`
      CREATE TABLE PROJECT (
        id NUMBER DEFAULT PROJECT_ID_SEQ.NEXTVAL PRIMARY KEY,
        project_code VARCHAR2(30),
        project_name VARCHAR2(200) NOT NULL,
        customer_id NUMBER NOT NULL,
        employee_id NUMBER NOT NULL,
        status VARCHAR2(20) DEFAULT 'PREPARING' NOT NULL,
        start_date DATE,
        end_date DATE,
        contract_amount NUMBER,
        description CLOB,
        stage_meeting_at TIMESTAMP,
        stage_proposal_at TIMESTAMP,
        stage_quotation_at TIMESTAMP,
        stage_contract_at TIMESTAMP,
        stage_kickoff_at TIMESTAMP,
        stage_development_at TIMESTAMP,
        stage_delivery_at TIMESTAMP,
        stage_handover_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        deleted_at TIMESTAMP
      )
    `);

    // 3. PROJECT_ATTACHMENT table
    await queryRunner.query(`
      CREATE TABLE PROJECT_ATTACHMENT (
        id NUMBER DEFAULT PROJECT_ATTACHMENT_ID_SEQ.NEXTVAL PRIMARY KEY,
        project_id NUMBER NOT NULL,
        file_path VARCHAR2(500) NOT NULL,
        file_name VARCHAR2(200) NOT NULL,
        file_size NUMBER NOT NULL,
        category VARCHAR2(20) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      )
    `);

    // 4. Foreign Keys
    await queryRunner.query(`ALTER TABLE PROJECT ADD CONSTRAINT FK_PROJECT_CUSTOMER FOREIGN KEY (customer_id) REFERENCES CUSTOMER(id)`);
    await queryRunner.query(`ALTER TABLE PROJECT ADD CONSTRAINT FK_PROJECT_EMPLOYEE FOREIGN KEY (employee_id) REFERENCES EMPLOYEE(id)`);
    await queryRunner.query(`ALTER TABLE PROJECT_ATTACHMENT ADD CONSTRAINT FK_ATTACH_PROJECT FOREIGN KEY (project_id) REFERENCES PROJECT(id)`);

    // 5. CHECK Constraints
    await queryRunner.query(`ALTER TABLE PROJECT ADD CONSTRAINT CHK_PROJECT_STATUS CHECK (status IN ('PREPARING', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD'))`);
    await queryRunner.query(`ALTER TABLE PROJECT ADD CONSTRAINT CHK_PROJECT_DATE_ORDER CHECK (start_date IS NULL OR end_date IS NULL OR start_date <= end_date)`);
    await queryRunner.query(`ALTER TABLE PROJECT_ATTACHMENT ADD CONSTRAINT CHK_ATTACH_CATEGORY CHECK (category IN ('CONTRACT', 'PROPOSAL', 'QUOTATION', 'REPORT', 'OTHER'))`);

    // 6. Indexes
    await queryRunner.query(`CREATE INDEX IDX_PROJECT_CUSTOMER ON PROJECT(customer_id)`);
    await queryRunner.query(`CREATE INDEX IDX_PROJECT_EMPLOYEE ON PROJECT(employee_id)`);
    await queryRunner.query(`CREATE INDEX IDX_PROJECT_STATUS ON PROJECT(status)`);
    await queryRunner.query(`CREATE UNIQUE INDEX IDX_PROJECT_CODE ON PROJECT(project_code)`);
    await queryRunner.query(`CREATE INDEX IDX_PROJECT_DELETED_AT ON PROJECT(deleted_at)`);
    await queryRunner.query(`CREATE INDEX IDX_PROJECT_ATTACH_PROJECT ON PROJECT_ATTACHMENT(project_id)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Indexes
    await queryRunner.query(`DROP INDEX IDX_PROJECT_ATTACH_PROJECT`);
    await queryRunner.query(`DROP INDEX IDX_PROJECT_DELETED_AT`);
    await queryRunner.query(`DROP INDEX IDX_PROJECT_CODE`);
    await queryRunner.query(`DROP INDEX IDX_PROJECT_STATUS`);
    await queryRunner.query(`DROP INDEX IDX_PROJECT_EMPLOYEE`);
    await queryRunner.query(`DROP INDEX IDX_PROJECT_CUSTOMER`);
    // CHECK Constraints
    await queryRunner.query(`ALTER TABLE PROJECT_ATTACHMENT DROP CONSTRAINT CHK_ATTACH_CATEGORY`);
    await queryRunner.query(`ALTER TABLE PROJECT DROP CONSTRAINT CHK_PROJECT_DATE_ORDER`);
    await queryRunner.query(`ALTER TABLE PROJECT DROP CONSTRAINT CHK_PROJECT_STATUS`);
    // Foreign Keys
    await queryRunner.query(`ALTER TABLE PROJECT_ATTACHMENT DROP CONSTRAINT FK_ATTACH_PROJECT`);
    await queryRunner.query(`ALTER TABLE PROJECT DROP CONSTRAINT FK_PROJECT_EMPLOYEE`);
    await queryRunner.query(`ALTER TABLE PROJECT DROP CONSTRAINT FK_PROJECT_CUSTOMER`);
    // Tables
    await queryRunner.query(`DROP TABLE PROJECT_ATTACHMENT`);
    await queryRunner.query(`DROP TABLE PROJECT`);
    // Sequences
    await queryRunner.query(`DROP SEQUENCE PROJECT_ATTACHMENT_ID_SEQ`);
    await queryRunner.query(`DROP SEQUENCE PROJECT_CODE_SEQ`);
    await queryRunner.query(`DROP SEQUENCE PROJECT_ID_SEQ`);
  }
}
```

---

## Acceptance Criteria

- [ ] Migration 파일 생성 완료
- [ ] `npx typeorm migration:run` 성공 (Oracle 환경)
- [ ] PROJECT 테이블 생성 확인 (모든 컬럼, DEFAULT 값)
- [ ] PROJECT_ATTACHMENT 테이블 생성 확인
- [ ] 3개 시퀀스 생성 확인 (PROJECT_ID_SEQ, PROJECT_CODE_SEQ, PROJECT_ATTACHMENT_ID_SEQ)
- [ ] FK 제약조건 3개 동작 확인 (존재하지 않는 customer_id/employee_id/project_id 삽입 시 에러)
- [ ] CHECK 제약조건 3개 동작 확인 (유효하지 않은 status/category, 잘못된 날짜 순서 시 에러)
- [ ] 인덱스 6개 생성 확인
- [ ] IDX_PROJECT_CODE UNIQUE 동작 확인 (중복 project_code 삽입 시 에러, NULL은 허용)
- [ ] `npx typeorm migration:revert` 성공 (Down 메서드 정상 동작)
- [ ] `npm run build` 성공

---

## 테스트 전략

### Migration 실행 검증

```bash
npx typeorm migration:run
```

### Oracle 확인 쿼리

```sql
-- 테이블 존재 확인
SELECT table_name FROM user_tables WHERE table_name IN ('PROJECT', 'PROJECT_ATTACHMENT');

-- 시퀀스 확인
SELECT sequence_name FROM user_sequences WHERE sequence_name LIKE 'PROJECT%';

-- FK 확인
SELECT constraint_name, table_name FROM user_constraints WHERE constraint_type = 'R' AND table_name LIKE 'PROJECT%';

-- CHECK 확인
SELECT constraint_name, table_name FROM user_constraints WHERE constraint_type = 'C' AND constraint_name LIKE 'CHK_%';

-- 인덱스 확인
SELECT index_name, table_name FROM user_indexes WHERE table_name LIKE 'PROJECT%';
```

### Rollback 검증

```bash
npx typeorm migration:revert
# 이후 위 쿼리로 모두 삭제되었는지 확인
```

---

**다음 문서**: 2041_03_Employee_목록_API.md
