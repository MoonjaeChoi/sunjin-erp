<!-- Generated: 2026-01-27 22:45:00 KST -->

# CustomerHistory Entity 및 Migration

**문서 번호**: 2081_02
**원본 PRD**: docs/prd/2081_고객_등록_및_조회_prd_v2.md
**PRD 참조**: 원본 PRD의 "5.3 Database" 섹션 및 Decision 3 (모든 필드 추적) 참조
**구현 범위**: CustomerHistory TypeORM Entity + Database Migration 생성 및 실행
**복잡도**: S (0.5~1일)
**의존성**: 2081_01 완료 (Customer, CustomerContact Entity 필수)

---

## 구현 목표

CUSTOMER_HISTORY (감사 로그) TypeORM 엔티티를 정의하고, 모든 CUSTOMER/CUSTOMER_CONTACT 테이블을 생성하는 TypeORM Migration을 작성하여 데이터베이스 스키마를 구성합니다. 모든 필드 변경을 추적하고 불변 로그로 기록하는 구조를 설계합니다.

---

## 파일 구조

```
src/entities/
├── CustomerHistory.ts (새 파일 - 이력 엔티티)
└── (Customer.ts, CustomerContact.ts는 2081_01에서 생성)

src/migrations/
└── [timestamp]_create_customer_tables.ts (새 파일 - Migration)
```

---

## 구현 상세

### 1. CustomerHistory Entity (`src/entities/CustomerHistory.ts`)

**핵심 정책:**
- **불변 로그**: soft delete 없음 (삭제 불가, 감사 목적)
- **변경 내용**: JSON 형식 (fieldName → {before: old, after: new})
- **변경 유형**: CREATE, UPDATE, DELETE, CONTACT_ADD, CONTACT_DELETE
- **메타데이터**: 변경자, 변경 시각
- **FK**: customer_id (ON DELETE RESTRICT - 고객 삭제 시 이력 보존 필수)

**TypeORM Entity 구조:**

```typescript
import { Entity, PrimaryColumn, Column, ManyToOne, Index, CreateDateColumn } from 'typeorm';
import { Customer } from './Customer';
import { Employee } from './Employee';

@Entity('CUSTOMER_HISTORY')
@Index('idx_history_customer_id', ['customerId'])
@Index('idx_history_changed_at', ['changedAt'])
@Index('idx_history_customer_changed', ['customerId', 'changedAt'])
export class CustomerHistory {
  @PrimaryColumn('number')
  id: number;

  @Column('number', { nullable: false })
  customerId: number; // 고객 ID (FK → CUSTOMER, ON DELETE RESTRICT)

  @Column('varchar2', {
    length: 20,
    nullable: false,
    check: "change_type IN ('CREATE', 'UPDATE', 'DELETE', 'CONTACT_ADD', 'CONTACT_DELETE')"
  })
  changeType: 'CREATE' | 'UPDATE' | 'DELETE' | 'CONTACT_ADD' | 'CONTACT_DELETE';

  @Column('clob', { nullable: false })
  changedFields: string; // JSON: {"fieldName": {"before": old, "after": new}, ...}
  // 예: {"name": {"before": "삼성전자", "after": "삼성전자(구)"}, "classification": {"before": "END_USER", "after": "RESELLER"}}

  @Column('number', { nullable: false })
  changedById: number; // 변경자 ID (FK → Employee)

  @CreateDateColumn()
  changedAt: Date; // 변경일시

  // Relations
  @ManyToOne(() => Customer, (customer) => customer.histories, { onDelete: 'RESTRICT' })
  customer: Customer;

  @ManyToOne(() => Employee, { lazy: false })
  changedBy: Employee;
}
```

**컬럼 정의:**

| 컬럼명 | 타입 | 제약 | 설명 |
|--------|------|------|------|
| `ID` | NUMBER | PK | 이력 고유 ID |
| `CUSTOMER_ID` | NUMBER | NOT NULL, FK | 고객 ID (ON DELETE RESTRICT) |
| `CHANGE_TYPE` | VARCHAR2(20) | NOT NULL, CHECK | 변경 유형 (CREATE\|UPDATE\|DELETE\|CONTACT_ADD\|CONTACT_DELETE) |
| `CHANGED_FIELDS` | CLOB | NOT NULL | 변경 내용 (JSON 형식) |
| `CHANGED_BY_ID` | NUMBER | NOT NULL, FK | 변경자 (Employee FK) |
| `CHANGED_AT` | TIMESTAMP | NOT NULL | 변경일시 |

