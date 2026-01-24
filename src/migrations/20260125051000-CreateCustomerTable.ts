// Generated: 2026-01-25 05:20:00 KST

import { MigrationInterface, QueryRunner, Table, TableIndex, TableUnique } from 'typeorm';

export class CreateCustomerTable20260125051000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Sequence 생성
    await queryRunner.query(
      `CREATE SEQUENCE CUSTOMER_ID_SEQ START WITH 1 INCREMENT BY 1 NOCACHE`
    );

    // 2. Table 생성
    await queryRunner.createTable(
      new Table({
        name: 'CUSTOMER',
        columns: [
          {
            name: 'id',
            type: 'NUMBER',
            isPrimary: true,
            default: 'CUSTOMER_ID_SEQ.NEXTVAL',
          },
          {
            name: 'name',
            type: 'VARCHAR2(100)',
            isNullable: false,
          },
          {
            name: 'category',
            type: 'VARCHAR2(20)',
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

    // 3. UNIQUE 제약조건
    await queryRunner.createUniqueConstraint(
      'CUSTOMER',
      new TableUnique({
        name: 'UQ_CUSTOMER_NAME',
        columnNames: ['name'],
      })
    );

    // 4. Indexes
    await queryRunner.createIndex(
      'CUSTOMER',
      new TableIndex({
        name: 'IDX_CUSTOMER_DELETED_AT',
        columnNames: ['deleted_at'],
      })
    );
    await queryRunner.createIndex(
      'CUSTOMER',
      new TableIndex({
        name: 'IDX_CUSTOMER_CATEGORY',
        columnNames: ['category'],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('CUSTOMER', 'IDX_CUSTOMER_CATEGORY');
    await queryRunner.dropIndex('CUSTOMER', 'IDX_CUSTOMER_DELETED_AT');
    await queryRunner.dropUniqueConstraint('CUSTOMER', 'UQ_CUSTOMER_NAME');
    await queryRunner.dropTable('CUSTOMER');
    await queryRunner.query(`DROP SEQUENCE CUSTOMER_ID_SEQ`);
  }
}
