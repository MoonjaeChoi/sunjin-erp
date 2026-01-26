// Generated: 2026-01-26 10:00:00 KST


import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  Check,
  Index,
} from 'typeorm';
import { Employee } from './Employee';

export type InventoryStatus = '재고' | '출고' | '고장' | '폐기';

@Entity('INVENTORY')
@Check('"current_status" IN (\'재고\', \'출고\', \'고장\', \'폐기\')')
@Index('IDX_INVENTORY_SERIAL_NUMBER', ['serial_number'], { unique: true })
@Index('IDX_INVENTORY_CATEGORY', ['category'])
@Index('IDX_INVENTORY_CURRENT_STATUS', ['current_status'])
@Index('IDX_INVENTORY_DELETED_AT', ['deleted_at'])
export class Inventory {
  @PrimaryGeneratedColumn({ name: 'id', type: 'number' })
  id!: number;

  @Column({
    name: 'category',
    type: 'varchar2',
    length: 50,
    nullable: false,
  })
  category!: string;
  // 예: '모니터', '노트북', '라우터', '프린터', '기타'

  @Column({
    name: 'model',
    type: 'varchar2',
    length: 255,
    nullable: false,
  })
  model!: string;

  @Column({
    name: 'serial_number',
    type: 'varchar2',
    length: 100,
    nullable: false,
    unique: true,
  })
  serial_number!: string;

  @Column({
    name: 'purchase_date',
    type: 'date',
    nullable: false,
  })
  purchase_date!: Date;

  @Column({
    name: 'purchase_from',
    type: 'varchar2',
    length: 255,
    nullable: false,
  })
  purchase_from!: string;

  @Column({
    name: 'current_location',
    type: 'varchar2',
    length: 255,
    nullable: false,
  })
  current_location!: string;
  // 물리적 보관 위치 (창고, 사무실 등)

  @Column({
    name: 'current_status',
    type: 'varchar2',
    length: 20,
    nullable: false,
    default: '\'재고\'',
  })
  current_status!: InventoryStatus;
  // 기본값: '재고'

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
  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'created_by_id' })
  created_by!: Employee;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'updated_by_id' })
  updated_by!: Employee;
}
