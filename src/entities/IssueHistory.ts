// Generated: 2026-01-25 21:45:00 KST


import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Issue } from './Issue';
import { Employee } from './Employee';

export type IssueHistoryChangeType =
  | 'STATUS_CHANGE'
  | 'ASSIGNEE_CHANGE'
  | 'SEVERITY_CHANGE'
  | 'STATUS_ROLLBACK'
  | 'ATTACHMENT_UPLOADED'
  | 'ATTACHMENT_DELETED'
  | 'IS_PUBLIC_CHANGE';

@Entity('ISSUE_HISTORY')
@Index('IDX_ISSUE_HISTORY_ISSUE_ID', ['issue_id'])
@Index('IDX_ISSUE_HISTORY_CHANGED_AT', ['changed_at'])
export class IssueHistory {
  @PrimaryGeneratedColumn('increment', {
    name: 'id',
    type: 'number',
  })
  id!: number;

  @Column({
    name: 'issue_id',
    type: 'number',
  })
  issue_id!: number;

  @Column({
    name: 'change_type',
    type: 'varchar2',
    length: 50,
  })
  change_type!: IssueHistoryChangeType;

  @Column({
    name: 'old_value',
    type: 'varchar2',
    length: 255,
    nullable: true,
  })
  old_value!: string | null;

  @Column({
    name: 'new_value',
    type: 'varchar2',
    length: 255,
    nullable: true,
  })
  new_value!: string | null;

  @Column({
    name: 'changed_by_id',
    type: 'number',
  })
  changed_by_id!: number;

  @CreateDateColumn({
    name: 'changed_at',
    type: 'timestamp',
  })
  changed_at!: Date;

  @Column({
    name: 'remark',
    type: 'clob',
    nullable: true,
  })
  remark!: string | null;

  // Relations
  @ManyToOne(() => Issue)
  @JoinColumn({ name: 'issue_id' })
  issue!: Issue;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'changed_by_id' })
  changedBy!: Employee;
}
