// Generated: 2026-01-25 08:30:00 KST

import { MigrationInterface, QueryRunner } from 'typeorm';

// lowercase columns (quoted raw SQL) — project API uses quoted lowercase identifiers
export class CreateProjectTable20260125083000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE SEQUENCE PROJECT_ID_SEQ START WITH 1 INCREMENT BY 1`);
    await queryRunner.query(`CREATE SEQUENCE PROJECT_CODE_SEQ START WITH 1 INCREMENT BY 1`);
    await queryRunner.query(`CREATE SEQUENCE PROJECT_ATTACHMENT_ID_SEQ START WITH 1 INCREMENT BY 1`);

    await queryRunner.query(`
      CREATE TABLE PROJECT (
        "id" NUMBER DEFAULT PROJECT_ID_SEQ.NEXTVAL PRIMARY KEY,
        "project_code" VARCHAR2(30),
        "project_name" VARCHAR2(200) NOT NULL,
        "customer_id" NUMBER NOT NULL,
        "employee_id" NUMBER NOT NULL,
        "status" VARCHAR2(20) DEFAULT 'PREPARING' NOT NULL,
        "start_date" DATE,
        "end_date" DATE,
        "contract_amount" NUMBER,
        "description" CLOB,
        "stage_meeting_at" TIMESTAMP,
        "stage_proposal_at" TIMESTAMP,
        "stage_quotation_at" TIMESTAMP,
        "stage_contract_at" TIMESTAMP,
        "stage_kickoff_at" TIMESTAMP,
        "stage_development_at" TIMESTAMP,
        "stage_delivery_at" TIMESTAMP,
        "stage_handover_at" TIMESTAMP,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        "deleted_at" TIMESTAMP
      )
    `);

    await queryRunner.query(`
      CREATE TABLE PROJECT_ATTACHMENT (
        "id" NUMBER DEFAULT PROJECT_ATTACHMENT_ID_SEQ.NEXTVAL PRIMARY KEY,
        "project_id" NUMBER NOT NULL,
        "file_path" VARCHAR2(500) NOT NULL,
        "file_name" VARCHAR2(200) NOT NULL,
        "file_size" NUMBER NOT NULL,
        "category" VARCHAR2(20) NOT NULL,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      )
    `);

    await queryRunner.query(`ALTER TABLE PROJECT ADD CONSTRAINT FK_PROJECT_CUSTOMER FOREIGN KEY ("customer_id") REFERENCES CUSTOMER("id")`);
    await queryRunner.query(`ALTER TABLE PROJECT ADD CONSTRAINT FK_PROJECT_EMPLOYEE FOREIGN KEY ("employee_id") REFERENCES EMPLOYEE(ID)`);
    await queryRunner.query(`ALTER TABLE PROJECT_ATTACHMENT ADD CONSTRAINT FK_ATTACH_PROJECT FOREIGN KEY ("project_id") REFERENCES PROJECT("id")`);

    await queryRunner.query(`ALTER TABLE PROJECT ADD CONSTRAINT CHK_PROJECT_STATUS CHECK ("status" IN ('PREPARING', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD'))`);
    await queryRunner.query(`ALTER TABLE PROJECT ADD CONSTRAINT CHK_PROJECT_DATE_ORDER CHECK ("start_date" IS NULL OR "end_date" IS NULL OR "start_date" <= "end_date")`);
    await queryRunner.query(`ALTER TABLE PROJECT_ATTACHMENT ADD CONSTRAINT CHK_ATTACH_CATEGORY CHECK ("category" IN ('CONTRACT', 'PROPOSAL', 'QUOTATION', 'REPORT', 'OTHER'))`);

    await queryRunner.query(`CREATE INDEX IDX_PROJECT_CUSTOMER ON PROJECT("customer_id")`);
    await queryRunner.query(`CREATE INDEX IDX_PROJECT_EMPLOYEE ON PROJECT("employee_id")`);
    await queryRunner.query(`CREATE INDEX IDX_PROJECT_STATUS ON PROJECT("status")`);
    await queryRunner.query(`CREATE UNIQUE INDEX IDX_PROJECT_CODE ON PROJECT("project_code")`);
    await queryRunner.query(`CREATE INDEX IDX_PROJECT_DELETED_AT ON PROJECT("deleted_at")`);
    await queryRunner.query(`CREATE INDEX IDX_PROJECT_ATTACH_PROJECT ON PROJECT_ATTACHMENT("project_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IDX_PROJECT_ATTACH_PROJECT`);
    await queryRunner.query(`DROP INDEX IDX_PROJECT_DELETED_AT`);
    await queryRunner.query(`DROP INDEX IDX_PROJECT_CODE`);
    await queryRunner.query(`DROP INDEX IDX_PROJECT_STATUS`);
    await queryRunner.query(`DROP INDEX IDX_PROJECT_EMPLOYEE`);
    await queryRunner.query(`DROP INDEX IDX_PROJECT_CUSTOMER`);
    await queryRunner.query(`ALTER TABLE PROJECT_ATTACHMENT DROP CONSTRAINT FK_ATTACH_PROJECT`);
    await queryRunner.query(`ALTER TABLE PROJECT DROP CONSTRAINT FK_PROJECT_EMPLOYEE`);
    await queryRunner.query(`ALTER TABLE PROJECT DROP CONSTRAINT FK_PROJECT_CUSTOMER`);
    await queryRunner.query(`DROP TABLE PROJECT_ATTACHMENT`);
    await queryRunner.query(`DROP TABLE PROJECT`);
    await queryRunner.query(`DROP SEQUENCE PROJECT_ATTACHMENT_ID_SEQ`);
    await queryRunner.query(`DROP SEQUENCE PROJECT_CODE_SEQ`);
    await queryRunner.query(`DROP SEQUENCE PROJECT_ID_SEQ`);
  }
}
