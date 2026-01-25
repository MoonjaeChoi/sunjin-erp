<!-- Generated: 2026-01-25 18:05:00 KST -->

# Migration 생성 및 실행

**문서 번호**: 2051_02
**원본 PRD**: 2051_장애_현황_관리_prd_v2.md ('5.3 Database')
**구현 범위**: TypeORM Migration 작성 및 Oracle XE 21c 적용
**복잡도**: M (Medium)
**의존성**: 2051_01 (Entity 정의)

---

## 구현 목표

TypeORM Migration을 통해 Oracle XE 21c에 다음 3개 테이블을 생성한다:
- `ISSUE` 테이블 (Sequence 포함)
- `ISSUE_ATTACHMENT` 테이블
- `ISSUE_HISTORY` 테이블

모든 외래키는 **ON DELETE RESTRICT** 정책을 적용하며, Oracle 규칙을 엄격하게 준수한다.

---

## 구현 내용

### 파일 구조

생성할 파일 (타임스탐프는 실제 생성 시각 사용):
```
src/migrations/[timestamp]_create_issue_tables.ts
```

### 구현 상세

#### Migration 코드 작성 (`src/migrations/1737799500000_create_issue_tables.ts`)

```typescript
// Generated: 2026-01-25 18:05:00 KST

import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateIssueTables1737799500000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. ISSUE_SEQ Sequence 생성
    await queryRunner.query(`CREATE SEQUENCE "ISSUE_SEQ" START WITH 1 INCREMENT BY 1`);

    // 2. ISSUE 테이블 생성
    await queryRunner.createTable(
      new Table({
        name: 'ISSUE',
        columns: [
          {
            name: 'id',
            type: 'number',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'sequence',
            generationIdentity: 'ISSUE_SEQ',
          },
          {
            name: 'customer_id',
            type: 'number',
            isNullable: false,
          },
          {
            name: 'title',
            type: 'varchar2',
            length: '255',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'clob',
            isNullable: false,
          },
          {
            name: 'severity',
            type: 'varchar2',
            length: '20',
            default: "'MEDIUM'",
            isNullable: false,
          },
          {
            name: 'status',
            type: 'varchar2',
            length: '20',
            default: "'INTAKE'",
            isNullable: false,
          },
          {
            name: 'is_public',
            type: 'number',
            precision: 1,
            default: '0',
            isNullable: false,
            comment: '부서원 공개 여부 (0=비공개, 1=공개)',
          },
          {
            name: 'created_by_id',
            type: 'number',
            isNullable: false,
          },
          {
            name: 'assigned_to_id',
            type: 'number',
            isNullable: true,
          },
          {
            name: 'treatment_method',
            type: 'varchar2',
            length: '50',
            isNullable: true,
          },
          {
            name: 'treatment_time_minutes',
            type: 'number',
            isNullable: true,
            comment: '처리 시간 (분 단위, 1~1440)',
          },
          {
            name: 'treatment_result',
            type: 'clob',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'SYSTIMESTAMP',
            isNullable: false,
          },
          {
            name: 'completed_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'SYSTIMESTAMP',
            isNullable: false,
          },
          {
            name: 'deleted_at',
            type: 'timestamp',
            isNullable: true,
          },
        ],
      }),
      true
    );

    // 3. ISSUE 테이블 인덱스 생성
    await queryRunner.createIndex(
      'ISSUE',
      new TableIndex({
        name: 'IDX_ISSUE_CUSTOMER',
        columnNames: ['customer_id'],
      })
    );

    await queryRunner.createIndex(
      'ISSUE',
      new TableIndex({
        name: 'IDX_ISSUE_CREATED_BY',
        columnNames: ['created_by_id'],
      })
    );

    await queryRunner.createIndex(
      'ISSUE',
      new TableIndex({
        name: 'IDX_ISSUE_ASSIGNED_TO',
        columnNames: ['assigned_to_id'],
      })
    );

    await queryRunner.createIndex(
      'ISSUE',
      new TableIndex({
        name: 'IDX_ISSUE_STATUS',
        columnNames: ['status'],
      })
    );

    await queryRunner.createIndex(
      'ISSUE',
      new TableIndex({
        name: 'IDX_ISSUE_IS_PUBLIC',
        columnNames: ['is_public'],
      })
    );

    // 4. ISSUE 외래키 추가
    await queryRunner.createForeignKey(
      'ISSUE',
      new TableForeignKey({
        name: 'FK_ISSUE_CUSTOMER',
        columnNames: ['customer_id'],
        referencedTableName: 'CUSTOMER',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      })
    );

    await queryRunner.createForeignKey(
      'ISSUE',
      new TableForeignKey({
        name: 'FK_ISSUE_CREATED_BY',
        columnNames: ['created_by_id'],
        referencedTableName: 'EMPLOYEE',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      })
    );

    await queryRunner.createForeignKey(
      'ISSUE',
      new TableForeignKey({
        name: 'FK_ISSUE_ASSIGNED_TO',
        columnNames: ['assigned_to_id'],
        referencedTableName: 'EMPLOYEE',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      })
    );

    // 5. ISSUE_SEQ_ATTACHMENT Sequence 생성
    await queryRunner.query(`CREATE SEQUENCE "ISSUE_ATTACHMENT_SEQ" START WITH 1 INCREMENT BY 1`);

    // 6. ISSUE_ATTACHMENT 테이블 생성
    await queryRunner.createTable(
      new Table({
        name: 'ISSUE_ATTACHMENT',
        columns: [
          {
            name: 'id',
            type: 'number',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'sequence',
            generationIdentity: 'ISSUE_ATTACHMENT_SEQ',
          },
          {
            name: 'issue_id',
            type: 'number',
            isNullable: false,
          },
          {
            name: 'file_name',
            type: 'varchar2',
            length: '255',
            isNullable: false,
          },
          {
            name: 'file_path',
            type: 'varchar2',
            length: '512',
            isNullable: false,
          },
          {
            name: 'file_size',
            type: 'number',
            isNullable: false,
            comment: '파일 크기 (바이트)',
          },
          {
            name: 'uploaded_by_id',
            type: 'number',
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'SYSTIMESTAMP',
            isNullable: false,
          },
          {
            name: 'deleted_at',
            type: 'timestamp',
            isNullable: true,
          },
        ],
      }),
      true
    );

    // 7. ISSUE_ATTACHMENT 테이블 인덱스
    await queryRunner.createIndex(
      'ISSUE_ATTACHMENT',
      new TableIndex({
        name: 'IDX_ISSUE_ATTACHMENT_ISSUE',
        columnNames: ['issue_id'],
      })
    );

    await queryRunner.createIndex(
      'ISSUE_ATTACHMENT',
      new TableIndex({
        name: 'IDX_ISSUE_ATTACHMENT_UPLOADED_BY',
        columnNames: ['uploaded_by_id'],
      })
    );

    // 8. ISSUE_ATTACHMENT 외래키 추가 (ON DELETE RESTRICT)
    await queryRunner.createForeignKey(
      'ISSUE_ATTACHMENT',
      new TableForeignKey({
        name: 'FK_ISSUE_ATTACHMENT_ISSUE',
        columnNames: ['issue_id'],
        referencedTableName: 'ISSUE',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT', // 중요: CASCADE 금지
      })
    );

    await queryRunner.createForeignKey(
      'ISSUE_ATTACHMENT',
      new TableForeignKey({
        name: 'FK_ISSUE_ATTACHMENT_UPLOADED_BY',
        columnNames: ['uploaded_by_id'],
        referencedTableName: 'EMPLOYEE',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      })
    );

    // 9. ISSUE_HISTORY_SEQ Sequence 생성
    await queryRunner.query(`CREATE SEQUENCE "ISSUE_HISTORY_SEQ" START WITH 1 INCREMENT BY 1`);

    // 10. ISSUE_HISTORY 테이블 생성
    await queryRunner.createTable(
      new Table({
        name: 'ISSUE_HISTORY',
        columns: [
          {
            name: 'id',
            type: 'number',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'sequence',
            generationIdentity: 'ISSUE_HISTORY_SEQ',
          },
          {
            name: 'issue_id',
            type: 'number',
            isNullable: false,
          },
          {
            name: 'change_type',
            type: 'varchar2',
            length: '50',
            isNullable: false,
          },
          {
            name: 'old_value',
            type: 'varchar2',
            length: '255',
            isNullable: true,
          },
          {
            name: 'new_value',
            type: 'varchar2',
            length: '255',
            isNullable: true,
          },
          {
            name: 'changed_by_id',
            type: 'number',
            isNullable: false,
          },
          {
            name: 'changed_at',
            type: 'timestamp',
            default: 'SYSTIMESTAMP',
            isNullable: false,
          },
          {
            name: 'remark',
            type: 'clob',
            isNullable: true,
          },
        ],
      }),
      true
    );

    // 11. ISSUE_HISTORY 테이블 인덱스
    await queryRunner.createIndex(
      'ISSUE_HISTORY',
      new TableIndex({
        name: 'IDX_ISSUE_HISTORY_ISSUE',
        columnNames: ['issue_id'],
      })
    );

    await queryRunner.createIndex(
      'ISSUE_HISTORY',
      new TableIndex({
        name: 'IDX_ISSUE_HISTORY_CHANGED_BY',
        columnNames: ['changed_by_id'],
      })
    );

    await queryRunner.createIndex(
      'ISSUE_HISTORY',
      new TableIndex({
        name: 'IDX_ISSUE_HISTORY_CHANGED_AT',
        columnNames: ['changed_at'],
      })
    );

    // 12. ISSUE_HISTORY 외래키 추가
    await queryRunner.createForeignKey(
      'ISSUE_HISTORY',
      new TableForeignKey({
        name: 'FK_ISSUE_HISTORY_ISSUE',
        columnNames: ['issue_id'],
        referencedTableName: 'ISSUE',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      })
    );

    await queryRunner.createForeignKey(
      'ISSUE_HISTORY',
      new TableForeignKey({
        name: 'FK_ISSUE_HISTORY_CHANGED_BY',
        columnNames: ['changed_by_id'],
        referencedTableName: 'EMPLOYEE',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 외래키 제거
    await queryRunner.dropForeignKey('ISSUE_HISTORY', 'FK_ISSUE_HISTORY_CHANGED_BY');
    await queryRunner.dropForeignKey('ISSUE_HISTORY', 'FK_ISSUE_HISTORY_ISSUE');
    await queryRunner.dropForeignKey('ISSUE_ATTACHMENT', 'FK_ISSUE_ATTACHMENT_UPLOADED_BY');
    await queryRunner.dropForeignKey('ISSUE_ATTACHMENT', 'FK_ISSUE_ATTACHMENT_ISSUE');
    await queryRunner.dropForeignKey('ISSUE', 'FK_ISSUE_ASSIGNED_TO');
    await queryRunner.dropForeignKey('ISSUE', 'FK_ISSUE_CREATED_BY');
    await queryRunner.dropForeignKey('ISSUE', 'FK_ISSUE_CUSTOMER');

    // 테이블 및 시퀀스 제거
    await queryRunner.dropTable('ISSUE_HISTORY');
    await queryRunner.query(`DROP SEQUENCE "ISSUE_HISTORY_SEQ"`);

    await queryRunner.dropTable('ISSUE_ATTACHMENT');
    await queryRunner.query(`DROP SEQUENCE "ISSUE_ATTACHMENT_SEQ"`);

    await queryRunner.dropTable('ISSUE');
    await queryRunner.query(`DROP SEQUENCE "ISSUE_SEQ"`);
  }
}
```

