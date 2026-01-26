// Generated: 2026-01-26 13:40:00 KST

import { InventoryStatus, InventoryStatusColor, InventoryStatusLabel, ChangeTypeLabel } from '@/types/inventory';

export class InventoryService {
  /**
   * 상태 전이 검증
   * 규칙:
   * - 재고 ↔ 출고 (양방향)
   * - 재고 → 고장, 폐기
   * - 출고 → 재고 (반납), 고장
   * - 고장 → 폐기 (유일한 경로)
   * - 폐기 → 최종 상태 (변경 불가)
   */
  static validateStateTransition(
    currentStatus: InventoryStatus,
    newStatus: InventoryStatus
  ): { valid: boolean; error?: string } {
    // 현재 상태가 폐기이면 변경 불가
    if (currentStatus === '폐기') {
      return { valid: false, error: '폐기된 장비는 상태를 변경할 수 없습니다' };
    }

    // 현재 상태와 새 상태가 같으면 유효
    if (currentStatus === newStatus) {
      return { valid: true };
    }

    // 상태별 전이 규칙
    const transitions: Record<InventoryStatus, InventoryStatus[]> = {
      '재고': ['출고', '고장', '폐기'],
      '출고': ['재고', '고장'],
      '고장': ['폐기'],
      '폐기': [], // 터미널 상태
    };

    const allowedTransitions = transitions[currentStatus];

    if (!allowedTransitions.includes(newStatus)) {
      return {
        valid: false,
        error: `${currentStatus} 상태에서 ${newStatus}로 변경할 수 없습니다`,
      };
    }

    return { valid: true };
  }

  /**
   * 과기 판정 (출고 상태에서 예정 반납일이 과거인 경우)
   */
  static calculateOverdueStatus(
    status: InventoryStatus,
    expectedCheckinDate?: string | null
  ): { isOverdue: boolean; overdueDays?: number } {
    if (status !== '출고' || !expectedCheckinDate) {
      return { isOverdue: false };
    }

    const checkinDate = new Date(expectedCheckinDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (checkinDate < today) {
      const diffTime = today.getTime() - checkinDate.getTime();
      const overdueDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      return { isOverdue: true, overdueDays };
    }

    return { isOverdue: false };
  }

  /**
   * 상태를 한글 라벨로 변환
   */
  static formatStatusForDisplay(status: InventoryStatus): string {
    return InventoryStatusLabel[status] || status;
  }

  /**
   * 이력 타입을 한글 라벨로 변환
   */
  static formatChangeTypeForDisplay(changeType: string): string {
    return (ChangeTypeLabel as Record<string, string>)[changeType] || changeType;
  }

  /**
   * 상태별 배경색, 텍스트색, 배지색 반환
   */
  static getStatusBadgeColor(status: InventoryStatus): { bg: string; text: string; badge: string } {
    return InventoryStatusColor[status] || InventoryStatusColor['재고'];
  }

  /**
   * 재고 편집 가능 여부 확인 (역할별)
   */
  static canEditInventory(status: InventoryStatus, userRole?: string): boolean {
    if (!userRole) return false;

    // ADMIN: 폐기 상태 제외하고 모두 수정 가능
    if (userRole === 'ADMIN') {
      return status !== '폐기';
    }

    // MANAGER: 폐기 상태 제외하고 모두 수정 가능
    if (userRole === 'MANAGER') {
      return status !== '폐기';
    }

    // USER: 수정 불가
    return false;
  }

  /**
   * 출고 가능 여부 확인
   */
  static canCheckout(status: InventoryStatus): boolean {
    return status === '재고';
  }

  /**
   * 반납 가능 여부 확인
   */
  static canCheckin(status: InventoryStatus): boolean {
    return status === '출고';
  }

  /**
   * 위치 변경 가능 여부 확인
   */
  static canRelocate(status: InventoryStatus): boolean {
    // 폐기 상태에서는 위치 변경 불가
    return status !== '폐기';
  }

  /**
   * 상태 변경 가능 여부 확인
   */
  static canChangeStatus(status: InventoryStatus, userRole?: string): boolean {
    if (!userRole) return false;

    // ADMIN만 상태 변경 가능
    if (userRole !== 'ADMIN') {
      return false;
    }

    // 폐기 상태에서는 변경 불가
    return status !== '폐기';
  }
}
