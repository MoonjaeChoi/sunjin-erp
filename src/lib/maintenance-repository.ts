// Generated: 2026-01-27 16:15:00 KST

import { DataSource, Repository, IsNull } from 'typeorm';
import { MaintenanceContract } from '../entities/MaintenanceContract';
import { MaintenanceContractAttachment } from '../entities/MaintenanceContractAttachment';
import { MaintenanceContractHistory } from '../entities/MaintenanceContractHistory';

/**
 * Maintenance Contract Repository
 *
 * 유지보수 계약 관련 데이터 액세스를 담당합니다.
 * - 모든 쿼리에서 soft delete 필터링 적용 (deleted_at IS NULL)
 * - QueryBuilder 기반 쿼리 작성
 * - 관계 데이터 eager loading
 */
export class MaintenanceContractRepository {
  private contractRepo: Repository<MaintenanceContract>;
  private attachmentRepo: Repository<MaintenanceContractAttachment>;
  private historyRepo: Repository<MaintenanceContractHistory>;

  constructor(dataSource: DataSource) {
    this.contractRepo = dataSource.getRepository(MaintenanceContract);
    this.attachmentRepo = dataSource.getRepository(
      MaintenanceContractAttachment
    );
    this.historyRepo = dataSource.getRepository(MaintenanceContractHistory);
  }

  /**
   * 활성 계약 목록 조회 (페이지네이션 + 필터)
   */
  async findActiveContracts(
    filters: {
      status?: string;
      customerId?: number;
      assignedEmployeeId?: number;
      contractNameSearch?: string;
      startDateFrom?: Date;
      startDateTo?: Date;
      endDateFrom?: Date;
      endDateTo?: Date;
      sortBy?: string;
      sortOrder?: 'ASC' | 'DESC';
    } = {},
    pagination: { page: number; limit: number } = { page: 1, limit: 20 }
  ) {
    let query = this.contractRepo
      .createQueryBuilder('mc')
      .leftJoinAndSelect('mc.customer', 'customer')
      .leftJoinAndSelect('mc.assignedEmployee', 'employee')
      .leftJoinAndSelect('mc.createdBy', 'createdBy')
      .where({ deleted_at: IsNull() }); // Soft delete filter

    // Apply filters
    if (filters.status) {
      query = query.andWhere('mc.contract_status = :status', {
        status: filters.status,
      });
    }

    if (filters.customerId) {
      query = query.andWhere('mc.customer_id = :customerId', {
        customerId: filters.customerId,
      });
    }

    if (filters.assignedEmployeeId) {
      query = query.andWhere('mc.assigned_employee_id = :employeeId', {
        employeeId: filters.assignedEmployeeId,
      });
    }

    if (filters.contractNameSearch) {
      query = query.andWhere('LOWER(mc.contract_name) LIKE LOWER(:search)', {
        search: `%${filters.contractNameSearch}%`,
      });
    }

    if (filters.startDateFrom) {
      query = query.andWhere('mc.start_date >= :startDateFrom', {
        startDateFrom: filters.startDateFrom,
      });
    }

    if (filters.startDateTo) {
      query = query.andWhere('mc.start_date <= :startDateTo', {
        startDateTo: filters.startDateTo,
      });
    }

    if (filters.endDateFrom) {
      query = query.andWhere('mc.end_date >= :endDateFrom', {
        endDateFrom: filters.endDateFrom,
      });
    }

    if (filters.endDateTo) {
      query = query.andWhere('mc.end_date <= :endDateTo', {
        endDateTo: filters.endDateTo,
      });
    }

    // Apply sorting
    const sortBy = filters.sortBy || 'mc.created_at';
    const sortOrder = filters.sortOrder || 'DESC';
    query = query.orderBy(sortBy, sortOrder);

    // Apply pagination
    const offset = (pagination.page - 1) * pagination.limit;
    return query.skip(offset).take(pagination.limit).getManyAndCount();
  }