**제약 조건:**

```sql
-- ON DELETE RESTRICT: CUSTOMER 삭제 시 이력 존재 시 삭제 불가
ALTER TABLE CUSTOMER_HISTORY
ADD CONSTRAINT fk_history_customer
FOREIGN KEY (customer_id) REFERENCES CUSTOMER(id) ON DELETE RESTRICT;

-- 변경 유형 체크
ALTER TABLE CUSTOMER_HISTORY
ADD CONSTRAINT ck_history_change_type
CHECK (change_type IN ('CREATE', 'UPDATE', 'DELETE', 'CONTACT_ADD', 'CONTACT_DELETE'));
```

**인덱스:**

```sql
CREATE INDEX idx_history_customer_id ON CUSTOMER_HISTORY(customer_id);
CREATE INDEX idx_history_changed_at ON CUSTOMER_HISTORY(changed_at);
CREATE INDEX idx_history_customer_changed ON CUSTOMER_HISTORY(customer_id, changed_at);
```

---

### 2. TypeORM Migration (`src/migrations/[timestamp]_create_customer_tables.ts`)

**파일명 규칙**: `YYYYMMDDHHMMSS_create_customer_tables.ts` (예: `20260127224500_create_customer_tables.ts`)

**생성 명령어:**

```bash
npx typeorm migration:generate -n create_customer_tables
```

또는 수동 작성:

