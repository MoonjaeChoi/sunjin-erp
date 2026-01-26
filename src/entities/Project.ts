// Generated: 2026-01-25 14:30:00 KST

// CRITICAL: Load reflect-metadata BEFORE decorators are evaluated
require('reflect-metadata');


import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
} from 'typeorm';

export type ProjectStatus = 'PREPARING' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD';

@Entity('PROJECT')
@Index('IDX_PROJECT_CUSTOMER', ['customer_id'])
@Index('IDX_PROJECT_EMPLOYEE', ['employee_id'])
@Index('IDX_PROJECT_STATUS', ['status'])
@Index('IDX_PROJECT_DELETED_AT', ['deleted_at'])
export class Project {
  @PrimaryGeneratedColumn({ name: 'id', type: 'int' })
  id!: number;

  @Column({ name: 'project_code', type: 'varchar', length: 30, nullable: true, unique: true })
  project_code!: string | null;

  @Column({ name: 'project_name', type: 'varchar', length: 200, nullable: false })
  project_name!: string;

  @Column({ name: 'customer_id', type: 'int', nullable: false })
  customer_id!: number;

  @Column({ name: 'employee_id', type: 'int', nullable: false })
  employee_id!: number;

  @Column({ name: 'status', type: 'varchar', length: 20, default: "'PREPARING'" })
  status!: ProjectStatus;

  @Column({ name: 'start_date', type: 'date', nullable: true })
  start_date!: Date | null;

  @Column({ name: 'end_date', type: 'date', nullable: true })
  end_date!: Date | null;

  @Column({ name: 'contract_amount', type: 'number', nullable: true })
  contract_amount!: number | null;

  @Column({ name: 'description', type: 'clob', nullable: true })
  description!: string | null;

  // 8단계 Sales Pipeline 체크리스트 (TIMESTAMP, nullable)
  @Column({ name: 'stage_meeting_at', type: 'timestamp', nullable: true })
  stage_meeting_at!: Date | null;

  @Column({ name: 'stage_proposal_at', type: 'timestamp', nullable: true })
  stage_proposal_at!: Date | null;

  @Column({ name: 'stage_quotation_at', type: 'timestamp', nullable: true })
  stage_quotation_at!: Date | null;

  @Column({ name: 'stage_contract_at', type: 'timestamp', nullable: true })
  stage_contract_at!: Date | null;

  @Column({ name: 'stage_kickoff_at', type: 'timestamp', nullable: true })
  stage_kickoff_at!: Date | null;

  @Column({ name: 'stage_development_at', type: 'timestamp', nullable: true })
  stage_development_at!: Date | null;

  @Column({ name: 'stage_delivery_at', type: 'timestamp', nullable: true })
  stage_delivery_at!: Date | null;

  @Column({ name: 'stage_handover_at', type: 'timestamp', nullable: true })
  stage_handover_at!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  created_at!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updated_at!: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deleted_at!: Date | null;
}
