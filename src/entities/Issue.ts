// Generated: 2026-01-25 21:35:00 KST

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
  Check,
} from 'typeorm';
import { Customer } from './Customer';
import { Employee } from './Employee';
import { IssueAttachment } from './IssueAttachment';
import { IssueHistory } from './IssueHistory';

export type IssueStatus = 'INTAKE' | 'IN_PROGRESS' | 'COMPLETED';
export type IssueSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type TreatmentMethod = 'REMOTE' | 'PHONE' | 'ONSITE' | null;

@Entity('ISSUE')
@Check('CHK_ISSUE_TREATMENT_TIME', '"treatment_time_minutes" IS NULL OR ("treatment_time_minutes" >= 1 AND "treatment_time_minutes" <= 1440)')
@Index('IDX_ISSUE_CUSTOMER_ID', ['customer_id'])
@Index('IDX_ISSUE_CREATED_BY_ID', ['created_by_id'])
@Index('IDX_ISSUE_ASSIGNED_TO_ID', ['assigned_to_id'])
@Index('IDX_ISSUE_STATUS', ['status'])
@Index('IDX_ISSUE_DELETED_AT', ['deleted_at'])
export class Issue {
  @PrimaryGeneratedColumn('increment', {
    name: 'id',
    type: 'number',
  })
  id!: number;

  @Column({
    name: 'customer_id',
    type: 'number',
  })
  customer_id!: number;

  @Column({
    name: 'title',
    type: 'varchar2',
    length: 255,
  })
  title!: string;

  @Column({
    name: 'description',
    type: 'clob',
  })
  description!: string;

  @Column({
    name: 'severity',
    type: 'varchar2',
    length: 20,
    default: 'CRITICAL',
  })
  severity!: IssueSeverity;

  @Column({
    name: 'status',
    type: 'varchar2',
    length: 20,
    default: 'INTAKE',
  })
  status!: IssueStatus;

  @Column({
    name: 'is_public',
    type: 'number',
    precision: 1,
    default: 0,
    comment: '부서원 공개 여부 (0=비공개, 1=공개)',
  })
  is_public!: number; // 0 or 1

  @Column({
    name: 'created_by_id',
    type: 'number',
  })
  created_by_id!: number;

  @Column({
    name: 'assigned_to_id',
    type: 'number',
    nullable: true,
  })
  assigned_to_id!: number | null;

  @Column({
    name: 'treatment_method',
    type: 'varchar2',
    length: 50,
    nullable: true,
  })
  treatment_method!: TreatmentMethod;

  @Column({
    name: 'treatment_time_minutes',
    type: 'number',
    nullable: true,
    comment: '처리 시간 (분 단위, 1~1440)',
  })
  treatment_time_minutes!: number | null;

  @Column({
    name: 'treatment_result',
    type: 'clob',
    nullable: true,
  })
  treatment_result!: string | null;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp',
  })
  created_at!: Date;

  @Column({
    name: 'completed_at',
    type: 'timestamp',
    nullable: true,
  })
  completed_at!: Date | null;

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
  @ManyToOne(() => Customer, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'customer_id' })
  customer!: Customer;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'created_by_id' })
  createdBy!: Employee;

  @ManyToOne(() => Employee, { nullable: true })
  @JoinColumn({ name: 'assigned_to_id' })
  assignedTo!: Employee | null;

  @OneToMany(() => IssueAttachment, (attachment) => attachment.issue)
  attachments!: IssueAttachment[];

  @OneToMany(() => IssueHistory, (history) => history.issue)
  histories!: IssueHistory[];
}