```typescript
import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateCustomerTables1704067200000 implements MigrationInterface {
  name = 'CreateCustomerTables1704067200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. CUSTOMER 테이블 생성
    await queryRunner.createTable(
      new Table({
        name: 'CUSTOMER',
        columns: [
          {
            name: 'id',
            type: 'number',
            isPrimary: true,
            generationStrategy: 'sequence',
            isGenerated: true
          },
          {
            name: 'name',
            type: 'varchar2',
            length: '200',
            isNullable: false
          },
          {
            name: 'code',
            type: 'varchar2',
            length: '20',
            isNullable: false,
            isUnique: true
          },
          {
            name: 'classification',
            type: 'varchar2',
            length: '20',
            isNullable: false,
            default: `'GENERAL'`
          },
          {
            name: 'address',
            type: 'varchar2',
            length: '500',
            isNullable: true
          },
          {
            name: 'phone',
            type: 'varchar2',
            length: '20',
            isNullable: true
          },
          {
            name: 'email',
            type: 'varchar2',
            length: '100',
            isNullable: true
          },
          {
            name: 'memo',
            type: 'clob',
            isNullable: true
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false
          },
          {
            name: 'created_by_id',
            type: 'number',
            isNullable: false
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
            onUpdate: 'CURRENT_TIMESTAMP'
          },
          {
            name: 'updated_by_id',
            type: 'number',
            isNullable: false
          },
          {
            name: 'deleted_at',
            type: 'timestamp',
            isNullable: true
          }
        ],
        indices: [
          {
            name: 'idx_customer_classification',
            columnNames: ['classification']
          },
          {
            name: 'idx_customer_created_at',
            columnNames: ['created_at']
          },
          {
            name: 'idx_customer_deleted_at',
            columnNames: ['deleted_at']
          }
        ]
      }),
      true
    );

    // 2. CUSTOMER 테이블에 partial unique index (deleted_at IS NULL)
    await queryRunner.query(`
      CREATE UNIQUE INDEX idx_customer_name
      ON CUSTOMER(name)
      WHERE deleted_at IS NULL
    `);

    // 3. CUSTOMER_CONTACT 테이블 생성
    await queryRunner.createTable(
      new Table({
        name: 'CUSTOMER_CONTACT',
        columns: [
          {
            name: 'id',
            type: 'number',
            isPrimary: true,
            generationStrategy: 'sequence',
            isGenerated: true
          },
          {
            name: 'customer_id',
            type: 'number',
            isNullable: false
          },
          {
            name: 'name',
            type: 'varchar2',
            length: '100',
            isNullable: false
          },
          {
            name: 'title',
            type: 'varchar2',
            length: '50',
            isNullable: false
          },
          {
            name: 'department',
            type: 'varchar2',
            length: '50',
            isNullable: true
          },
          {
            name: 'email',
            type: 'varchar2',
            length: '100',
            isNullable: false
          },
          {
            name: 'phone',
            type: 'varchar2',
            length: '20',
            isNullable: false
          },
          {
            name: 'description',
            type: 'varchar2',
            length: '200',
            isNullable: true
          },
          {
            name: 'primary_contact',
            type: 'number',
            default: 0,
            isNullable: false
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
            onUpdate: 'CURRENT_TIMESTAMP'
          },
          {
            name: 'deleted_at',
            type: 'timestamp',
            isNullable: true
          }
        ],
        indices: [
          {
            name: 'idx_contact_customer_id',
            columnNames: ['customer_id']
          },
          {
            name: 'idx_contact_deleted_at',
            columnNames: ['deleted_at']
          }
        ]
      }),
      true
    );

    // 4. CUSTOMER_CONTACT에 unique partial index
    await queryRunner.query(`
      CREATE UNIQUE INDEX idx_contact_primary
      ON CUSTOMER_CONTACT(customer_id)
      WHERE primary_contact = 1 AND deleted_at IS NULL
    `);

    // 5. CUSTOMER_HISTORY 테이블 생성
    await queryRunner.createTable(
      new Table({
        name: 'CUSTOMER_HISTORY',
        columns: [
          {
            name: 'id',
            type: 'number',
            isPrimary: true,
            generationStrategy: 'sequence',
            isGenerated: true
          },
          {
            name: 'customer_id',
            type: 'number',
            isNullable: false
          },
          {
            name: 'change_type',
            type: 'varchar2',
            length: '20',
            isNullable: false
          },
          {
            name: 'changed_fields',
            type: 'clob',
            isNullable: false
          },
          {
            name: 'changed_by_id',
            type: 'number',
            isNullable: false
          },
          {
            name: 'changed_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false
          }
        ],
        indices: [
          {
            name: 'idx_history_customer_id',
            columnNames: ['customer_id']
          },
          {
            name: 'idx_history_changed_at',
            columnNames: ['changed_at']
          }
        ]
      }),
      true
    );

    // 6. Foreign Key 생성
    await queryRunner.createForeignKey(
      'CUSTOMER',
      new TableForeignKey({
        name: 'fk_customer_created_by',
        columnNames: ['created_by_id'],
        referencedTableName: 'EMPLOYEE',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT'
      })
    );

    await queryRunner.createForeignKey(
      'CUSTOMER',
      new TableForeignKey({
        name: 'fk_customer_updated_by',
        columnNames: ['updated_by_id'],
        referencedTableName: 'EMPLOYEE',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT'
      })
    );

    await queryRunner.createForeignKey(
      'CUSTOMER_CONTACT',
      new TableForeignKey({
        name: 'fk_contact_customer',
        columnNames: ['customer_id'],
        referencedTableName: 'CUSTOMER',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT'
      })
    );

    await queryRunner.createForeignKey(
      'CUSTOMER_HISTORY',
      new TableForeignKey({
        name: 'fk_history_customer',
        columnNames: ['customer_id'],
        referencedTableName: 'CUSTOMER',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT'
      })
    );

    await queryRunner.createForeignKey(
      'CUSTOMER_HISTORY',
      new TableForeignKey({
        name: 'fk_history_changed_by',
        columnNames: ['changed_by_id'],
        referencedTableName: 'EMPLOYEE',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT'
      })
    );

    // 7. Check constraints (Oracle 구문)
    await queryRunner.query(`
      ALTER TABLE CUSTOMER_HISTORY
      ADD CONSTRAINT ck_history_change_type
      CHECK (change_type IN ('CREATE', 'UPDATE', 'DELETE', 'CONTACT_ADD', 'CONTACT_DELETE'))
    `);

    await queryRunner.query(`
      ALTER TABLE CUSTOMER
      ADD CONSTRAINT ck_customer_classification
      CHECK (classification IN ('RESELLER', 'END_USER', 'MAINTENANCE', 'GENERAL'))
    `);

    // 8. Sequence 생성 (고객 코드 자동 생성용)
    await queryRunner.query(`
      CREATE SEQUENCE CUST_CODE_SEQ
      INCREMENT BY 1
      START WITH 1
      CACHE 20
      NOCYCLE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Rollback (역순)
    await queryRunner.query(`DROP SEQUENCE CUST_CODE_SEQ`);

    await queryRunner.dropForeignKey('CUSTOMER_HISTORY', 'fk_history_changed_by');
    await queryRunner.dropForeignKey('CUSTOMER_HISTORY', 'fk_history_customer');
    await queryRunner.dropForeignKey('CUSTOMER_CONTACT', 'fk_contact_customer');
    await queryRunner.dropForeignKey('CUSTOMER', 'fk_customer_updated_by');
    await queryRunner.dropForeignKey('CUSTOMER', 'fk_customer_created_by');

    await queryRunner.dropTable('CUSTOMER_HISTORY', true);
    await queryRunner.dropTable('CUSTOMER_CONTACT', true);
    await queryRunner.dropTable('CUSTOMER', true);
  }
}
```

---

## Acceptance Criteria

- [ ] CustomerHistory Entity 정의 완료 (`src/entities/CustomerHistory.ts`)
  - [ ] PrimaryColumn `id` 정의
  - [ ] 변경 유형: enum (CREATE, UPDATE, DELETE, CONTACT_ADD, CONTACT_DELETE)
  - [ ] 변경 내용: CLOB (JSON 형식)
  - [ ] 메타데이터: changed_by_id, changed_at
  - [ ] FK: customer_id (ON DELETE RESTRICT)
  - [ ] 불변 로그 설계 (soft delete 없음)

- [ ] Migration 파일 생성 완료 (`src/migrations/[timestamp]_create_customer_tables.ts`)
  - [ ] CUSTOMER 테이블 생성
  - [ ] CUSTOMER_CONTACT 테이블 생성
  - [ ] CUSTOMER_HISTORY 테이블 생성
  - [ ] Partial unique index (name, primary_contact)
  - [ ] Foreign Key 생성 (ON DELETE RESTRICT)
  - [ ] SEQUENCE 생성 (CUST_CODE_SEQ)

- [ ] Migration 실행 성공
  ```bash
  npx typeorm migration:run
  ✅ Database schema created successfully
  ```

- [ ] TypeScript 컴파일 성공
  ```bash
  npm run type-check
  ✅ (에러 없음)
  ```

---

## 테스트 전략

### TypeScript & Lint

```bash
npm run type-check
npm run lint
npm run format
```

### Migration 검증

```bash
# Migration 실행
npx typeorm migration:run

