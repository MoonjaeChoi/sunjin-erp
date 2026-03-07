// Generated: 2026-01-24 00:00:00 KST

import { MigrationInterface, QueryRunner } from 'typeorm';

// UPPERCASE columns (raw SQL) — departments/positions APIs use unquoted uppercase identifiers
// Also creates POSITION table here since EMPLOYEE migration depends on it
export class CreateDepartmentTable20260125010000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // DEPARTMENT
    await queryRunner.query(`CREATE SEQUENCE DEPARTMENT_ID_SEQ START WITH 1 INCREMENT BY 1 NOCACHE`);
    await queryRunner.query(`
      CREATE TABLE DEPARTMENT (
        ID NUMBER DEFAULT DEPARTMENT_ID_SEQ.NEXTVAL PRIMARY KEY,
        NAME VARCHAR2(100) NOT NULL,
        CODE VARCHAR2(20) NOT NULL,
        DESCRIPTION VARCHAR2(500),
        PARENT_DEPARTMENT_ID NUMBER,
        CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        UPDATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        DELETED_AT TIMESTAMP
      )
    `);
    await queryRunner.query(`ALTER TABLE DEPARTMENT ADD CONSTRAINT UQ_DEPT_CODE UNIQUE (CODE)`);
    await queryRunner.query(`CREATE INDEX IDX_DEPARTMENT_DELETED_AT ON DEPARTMENT(DELETED_AT)`);

    // POSITION (must exist before EMPLOYEE migration)
    await queryRunner.query(`CREATE SEQUENCE POSITION_ID_SEQ START WITH 1 INCREMENT BY 1 NOCACHE`);
    await queryRunner.query(`CREATE SEQUENCE POSITION_CODE_SEQ START WITH 1 INCREMENT BY 1 NOCACHE`);
    await queryRunner.query(`
      CREATE TABLE POSITION (
        ID NUMBER DEFAULT POSITION_ID_SEQ.NEXTVAL PRIMARY KEY,
        NAME VARCHAR2(100) NOT NULL,
        CODE VARCHAR2(20) NOT NULL,
        LVL NUMBER NOT NULL,
        CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        UPDATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        DELETED_AT TIMESTAMP
      )
    `);
    await queryRunner.query(`ALTER TABLE POSITION ADD CONSTRAINT UQ_POSITION_NAME UNIQUE (NAME)`);
    await queryRunner.query(`ALTER TABLE POSITION ADD CONSTRAINT UQ_POSITION_CODE UNIQUE (CODE)`);
    await queryRunner.query(`ALTER TABLE POSITION ADD CONSTRAINT CHK_POSITION_LVL CHECK (LVL >= 1 AND LVL <= 10)`);
    await queryRunner.query(`CREATE INDEX IDX_POSITION_DELETED_AT ON POSITION(DELETED_AT)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IDX_POSITION_DELETED_AT`);
    await queryRunner.query(`DROP TABLE POSITION`);
    await queryRunner.query(`DROP SEQUENCE POSITION_CODE_SEQ`);
    await queryRunner.query(`DROP SEQUENCE POSITION_ID_SEQ`);
    await queryRunner.query(`DROP INDEX IDX_DEPARTMENT_DELETED_AT`);
    await queryRunner.query(`DROP TABLE DEPARTMENT`);
    await queryRunner.query(`DROP SEQUENCE DEPARTMENT_ID_SEQ`);
  }
}
