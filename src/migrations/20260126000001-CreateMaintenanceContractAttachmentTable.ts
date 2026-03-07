// Generated: 2026-01-26 00:01:00 KST

import { MigrationInterface, QueryRunner } from 'typeorm';

// lowercase columns (quoted raw SQL) — maintenance attachment API uses quoted lowercase identifiers
export class CreateMaintenanceContractAttachmentTable20260126000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE SEQUENCE SEQ_MC_ATTACHMENT START WITH 1 INCREMENT BY 1 NOCACHE`);

    await queryRunner.query(`
      CREATE TABLE MAINTENANCE_CONTRACT_ATTACHMENT (
        "id" NUMBER DEFAULT SEQ_MC_ATTACHMENT.NEXTVAL PRIMARY KEY,
        "maintenance_contract_id" NUMBER NOT NULL,
        "file_name" VARCHAR2(255) NOT NULL,
        "file_path" VARCHAR2(512) NOT NULL,
        "file_size" NUMBER NOT NULL,
        "uploaded_by_id" NUMBER NOT NULL,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        "deleted_at" TIMESTAMP
      )
    `);

    await queryRunner.query(`ALTER TABLE MAINTENANCE_CONTRACT_ATTACHMENT ADD CONSTRAINT FK_MCA_CONTRACT FOREIGN KEY ("maintenance_contract_id") REFERENCES MAINTENANCE_CONTRACT("id")`);
    await queryRunner.query(`ALTER TABLE MAINTENANCE_CONTRACT_ATTACHMENT ADD CONSTRAINT FK_MCA_UPLOADED_BY FOREIGN KEY ("uploaded_by_id") REFERENCES EMPLOYEE(ID)`);

    await queryRunner.query(`CREATE INDEX IDX_MCA_CONTRACT_ID ON MAINTENANCE_CONTRACT_ATTACHMENT("maintenance_contract_id")`);
    await queryRunner.query(`CREATE INDEX IDX_MCA_UPLOADED_BY_ID ON MAINTENANCE_CONTRACT_ATTACHMENT("uploaded_by_id")`);
    await queryRunner.query(`CREATE INDEX IDX_MCA_DELETED_AT ON MAINTENANCE_CONTRACT_ATTACHMENT("deleted_at")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IDX_MCA_DELETED_AT`);
    await queryRunner.query(`DROP INDEX IDX_MCA_UPLOADED_BY_ID`);
    await queryRunner.query(`DROP INDEX IDX_MCA_CONTRACT_ID`);
    await queryRunner.query(`ALTER TABLE MAINTENANCE_CONTRACT_ATTACHMENT DROP CONSTRAINT FK_MCA_UPLOADED_BY`);
    await queryRunner.query(`ALTER TABLE MAINTENANCE_CONTRACT_ATTACHMENT DROP CONSTRAINT FK_MCA_CONTRACT`);
    await queryRunner.query(`DROP TABLE MAINTENANCE_CONTRACT_ATTACHMENT`);
    await queryRunner.query(`DROP SEQUENCE SEQ_MC_ATTACHMENT`);
  }
}
