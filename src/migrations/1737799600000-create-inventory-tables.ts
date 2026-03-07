// Generated: 2026-01-26 10:15:00 KST

import { MigrationInterface, QueryRunner } from 'typeorm';

// lowercase columns (quoted raw SQL) — inventory API uses quoted lowercase identifiers
export class CreateInventoryTables20260128000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE SEQUENCE INVENTORY_SEQ START WITH 1 INCREMENT BY 1`);
    await queryRunner.query(`CREATE SEQUENCE INVENTORY_HISTORY_SEQ START WITH 1 INCREMENT BY 1`);

    await queryRunner.query(`
      CREATE TABLE INVENTORY (
        "id" NUMBER DEFAULT INVENTORY_SEQ.NEXTVAL PRIMARY KEY,
        "category" VARCHAR2(50) NOT NULL,
        "model" VARCHAR2(255) NOT NULL,
        "serial_number" VARCHAR2(100) NOT NULL,
        "purchase_date" DATE NOT NULL,
        "purchase_from" VARCHAR2(255) NOT NULL,
        "current_location" VARCHAR2(255) NOT NULL,
        "current_status" VARCHAR2(20) DEFAULT '재고' NOT NULL,
        "notes" CLOB,
        "created_by_id" NUMBER NOT NULL,
        "updated_by_id" NUMBER NOT NULL,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        "deleted_at" TIMESTAMP
      )
    `);

    await queryRunner.query(`
      CREATE TABLE INVENTORY_HISTORY (
        "id" NUMBER DEFAULT INVENTORY_HISTORY_SEQ.NEXTVAL PRIMARY KEY,
        "inventory_id" NUMBER NOT NULL,
        "change_type" VARCHAR2(20) NOT NULL,
        "previous_location" VARCHAR2(255),
        "new_location" VARCHAR2(255),
        "previous_status" VARCHAR2(20),
        "new_status" VARCHAR2(20),
        "checkout_location" VARCHAR2(255),
        "expected_checkin_date" DATE,
        "reason" VARCHAR2(500),
        "changed_by_id" NUMBER NOT NULL,
        "changed_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      )
    `);

    await queryRunner.query(`ALTER TABLE INVENTORY ADD CONSTRAINT CHK_INVENTORY_STATUS CHECK ("current_status" IN ('재고', '출고', '고장', '폐기'))`);
    await queryRunner.query(`ALTER TABLE INVENTORY ADD CONSTRAINT UQ_INVENTORY_SERIAL UNIQUE ("serial_number")`);
    await queryRunner.query(`ALTER TABLE INVENTORY ADD CONSTRAINT FK_INVENTORY_CREATED_BY FOREIGN KEY ("created_by_id") REFERENCES EMPLOYEE(ID)`);
    await queryRunner.query(`ALTER TABLE INVENTORY ADD CONSTRAINT FK_INVENTORY_UPDATED_BY FOREIGN KEY ("updated_by_id") REFERENCES EMPLOYEE(ID)`);
    await queryRunner.query(`ALTER TABLE INVENTORY_HISTORY ADD CONSTRAINT FK_INVENTORY_HISTORY_INV FOREIGN KEY ("inventory_id") REFERENCES INVENTORY("id")`);
    await queryRunner.query(`ALTER TABLE INVENTORY_HISTORY ADD CONSTRAINT FK_INVENTORY_HISTORY_BY FOREIGN KEY ("changed_by_id") REFERENCES EMPLOYEE(ID)`);

    await queryRunner.query(`CREATE INDEX IDX_INVENTORY_STATUS ON INVENTORY("current_status")`);
    await queryRunner.query(`CREATE INDEX IDX_INVENTORY_CATEGORY ON INVENTORY("category")`);
    await queryRunner.query(`CREATE INDEX IDX_INVENTORY_LOCATION ON INVENTORY("current_location")`);
    await queryRunner.query(`CREATE INDEX IDX_INVENTORY_MODEL ON INVENTORY("model")`);
    await queryRunner.query(`CREATE INDEX IDX_INVENTORY_CREATED_AT ON INVENTORY("created_at")`);
    await queryRunner.query(`CREATE INDEX IDX_INVENTORY_DELETED_AT ON INVENTORY("deleted_at")`);
    await queryRunner.query(`CREATE INDEX IDX_INVENTORY_HISTORY_INV ON INVENTORY_HISTORY("inventory_id")`);
    await queryRunner.query(`CREATE INDEX IDX_INVENTORY_HISTORY_AT ON INVENTORY_HISTORY("changed_at")`);
    await queryRunner.query(`CREATE INDEX IDX_INVENTORY_HISTORY_TYPE ON INVENTORY_HISTORY("change_type")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IDX_INVENTORY_HISTORY_TYPE`);
    await queryRunner.query(`DROP INDEX IDX_INVENTORY_HISTORY_AT`);
    await queryRunner.query(`DROP INDEX IDX_INVENTORY_HISTORY_INV`);
    await queryRunner.query(`DROP INDEX IDX_INVENTORY_DELETED_AT`);
    await queryRunner.query(`DROP INDEX IDX_INVENTORY_CREATED_AT`);
    await queryRunner.query(`DROP INDEX IDX_INVENTORY_MODEL`);
    await queryRunner.query(`DROP INDEX IDX_INVENTORY_LOCATION`);
    await queryRunner.query(`DROP INDEX IDX_INVENTORY_CATEGORY`);
    await queryRunner.query(`DROP INDEX IDX_INVENTORY_STATUS`);
    await queryRunner.query(`ALTER TABLE INVENTORY_HISTORY DROP CONSTRAINT FK_INVENTORY_HISTORY_BY`);
    await queryRunner.query(`ALTER TABLE INVENTORY_HISTORY DROP CONSTRAINT FK_INVENTORY_HISTORY_INV`);
    await queryRunner.query(`ALTER TABLE INVENTORY DROP CONSTRAINT FK_INVENTORY_UPDATED_BY`);
    await queryRunner.query(`ALTER TABLE INVENTORY DROP CONSTRAINT FK_INVENTORY_CREATED_BY`);
    await queryRunner.query(`DROP TABLE INVENTORY_HISTORY`);
    await queryRunner.query(`DROP SEQUENCE INVENTORY_HISTORY_SEQ`);
    await queryRunner.query(`DROP TABLE INVENTORY`);
    await queryRunner.query(`DROP SEQUENCE INVENTORY_SEQ`);
  }
}
