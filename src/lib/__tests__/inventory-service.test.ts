// Generated: 2026-01-26 17:45:00 KST

import { InventoryService } from '../inventory-service';
import { InventoryStatus } from '@/types/inventory';

describe('InventoryService', () => {
  describe('validateStateTransition', () => {
    test('should allow valid state transition: 재고 → 출고', () => {
      const result = InventoryService.validateStateTransition('재고', '출고');
      expect(result.valid).toBe(true);
    });

    test('should allow valid state transition: 재고 → 고장', () => {
      const result = InventoryService.validateStateTransition('재고', '고장');
      expect(result.valid).toBe(true);
    });

    test('should allow valid state transition: 재고 → 폐기', () => {
      const result = InventoryService.validateStateTransition('재고', '폐기');
      expect(result.valid).toBe(true);
    });

    test('should allow valid state transition: 출고 → 재고 (return)', () => {
      const result = InventoryService.validateStateTransition('출고', '재고');
      expect(result.valid).toBe(true);
    });

    test('should allow valid state transition: 출고 → 고장', () => {
      const result = InventoryService.validateStateTransition('출고', '고장');
      expect(result.valid).toBe(true);
    });

    test('should reject invalid state transition: 출고 → 폐기', () => {
      const result = InventoryService.validateStateTransition('출고', '폐기');
      expect(result.valid).toBe(false);
    });

    test('should allow valid state transition: 고장 → 폐기', () => {
      const result = InventoryService.validateStateTransition('고장', '폐기');
      expect(result.valid).toBe(true);
    });

    test('should reject invalid state transition: 폐기 → 재고', () => {
      const result = InventoryService.validateStateTransition('폐기', '재고');
      expect(result.valid).toBe(false);
    });

    test('should reject invalid state transition: 폐기 → 고장', () => {
      const result = InventoryService.validateStateTransition('폐기', '고장');
      expect(result.valid).toBe(false);
    });

    test('should allow same state transition', () => {
      const result = InventoryService.validateStateTransition('재고', '재고');
      expect(result.valid).toBe(true);
    });
  });

  describe('calculateOverdueStatus', () => {
    test('should detect overdue equipment', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 5);
      const result = InventoryService.calculateOverdueStatus('출고', pastDate.toISOString().split('T')[0]);
      expect(result.isOverdue).toBe(true);
      expect(result.overdueDays).toBeGreaterThanOrEqual(4); // Allow for timezone differences
    });

    test('should not mark as overdue for future date', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);
      const result = InventoryService.calculateOverdueStatus('출고', futureDate.toISOString().split('T')[0]);
      expect(result.isOverdue).toBe(false);
      // overdueDays is undefined when not overdue
    });

    test('should not mark as overdue if status is not 출고', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 5);
      const result = InventoryService.calculateOverdueStatus('재고', pastDate.toISOString().split('T')[0]);
      expect(result.isOverdue).toBe(false);
    });

    test('should handle empty expected_checkin_date', () => {
      const result = InventoryService.calculateOverdueStatus('출고', '');
      expect(result.isOverdue).toBe(false);
      // overdueDays is undefined when not overdue
    });
  });

  describe('formatStatusForDisplay', () => {
    test('should return korean label for 재고', () => {
      expect(InventoryService.formatStatusForDisplay('재고')).toBe('재고');
    });

    test('should return korean label for 출고', () => {
      expect(InventoryService.formatStatusForDisplay('출고')).toBe('출고');
    });

    test('should return korean label for 고장', () => {
      expect(InventoryService.formatStatusForDisplay('고장')).toBe('고장');
    });

    test('should return korean label for 폐기', () => {
      expect(InventoryService.formatStatusForDisplay('폐기')).toBe('폐기');
    });
  });

  describe('formatChangeTypeForDisplay', () => {
    test('should format inbound', () => {
      const result = InventoryService.formatChangeTypeForDisplay('inbound');
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });

    test('should format checkout', () => {
      const result = InventoryService.formatChangeTypeForDisplay('checkout');
      expect(result).toBeTruthy();
    });

    test('should format checkin', () => {
      const result = InventoryService.formatChangeTypeForDisplay('checkin');
      expect(result).toBeTruthy();
    });

    test('should format relocate', () => {
      const result = InventoryService.formatChangeTypeForDisplay('relocate');
      expect(result).toBeTruthy();
    });

    test('should format status_change', () => {
      const result = InventoryService.formatChangeTypeForDisplay('status_change');
      expect(result).toBeTruthy();
    });
  });

  describe('getStatusBadgeColor', () => {
    test('should return color object for 재고', () => {
      const color = InventoryService.getStatusBadgeColor('재고');
      expect(color).toHaveProperty('bg');
      expect(color).toHaveProperty('text');
      expect(color).toHaveProperty('badge');
    });

    test('should return different colors for different statuses', () => {
      const color1 = InventoryService.getStatusBadgeColor('재고');
      const color2 = InventoryService.getStatusBadgeColor('출고');
      expect(color1).not.toEqual(color2);
    });
  });

  describe('canEditInventory', () => {
    test('should allow edit for 재고 status with MANAGER role', () => {
      expect(InventoryService.canEditInventory('재고', 'MANAGER')).toBe(true);
    });

    test('should allow edit for 재고 status with ADMIN role', () => {
      expect(InventoryService.canEditInventory('재고', 'ADMIN')).toBe(true);
    });

    test('should deny edit for 폐기 status', () => {
      expect(InventoryService.canEditInventory('폐기', 'ADMIN')).toBe(false);
    });

    test('should deny edit for USER role', () => {
      expect(InventoryService.canEditInventory('재고', 'USER')).toBe(false);
    });
  });

  describe('canCheckout', () => {
    test('should allow checkout for 재고 status', () => {
      expect(InventoryService.canCheckout('재고')).toBe(true);
    });

    test('should deny checkout for 출고 status', () => {
      expect(InventoryService.canCheckout('출고')).toBe(false);
    });

    test('should deny checkout for 고장 status', () => {
      expect(InventoryService.canCheckout('고장')).toBe(false);
    });

    test('should deny checkout for 폐기 status', () => {
      expect(InventoryService.canCheckout('폐기')).toBe(false);
    });
  });

  describe('canCheckin', () => {
    test('should allow checkin for 출고 status', () => {
      expect(InventoryService.canCheckin('출고')).toBe(true);
    });

    test('should deny checkin for 재고 status', () => {
      expect(InventoryService.canCheckin('재고')).toBe(false);
    });

    test('should deny checkin for other statuses', () => {
      expect(InventoryService.canCheckin('고장')).toBe(false);
      expect(InventoryService.canCheckin('폐기')).toBe(false);
    });
  });

  describe('canRelocate', () => {
    test('should allow relocation for 재고 status', () => {
      expect(InventoryService.canRelocate('재고')).toBe(true);
    });

    test('should allow relocation for 출고 status', () => {
      expect(InventoryService.canRelocate('출고')).toBe(true);
    });

    test('should allow relocation for 고장 status', () => {
      expect(InventoryService.canRelocate('고장')).toBe(true);
    });

    test('should deny relocation for 폐기 status', () => {
      expect(InventoryService.canRelocate('폐기')).toBe(false);
    });
  });

  describe('canChangeStatus', () => {
    test('should deny if user is not ADMIN', () => {
      expect(InventoryService.canChangeStatus('재고', 'USER')).toBe(false);
      expect(InventoryService.canChangeStatus('재고', 'MANAGER')).toBe(false);
    });

    test('should allow if user is ADMIN and status is not 폐기', () => {
      expect(InventoryService.canChangeStatus('재고', 'ADMIN')).toBe(true);
      expect(InventoryService.canChangeStatus('출고', 'ADMIN')).toBe(true);
    });

    test('should deny if status is 폐기', () => {
      expect(InventoryService.canChangeStatus('폐기', 'ADMIN')).toBe(false);
    });
  });
});
