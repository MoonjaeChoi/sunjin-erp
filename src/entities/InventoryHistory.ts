// Generated: 2026-01-26 10:05:00 KST

// CRITICAL: Load reflect-metadata BEFORE decorators are evaluated
require('reflect-metadata');


import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Inventory } from './Inventory';
import { Employee } from './Employee';

export type ChangeType = '입고' | '출고' | '반납' | '위치변경' | '상태변경';

@Entity('INVENTORY_HISTORY')
@Index('IDX_INVENTORY_HISTORY_INVENTORY_ID', ['inventory_id'])
@Index('IDX_INVENTORY_HISTORY_CHANGED_AT', ['changed_at'])
export class InventoryHistory {
  @PrimaryGeneratedColumn({ name: 'id', type: 'number' })
  id!: number;

  @Column({
    name: 'inventory_id',
    type: 'number',
    nullable: false,
  })
  inventory_id!: number;

  @Column({
    name: 'change_type',
    type: 'varchar2',
    length: 20,
    nullable: false,
  })
  change_type!: ChangeType;

  @Column({
    name: 'previous_location',
    type: 'varchar2',
    length: 255,
    nullable: true,
  })
  previous_location!: string | null;

  @Column({
    name: 'new_location',
    type: 'varchar2',
    length: 255,
    nullable: true,
  })
  new_location!: string | null;

  @Column({
    name: 'previous_status',
    type: 'varchar2',
    length: 20,
    nullable: true,
  })
  previous_status!: string | null;

  @Column({
    name: 'new_status',
    type: 'varchar2',
    length: 20,
    nullable: true,
  })
  new_status!: string | null;

  @Column({
    name: 'checkout_location',
    type: 'varchar2',
    length: 255,
    nullable: true,
  })
  checkout_location!: string | null;
  // 출고 시만 기록 (논리적 사용처: 프로젝트, 사람 등)

  @Column({
    name: 'expected_checkin_date',
    type: 'date',
    nullable: true,
  })
  expected_checkin_date!: Date | null;

  @Column({
    name: 'reason',
    type: 'varchar2',
    length: 500,
    nullable: true,
  })
  reason!: string | null;

  @Column({
    name: 'changed_by_id',
    type: 'number',
    nullable: false,
  })
  changed_by_id!: number;

  @CreateDateColumn({
    name: 'changed_at',
    type: 'timestamp',
  })
  changed_at!: Date;

  // Relations
  @ManyToOne(() => Inventory, (inv) => inv.histories, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'inventory_id' })
  inventory!: Inventory;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'changed_by_id' })
  changed_by!: Employee;
}
