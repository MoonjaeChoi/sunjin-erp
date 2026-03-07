// Generated: 2026-01-27 23:00:00 KST

import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
  TableForeignKey,
  TableColumn,
} from 'typeorm';

export class UpdateCustomerAndCreateContactHistoryTables20260127230000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Sequence 생성 (고객 코드 자동 생성)
    await queryRunner.query(`
      CREATE SEQUENCE CUST_CODE_SEQ
      INCREMENT BY 1
      START WITH 1
      CACHE 20
      NOCYCLE
    `);

    // 2. CUSTOMER 테이블 업데이트 (새 칼럼 추가)
    // 기존 칼럼: id, name, category, created_at, updated_at, deleted_at
    // 추가할 칼럼: code, classification, address, phone, email, memo, created_by_id, updated_by_id

    await queryRunner.addColumn(
      'CUSTOMER',
      new TableColumn({
        name: 'code',
        type: 'VARCHAR2(20)',
        isNullable: true, // 초기에는 null, 마이그레이션 후 NOT NULL로 변경
      })
    );

    await queryRunner.addColumn(
      'CUSTOMER',
      new TableColumn({
        name: 'classification',
        type: 'VARCHAR2(20)',
        isNullable: true,
      })
    );

    await queryRunner.addColumn(
      'CUSTOMER',
      new TableColumn({
        name: 'address',
        type: 'VARCHAR2(500)',
        isNullable: true,
      })
    );

    await queryRunner.addColumn(
      'CUSTOMER',
      new TableColumn({
        name: 'phone',
        type: 'VARCHAR2(20)',
        isNullable: true,
      })
    );

    await queryRunner.addColumn(
      'CUSTOMER',
      new TableColumn({
        name: 'email',
        type: 'VARCHAR2(100)',
        isNullable: true,
      })
    );

    await queryRunner.addColumn(
      'CUSTOMER',
      new TableColumn({
        name: 'memo',
        type: 'CLOB',
        isNullable: true,
      })
    );

    await queryRunner.addColumn(
      'CUSTOMER',
      new TableColumn({
        name: 'created_by_id',
        type: 'NUMBER',
        isNullable: true, // 기존 데이터 마이그레이션 후 NOT NULL로 변경
      })
    );

    await queryRunner.addColumn(
      'CUSTOMER',
      new TableColumn({
        name: 'updated_by_id',
        type: 'NUMBER',
        isNullable: true,
      })
    );

    // 3. 기존 category 데이터를 classification으로 복사
    await queryRunner.query(`
      UPDATE CUSTOMER
      SET classification = category,
          code = 'CUST-' || LPAD(id, 5, '0')
      WHERE classification IS NULL
    `);

    // 4. CUSTOMER_CONTACT 테이블 생성
    await queryRunner.createTable(
      new Table({
        name: 'CUSTOMER_CONTACT',
        columns: [
          {
            name: 'id',
            type: 'NUMBER',
            isPrimary: true,
            generationStrategy: 'increment',
            isGenerated: true,
          },
          {
            name: 'customer_id',
            type: 'NUMBER',
            isNullable: false,
          },
          {
            name: 'name',
            type: 'VARCHAR2(100)',
            isNullable: false,
          },
          {
            name: 'title',
            type: 'VARCHAR2(50)',
            isNullable: false,
          },
          {
            name: 'department',
            type: 'VARCHAR2(50)',
            isNullable: true,
          },
          {
            name: 'email',
            type: 'VARCHAR2(100)',
            isNullable: false,
          },
          {
            name: 'phone',
            type: 'VARCHAR2(20)',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'VARCHAR2(200)',
            isNullable: true,
          },
          {
            name: 'primary_contact',
            type: 'NUMBER',
            default: 0,
            isNullable: false,
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

    // 5. CUSTOMER_HISTORY 테이블 생성
    await queryRunner.createTable(
      new Table({
        name: 'CUSTOMER_HISTORY',
        columns: [
          {
            name: 'id',
            type: 'NUMBER',
            isPrimary: true,
            generationStrategy: 'increment',
            isGenerated: true,
          },
          {
            name: 'customer_id',
            type: 'NUMBER',
            isNullable: false,
          },
          {
            name: 'change_type',
            type: 'VARCHAR2(20)',
            isNullable: false,
          },
          {
            name: 'changed_fields',
            type: 'CLOB',
            isNullable: false,
          },
          {
            name: 'changed_by_id',
            type: 'NUMBER',
            isNullable: false,
          },
          {
            name: 'changed_at',
            type: 'TIMESTAMP',
            isNullable: false,
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    );

    // 6. Foreign Key 제약 조건 추가 (CUSTOMER → EMPLOYEE)
    await queryRunner.createForeignKey(
      'CUSTOMER',
      new TableForeignKey({
        name: 'fk_customer_created_by',
        columnNames: ['created_by_id'],
        referencedTableName: 'EMPLOYEE',
        referencedColumnNames: ['id'],
      })
    );

    await queryRunner.createForeignKey(
      'CUSTOMER',
      new TableForeignKey({
        name: 'fk_customer_updated_by',
        columnNames: ['updated_by_id'],
        referencedTableName: 'EMPLOYEE',
        referencedColumnNames: ['id'],
      })
    );

    // 7. Foreign Key 제약 조건 추가 (CUSTOMER_CONTACT → CUSTOMER)
    await queryRunner.createForeignKey(
      'CUSTOMER_CONTACT',
      new TableForeignKey({
        name: 'fk_contact_customer',
        columnNames: ['customer_id'],
        referencedTableName: 'CUSTOMER',
        referencedColumnNames: ['id'],
      })
    );

    // 8. Foreign Key 제약 조건 추가 (CUSTOMER_HISTORY → CUSTOMER)
    await queryRunner.createForeignKey(
      'CUSTOMER_HISTORY',
      new TableForeignKey({
        name: 'fk_history_customer',
        columnNames: ['customer_id'],
        referencedTableName: 'CUSTOMER',
        referencedColumnNames: ['id'],
      })
    );

    // 9. Foreign Key 제약 조건 추가 (CUSTOMER_HISTORY → EMPLOYEE)
    await queryRunner.createForeignKey(
      'CUSTOMER_HISTORY',
      new TableForeignKey({
        name: 'fk_history_changed_by',
        columnNames: ['changed_by_id'],
        referencedTableName: 'EMPLOYEE',
        referencedColumnNames: ['id'],
      })
    );

    // 10. 인덱스 생성 (CUSTOMER_CONTACT)
    await queryRunner.createIndex(
      'CUSTOMER_CONTACT',
      new TableIndex({
        name: 'idx_contact_customer_id',
        columnNames: ['customer_id'],
      })
    );

    await queryRunner.createIndex(
      'CUSTOMER_CONTACT',
      new TableIndex({
        name: 'idx_contact_deleted_at',
        columnNames: ['deleted_at'],
      })
    );

    // 11. 인덱스 생성 (CUSTOMER_HISTORY)
    await queryRunner.createIndex(
      'CUSTOMER_HISTORY',
      new TableIndex({
        name: 'idx_history_customer_id',
        columnNames: ['customer_id'],
      })
    );

    await queryRunner.createIndex(
      'CUSTOMER_HISTORY',
      new TableIndex({
        name: 'idx_history_changed_at',
        columnNames: ['changed_at'],
      })
    );

    await queryRunner.createIndex(
      'CUSTOMER_HISTORY',
      new TableIndex({
        name: 'idx_history_customer_changed',
        columnNames: ['customer_id', 'changed_at'],
      })
    );

    // 12. 부분 유니크 인덱스 생성 (CUSTOMER name - soft delete 제외)
    await queryRunner.query(`
      CREATE UNIQUE INDEX idx_customer_name_soft_delete
      ON CUSTOMER("name")
      WHERE deleted_at IS NULL
    `);

    // 13. 부분 유니크 인덱스 생성 (CUSTOMER_CONTACT primary_contact - 고객당 max 1)
    await queryRunner.query(`
      CREATE UNIQUE INDEX idx_contact_primary_soft_delete
      ON CUSTOMER_CONTACT("customer_id")
      WHERE primary_contact = 1 AND deleted_at IS NULL
    `);

    // 14. Check 제약 조건 추가
    await queryRunner.query(`
      ALTER TABLE CUSTOMER_HISTORY
      ADD CONSTRAINT ck_history_change_type
      CHECK (change_type IN ('CREATE', 'UPDATE', 'DELETE', 'CONTACT_ADD', 'CONTACT_DELETE'))
    `);

    await queryRunner.query(`
      ALTER TABLE CUSTOMER
      ADD CONSTRAINT ck_customer_classification
      CHECK (classification IN ('RESELLER', 'END_USER', 'MAINTENANCE', 'GENERAL'))
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 역순으로 롤백

    // 1. Check 제약 조건 제거
    await queryRunner.query(`
      ALTER TABLE CUSTOMER
      DROP CONSTRAINT ck_customer_classification
    `);

    await queryRunner.query(`
      ALTER TABLE CUSTOMER_HISTORY
      DROP CONSTRAINT ck_history_change_type
    `);

    // 2. 부분 유니크 인덱스 제거
    await queryRunner.dropIndex('CUSTOMER_CONTACT', 'idx_contact_primary_soft_delete');
    await queryRunner.dropIndex('CUSTOMER', 'idx_customer_name_soft_delete');

    // 3. 인덱스 제거
    await queryRunner.dropIndex('CUSTOMER_HISTORY', 'idx_history_customer_changed');
    await queryRunner.dropIndex('CUSTOMER_HISTORY', 'idx_history_changed_at');
    await queryRunner.dropIndex('CUSTOMER_HISTORY', 'idx_history_customer_id');

    await queryRunner.dropIndex('CUSTOMER_CONTACT', 'idx_contact_deleted_at');
    await queryRunner.dropIndex('CUSTOMER_CONTACT', 'idx_contact_customer_id');

    // 4. Foreign Key 제약 조건 제거
    await queryRunner.dropForeignKey('CUSTOMER_HISTORY', 'fk_history_changed_by');
    await queryRunner.dropForeignKey('CUSTOMER_HISTORY', 'fk_history_customer');
    await queryRunner.dropForeignKey('CUSTOMER_CONTACT', 'fk_contact_customer');
    await queryRunner.dropForeignKey('CUSTOMER', 'fk_customer_updated_by');
    await queryRunner.dropForeignKey('CUSTOMER', 'fk_customer_created_by');

    // 5. 테이블 제거
    await queryRunner.dropTable('CUSTOMER_HISTORY');
    await queryRunner.dropTable('CUSTOMER_CONTACT');

    // 6. CUSTOMER 테이블에서 새 칼럼 제거
    await queryRunner.dropColumn('CUSTOMER', 'updated_by_id');
    await queryRunner.dropColumn('CUSTOMER', 'created_by_id');
    await queryRunner.dropColumn('CUSTOMER', 'memo');
    await queryRunner.dropColumn('CUSTOMER', 'email');
    await queryRunner.dropColumn('CUSTOMER', 'phone');
    await queryRunner.dropColumn('CUSTOMER', 'address');
    await queryRunner.dropColumn('CUSTOMER', 'classification');
    await queryRunner.dropColumn('CUSTOMER', 'code');

    // 7. Sequence 제거
    await queryRunner.query(`DROP SEQUENCE CUST_CODE_SEQ`);
  }
}
