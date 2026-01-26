// Generated: 2026-01-26 22:45:00 KST


import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  DeleteDateColumn,
  Index,
} from 'typeorm';
import { MaintenanceContract } from './MaintenanceContract';
import { Employee } from './Employee';

export type MaintenanceChangeType = '갱신' | '상태변경' | '정보수정';

/**
 * 유지보수 계약 변경 이력 엔티티
 *
 * 계약의 모든 중요한 변경사항을 기록합니다.
 * - soft delete 지원 (deleted_at - cascade)
 * - 변경 유형별 추적 (갱신, 상태변경, 정보수정)
 * - 변경자 및 변경일시 기록
 */
@Entity('MAINTENANCE_CONTRACT_HISTORY')
@Index('IDX_MCH_MAINTENANCE_CONTRACT_ID', ['maintenance_contract_id'])
@Index('IDX_MCH_CHANGED_BY_ID', ['changed_by_id'])
@Index('IDX_MCH_CHANGED_AT', ['changed_at'])
@Index('IDX_MCH_CHANGE_TYPE', ['change_type'])
@Index('IDX_MCH_DELETED_AT', ['deleted_at'])
export class MaintenanceContractHistory {
  @PrimaryGeneratedColumn('increment', {
    name: 'id',
    type: 'number',
  })
  id!: number;

  @Column({
    name: 'maintenance_contract_id',
    type: 'number',
    nullable: false,
  })
  maintenance_contract_id!: number;

  @Column({
    name: 'change_type',
    type: 'varchar2',
    length: 50,
    nullable: false,
  })
  change_type!: MaintenanceChangeType;

  @Column({
    name: 'previous_end_date',
    type: 'date',
    nullable: true,
  })
  previous_end_date!: Date | null;

  @Column({
    name: 'new_end_date',
    type: 'date',
    nullable: true,
  })
  new_end_date!: Date | null;

  @Column({
    name: 'reason',
    type: 'varchar2',
    length: 500,
    nullable: true,
  })
  reason!: string | null;

  @Column({
    name: 'changed_by_id',
    type: 'number',
    nullable: false,
  })
  changed_by_id!: number;

  @CreateDateColumn({
    name: 'changed_at',
    type: 'timestamp',
  })
  changed_at!: Date;

  @DeleteDateColumn({
    name: 'deleted_at',
    type: 'timestamp',
    nullable: true,
  })
  deleted_at!: Date | null;

  // Relations
  @ManyToOne(() => MaintenanceContract, {
    onDelete: 'RESTRICT',
    eager: false,
  })
  @JoinColumn({
    name: 'maintenance_contract_id',
  })
  contract!: MaintenanceContract;

  @ManyToOne(() => Employee, {
    onDelete: 'RESTRICT',
    eager: false,
  })
  @JoinColumn({
    name: 'changed_by_id',
  })
  changedBy!: Employee;
}
