// Generated: 2026-01-24 23:00:00 KST

import { MigrationInterface, QueryRunner } from 'typeorm';

// lowercase columns (quoted raw SQL) — task API uses quoted lowercase identifiers
export class CreateTaskTable20260124230000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE SEQUENCE TASK_ID_SEQ START WITH 1 INCREMENT BY 1 NOCACHE`);

    await queryRunner.query(`
      CREATE TABLE TASK (
        "id" NUMBER DEFAULT TASK_ID_SEQ.NEXTVAL PRIMARY KEY,
        "title" VARCHAR2(200) NOT NULL,
        "description" CLOB,
        "task_date" DATE NOT NULL,
        "start_time" NUMBER,
        "end_time" NUMBER,
        "task_type" VARCHAR2(20) NOT NULL,
        "work_type" VARCHAR2(10) NOT NULL,
        "status" VARCHAR2(20) DEFAULT 'READY' NOT NULL,
        "employee_id" NUMBER NOT NULL,
        "customer_id" NUMBER,
        "completed_at" TIMESTAMP,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        "deleted_at" TIMESTAMP
      )
    `);

    await queryRunner.query(`ALTER TABLE TASK ADD CONSTRAINT CHK_TASK_START_TIME CHECK ("start_time" IS NULL OR ("start_time" >= 0 AND "start_time" <= 1439))`);
    await queryRunner.query(`ALTER TABLE TASK ADD CONSTRAINT CHK_TASK_END_TIME CHECK ("end_time" IS NULL OR ("end_time" >= 0 AND "end_time" <= 1439))`);
    await queryRunner.query(`ALTER TABLE TASK ADD CONSTRAINT CHK_TASK_TIME_ORDER CHECK (("start_time" IS NULL OR "end_time" IS NULL) OR "start_time" < "end_time")`);

    await queryRunner.query(`CREATE INDEX IDX_TASK_DATE_EMPLOYEE ON TASK("task_date", "employee_id")`);
    await queryRunner.query(`CREATE INDEX IDX_TASK_EMPLOYEE_DATE ON TASK("employee_id", "task_date", "deleted_at")`);
    await queryRunner.query(`CREATE INDEX IDX_TASK_EMPLOYEE_STATUS ON TASK("employee_id", "status")`);
    await queryRunner.query(`CREATE INDEX IDX_TASK_DELETED_AT ON TASK("deleted_at")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IDX_TASK_DELETED_AT`);
    await queryRunner.query(`DROP INDEX IDX_TASK_EMPLOYEE_STATUS`);
    await queryRunner.query(`DROP INDEX IDX_TASK_EMPLOYEE_DATE`);
    await queryRunner.query(`DROP INDEX IDX_TASK_DATE_EMPLOYEE`);
    await queryRunner.query(`DROP TABLE TASK`);
    await queryRunner.query(`DROP SEQUENCE TASK_ID_SEQ`);
  }
}