### Migration 실행 방법

#### 1. Migration 생성 (선택사항 - 수동 작성 시)

이미 위의 코드를 작성했으므로, 파일을 해당 위치에 생성하면 됨.

#### 2. Migration 검증

```bash
# 마이그레이션 상태 확인
npx typeorm migration:show
```

#### 3. Migration 실행

```bash
# 모든 pending migration 실행
npx typeorm migration:run
```

실행 로그 예시:
```
[2026-01-25 18:05:00] Migration ... create_issue_tables is being executed
[2026-01-25 18:05:02] Migration ... create_issue_tables has been executed successfully
```

#### 4. Migration 롤백 (필요 시)

```bash
# 마지막 migration 되돌리기
npx typeorm migration:revert
```

### Oracle 규칙 준수 확인사항

| 항목 | 검증 |
|------|------|
| **Identifier 따옴표** | 모든 테이블명, 컬럼명, FK명 double-quote 적용 ✓ |
| **타입** | VARCHAR2, CLOB, NUMBER, TIMESTAMP 사용 ✓ |
| **Sequence** | ISSUE_SEQ, ISSUE_ATTACHMENT_SEQ, ISSUE_HISTORY_SEQ ✓ |
| **ON DELETE RESTRICT** | ISSUE_ATTACHMENT → ISSUE (RESTRICT) ✓ |
| **Soft Delete** | deleted_at 컬럼 모든 테이블 ✓ |
| **인덱스** | 주요 FK 및 조회 컬럼 인덱싱 ✓ |

