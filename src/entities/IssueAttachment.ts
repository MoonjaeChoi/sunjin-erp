// Generated: 2026-01-25 21:40:00 KST

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Issue } from './Issue';
import { Employee } from './Employee';

@Entity('ISSUE_ATTACHMENT')
@Index('IDX_ISSUE_ATTACHMENT_ISSUE_ID', ['issue_id'])
@Index('IDX_ISSUE_ATTACHMENT_DELETED_AT', ['deleted_at'])
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

  @DeleteDateColumn({
    name: 'deleted_at',
    type: 'timestamp',
    nullable: true,
  })
  deleted_at!: Date | null;

  // Relations
  @ManyToOne(() => Issue, (issue) => issue.attachments, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'issue_id' })
  issue!: Issue;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'uploaded_by_id' })
  uploadedBy!: Employee;
}
