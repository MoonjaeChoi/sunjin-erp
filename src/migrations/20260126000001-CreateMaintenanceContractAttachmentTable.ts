// Generated: 2026-01-26 22:45:00 KST

import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
  TableForeignKey,
} from 'typeorm';

export class CreateMaintenanceContractAttachmentTable20260126000001
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create sequence for ID generation
    await queryRunner.query(
      `CREATE SEQUENCE SEQ_MC_ATTACHMENT START WITH 1 INCREMENT BY 1 NOCACHE`
    );

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

    // Create indexes
    await queryRunner.createIndex(
      'MAINTENANCE_CONTRACT_ATTACHMENT',
      new TableIndex({
        name: 'idx_mca_maintenance_contract_id',
        columnNames: ['maintenance_contract_id'],
      })
    );

    await queryRunner.createIndex(
      'MAINTENANCE_CONTRACT_ATTACHMENT',
      new TableIndex({
        name: 'idx_mca_uploaded_by_id',
        columnNames: ['uploaded_by_id'],
      })
    );

    await queryRunner.createIndex(
      'MAINTENANCE_CONTRACT_ATTACHMENT',
      new TableIndex({
        name: 'idx_mca_deleted_at',
        columnNames: ['deleted_at'],
      })
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

    await queryRunner.dropIndex(
      'MAINTENANCE_CONTRACT_ATTACHMENT',
      'idx_mca_maintenance_contract_id'
    );
    await queryRunner.dropIndex(
      'MAINTENANCE_CONTRACT_ATTACHMENT',
      'idx_mca_uploaded_by_id'
    );
    await queryRunner.dropIndex('MAINTENANCE_CONTRACT_ATTACHMENT', 'idx_mca_deleted_at');

    await queryRunner.dropTable('MAINTENANCE_CONTRACT_ATTACHMENT');

    // Drop sequence
    await queryRunner.query(`DROP SEQUENCE SEQ_MC_ATTACHMENT`);
  }
}
