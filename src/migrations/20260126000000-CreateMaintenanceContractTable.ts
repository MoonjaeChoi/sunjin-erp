// Generated: 2026-01-26 22:45:00 KST

import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
  TableForeignKey,
} from 'typeorm';

export class CreateMaintenanceContractTable20260126000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create sequence for ID generation
    await queryRunner.query(
      `CREATE SEQUENCE SEQ_MAINTENANCE_CONTRACT START WITH 1 INCREMENT BY 1 NOCACHE`
    );

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

    // Create indexes for common query patterns
    await queryRunner.createIndex(
      'MAINTENANCE_CONTRACT',
      new TableIndex({
        name: 'idx_mc_customer_id',
        columnNames: ['customer_id'],
      })
    );

    await queryRunner.createIndex(
      'MAINTENANCE_CONTRACT',
      new TableIndex({
        name: 'idx_mc_assigned_employee_id',
        columnNames: ['assigned_employee_id'],
      })
    );

    await queryRunner.createIndex(
      'MAINTENANCE_CONTRACT',
      new TableIndex({
        name: 'idx_mc_status',
        columnNames: ['contract_status'],
      })
    );

    await queryRunner.createIndex(
      'MAINTENANCE_CONTRACT',
      new TableIndex({
        name: 'idx_mc_end_date',
        columnNames: ['end_date'],
      })
    );

    await queryRunner.createIndex(
      'MAINTENANCE_CONTRACT',
      new TableIndex({
        name: 'idx_mc_deleted_at',
        columnNames: ['deleted_at'],
      })
    );

    // Composite indexes for soft-delete filtering
    await queryRunner.createIndex(
      'MAINTENANCE_CONTRACT',
      new TableIndex({
        name: 'idx_mc_status_enddate',
        columnNames: ['contract_status', 'end_date'],
      })
    );

    await queryRunner.createIndex(
      'MAINTENANCE_CONTRACT',
      new TableIndex({
        name: 'idx_mc_customer_enddate',
        columnNames: ['customer_id', 'end_date'],
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

    await queryRunner.dropIndex('MAINTENANCE_CONTRACT', 'idx_mc_customer_id');
    await queryRunner.dropIndex(
      'MAINTENANCE_CONTRACT',
      'idx_mc_assigned_employee_id'
    );
    await queryRunner.dropIndex('MAINTENANCE_CONTRACT', 'idx_mc_status');
    await queryRunner.dropIndex('MAINTENANCE_CONTRACT', 'idx_mc_end_date');
    await queryRunner.dropIndex('MAINTENANCE_CONTRACT', 'idx_mc_deleted_at');
    await queryRunner.dropIndex('MAINTENANCE_CONTRACT', 'idx_mc_status_enddate');
    await queryRunner.dropIndex('MAINTENANCE_CONTRACT', 'idx_mc_customer_enddate');

    await queryRunner.dropTable('MAINTENANCE_CONTRACT');

    // Drop sequence
    await queryRunner.query(`DROP SEQUENCE SEQ_MAINTENANCE_CONTRACT`);
  }
}
