// Generated: 2026-01-25 18:05:00 KST

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

@Entity('ISSUE_ATTACHMENT')
@Index(['issue_id'])
@Index(['uploaded_by_id'])
export class IssueAttachment {
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
    name: 'file_name',
    type: 'varchar2',
    length: 255,
  })
  file_name!: string;

  @Column({
    name: 'file_path',
    type: 'varchar2',
    length: 512,
  })
  file_path!: string;

  @Column({
    name: 'file_size',
    type: 'number',
    comment: '파일 크기 (바이트)',
  })
  file_size!: number;

  @Column({
    name: 'uploaded_by_id',
    type: 'number',
  })
  uploaded_by_id!: number;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp',
  })
  created_at!: Date;

  @Column({
    name: 'deleted_at',
    type: 'timestamp',
    nullable: true,
  })
  deleted_at!: Date | null;

  // Relations (ON DELETE RESTRICT)
  @ManyToOne(() => Issue, (issue) => issue.attachments, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'issue_id' })
  issue!: Issue;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'uploaded_by_id' })
  uploaded_by!: Employee;
}