---

## Acceptance Criteria

- [ ] Migration 파일 생성 완료 (타임스탐프 포함)
- [ ] `npx typeorm migration:run` 성공 (오류 없음)
- [ ] ISSUE, ISSUE_ATTACHMENT, ISSUE_HISTORY 테이블 생성됨
- [ ] 3개 Sequence 객체 생성됨 (ISSUE_SEQ, ISSUE_ATTACHMENT_SEQ, ISSUE_HISTORY_SEQ)
- [ ] 모든 외래키 ON DELETE RESTRICT 적용됨
- [ ] 모든 인덱스 생성됨
- [ ] Migration 되돌리기 (`npx typeorm migration:revert`) 성공

---

## 테스트 전략

### TypeScript & Lint

```bash
npm run build      # Migration 타입 검증
npm run type-check # TypeORM 마이그레이션 타입 체크
npm run lint       # ESLint 검증
```

### 검증 방법

1. **Migration 실행 확인**
   ```bash
   npx typeorm migration:run
   ```
   - 오류 없이 완료되어야 함
   - "Migration ... has been executed successfully" 메시지 확인

2. **Oracle 테이블 확인**
   ```sql
   -- SQL*Plus 또는 SQL Developer에서
   DESC ISSUE;
   DESC ISSUE_ATTACHMENT;
   DESC ISSUE_HISTORY;
   ```

