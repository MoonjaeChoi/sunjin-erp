<!-- Generated: 2026-01-26 22:45:00 KST -->

# TypeORM Migration 생성 (테이블 + 인덱스)

**문서 번호**: 2071_02
**원본 PRD**: `docs/prd/2071_유지보수_고객_관리_prd_v2.md`
**PRD 참조**: [Section 5.3 - Database Migration](./2071_유지보수_고객_관리_prd_v2.md#migration-파일)
**운영 표준**: `docs/operation/011_데이터베이스연결.md` (Oracle XE 21c Migration, QueryRunner 패턴, ON DELETE RESTRICT, Soft delete 인덱싱)
**구현 범위**: 3개 Migration 파일 (테이블 + 인덱스)
**복잡도**: M (1-2일)
**의존성**: 2071_01 (Entity 정의 완료)

---

## 구현 목표

TypeORM을 사용하여 유지보수 계약 관련 테이블을 Oracle XE 21c에 생성합니다. Soft delete 지원 인덱스, 복합 인덱스, 성능 최적화 인덱스를 포함합니다.

---

## 구현 내용

### 파일 구조

```
src/migrations/
├── 1706300000000-CreateMaintenanceContractTable.ts
├── 1706300000001-CreateMaintenanceContractAttachmentTable.ts
└── 1706300000002-CreateMaintenanceContractHistoryTable.ts
```

### Oracle XE 21c 호환성 (docs/operation/011 참조)

**TypeORM Migration Pattern**:
```bash
# Generation
npx typeorm migration:generate -n MigrationName

# Execution
npx typeorm migration:run

# Rollback
npx typeorm migration:revert
```

**QueryRunner 사용 패턴** (Oracle raw query execution):
```typescript
const queryRunner = dataSource.createQueryRunner();
try {
  await queryRunner.query('CREATE TABLE ...');
  // All operations use queryRunner.query() for raw SQL
} finally {
  await queryRunner.release();
}
```

**FK 규칙**: `ON DELETE RESTRICT` (CASCADE DELETE 절대 금지)
**Soft Delete 인덱스**: `WHERE deleted_at IS NULL` 조건포함

### 1. MaintenanceContract 테이블 Migration

**파일**: `src/migrations/1706300000000-CreateMaintenanceContractTable.ts`

```typescript
// Generated: 2026-01-26 22:45:00 KST

import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateMaintenanceContractTable1706300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'MAINTENANCE_CONTRACT',
        columns: [
          {
            name: 'id',
            type: 'number',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'customer_id',
            type: 'number',
            isNullable: false,
          },
          {
            name: 'contract_name',
            type: 'varchar2',
            length: '255',
            isNullable: false,
          },
          {
            name: 'contract_type',
            type: 'varchar2',
            length: '255',
            isNullable: false,
          },
          {
            name: 'start_date',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'end_date',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'contract_amount',
            type: 'number',
            isNullable: true,
          },
          {
            name: 'assigned_employee_id',
            type: 'number',
            isNullable: false,
          },
          {
            name: 'contract_status',
            type: 'varchar2',
            length: '50',
            isNullable: false,
            default: `'활성'`,
          },
          {
            name: 'notes',
            type: 'clob',
            isNullable: true,
          },
          {
            name: 'created_by_id',
            type: 'number',
            isNullable: false,
          },
          {
            name: 'updated_by_id',
            type: 'number',
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            isNullable: false,
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            isNullable: false,
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'deleted_at',
            type: 'timestamp',
            isNullable: true,
          },
        ],
        checks: [
          {
            name: 'CHK_MC_STATUS',
            expression: `contract_status IN ('활성', '종료', '갱신예정')`,
          },
          {
            name: 'CHK_MC_DATES',
            expression: 'start_date <= end_date',
          },
        ],
      }),
      true
    );

    // Soft delete 인덱스 추가
    await queryRunner.createIndex(
      'MAINTENANCE_CONTRACT',
      new TableIndex({
        name: 'idx_mc_customer_active',
        columnNames: ['customer_id'],
        where: 'deleted_at IS NULL',
      })
    );

    await queryRunner.createIndex(
      'MAINTENANCE_CONTRACT',
      new TableIndex({
        name: 'idx_mc_employee_active',
        columnNames: ['assigned_employee_id'],
        where: 'deleted_at IS NULL',
      })
    );

    await queryRunner.createIndex(
      'MAINTENANCE_CONTRACT',
      new TableIndex({
        name: 'idx_mc_status_active',
        columnNames: ['contract_status'],
        where: 'deleted_at IS NULL',
      })
    );

    await queryRunner.createIndex(
      'MAINTENANCE_CONTRACT',
      new TableIndex({
        name: 'idx_mc_status_enddate_active',
        columnNames: ['contract_status', 'end_date'],
        where: 'deleted_at IS NULL',
      })
    );

    await queryRunner.createIndex(
      'MAINTENANCE_CONTRACT',
      new TableIndex({
        name: 'idx_mc_customer_enddate_active',
        columnNames: ['customer_id', 'end_date'],
        where: 'deleted_at IS NULL',
      })
    );

    await queryRunner.createIndex(
      'MAINTENANCE_CONTRACT',
      new TableIndex({
        name: 'idx_mc_enddate_active',
        columnNames: ['end_date'],
        where: 'deleted_at IS NULL',
      })
    );

    // Foreign Keys (ON DELETE RESTRICT)
    await queryRunner.createForeignKey(
      'MAINTENANCE_CONTRACT',
      new TableForeignKey({
        name: 'fk_mc_customer',
        columnNames: ['customer_id'],
        referencedTableName: 'CUSTOMER',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      })
    );

    await queryRunner.createForeignKey(
      'MAINTENANCE_CONTRACT',
      new TableForeignKey({
        name: 'fk_mc_assigned_employee',
        columnNames: ['assigned_employee_id'],
        referencedTableName: 'EMPLOYEE',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      })
    );

    await queryRunner.createForeignKey(
      'MAINTENANCE_CONTRACT',
      new TableForeignKey({
        name: 'fk_mc_created_by',
        columnNames: ['created_by_id'],
        referencedTableName: 'EMPLOYEE',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      })
    );

    await queryRunner.createForeignKey(
      'MAINTENANCE_CONTRACT',
      new TableForeignKey({
        name: 'fk_mc_updated_by',
        columnNames: ['updated_by_id'],
        referencedTableName: 'EMPLOYEE',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('MAINTENANCE_CONTRACT');
    if (table) {
      for (const fk of table.foreignKeys) {
        await queryRunner.dropForeignKey('MAINTENANCE_CONTRACT', fk);
      }
    }

    await queryRunner.dropIndex('MAINTENANCE_CONTRACT', 'idx_mc_customer_active');
    await queryRunner.dropIndex('MAINTENANCE_CONTRACT', 'idx_mc_employee_active');
    await queryRunner.dropIndex('MAINTENANCE_CONTRACT', 'idx_mc_status_active');
    await queryRunner.dropIndex('MAINTENANCE_CONTRACT', 'idx_mc_status_enddate_active');
    await queryRunner.dropIndex('MAINTENANCE_CONTRACT', 'idx_mc_customer_enddate_active');
    await queryRunner.dropIndex('MAINTENANCE_CONTRACT', 'idx_mc_enddate_active');

    await queryRunner.dropTable('MAINTENANCE_CONTRACT');
  }
}
```

### 2. Attachment 테이블 Migration

**파일**: `src/migrations/1706300000001-CreateMaintenanceContractAttachmentTable.ts`

```typescript
// Generated: 2026-01-26 22:45:00 KST

import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateMaintenanceContractAttachmentTable1706300000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'MAINTENANCE_CONTRACT_ATTACHMENT',
        columns: [
          {
            name: 'id',
            type: 'number',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'maintenance_contract_id',
            type: 'number',
            isNullable: false,
          },
          {
            name: 'file_name',
            type: 'varchar2',
            length: '255',
            isNullable: false,
          },
          {
            name: 'file_path',
            type: 'varchar2',
            length: '512',
            isNullable: false,
          },
          {
            name: 'file_size',
            type: 'number',
            isNullable: false,
          },
          {
            name: 'uploaded_by_id',
            type: 'number',
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            isNullable: false,
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'deleted_at',
            type: 'timestamp',
            isNullable: true,
          },
        ],
      }),
      true
    );

    // Foreign Keys (ON DELETE RESTRICT)
    await queryRunner.createForeignKey(
      'MAINTENANCE_CONTRACT_ATTACHMENT',
      new TableForeignKey({
        name: 'fk_mca_contract',
        columnNames: ['maintenance_contract_id'],
        referencedTableName: 'MAINTENANCE_CONTRACT',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      })
    );

    await queryRunner.createForeignKey(
      'MAINTENANCE_CONTRACT_ATTACHMENT',
      new TableForeignKey({
        name: 'fk_mca_uploaded_by',
        columnNames: ['uploaded_by_id'],
        referencedTableName: 'EMPLOYEE',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('MAINTENANCE_CONTRACT_ATTACHMENT');
    if (table) {
      for (const fk of table.foreignKeys) {
        await queryRunner.dropForeignKey('MAINTENANCE_CONTRACT_ATTACHMENT', fk);
      }
    }
    await queryRunner.dropTable('MAINTENANCE_CONTRACT_ATTACHMENT');
  }
}
```

### 3. History 테이블 Migration

**파일**: `src/migrations/1706300000002-CreateMaintenanceContractHistoryTable.ts`

```typescript
// Generated: 2026-01-26 22:45:00 KST

import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateMaintenanceContractHistoryTable1706300000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'MAINTENANCE_CONTRACT_HISTORY',
        columns: [
          {
            name: 'id',
            type: 'number',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'maintenance_contract_id',
            type: 'number',
            isNullable: false,
          },
          {
            name: 'change_type',
            type: 'varchar2',
            length: '50',
            isNullable: false,
          },
          {
            name: 'previous_end_date',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'new_end_date',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'reason',
            type: 'varchar2',
            length: '500',
            isNullable: true,
          },
          {
            name: 'changed_by_id',
            type: 'number',
            isNullable: false,
          },
          {
            name: 'changed_at',
            type: 'timestamp',
            isNullable: false,
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'deleted_at',
            type: 'timestamp',
            isNullable: true,
          },
        ],
        checks: [
          {
            name: 'CHK_MCH_CHANGE_TYPE',
            expression: `change_type IN ('갱신', '상태변경', '정보수정')`,
          },
        ],
      }),
      true
    );

    // Foreign Keys (ON DELETE RESTRICT)
    await queryRunner.createForeignKey(
      'MAINTENANCE_CONTRACT_HISTORY',
      new TableForeignKey({
        name: 'fk_mch_contract',
        columnNames: ['maintenance_contract_id'],
        referencedTableName: 'MAINTENANCE_CONTRACT',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      })
    );

    await queryRunner.createForeignKey(
      'MAINTENANCE_CONTRACT_HISTORY',
      new TableForeignKey({
        name: 'fk_mch_changed_by',
        columnNames: ['changed_by_id'],
        referencedTableName: 'EMPLOYEE',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('MAINTENANCE_CONTRACT_HISTORY');
    if (table) {
      for (const fk of table.foreignKeys) {
        await queryRunner.dropForeignKey('MAINTENANCE_CONTRACT_HISTORY', fk);
      }
    }
    await queryRunner.dropTable('MAINTENANCE_CONTRACT_HISTORY');
  }
}
```

---

## Acceptance Criteria

- [ ] 3개 Migration 파일 생성 완료
- [ ] 모든 CHECK 제약조건 적용
- [ ] 모든 FK가 ON DELETE RESTRICT 설정
- [ ] Soft delete 인덱스 포함
- [ ] Migration 실행/롤백 성공

---

## 테스트 전략

```bash
npx typeorm migration:run
npx typeorm migration:show
npx typeorm migration:revert
```

---

**다음 문서**: `2071_03_저장소_서비스_레이어.md`
