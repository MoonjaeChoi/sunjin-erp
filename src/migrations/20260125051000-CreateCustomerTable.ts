// Generated: 2026-01-25 05:10:00 KST

import { MigrationInterface, QueryRunner } from 'typeorm';

// lowercase columns (quoted raw SQL) — customer API uses quoted lowercase identifiers
export class CreateCustomerTable20260125051000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE SEQUENCE CUSTOMER_ID_SEQ START WITH 1 INCREMENT BY 1 NOCACHE`);

    await queryRunner.query(`
      CREATE TABLE CUSTOMER (
        "id" NUMBER DEFAULT CUSTOMER_ID_SEQ.NEXTVAL PRIMARY KEY,
        "name" VARCHAR2(100) NOT NULL,
        "category" VARCHAR2(20) NOT NULL,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        "deleted_at" TIMESTAMP
      )
    `);

    await queryRunner.query(`ALTER TABLE CUSTOMER ADD CONSTRAINT UQ_CUSTOMER_NAME UNIQUE ("name")`);
    await queryRunner.query(`CREATE INDEX IDX_CUSTOMER_DELETED_AT ON CUSTOMER("deleted_at")`);
    await queryRunner.query(`CREATE INDEX IDX_CUSTOMER_CATEGORY ON CUSTOMER("category")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IDX_CUSTOMER_CATEGORY`);
    await queryRunner.query(`DROP INDEX IDX_CUSTOMER_DELETED_AT`);
    await queryRunner.query(`DROP TABLE CUSTOMER`);
    await queryRunner.query(`DROP SEQUENCE CUSTOMER_ID_SEQ`);
  }
}
