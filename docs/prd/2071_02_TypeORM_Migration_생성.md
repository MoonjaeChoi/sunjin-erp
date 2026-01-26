<!-- Generated: 2026-01-26 21:30:00 KST -->

# TypeORM Migration 생성 (테이블 + 인덱스)

**문서 번호**: 2071_02
**원본 PRD**: `docs/prd/2071_유지보수_고객_관리_prd_v2.md`
**PRD 참조**: [Section 5.3 - Database Migration](./2071_유지보수_고객_관리_prd_v2.md#migration-파일)
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

### 1. MaintenanceContract 테이블 Migration

**파일**: `src/migrations/1706300000000-CreateMaintenanceContractTable.ts`

```typescript
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

    // 인덱스 추가
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

    // Foreign Keys 추가
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
    // Drop foreign keys
    const table = await queryRunner.getTable('MAINTENANCE_CONTRACT');
    if (table) {
      const foreignKeys = table.foreignKeys;
      for (const fk of foreignKeys) {
        await queryRunner.dropForeignKey('MAINTENANCE_CONTRACT', fk);
      }
    }

    // Drop indexes
    await queryRunner.dropIndex('MAINTENANCE_CONTRACT', 'idx_mc_customer_active');
    await queryRunner.dropIndex('MAINTENANCE_CONTRACT', 'idx_mc_employee_active');
    await queryRunner.dropIndex('MAINTENANCE_CONTRACT', 'idx_mc_status_active');
    await queryRunner.dropIndex('MAINTENANCE_CONTRACT', 'idx_mc_status_enddate_active');
    await queryRunner.dropIndex('MAINTENANCE_CONTRACT', 'idx_mc_customer_enddate_active');
    await queryRunner.dropIndex('MAINTENANCE_CONTRACT', 'idx_mc_enddate_active');

    // Drop table
    await queryRunner.dropTable('MAINTENANCE_CONTRACT');
  }
}
```

### 2. Attachment 테이블 Migration

**파일**: `src/migrations/1706300000001-CreateMaintenanceContractAttachmentTable.ts`

```typescript
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

    // Foreign Keys
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

    // Foreign Keys
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
  - MaintenanceContract 테이블 + FK + 인덱스
  - Attachment 테이블 + FK
  - History 테이블 + FK

- [ ] 모든 CHECK 제약조건 적용
  - contract_status IN ('활성', '종료', '갱신예정')
  - start_date <= end_date
  - change_type IN ('갱신', '상태변경', '정보수정')

- [ ] 모든 FK가 ON DELETE RESTRICT 설정

- [ ] Soft delete 인덱스 포함
  - `WHERE deleted_at IS NULL`

- [ ] Migration 실행 성공
  ```bash
  npx typeorm migration:run
  ```

- [ ] Migration 롤백 성공
  ```bash
  npx typeorm migration:revert
  ```

---

## 테스트 전략

### Migration 검증

```bash
# 1. 마이그레이션 실행
npx typeorm migration:run

# 2. Oracle에서 테이블 확인
SELECT table_name FROM user_tables WHERE table_name IN ('MAINTENANCE_CONTRACT', 'MAINTENANCE_CONTRACT_ATTACHMENT', 'MAINTENANCE_CONTRACT_HISTORY');

# 3. 인덱스 확인
SELECT index_name, table_name FROM user_indexes WHERE table_name LIKE 'MAINTENANCE_CONTRACT%';

# 4. FK 확인
SELECT constraint_name, table_name, constraint_type FROM user_constraints WHERE table_name LIKE 'MAINTENANCE_CONTRACT%';

# 5. 마이그레이션 롤백
npx typeorm migration:revert
```

---

## 완료 체크리스트

- [ ] 3개 Migration 파일 작성 완료
- [ ] 타임스탐프 네이밍 확인 (1706300000000~002)
- [ ] Migration 실행 성공
- [ ] 모든 테이블 생성 확인
- [ ] 모든 FK 생성 확인
- [ ] 모든 인덱스 생성 확인
- [ ] Migration 롤백 성공
- [ ] 데이터 무결성 검증

---

**다음 문서**: `2071_03_저장소_서비스_레이어.md`
