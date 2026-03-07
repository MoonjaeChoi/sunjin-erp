// Generated: 2026-01-25 05:30:00 KST

import { MigrationInterface, QueryRunner } from 'typeorm';

// lowercase columns (quoted raw SQL) — support API uses quoted lowercase identifiers
export class CreateTechSupportTable20260125053000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE SEQUENCE TECH_SUPPORT_ID_SEQ START WITH 1 INCREMENT BY 1 NOCACHE`);

    await queryRunner.query(`
      CREATE TABLE TECH_SUPPORT (
        "id" NUMBER DEFAULT TECH_SUPPORT_ID_SEQ.NEXTVAL PRIMARY KEY,
        "title" VARCHAR2(200) NOT NULL,
        "description" CLOB,
        "support_date" DATE NOT NULL,
        "start_time" NUMBER,
        "end_time" NUMBER,
        "support_type" VARCHAR2(20) NOT NULL,
        "support_method" VARCHAR2(20),
        "status" VARCHAR2(20) DEFAULT 'RECEIVED' NOT NULL,
        "employee_id" NUMBER NOT NULL,
        "customer_id" NUMBER NOT NULL,
        "attachment_path" VARCHAR2(500),
        "attachment_name" VARCHAR2(200),
        "completed_at" TIMESTAMP,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        "deleted_at" TIMESTAMP
      )
    `);

    await queryRunner.query(`ALTER TABLE TECH_SUPPORT ADD CONSTRAINT CHK_TS_START_TIME CHECK ("start_time" IS NULL OR ("start_time" >= 0 AND "start_time" <= 1439))`);
    await queryRunner.query(`ALTER TABLE TECH_SUPPORT ADD CONSTRAINT CHK_TS_END_TIME CHECK ("end_time" IS NULL OR ("end_time" >= 0 AND "end_time" <= 1439))`);
    await queryRunner.query(`ALTER TABLE TECH_SUPPORT ADD CONSTRAINT CHK_TS_TIME_ORDER CHECK (("start_time" IS NULL OR "end_time" IS NULL) OR "start_time" < "end_time")`);
    await queryRunner.query(`ALTER TABLE TECH_SUPPORT ADD CONSTRAINT FK_TS_EMPLOYEE FOREIGN KEY ("employee_id") REFERENCES EMPLOYEE(ID)`);
    await queryRunner.query(`ALTER TABLE TECH_SUPPORT ADD CONSTRAINT FK_TS_CUSTOMER FOREIGN KEY ("customer_id") REFERENCES CUSTOMER("id")`);

    await queryRunner.query(`CREATE INDEX IDX_TECHSUPPORT_DATE_EMPLOYEE ON TECH_SUPPORT("support_date", "employee_id")`);
    await queryRunner.query(`CREATE INDEX IDX_TECHSUPPORT_CUSTOMER ON TECH_SUPPORT("customer_id")`);
    await queryRunner.query(`CREATE INDEX IDX_TECHSUPPORT_STATUS ON TECH_SUPPORT("status")`);
    await queryRunner.query(`CREATE INDEX IDX_TECHSUPPORT_DELETED_AT ON TECH_SUPPORT("deleted_at")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IDX_TECHSUPPORT_DELETED_AT`);
    await queryRunner.query(`DROP INDEX IDX_TECHSUPPORT_STATUS`);
    await queryRunner.query(`DROP INDEX IDX_TECHSUPPORT_CUSTOMER`);
    await queryRunner.query(`DROP INDEX IDX_TECHSUPPORT_DATE_EMPLOYEE`);
    await queryRunner.query(`ALTER TABLE TECH_SUPPORT DROP CONSTRAINT FK_TS_CUSTOMER`);
    await queryRunner.query(`ALTER TABLE TECH_SUPPORT DROP CONSTRAINT FK_TS_EMPLOYEE`);
    await queryRunner.query(`DROP TABLE TECH_SUPPORT`);
    await queryRunner.query(`DROP SEQUENCE TECH_SUPPORT_ID_SEQ`);
  }
}
