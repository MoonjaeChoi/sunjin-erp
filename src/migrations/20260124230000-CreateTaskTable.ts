// Generated: 2026-01-24 23:00:00 KST

import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateTaskTable20260124230000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Sequence 생성
    await queryRunner.query(
      `CREATE SEQUENCE TASK_ID_SEQ START WITH 1 INCREMENT BY 1 NOCACHE`
    );

    // 2. Table 생성
    await queryRunner.createTable(
      new Table({
        name: 'TASK',
        columns: [
          {
            name: 'id',
            type: 'NUMBER',
            isPrimary: true,
            default: 'TASK_ID_SEQ.NEXTVAL',
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
            name: 'task_date',
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
            name: 'task_type',
            type: 'VARCHAR2(20)',
            isNullable: false,
          },
          {
            name: 'work_type',
            type: 'VARCHAR2(10)',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'VARCHAR2(20)',
            isNullable: false,
            default: "'READY'",
          },
          {
            name: 'employee_id',
            type: 'NUMBER',
            isNullable: false,
          },
          {
            name: 'customer_id',
            type: 'NUMBER',
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

    // 3. CHECK Constraints (Oracle: TypeORM creates columns as quoted lowercase, must match)
    await queryRunner.query(
      `ALTER TABLE TASK ADD CONSTRAINT CHK_TASK_START_TIME CHECK ("start_time" IS NULL OR ("start_time" >= 0 AND "start_time" <= 1439))`
    );
    await queryRunner.query(
      `ALTER TABLE TASK ADD CONSTRAINT CHK_TASK_END_TIME CHECK ("end_time" IS NULL OR ("end_time" >= 0 AND "end_time" <= 1439))`
    );
    await queryRunner.query(
      `ALTER TABLE TASK ADD CONSTRAINT CHK_TASK_TIME_ORDER CHECK (("start_time" IS NULL OR "end_time" IS NULL) OR "start_time" < "end_time")`
    );

    // 4. Indexes
    await queryRunner.createIndex(
      'TASK',
      new TableIndex({
        name: 'IDX_TASK_DATE_EMPLOYEE',
        columnNames: ['task_date', 'employee_id'],
      })
    );
    await queryRunner.createIndex(
      'TASK',
      new TableIndex({
        name: 'IDX_TASK_EMPLOYEE_DATE',
        columnNames: ['employee_id', 'task_date', 'deleted_at'],
      })
    );
    await queryRunner.createIndex(
      'TASK',
      new TableIndex({
        name: 'IDX_TASK_EMPLOYEE_STATUS',
        columnNames: ['employee_id', 'status'],
      })
    );
    await queryRunner.createIndex(
      'TASK',
      new TableIndex({
        name: 'IDX_TASK_DELETED_AT',
        columnNames: ['deleted_at'],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 역순 삭제: Indexes → Table → Sequence
    await queryRunner.dropIndex('TASK', 'IDX_TASK_DELETED_AT');
    await queryRunner.dropIndex('TASK', 'IDX_TASK_EMPLOYEE_STATUS');
    await queryRunner.dropIndex('TASK', 'IDX_TASK_EMPLOYEE_DATE');
    await queryRunner.dropIndex('TASK', 'IDX_TASK_DATE_EMPLOYEE');
    await queryRunner.dropTable('TASK');
    await queryRunner.query(`DROP SEQUENCE TASK_ID_SEQ`);
  }
}
