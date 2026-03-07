// Generated: 2026-01-25 02:00:00 KST

import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateEmployeeTable20260125020000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Sequence
    await queryRunner.query(
      `CREATE SEQUENCE EMPLOYEE_ID_SEQ START WITH 1 INCREMENT BY 1 NOCACHE`
    );

    // 2. Table
    await queryRunner.createTable(
      new Table({
        name: 'EMPLOYEE',
        columns: [
          {
            name: 'id',
            type: 'NUMBER',
            isPrimary: true,
            default: 'EMPLOYEE_ID_SEQ.NEXTVAL',
          },
          {
            name: 'name',
            type: 'VARCHAR2(50)',
            isNullable: false,
          },
          {
            name: 'username',
            type: 'VARCHAR2(50)',
            isNullable: false,
          },
          {
            name: 'password_hash',
            type: 'VARCHAR2(200)',
            isNullable: false,
          },
          {
            name: 'role',
            type: 'VARCHAR2(20)',
            isNullable: false,
            default: "'USER'",
          },
          {
            name: 'department_id',
            type: 'NUMBER',
            isNullable: true,
          },
          {
            name: 'email',
            type: 'VARCHAR2(100)',
            isNullable: true,
          },
          {
            name: 'position',
            type: 'VARCHAR2(50)',
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
    await queryRunner.query(
      `ALTER TABLE EMPLOYEE ADD CONSTRAINT FK_EMPLOYEE_DEPARTMENT FOREIGN KEY (department_id) REFERENCES DEPARTMENT(id)`
    );

    // 4. Unique Constraint
    await queryRunner.query(
      `ALTER TABLE EMPLOYEE ADD CONSTRAINT UQ_EMPLOYEE_USERNAME UNIQUE (username)`
    );

    // 5. Indexes
    await queryRunner.createIndex(
      'EMPLOYEE',
      new TableIndex({
        name: 'IDX_EMPLOYEE_USERNAME',
        columnNames: ['username'],
        isUnique: true,
      })
    );
    await queryRunner.createIndex(
      'EMPLOYEE',
      new TableIndex({
        name: 'IDX_EMPLOYEE_DELETED_AT',
        columnNames: ['deleted_at'],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('EMPLOYEE', 'IDX_EMPLOYEE_DELETED_AT');
    await queryRunner.dropIndex('EMPLOYEE', 'IDX_EMPLOYEE_USERNAME');
    await queryRunner.query(`ALTER TABLE EMPLOYEE DROP CONSTRAINT UQ_EMPLOYEE_USERNAME`);
    await queryRunner.query(`ALTER TABLE EMPLOYEE DROP CONSTRAINT FK_EMPLOYEE_DEPARTMENT`);
    await queryRunner.dropTable('EMPLOYEE');
    await queryRunner.query(`DROP SEQUENCE EMPLOYEE_ID_SEQ`);
  }
}