# 테이블 생성 확인 (Oracle)
SELECT table_name FROM user_tables WHERE table_name LIKE 'CUSTOMER%';

# 인덱스 확인
SELECT index_name FROM user_indexes WHERE table_name LIKE 'CUSTOMER%';

# Sequence 확인
SELECT sequence_name FROM user_sequences WHERE sequence_name LIKE 'CUST%';
```

---

## 완료 체크리스트

- [ ] TypeScript 빌드 성공
  ```bash
  npm run build
  ✅ (에러 없음)
  ```

- [ ] TypeScript 검증 통과
  ```bash
  npm run type-check
  ✅ (에러 없음)
  ```

- [ ] ESLint 검증 통과
  ```bash
  npm run lint
  ✅ (경고 없음)
  ```

- [ ] Migration 실행 성공
  ```bash
  npx typeorm migration:run
  ✅ 3 new migrations executed
  ```

- [ ] 데이터베이스 스키마 확인
  - [ ] CUSTOMER 테이블 존재
  - [ ] CUSTOMER_CONTACT 테이블 존재
  - [ ] CUSTOMER_HISTORY 테이블 존재
  - [ ] Partial unique index 생성됨
  - [ ] Foreign Key 생성됨
  - [ ] CUST_CODE_SEQ Sequence 생성됨

---

**다음 문서**: 2081_03_API_고객_CRUD.md
