// Generated: 2026-01-25 01:00:00 KST

import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateDepartmentTable20260125010000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Sequence
    await queryRunner.query(
      `CREATE SEQUENCE DEPARTMENT_ID_SEQ START WITH 1 INCREMENT BY 1 NOCACHE`
    );

    // 2. Table
    await queryRunner.createTable(
      new Table({
        name: 'DEPARTMENT',
        columns: [
          {
            name: 'id',
            type: 'NUMBER',
            isPrimary: true,
            default: 'DEPARTMENT_ID_SEQ.NEXTVAL',
          },
          {
            name: 'name',
            type: 'VARCHAR2(100)',
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'TIMESTAMP',
            isNullable: false,
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'TIMESTAMP',
            isNullable: false,
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'deleted_at',
            type: 'TIMESTAMP',
            isNullable: true,
          },
        ],
      }),
      true
    );

    // 3. Indexes
    await queryRunner.createIndex(
      'DEPARTMENT',
      new TableIndex({
        name: 'IDX_DEPARTMENT_DELETED_AT',
        columnNames: ['deleted_at'],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('DEPARTMENT', 'IDX_DEPARTMENT_DELETED_AT');
    await queryRunner.dropTable('DEPARTMENT');
    await queryRunner.query(`DROP SEQUENCE DEPARTMENT_ID_SEQ`);
  }
}
