// Generated: 2026-01-26 22:45:00 KST

import { MaintenanceContractService } from '../maintenance-service';
import { MaintenanceContractRepository } from '../maintenance-repository';
import { CONTRACT_STATUS, CHANGE_TYPE } from '../maintenance-constants';

/**
 * Mock DataSource
 */
const mockDataSource = {
  getRepository: jest.fn(),
  createQueryRunner: jest.fn(() => ({
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    query: jest.fn(),
  })),
};

describe('MaintenanceContractService', () => {
  let service: MaintenanceContractService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new MaintenanceContractService(mockDataSource as any);
  });

  describe('Constants', () => {
    test('should define CONTRACT_STATUS constants', () => {
      expect(CONTRACT_STATUS.ACTIVE).toBe('활성');
      expect(CONTRACT_STATUS.TERMINATED).toBe('종료');
      expect(CONTRACT_STATUS.RENEWAL_PENDING).toBe('갱신예정');
    });

    test('should define CHANGE_TYPE constants', () => {
      expect(CHANGE_TYPE.RENEWAL).toBe('갱신');
      expect(CHANGE_TYPE.STATUS_CHANGE).toBe('상태변경');
      expect(CHANGE_TYPE.INFO_UPDATE).toBe('정보수정');
    });
  });

  describe('Service Instantiation', () => {
    test('should create service instance', () => {
      expect(service).toBeDefined();
      expect(service).toBeInstanceOf(MaintenanceContractService);
    });
  });

  describe('Repository Integration', () => {
    test('should use MaintenanceContractRepository', () => {
      expect(service['repository']).toBeDefined();
      expect(service['repository']).toBeInstanceOf(
        MaintenanceContractRepository
      );
    });
  });
});
