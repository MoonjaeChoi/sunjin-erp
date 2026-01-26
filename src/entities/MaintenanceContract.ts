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
  Index,
} from 'typeorm';
import { Customer } from './Customer';
import { Employee } from './Employee';
import { MaintenanceContractAttachment } from './MaintenanceContractAttachment';
import { MaintenanceContractHistory } from './MaintenanceContractHistory';

export type ContractStatus = '활성' | '종료' | '갱신예정';

/**
 * 유지보수 계약 엔티티
 *
 * 고객사의 유지보수 계약 정보를 저장합니다.
 * - soft delete 지원 (deleted_at)
 * - 담당자, 고객사, 생성/수정자 추적
 * - 첨부파일, 변경이력 관리
 */
@Entity('MAINTENANCE_CONTRACT')
@Index('IDX_MC_CUSTOMER_ID', ['customer_id'])
@Index('IDX_MC_ASSIGNED_EMPLOYEE_ID', ['assigned_employee_id'])
@Index('IDX_MC_STATUS', ['contract_status'])
@Index('IDX_MC_END_DATE', ['end_date'])
@Index('IDX_MC_DELETED_AT', ['deleted_at'])
@Index('IDX_MC_STATUS_ENDDATE_ACTIVE', ['contract_status', 'end_date'], {
  where: 'deleted_at IS NULL',
})
export class MaintenanceContract {
  @PrimaryGeneratedColumn('increment', {
    name: 'id',
    type: 'number',
  })
  id!: number;

  @Column({
    name: 'customer_id',
    type: 'number',
    nullable: false,
  })
  customer_id!: number;

  @Column({
    name: 'contract_name',
    type: 'varchar2',
    length: 255,
    nullable: false,
  })
  contract_name!: string;

  @Column({
    name: 'contract_type',
    type: 'varchar2',
    length: 255,
    nullable: false,
  })
  contract_type!: string;

  @Column({
    name: 'start_date',
    type: 'date',
    nullable: false,
  })
  start_date!: Date;

  @Column({
    name: 'end_date',
    type: 'date',
    nullable: false,
  })
  end_date!: Date;

  @Column({
    name: 'contract_status',
    type: 'varchar2',
    length: 50,
    nullable: false,
    default: "'활성'",
  })
  contract_status!: ContractStatus;

  @Column({
    name: 'contract_amount',
    type: 'number',
    nullable: true,
  })
  contract_amount!: number | null;

  @Column({
    name: 'assigned_employee_id',
    type: 'number',
    nullable: false,
  })
  assigned_employee_id!: number;

  @Column({
    name: 'notes',
    type: 'clob',
    nullable: true,
  })
  notes!: string | null;

  @Column({
    name: 'created_by_id',
    type: 'number',
    nullable: false,
  })
  created_by_id!: number;

  @Column({
    name: 'updated_by_id',
    type: 'number',
    nullable: false,
  })
  updated_by_id!: number;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp',
  })
  created_at!: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp',
  })
  updated_at!: Date;

  @DeleteDateColumn({
    name: 'deleted_at',
    type: 'timestamp',
    nullable: true,
  })
  deleted_at!: Date | null;

  // Relations
  @ManyToOne(() => Customer, {
    onDelete: 'RESTRICT',
    eager: false,
  })
  @JoinColumn({
    name: 'customer_id',
  })
  customer!: Customer;

  @ManyToOne(() => Employee, {
    onDelete: 'RESTRICT',
    eager: false,
  })
  @JoinColumn({
    name: 'assigned_employee_id',
  })
  assignedEmployee!: Employee;

  @ManyToOne(() => Employee, {
    onDelete: 'RESTRICT',
    eager: false,
  })
  @JoinColumn({
    name: 'created_by_id',
  })
  createdBy!: Employee;

  @ManyToOne(() => Employee, {
    onDelete: 'RESTRICT',
    eager: false,
  })
  @JoinColumn({
    name: 'updated_by_id',
  })
  updatedBy!: Employee;

  @OneToMany(
    () => MaintenanceContractAttachment,
    (attachment) => attachment.contract,
    {
      cascade: false,
      eager: false,
    }
  )
  attachments!: MaintenanceContractAttachment[];

  @OneToMany(
    () => MaintenanceContractHistory,
    (history) => history.contract,
    {
      cascade: false,
      eager: false,
    }
  )
  histories!: MaintenanceContractHistory[];
}