  /**
   * ID로 계약 조회 (상세정보 + 첨부파일 + 이력)
   */
  async findById(id: number) {
    return this.contractRepo
      .createQueryBuilder('mc')
      .leftJoinAndSelect('mc.customer', 'customer')
      .leftJoinAndSelect('mc.assignedEmployee', 'employee')
      .leftJoinAndSelect('mc.createdBy', 'createdBy')
      .leftJoinAndSelect('mc.updatedBy', 'updatedBy')
      .leftJoinAndSelect('mc.attachments', 'attachments')
      .leftJoinAndSelect('mc.histories', 'histories')
      .where('mc.id = :id', { id })
      .andWhere('mc.deleted_at IS NULL')
      .getOne();
  }

  /**
   * 계약 생성
   */
  async create(data: Partial<MaintenanceContract>) {
    const contract = this.contractRepo.create(data);
    return this.contractRepo.save(contract);
  }

  /**
   * 계약 수정 (활성 계약만)
   */
  async update(id: number, data: Partial<MaintenanceContract>) {
    await this.contractRepo.update(
      { id, deleted_at: IsNull() },
      {
        ...data,
        updated_at: new Date(),
      }
    );
    return this.findById(id);
  }

  /**
   * 계약 Soft Delete (Cascade: 첨부파일, 이력도 함께 삭제)
   */
  async softDeleteContract(id: number) {
    const now = new Date();

    // Cascade soft delete
    await this.contractRepo.update(
      { id, deleted_at: IsNull() },
      { deleted_at: now }
    );

    await this.attachmentRepo.update(
      { maintenance_contract_id: id, deleted_at: IsNull() },
      { deleted_at: now }
    );

    await this.historyRepo.update(
      { maintenance_contract_id: id, deleted_at: IsNull() },
      { deleted_at: now }
    );
  }

  /**
   * 첨부파일 추가
   */
  async addAttachment(data: Partial<MaintenanceContractAttachment>) {
    const attachment = this.attachmentRepo.create(data);
    return this.attachmentRepo.save(attachment);
  }

  /**
   * 첨부파일 목록 조회 (활성만)
   */
  async findAttachments(contractId: number) {
    return this.attachmentRepo.find({
      where: {
        maintenance_contract_id: contractId,
        deleted_at: IsNull(),
      },
      relations: ['uploadedBy'],
    });
  }

  /**
   * 이력 추가
   */
  async addHistory(data: Partial<MaintenanceContractHistory>) {
    const history = this.historyRepo.create(data);
    return this.historyRepo.save(history);
  }

  /**
   * 이력 목록 조회 (활성만)
   */
  async findHistories(
    contractId: number,
    pagination: { page: number; limit: number } = { page: 1, limit: 20 }
  ) {
    const offset = (pagination.page - 1) * pagination.limit;
    return this.historyRepo.find({
      where: {
        maintenance_contract_id: contractId,
        deleted_at: IsNull(),
      },
      relations: ['changedBy'],
      order: { changed_at: 'DESC' },
      skip: offset,
      take: pagination.limit,
    });
  }

  /**
   * 계약 존재 여부 확인 (활성만)
   */
  async exists(id: number) {
    const count = await this.contractRepo.count({
      where: {
        id,
        deleted_at: IsNull(),
      },
    });
    return count > 0;
  }

  /**
   * 고객의 활성 계약 수 조회
   */
  async countByCustomer(customerId: number) {
    return this.contractRepo.count({
      where: {
        customer_id: customerId,
        deleted_at: IsNull(),
      },
    });
  }

  /**
   * 상태별 계약 수 조회
   */
  async countByStatus(status: any) {
    return this.contractRepo.count({
      where: {
        contract_status: status as any,
        deleted_at: IsNull(),
      },
    });
  }

  /**
   * 만료 예정 계약 조회 (30일 이내)
   */
  async findExpiringContracts(daysUntilExpiry: number = 30) {
    const today = new Date();
    const expiryDate = new Date(today.getTime() + daysUntilExpiry * 24 * 60 * 60 * 1000);

    return this.contractRepo.find({
      where: {
        contract_status: '활성',
        deleted_at: IsNull(),
      },
      relations: ['customer', 'assignedEmployee'],
    });
    // Note: Filtering by date should be done in application layer
    // due to TypeORM limitations with date comparisons on Oracle
  }
}
