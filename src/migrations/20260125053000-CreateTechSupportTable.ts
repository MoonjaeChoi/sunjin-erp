// Generated: 2026-01-25 05:30:00 KST

import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateTechSupportTable20260125053000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Sequence 생성
    await queryRunner.query(
      `CREATE SEQUENCE TECH_SUPPORT_ID_SEQ START WITH 1 INCREMENT BY 1 NOCACHE`
    );

    // 2. Table 생성
    await queryRunner.createTable(
      new Table({
        name: 'TECH_SUPPORT',
        columns: [
          {
            name: 'id',
            type: 'NUMBER',
            isPrimary: true,
            default: 'TECH_SUPPORT_ID_SEQ.NEXTVAL',
          },
          {
            name: 'title',
            type: 'VARCHAR2(200)',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'CLOB',
            isNullable: true,
          },
          {
            name: 'support_date',
            type: 'DATE',
            isNullable: false,
          },
          {
            name: 'start_time',
            type: 'NUMBER',
            isNullable: true,
          },
          {
            name: 'end_time',
            type: 'NUMBER',
            isNullable: true,
          },
          {
            name: 'support_type',
            type: 'VARCHAR2(20)',
            isNullable: false,
          },
          {
            name: 'support_method',
            type: 'VARCHAR2(20)',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'VARCHAR2(20)',
            isNullable: false,
            default: "'RECEIVED'",
          },
          {
            name: 'employee_id',
            type: 'NUMBER',
            isNullable: false,
          },
          {
            name: 'customer_id',
            type: 'NUMBER',
            isNullable: false,
          },
          {
            name: 'attachment_path',
            type: 'VARCHAR2(500)',
            isNullable: true,
          },
          {
            name: 'attachment_name',
            type: 'VARCHAR2(200)',
            isNullable: true,
          },
          {
            name: 'completed_at',
            type: 'TIMESTAMP',
            isNullable: true,
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

    // 3. Foreign Keys
    await queryRunner.createForeignKey(
      'TECH_SUPPORT',
      new TableForeignKey({
        name: 'FK_TS_EMPLOYEE',
        columnNames: ['employee_id'],
        referencedTableName: 'EMPLOYEE',
        referencedColumnNames: ['id'],
        // Oracle default behavior (no cascade) = restrict
      })
    );
    await queryRunner.createForeignKey(
      'TECH_SUPPORT',
      new TableForeignKey({
        name: 'FK_TS_CUSTOMER',
        columnNames: ['customer_id'],
        referencedTableName: 'CUSTOMER',
        referencedColumnNames: ['id'],
        // Oracle default behavior (no cascade) = restrict
      })
    );

    // 4. CHECK Constraints (Oracle: TypeORM creates columns as quoted lowercase)
    await queryRunner.query(
      `ALTER TABLE TECH_SUPPORT ADD CONSTRAINT CHK_TS_START_TIME CHECK ("start_time" IS NULL OR ("start_time" >= 0 AND "start_time" <= 1439))`
    );
    await queryRunner.query(
      `ALTER TABLE TECH_SUPPORT ADD CONSTRAINT CHK_TS_END_TIME CHECK ("end_time" IS NULL OR ("end_time" >= 0 AND "end_time" <= 1439))`
    );
    await queryRunner.query(
      `ALTER TABLE TECH_SUPPORT ADD CONSTRAINT CHK_TS_TIME_ORDER CHECK (("start_time" IS NULL OR "end_time" IS NULL) OR "start_time" < "end_time")`
    );

    // 5. Indexes
    await queryRunner.createIndex(
      'TECH_SUPPORT',
      new TableIndex({
        name: 'IDX_TECHSUPPORT_DATE_EMPLOYEE',
        columnNames: ['support_date', 'employee_id'],
      })
    );
    await queryRunner.createIndex(
      'TECH_SUPPORT',
      new TableIndex({
        name: 'IDX_TECHSUPPORT_CUSTOMER',
        columnNames: ['customer_id'],
      })
    );
    await queryRunner.createIndex(
      'TECH_SUPPORT',
      new TableIndex({
        name: 'IDX_TECHSUPPORT_STATUS',
        columnNames: ['status'],
      })
    );
    await queryRunner.createIndex(
      'TECH_SUPPORT',
      new TableIndex({
        name: 'IDX_TECHSUPPORT_DELETED_AT',
        columnNames: ['deleted_at'],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 역순 삭제: Indexes → FKs → Table → Sequence
    await queryRunner.dropIndex('TECH_SUPPORT', 'IDX_TECHSUPPORT_DELETED_AT');
    await queryRunner.dropIndex('TECH_SUPPORT', 'IDX_TECHSUPPORT_STATUS');
    await queryRunner.dropIndex('TECH_SUPPORT', 'IDX_TECHSUPPORT_CUSTOMER');
    await queryRunner.dropIndex('TECH_SUPPORT', 'IDX_TECHSUPPORT_DATE_EMPLOYEE');
    await queryRunner.dropForeignKey('TECH_SUPPORT', 'FK_TS_CUSTOMER');
    await queryRunner.dropForeignKey('TECH_SUPPORT', 'FK_TS_EMPLOYEE');
    await queryRunner.dropTable('TECH_SUPPORT');
    await queryRunner.query(`DROP SEQUENCE TECH_SUPPORT_ID_SEQ`);
  }
}
