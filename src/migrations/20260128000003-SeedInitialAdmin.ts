// Generated: 2026-01-28 00:03:00 KST

import { MigrationInterface, QueryRunner } from 'typeorm';

// Seeds initial admin department, position, employee, and account
// Default credentials: admin / Admin123!
export class SeedInitialAdmin20260128000003 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const now = new Date().toISOString().replace('T', ' ').replace(/\.\d+Z$/, '');

    // 1. Create default department
    await queryRunner.query(`
      INSERT INTO DEPARTMENT (NAME, CODE, DESCRIPTION, CREATED_AT, UPDATED_AT)
      VALUES ('관리부', 'ADMIN-DEPT', '시스템 관리 부서', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);

    // 2. Create default position
    const posCode = 'POS-00001';
    await queryRunner.query(`SELECT POSITION_CODE_SEQ.NEXTVAL FROM DUAL`);
    await queryRunner.query(`
      INSERT INTO POSITION (NAME, CODE, LVL, CREATED_AT, UPDATED_AT)
      VALUES ('관리자', '${posCode}', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);

    // 3. Create admin employee (no created_by_id/updated_by_id for bootstrap)
    await queryRunner.query(`
      INSERT INTO EMPLOYEE (NAME, EMAIL, DEPARTMENT_ID, POSITION_ID, HIRED_AT, CREATED_AT, UPDATED_AT)
      SELECT '시스템관리자', 'admin@sunjin.co.kr', d.ID, p.ID, SYSDATE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      FROM DEPARTMENT d, POSITION p
      WHERE d.CODE = 'ADMIN-DEPT' AND p.CODE = '${posCode}'
    `);

    // 4. Create admin account (password: Admin123!)
    await queryRunner.query(`
      INSERT INTO ACCOUNT (EMPLOYEE_ID, USERNAME, PASSWORD_HASH, ROLE, IS_ACTIVE, PASSWORD_CHANGED_AT, CREATED_AT, UPDATED_AT)
      SELECT e.ID, 'admin', '$2b$10$itBXSpvN.5WBmS/2lbHa5O9J05L1ZA3jW6yri6U1zdUtUnjaBUpce', 'ADMIN', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      FROM EMPLOYEE e WHERE e.EMAIL = 'admin@sunjin.co.kr'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM ACCOUNT WHERE USERNAME = 'admin'`);
    await queryRunner.query(`DELETE FROM EMPLOYEE WHERE EMAIL = 'admin@sunjin.co.kr'`);
    await queryRunner.query(`DELETE FROM POSITION WHERE CODE = 'POS-00001'`);
    await queryRunner.query(`DELETE FROM DEPARTMENT WHERE CODE = 'ADMIN-DEPT'`);
  }
}
