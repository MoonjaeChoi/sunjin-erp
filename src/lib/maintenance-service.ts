// Generated: 2026-01-26 22:45:00 KST

import { DataSource } from 'typeorm';
import { MaintenanceContractRepository } from './maintenance-repository';
import { MaintenanceContract } from '@/entities/MaintenanceContract';
import { MaintenanceContractAttachment } from '@/entities/MaintenanceContractAttachment';
import { MaintenanceContractHistory } from '@/entities/MaintenanceContractHistory';
import { CONTRACT_STATUS, CHANGE_TYPE } from './maintenance-constants';

/**
 * Maintenance Contract Service
 *
 * 유지보수 계약 비즈니스 로직을 담당합니다.
 * - 트랜잭션 처리 (QueryRunner)
 * - 이력 기록 자동화
 * - Cascade soft delete
 */
export class MaintenanceContractService {
  private repository: MaintenanceContractRepository;

  constructor(private dataSource: DataSource) {
    this.repository = new MaintenanceContractRepository(dataSource);
  }

  /**
   * 계약 생성 + 이력 기록
   *
   * @param data 계약 정보
   * @param userId 생성자 ID
   * @returns 생성된 계약
   */
  async createContract(
    data: {
      customer_id: number;
      contract_name: string;
      contract_type: string;
      start_date: Date;
      end_date: Date;
      assigned_employee_id: number;
      contract_amount?: number | null;
      notes?: string | null;
    },
    userId: number
  ) {
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.startTransaction();

      // Create contract
      const contract = await this.repository.create({
        ...data,
        created_by_id: userId,
        updated_by_id: userId,
        contract_status: CONTRACT_STATUS.ACTIVE,
      });

      // Add history record
      await this.repository.addHistory({
        maintenance_contract_id: contract.id,
        change_type: CHANGE_TYPE.INFO_UPDATE,
        reason: '계약 생성',
        changed_by_id: userId,
      });

      await queryRunner.commitTransaction();
      return contract;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * 계약 수정 + 이력 기록
   */
  async updateContract(
    id: number,
    data: Partial<MaintenanceContract>,
    userId: number
  ) {
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.startTransaction();

      // Get previous data for history
      const previous = await this.repository.findById(id);
      if (!previous) {
        throw new Error(`Contract not found: ${id}`);
      }

      // Update contract
      const updated = await this.repository.update(id, {
        ...data,
        updated_by_id: userId,
      });

      // Add history record (track end_date changes)
      if (
        data.end_date &&
        previous.end_date.getTime() !== new Date(data.end_date).getTime()
      ) {
        await this.repository.addHistory({
          maintenance_contract_id: id,
          change_type: CHANGE_TYPE.INFO_UPDATE,
          previous_end_date: previous.end_date,
          new_end_date: new Date(data.end_date),
          reason: '종료일 변경',
          changed_by_id: userId,
        });
      }

      await queryRunner.commitTransaction();
      return updated;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * 계약 상태 변경 + 이력 기록
   */
  async changeStatus(
    id: number,
    newStatus: string,
    reason: string,
    userId: number
  ) {
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.startTransaction();

      // Validate status transition
      const contract = await this.repository.findById(id);
      if (!contract) {
        throw new Error(`Contract not found: ${id}`);
      }

      // Update status
      await this.repository.update(id, {
        contract_status: newStatus as any,
        updated_by_id: userId,
      });

      // Add history record
      await this.repository.addHistory({
        maintenance_contract_id: id,
        change_type: CHANGE_TYPE.STATUS_CHANGE,
        reason,
        changed_by_id: userId,
      });

      await queryRunner.commitTransaction();
      return this.repository.findById(id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * 계약 갱신 + 이력 기록
   *
   * 종료일 연장 처리
   */
  async renewContract(
    id: number,
    newEndDate: Date,
    reason: string,
    userId: number
  ) {
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.startTransaction();

      const contract = await this.repository.findById(id);
      if (!contract) {
        throw new Error(`Contract not found: ${id}`);
      }

      const oldEndDate = contract.end_date;

      // Update contract
      await this.repository.update(id, {
        end_date: newEndDate,
        contract_status: CONTRACT_STATUS.ACTIVE,
        updated_by_id: userId,
      });

      // Add history record
      await this.repository.addHistory({
        maintenance_contract_id: id,
        change_type: CHANGE_TYPE.RENEWAL,
        previous_end_date: oldEndDate,
        new_end_date: newEndDate,
        reason,
        changed_by_id: userId,
      });

      await queryRunner.commitTransaction();
      return this.repository.findById(id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * 계약 삭제 (Soft Delete + Cascade)
   */
  async deleteContract(id: number) {
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.startTransaction();

      // Cascade soft delete (contract → attachments, histories)
      await this.repository.softDeleteContract(id);

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * 계약 목록 조회 (페이지네이션 + 필터)
   */
  async getContracts(filters: any = {}, pagination: any = {}) {
    return this.repository.findActiveContracts(filters, {
      page: pagination.page || 1,
      limit: pagination.limit || 20,
    });
  }

  /**
   * 계약 상세 조회
   */
  async getContractDetail(id: number) {
    return this.repository.findById(id);
  }

  /**
   * 첨부파일 추가
   */
  async addAttachment(
    contractId: number,
    data: {
      file_name: string;
      file_path: string;
      file_size: number;
      uploaded_by_id: number;
    }
  ) {
    const contract = await this.repository.findById(contractId);
    if (!contract) {
      throw new Error(`Contract not found: ${contractId}`);
    }

    return this.repository.addAttachment({
      maintenance_contract_id: contractId,
      ...data,
    });
  }

  /**
   * 첨부파일 목록 조회
   */
  async getAttachments(contractId: number) {
    return this.repository.findAttachments(contractId);
  }

  /**
   * 이력 목록 조회
   */
  async getHistories(
    contractId: number,
    pagination: any = {}
  ) {
    return this.repository.findHistories(contractId, {
      page: pagination.page || 1,
      limit: pagination.limit || 20,
    });
  }

  /**
   * 통계 조회 (상태별 계약 수)
   */
  async getStats() {
    const [activeCount, terminatedCount, renewalPendingCount] = await Promise.all(
      [
        this.repository.countByStatus(CONTRACT_STATUS.ACTIVE),
        this.repository.countByStatus(CONTRACT_STATUS.TERMINATED),
        this.repository.countByStatus(CONTRACT_STATUS.RENEWAL_PENDING),
      ]
    );

    return {
      byStatus: {
        [CONTRACT_STATUS.ACTIVE]: activeCount,
        [CONTRACT_STATUS.TERMINATED]: terminatedCount,
        [CONTRACT_STATUS.RENEWAL_PENDING]: renewalPendingCount,
      },
      total: activeCount + terminatedCount + renewalPendingCount,
    };
  }
}
