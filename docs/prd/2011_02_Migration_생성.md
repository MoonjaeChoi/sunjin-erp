<!-- Generated: 2026-01-24 22:50:00 KST -->

# Migration 생성 및 실행

**문서 번호**: 2011_02
**원본 PRD**: 2011_대시보드_및_일정관리_prd_v2.md
**PRD 참조**: 원본 PRD의 'Section 5.3 Database' 참조
**구현 범위**: Task 테이블 DDL, 인덱스 4개, CHECK 제약조건 3개, Sequence 생성
**복잡도**: S
**의존성**: 2011_01

---

## 구현 목표

Task 엔티티 기반으로 Oracle XE 21c에 테이블을 생성하는 TypeORM Migration을 작성한다. 인덱스, CHECK 제약조건, Sequence를 포함한다.

---

## 구현 내용

### 파일 구조

```
src/
└── migrations/
    └── XXXXXXXX-CreateTaskTable.ts   # Migration 파일
```

### 구현 상세

**Migration에서 생성할 객체:**

1. **Sequence**: `TASK_ID_SEQ` (START WITH 1, INCREMENT BY 1)
2. **Table**: `TASK` (15개 컬럼)
3. **CHECK Constraints**: 3개
4. **Indexes**: 4개
   - `IDX_TASK_DATE_EMPLOYEE` — (task_date, employee_id)
   - `IDX_TASK_EMPLOYEE_DATE` — (employee_id, task_date, deleted_at)
   - `IDX_TASK_EMPLOYEE_STATUS` — (employee_id, status)
   - `IDX_TASK_DELETED_AT` — (deleted_at)

**Migration 클래스 구조:**

```typescript
import { MigrationInterface, QueryRunner, Table, TableIndex, TableCheck } from 'typeorm';

export class CreateTaskTable implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Sequence 생성
    await queryRunner.query(`CREATE SEQUENCE TASK_ID_SEQ START WITH 1 INCREMENT BY 1`);

    // 2. Table 생성
    await queryRunner.createTable(new Table({
      name: 'TASK',
      columns: [
        { name: 'id', type: 'NUMBER', isPrimary: true, default: 'TASK_ID_SEQ.NEXTVAL' },
        { name: 'title', type: 'VARCHAR2(200)', isNullable: false },
        { name: 'description', type: 'CLOB', isNullable: true },
        { name: 'task_date', type: 'DATE', isNullable: false },
        { name: 'start_time', type: 'NUMBER', isNullable: true },
        { name: 'end_time', type: 'NUMBER', isNullable: true },
        { name: 'task_type', type: 'VARCHAR2(20)', isNullable: false },
        { name: 'work_type', type: 'VARCHAR2(10)', isNullable: false },
        { name: 'status', type: 'VARCHAR2(20)', isNullable: false, default: "'READY'" },
        { name: 'employee_id', type: 'NUMBER', isNullable: false },
        { name: 'customer_id', type: 'NUMBER', isNullable: true },
        { name: 'completed_at', type: 'TIMESTAMP', isNullable: true },
        { name: 'created_at', type: 'TIMESTAMP', isNullable: false, default: 'CURRENT_TIMESTAMP' },
        { name: 'updated_at', type: 'TIMESTAMP', isNullable: false, default: 'CURRENT_TIMESTAMP' },
        { name: 'deleted_at', type: 'TIMESTAMP', isNullable: true },
      ],
    }));

    // 3. CHECK Constraints
    await queryRunner.query(`ALTER TABLE TASK ADD CONSTRAINT CHK_TASK_START_TIME CHECK (start_time IS NULL OR (start_time >= 0 AND start_time <= 1439))`);
    await queryRunner.query(`ALTER TABLE TASK ADD CONSTRAINT CHK_TASK_END_TIME CHECK (end_time IS NULL OR (end_time >= 0 AND end_time <= 1439))`);
    await queryRunner.query(`ALTER TABLE TASK ADD CONSTRAINT CHK_TASK_TIME_ORDER CHECK ((start_time IS NULL OR end_time IS NULL) OR start_time < end_time)`);

    // 4. Indexes
    await queryRunner.createIndex('TASK', new TableIndex({ name: 'IDX_TASK_DATE_EMPLOYEE', columnNames: ['task_date', 'employee_id'] }));
    await queryRunner.createIndex('TASK', new TableIndex({ name: 'IDX_TASK_EMPLOYEE_DATE', columnNames: ['employee_id', 'task_date', 'deleted_at'] }));
    await queryRunner.createIndex('TASK', new TableIndex({ name: 'IDX_TASK_EMPLOYEE_STATUS', columnNames: ['employee_id', 'status'] }));
    await queryRunner.createIndex('TASK', new TableIndex({ name: 'IDX_TASK_DELETED_AT', columnNames: ['deleted_at'] }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('TASK', 'IDX_TASK_DELETED_AT');
    await queryRunner.dropIndex('TASK', 'IDX_TASK_EMPLOYEE_STATUS');
    await queryRunner.dropIndex('TASK', 'IDX_TASK_EMPLOYEE_DATE');
    await queryRunner.dropIndex('TASK', 'IDX_TASK_DATE_EMPLOYEE');
    await queryRunner.dropTable('TASK');
    await queryRunner.query(`DROP SEQUENCE TASK_ID_SEQ`);
  }
}
```

---

## Acceptance Criteria

- [ ] Migration 파일 생성 완료
- [ ] `up()`: Sequence + Table + CHECK + Index 생성
- [ ] `down()`: 역순으로 모든 객체 삭제
- [ ] `npx typeorm migration:run` 성공 (Oracle 연결 시)
- [ ] `npx typeorm migration:revert` 성공
- [ ] `npm run type-check` 통과

---

## 테스트 전략

### TypeScript & Lint

```bash
npm run build
npm run type-check
npm run lint
```

### 검증 방법

1. `npm run build` 성공
2. Oracle 연결 가능 시: `npx typeorm migration:run` → 테이블 생성 확인
3. Oracle 연결 가능 시: `npx typeorm migration:revert` → 테이블 삭제 확인
4. Mock 환경: Migration 파일의 TypeScript 타입 정합성만 확인

---

## 완료 체크리스트

- [ ] TypeScript 빌드 성공
- [ ] ESLint/Prettier 통과
- [ ] Migration up() 구현 (Sequence, Table, CHECK, Index)
- [ ] Migration down() 구현 (역순 삭제)
- [ ] Oracle 환경에서 실행 검증 (가능한 경우)

---

**다음 문서**: 2011_03_API_Tasks_목록_조회.md
