<!-- Generated: 2026-01-26 22:45:00 KST -->

# TypeORM Entity 정의 (MaintenanceContract, Attachment, History)

**문서 번호**: 2071_01
**원본 PRD**: `docs/prd/2071_유지보수_고객_관리_prd_v2.md`
**PRD 참조**: [Section 5.3 - Database (Oracle XE 21c + TypeORM)](./2071_유지보수_고객_관리_prd_v2.md#53-database-oracle-xe-21c--typeorm)
**운영 표준**: `docs/operation/011_데이터베이스연결.md` (Oracle XE 21c, TypeORM DataSource, Column identifier quoting, Soft delete patterns)
**구현 범위**: TypeORM Entity 3개 정의 (MaintenanceContract, Attachment, History)
**복잡도**: M (1-2일)
**의존성**: 없음 (Customer, Employee entities 기존 존재)

---

## 구현 목표

Oracle XE 21c와 호환되는 TypeORM Entity 3개를 정의하여 유지보수 계약 데이터 모델을 구축합니다. 모든 Entity는 soft delete를 지원하며, FK는 ON DELETE RESTRICT로 설정합니다.

---

## 구현 내용

### 파일 구조

```
src/entities/
├── MaintenanceContract.ts           # 계약 엔티티
├── MaintenanceContractAttachment.ts # 첨부 엔티티
└── MaintenanceContractHistory.ts    # 이력 엔티티
```

### Oracle XE 21c 호환성 규칙 (docs/operation/011 참조)

**Column 타입**:
- ✅ `VARCHAR2` (not VARCHAR) for strings
- ✅ `CLOB` for large text (not TEXT)
- ✅ `NUMBER` for all numeric values
- ✅ `DATE` or `TIMESTAMP` for dates

**Column 식별자 (quoted identifiers)**:
```typescript
// MaintenanceContract: 일반적으로 lowercase (EMPLOYEE, ISSUE 규칙 확인)
@Column({ name: '"id"' })  // if case-sensitive
@Column({ name: 'id' })    // if case-insensitive (Oracle default)
```

**Soft Delete 패턴**:
```typescript
@DeleteDateColumn({ type: 'timestamp', nullable: true })
deleted_at: Date | null;

// 모든 조회 쿼리에서
.where('deleted_at IS NULL')  // Raw SQL 또는
.where({ deleted_at: IsNull() })  // TypeORM QueryBuilder
```

**Cascade Soft Delete**:
- 상위 엔티티 삭제 시 하위 엔티티도 함께 soft delete
- Migration에서 FK는 `ON DELETE RESTRICT` (물리 삭제 금지)
- Service 레이어에서 cascade soft delete 구현

### 1. MaintenanceContract Entity

**위치**: `src/entities/MaintenanceContract.ts`

**요구사항**:
- 고객사(Customer)와의 N:1 관계 (ON DELETE RESTRICT)
- 담당 영업자(Employee)와의 N:1 관계 (ON DELETE RESTRICT)
- 생성자, 수정자(Employee)와의 관계
- Soft delete 지원 (`deleted_at`)
- 상태 제약: CHECK 또는 애플리케이션 검증

**핵심 필드**:
```typescript
// Generated: 2026-01-26 22:45:00 KST

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { Customer } from './Customer';
import { Employee } from './Employee';
import { MaintenanceContractAttachment } from './MaintenanceContractAttachment';
import { MaintenanceContractHistory } from './MaintenanceContractHistory';

@Entity('MAINTENANCE_CONTRACT')
export class MaintenanceContract {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'number' })
  customer_id: number;

  @Column({ type: 'varchar2', length: 255 })
  contract_name: string;

  @Column({ type: 'varchar2', length: 255 })
  contract_type: string;

  @Column({ type: 'date' })
  start_date: Date;

  @Column({ type: 'date' })
  end_date: Date;

  @Column({ type: 'number', nullable: true })
  contract_amount: number | null;

  @Column({ type: 'number' })
  assigned_employee_id: number;

  @Column({ type: 'varchar2', length: 50 })
  contract_status: string; // 활성/종료/갱신예정

  @Column({ type: 'clob', nullable: true })
  notes: string | null;

  @Column({ type: 'number' })
  created_by_id: number;

  @Column({ type: 'number' })
  updated_by_id: number;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deleted_at: Date | null;

  // Relations
  @ManyToOne(() => Customer, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @ManyToOne(() => Employee, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'assigned_employee_id' })
  assignedEmployee: Employee;

  @ManyToOne(() => Employee, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'created_by_id' })
  createdBy: Employee;

  @ManyToOne(() => Employee, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'updated_by_id' })
  updatedBy: Employee;

  @OneToMany(() => MaintenanceContractAttachment, a => a.contract)
  attachments: MaintenanceContractAttachment[];

  @OneToMany(() => MaintenanceContractHistory, h => h.contract)
  histories: MaintenanceContractHistory[];
}
```

### 2. MaintenanceContractAttachment Entity

**위치**: `src/entities/MaintenanceContractAttachment.ts`

**요구사항**:
- 계약(MaintenanceContract)과의 N:1 관계 (ON DELETE RESTRICT)
- 업로더(Employee)와의 N:1 관계
- Soft delete 지원
- 파일 메타데이터 저장 (파일명, 경로, 크기)

**핵심 필드**:
```typescript
// Generated: 2026-01-26 22:45:00 KST

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { MaintenanceContract } from './MaintenanceContract';
import { Employee } from './Employee';

@Entity('MAINTENANCE_CONTRACT_ATTACHMENT')
export class MaintenanceContractAttachment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'number' })
  maintenance_contract_id: number;

  @Column({ type: 'varchar2', length: 255 })
  file_name: string;

  @Column({ type: 'varchar2', length: 512 })
  file_path: string; // /uploads/maintenance/uuid-original-filename

  @Column({ type: 'number' })
  file_size: number; // bytes

  @Column({ type: 'number' })
  uploaded_by_id: number;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deleted_at: Date | null;

  // Relations
  @ManyToOne(() => MaintenanceContract, c => c.attachments, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'maintenance_contract_id' })
  contract: MaintenanceContract;

  @ManyToOne(() => Employee, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'uploaded_by_id' })
  uploadedBy: Employee;
}
```

### 3. MaintenanceContractHistory Entity

**위치**: `src/entities/MaintenanceContractHistory.ts`

**요구사항**:
- 계약(MaintenanceContract)과의 N:1 관계 (ON DELETE RESTRICT)
- 변경자(Employee)와의 N:1 관계
- 변경 유형: 갱신 / 상태변경 / 정보수정
- Soft delete 지원 (cascade soft-delete)

**핵심 필드**:
```typescript
// Generated: 2026-01-26 22:45:00 KST

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { MaintenanceContract } from './MaintenanceContract';
import { Employee } from './Employee';

@Entity('MAINTENANCE_CONTRACT_HISTORY')
export class MaintenanceContractHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'number' })
  maintenance_contract_id: number;

  @Column({ type: 'varchar2', length: 50 })
  change_type: string; // 갱신/상태변경/정보수정

  @Column({ type: 'date', nullable: true })
  previous_end_date: Date | null;

  @Column({ type: 'date', nullable: true })
  new_end_date: Date | null;

  @Column({ type: 'varchar2', length: 500, nullable: true })
  reason: string | null;

  @Column({ type: 'number' })
  changed_by_id: number;

  @CreateDateColumn({ type: 'timestamp' })
  changed_at: Date;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deleted_at: Date | null;

  // Relations
  @ManyToOne(() => MaintenanceContract, c => c.histories, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'maintenance_contract_id' })
  contract: MaintenanceContract;

  @ManyToOne(() => Employee, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'changed_by_id' })
  changedBy: Employee;
}
```

### 핵심 인터페이스

```typescript
// Type 정의 (src/types/maintenance.ts에서도 필요)
export type ContractStatus = '활성' | '종료' | '갱신예정';
export type ChangeType = '갱신' | '상태변경' | '정보수정';

export interface MaintenanceContractRecord {
  id: number;
  customer_id: number;
  contract_name: string;
  contract_type: string;
  start_date: Date;
  end_date: Date;
  contract_amount: number | null;
  assigned_employee_id: number;
  contract_status: ContractStatus;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}
```

---

## Acceptance Criteria

- [ ] MaintenanceContract Entity 구현 완료
  - 모든 필드 정의 (id, customer_id, contract_name, ... deleted_at)
  - 관계 설정 (Customer, Employee, Attachment, History)
  - Decorator 적용 (@Entity, @Column, @ManyToOne, @OneToMany 등)
  - ON DELETE RESTRICT 설정 (모든 FK)

- [ ] MaintenanceContractAttachment Entity 구현 완료
  - 파일 메타데이터 필드
  - Contract와의 관계 설정
  - Soft delete 지원

- [ ] MaintenanceContractHistory Entity 구현 완료
  - 이력 추적 필드
  - 변경 유형, 이전/새로운 값
  - Contract와의 관계 설정

- [ ] 모든 Entity가 TypeScript strict mode 통과
  - `npm run type-check` 성공
  - null/undefined 타입 명시

- [ ] Soft delete 기능 구현
  - `@DeleteDateColumn()` 적용
  - 모든 쿼리에서 `deleted_at IS NULL` 필터링 (repository에서)

---

## 테스트 전략

### TypeScript 검증

```bash
npm run build         # Next.js 빌드 (TypeORM 컴파일)
npm run type-check    # TypeScript strict mode
```

### Entity 검증 테스트

**테스트 파일 위치**: `src/__tests__/entities/maintenance.entity.test.ts`

```typescript
describe('MaintenanceContract Entity', () => {
  it('should validate entity structure', () => {
    const entity = new MaintenanceContract();
    expect(entity).toHaveProperty('id');
    expect(entity).toHaveProperty('customer_id');
    expect(entity).toHaveProperty('contract_status');
    expect(entity).toHaveProperty('deleted_at');
  });

  it('should support soft delete', () => {
    // @DeleteDateColumn() 검증
    const metadata = getEntityMetadata(MaintenanceContract);
    const deletedAtColumn = metadata.columns.find(c => c.propertyName === 'deleted_at');
    expect(deletedAtColumn?.type).toBe('timestamp');
  });

  it('should enforce ON DELETE RESTRICT on FK columns', () => {
    const metadata = getEntityMetadata(MaintenanceContract);
    const fkRelations = metadata.relations.filter(r => r.type === 'many-to-one');
    fkRelations.forEach(r => {
      expect(r.onDelete).toBe('RESTRICT');
    });
  });
});
```

### 검증 방법

1. Entity 파일 생성
2. `npm run build` 실행 (TypeORM 메타데이터 생성)
3. `npm run type-check` 실행 (타입 검증)
4. 다음 단계(Migration)로 진행

---

## 완료 체크리스트

- [ ] TypeScript 빌드 성공 (`npm run build`)
- [ ] Type-check 통과 (`npm run type-check`)
- [ ] 모든 Entity 파일 생성 완료
- [ ] 관계(Relations) 정의 완료
- [ ] Soft delete 컬럼 추가 (`@DeleteDateColumn`)
- [ ] ON DELETE RESTRICT 설정 완료
- [ ] Entity 검증 테스트 작성
- [ ] 코드 리뷰 완료

---

**다음 문서**: `2071_02_TypeORM_Migration_생성.md`
