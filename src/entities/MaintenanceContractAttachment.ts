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

/**
 * 유지보수 계약 첨부파일 엔티티
 *
 * 계약과 연결된 파일(계약서, 인보이스 등)을 관리합니다.
 * - soft delete 지원 (deleted_at)
 * - 파일 메타데이터 저장 (파일명, 경로, 크기)
 * - 업로더 추적
 */
@Entity('MAINTENANCE_CONTRACT_ATTACHMENT')
@Index('IDX_MCA_MAINTENANCE_CONTRACT_ID', ['maintenance_contract_id'])
@Index('IDX_MCA_UPLOADED_BY_ID', ['uploaded_by_id'])
@Index('IDX_MCA_DELETED_AT', ['deleted_at'])
export class MaintenanceContractAttachment {
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
    name: 'file_name',
    type: 'varchar2',
    length: 255,
    nullable: false,
  })
  file_name!: string;

  @Column({
    name: 'file_path',
    type: 'varchar2',
    length: 512,
    nullable: false,
  })
  file_path!: string;

  @Column({
    name: 'file_size',
    type: 'number',
    nullable: false,
  })
  file_size!: number;

  @Column({
    name: 'uploaded_by_id',
    type: 'number',
    nullable: false,
  })
  uploaded_by_id!: number;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp',
  })
  created_at!: Date;

  @DeleteDateColumn({
    name: 'deleted_at',
    type: 'timestamp',
    nullable: true,
  })
  deleted_at!: Date | null;

  // Relations
  @ManyToOne(() => MaintenanceContract, (contract) => contract.attachments, {
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
    name: 'uploaded_by_id',
  })
  uploadedBy!: Employee;
}
