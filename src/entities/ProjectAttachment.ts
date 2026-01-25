// Generated: 2026-01-25 14:30:00 KST

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export type AttachmentCategory = 'CONTRACT' | 'PROPOSAL' | 'QUOTATION' | 'REPORT' | 'OTHER';

@Entity('PROJECT_ATTACHMENT')
@Index('IDX_PROJECT_ATTACHMENT_PROJECT', ['project_id'])
@Index('IDX_PROJECT_ATTACHMENT_CATEGORY', ['category'])
export class ProjectAttachment {
  @PrimaryGeneratedColumn({ type: 'number' })
  id!: number;

  @Column({ name: 'project_id', type: 'number', nullable: false })
  project_id!: number;

  @Column({ name: 'file_path', type: 'varchar2', length: 500, nullable: false })
  file_path!: string;

  @Column({ name: 'file_name', type: 'varchar2', length: 200, nullable: false })
  file_name!: string;

  @Column({ name: 'file_size', type: 'number', nullable: false })
  file_size!: number;

  @Column({ name: 'category', type: 'varchar2', length: 20, nullable: false })
  category!: AttachmentCategory;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  created_at!: Date;
}
