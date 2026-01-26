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
  @PrimaryGeneratedColumn({ name: 'id', type: 'int' })
  id!: number;

  @Column({ name: 'project_id', type: 'int', nullable: false })
  project_id!: number;

  @Column({ name: 'file_path', type: 'varchar', length: 500, nullable: false })
  file_path!: string;

  @Column({ name: 'file_name', type: 'varchar', length: 200, nullable: false })
  file_name!: string;

  @Column({ name: 'file_size', type: 'int', nullable: false })
  file_size!: number;

  @Column({ name: 'category', type: 'varchar', length: 20, nullable: false })
  category!: AttachmentCategory;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  created_at!: Date;
}
