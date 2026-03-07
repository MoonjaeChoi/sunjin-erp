// Generated: 2026-01-26 22:45:00 KST

import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
  TableForeignKey,
} from 'typeorm';

export class CreateMaintenanceContractHistoryTable20260126000002
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create sequence for ID generation
    await queryRunner.query(
      `CREATE SEQUENCE SEQ_MAINTENANCE_CONTRACT_HISTORY START WITH 1 INCREMENT BY 1 NOCACHE`
    );

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

    // Create indexes
    await queryRunner.createIndex(
      'MAINTENANCE_CONTRACT_HISTORY',
      new TableIndex({
        name: 'idx_mch_maintenance_contract_id',
        columnNames: ['maintenance_contract_id'],
      })
    );

    await queryRunner.createIndex(
      'MAINTENANCE_CONTRACT_HISTORY',
      new TableIndex({
        name: 'idx_mch_changed_by_id',
        columnNames: ['changed_by_id'],
      })
    );

    await queryRunner.createIndex(
      'MAINTENANCE_CONTRACT_HISTORY',
      new TableIndex({
        name: 'idx_mch_changed_at',
        columnNames: ['changed_at'],
      })
    );

    await queryRunner.createIndex(
      'MAINTENANCE_CONTRACT_HISTORY',
      new TableIndex({
        name: 'idx_mch_change_type',
        columnNames: ['change_type'],
      })
    );

    await queryRunner.createIndex(
      'MAINTENANCE_CONTRACT_HISTORY',
      new TableIndex({
        name: 'idx_mch_deleted_at',
        columnNames: ['deleted_at'],
      })
    );

    // Foreign Keys (ON DELETE RESTRICT)
    await queryRunner.createForeignKey(
      'MAINTENANCE_CONTRACT_HISTORY',
      new TableForeignKey({
        name: 'fk_mch_contract',
        columnNames: ['maintenance_contract_id'],
        referencedTableName: 'MAINTENANCE_CONTRACT',
        referencedColumnNames: ['id'],
      })
    );

    await queryRunner.createForeignKey(
      'MAINTENANCE_CONTRACT_HISTORY',
      new TableForeignKey({
        name: 'fk_mch_changed_by',
        columnNames: ['changed_by_id'],
        referencedTableName: 'EMPLOYEE',
        referencedColumnNames: ['id'],
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

    await queryRunner.dropIndex(
      'MAINTENANCE_CONTRACT_HISTORY',
      'idx_mch_maintenance_contract_id'
    );
    await queryRunner.dropIndex('MAINTENANCE_CONTRACT_HISTORY', 'idx_mch_changed_by_id');
    await queryRunner.dropIndex('MAINTENANCE_CONTRACT_HISTORY', 'idx_mch_changed_at');
    await queryRunner.dropIndex('MAINTENANCE_CONTRACT_HISTORY', 'idx_mch_change_type');
    await queryRunner.dropIndex('MAINTENANCE_CONTRACT_HISTORY', 'idx_mch_deleted_at');

    await queryRunner.dropTable('MAINTENANCE_CONTRACT_HISTORY');

    // Drop sequence
    await queryRunner.query(`DROP SEQUENCE SEQ_MAINTENANCE_CONTRACT_HISTORY`);
  }
}
