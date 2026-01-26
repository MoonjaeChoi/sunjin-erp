// Generated: 2026-01-26 18:00:00 KST

const oracledb = require('oracledb');

async function initMaintenanceTables() {
  let conn;

  try {
    console.log('데이터베이스에 연결 중...');
    conn = await oracledb.getConnection({
      user: process.env.ORACLE_USERNAME || 'sunjin_admin',
      password: process.env.ORACLE_PASSWORD || 'sunjin1234',
      connectString: `${process.env.ORACLE_HOST || '192.168.75.194'}:${process.env.ORACLE_PORT || 1521}/${process.env.ORACLE_SERVICE_NAME || 'XEPDB1'}`,
    });

    console.log('유지보수 관련 테이블을 생성 중...\n');

    // 1. MAINTENANCE_CONTRACTS 테이블
    try {
      await conn.execute('CREATE TABLE maintenance_contracts (id NUMBER PRIMARY KEY, customer_id NUMBER NOT NULL, contract_name VARCHAR2(255) NOT NULL, contract_type VARCHAR2(100) NOT NULL, start_date DATE NOT NULL, end_date DATE NOT NULL, assigned_employee_id NUMBER NOT NULL, contract_amount NUMBER(15, 2), contract_status VARCHAR2(50) NOT NULL, notes CLOB, created_at DATE NOT NULL, updated_at DATE NOT NULL, created_by_id NUMBER, updated_by_id NUMBER, deleted_at DATE)');
      console.log('✓ MAINTENANCE_CONTRACTS 테이블 생성됨');
    } catch (e) {
      if (e.errorNum === 955) {
        console.log('✓ MAINTENANCE_CONTRACTS 테이블 (이미 존재)');
      } else {
        throw e;
      }
    }

    // 1-1. 외래 키 추가
    try {
      await conn.execute('ALTER TABLE maintenance_contracts ADD CONSTRAINT fk_maintenance_customer FOREIGN KEY (customer_id) REFERENCES customer(id) ON DELETE RESTRICT');
    } catch (e) {
      // 이미 있으면 무시
    }

    try {
      await conn.execute('ALTER TABLE maintenance_contracts ADD CONSTRAINT fk_maintenance_employee FOREIGN KEY (assigned_employee_id) REFERENCES employee(id) ON DELETE RESTRICT');
    } catch (e) {
      // 이미 있으면 무시
    }

    try {
      await conn.execute('ALTER TABLE maintenance_contracts ADD CONSTRAINT fk_maintenance_creator FOREIGN KEY (created_by_id) REFERENCES employee(id) ON DELETE SET NULL');
    } catch (e) {
      // 이미 있으면 무시
    }

    try {
      await conn.execute('ALTER TABLE maintenance_contracts ADD CONSTRAINT fk_maintenance_updater FOREIGN KEY (updated_by_id) REFERENCES employee(id) ON DELETE SET NULL');
    } catch (e) {
      // 이미 있으면 무시
    }

    // 2. MAINTENANCE_CONTRACTS 시퀀스
    try {
      await conn.execute('CREATE SEQUENCE seq_maintenance_contracts START WITH 1 INCREMENT BY 1 NOCYCLE');
      console.log('✓ MAINTENANCE_CONTRACTS 시퀀스 생성됨');
    } catch (e) {
      if (e.errorNum === 955) {
        console.log('✓ MAINTENANCE_CONTRACTS 시퀀스 (이미 존재)');
      } else {
        throw e;
      }
    }

    // 3. MAINTENANCE_CONTRACT_ATTACHMENTS 테이블
    try {
      await conn.execute('CREATE TABLE maintenance_contract_attachments (id NUMBER PRIMARY KEY, maintenance_contract_id NUMBER NOT NULL, file_name VARCHAR2(255) NOT NULL, file_path VARCHAR2(500) NOT NULL, file_size NUMBER, uploaded_by_id NUMBER NOT NULL, created_at DATE NOT NULL, deleted_at DATE)');
      console.log('✓ MAINTENANCE_CONTRACT_ATTACHMENTS 테이블 생성됨');
    } catch (e) {
      if (e.errorNum === 955) {
        console.log('✓ MAINTENANCE_CONTRACT_ATTACHMENTS 테이블 (이미 존재)');
      } else {
        throw e;
      }
    }

    try {
      await conn.execute('ALTER TABLE maintenance_contract_attachments ADD CONSTRAINT fk_maint_attach_contract FOREIGN KEY (maintenance_contract_id) REFERENCES maintenance_contracts(id) ON DELETE RESTRICT');
    } catch (e) {
      // 이미 있으면 무시
    }

    try {
      await conn.execute('ALTER TABLE maintenance_contract_attachments ADD CONSTRAINT fk_maint_attach_uploader FOREIGN KEY (uploaded_by_id) REFERENCES employee(id) ON DELETE SET NULL');
    } catch (e) {
      // 이미 있으면 무시
    }

    // 4. MAINTENANCE_CONTRACT_HISTORIES 테이블
    try {
      await conn.execute('CREATE TABLE maintenance_contract_histories (id NUMBER PRIMARY KEY, maintenance_contract_id NUMBER NOT NULL, change_type VARCHAR2(50) NOT NULL, reason VARCHAR2(500), previous_end_date DATE, new_end_date DATE, changed_by_id NUMBER NOT NULL, changed_at DATE NOT NULL, deleted_at DATE)');
      console.log('✓ MAINTENANCE_CONTRACT_HISTORIES 테이블 생성됨');
    } catch (e) {
      if (e.errorNum === 955) {
        console.log('✓ MAINTENANCE_CONTRACT_HISTORIES 테이블 (이미 존재)');
      } else {
        throw e;
      }
    }

    try {
      await conn.execute('ALTER TABLE maintenance_contract_histories ADD CONSTRAINT fk_maint_history_contract FOREIGN KEY (maintenance_contract_id) REFERENCES maintenance_contracts(id) ON DELETE RESTRICT');
    } catch (e) {
      // 이미 있으면 무시
    }

    try {
      await conn.execute('ALTER TABLE maintenance_contract_histories ADD CONSTRAINT fk_maint_history_user FOREIGN KEY (changed_by_id) REFERENCES employee(id) ON DELETE SET NULL');
    } catch (e) {
      // 이미 있으면 무시
    }

    // 5. 인덱스 생성
    const indices = [
      { name: 'idx_maint_customer', table: 'maintenance_contracts', column: 'customer_id' },
      { name: 'idx_maint_employee', table: 'maintenance_contracts', column: 'assigned_employee_id' },
      { name: 'idx_maint_status', table: 'maintenance_contracts', column: 'contract_status' },
      { name: 'idx_maint_deleted', table: 'maintenance_contracts', column: 'deleted_at' },
      { name: 'idx_maint_attach_contract', table: 'maintenance_contract_attachments', column: 'maintenance_contract_id' },
      { name: 'idx_maint_attach_deleted', table: 'maintenance_contract_attachments', column: 'deleted_at' },
      { name: 'idx_maint_history_contract', table: 'maintenance_contract_histories', column: 'maintenance_contract_id' },
      { name: 'idx_maint_history_deleted', table: 'maintenance_contract_histories', column: 'deleted_at' },
    ];

    for (const idx of indices) {
      try {
        await conn.execute(`CREATE INDEX ${idx.name} ON ${idx.table}(${idx.column})`);
        console.log(`✓ ${idx.name} 인덱스 생성됨`);
      } catch (e) {
        if (e.errorNum === 955 || e.errorNum === 1408) {
          console.log(`✓ ${idx.name} 인덱스 (이미 존재)`);
        } else {
          console.error(`✗ Error creating index ${idx.name}:`, e.message);
        }
      }
    }

    console.log('\n✓ 유지보수 테이블 초기화 완료!');
  } catch (error) {
    console.error('✗ 오류:', error.message);
    process.exit(1);
  } finally {
    if (conn) {
      try {
        await conn.close();
      } catch (closeError) {
        console.error('연결 종료 오류:', closeError.message);
      }
    }
  }
}

initMaintenanceTables();