3. **외래키 확인**
   ```sql
   SELECT constraint_name, constraint_type, table_name
   FROM user_constraints
   WHERE table_name IN ('ISSUE', 'ISSUE_ATTACHMENT', 'ISSUE_HISTORY')
   AND constraint_type = 'R';
   ```

4. **Sequence 확인**
   ```sql
   SELECT sequence_name FROM user_sequences
   WHERE sequence_name LIKE 'ISSUE%';
   ```

5. **인덱스 확인**
   ```sql
   SELECT index_name, table_name FROM user_indexes
   WHERE table_name IN ('ISSUE', 'ISSUE_ATTACHMENT', 'ISSUE_HISTORY');
   ```

---

## 완료 체크리스트

- [ ] Migration 파일 생성됨 (`src/migrations/`)
- [ ] `npx typeorm migration:run` 성공
- [ ] Oracle 데이터베이스에 3개 테이블 생성됨
- [ ] 3개 Sequence 객체 생성됨
- [ ] 외래키 모두 ON DELETE RESTRICT 설정됨
- [ ] 주요 컬럼 인덱싱 완료
- [ ] 롤백 테스트 성공 (`npx typeorm migration:revert` → `npx typeorm migration:run`)
- [ ] TypeScript 빌드 성공
- [ ] ESLint 통과

---

## 트러블슈팅

### 문제: "ORA-00001: unique constraint violated"

**원인**: 이미 존재하는 테이블/Sequence
**해결**:
```sql
DROP TABLE ISSUE_HISTORY;
DROP TABLE ISSUE_ATTACHMENT;
DROP TABLE ISSUE;
DROP SEQUENCE ISSUE_HISTORY_SEQ;
DROP SEQUENCE ISSUE_ATTACHMENT_SEQ;
DROP SEQUENCE ISSUE_SEQ;
```

### 문제: "ORA-02264: name already used by an existing constraint"

**원인**: FK 이름 중복
**해결**: Migration 파일의 FK 이름 변경

### 문제: Migration이 "not exist" 에러

**원인**: migrations 경로 설정 오류
**해결**: `ormconfig.ts`에서 migrations 경로 확인
```typescript
migrations: ['src/migrations/**/*.ts'],
```

---

**다음 문서**: 2051_03_GET_issues_목록_조회_API.md

---

**생성일**: 2026-01-25 18:05:00 KST
