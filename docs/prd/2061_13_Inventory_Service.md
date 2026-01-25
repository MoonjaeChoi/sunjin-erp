<!-- Generated: 2026-01-25 21:30:00 KST -->

# Inventory Service (비즈니스 로직)

**문서 번호**: 2061_13
**원본 PRD**: 2061_재고_관리_prd_v2.md (Section 3, 3.1)
**구현 범위**: `src/lib/inventory-service.ts`
**복잡도**: S
**의존성**: 2061_12 (Types)

---

## 구현 목표

재고 관리의 핵심 비즈니스 로직(상태 전이 검증, 과기 판정)을 중앙 집중식 서비스로 구현한다. API 핸들러와 프론트엔드 컴포넌트에서 재사용 가능한 유틸리티를 제공한다.

---

## 구현 내용

### 파일 구조

```
src/lib/
└── inventory-service.ts        # Inventory 비즈니스 로직
```

### 구현 상세

```typescript
// src/lib/inventory-service.ts

import { InventoryStatus } from '@/types/inventory';

export class InventoryService {
  /**
   * 상태 전이 규칙 검증
   * 
   * 규칙:
   * - 재고 ↔ 출고 (반납 가능)
   * - 재고/출고 → 고장 (가능)
   * - 고장 → 폐기 (유일한 경로)
   * - 폐기 → 변경 불가 (최종 상태)
   * - 출고 → 폐기 (불가, 반납 후에만)
   */
  static validateStateTransition(
    currentStatus: InventoryStatus,
    newStatus: InventoryStatus
  ): { valid: boolean; error?: string } {
    // 재고 → 출고 (O)
    if (currentStatus === '재고' && newStatus === '출고') {
      return { valid: true };
    }

    // 출고 → 재고 (O, 반납)
    if (currentStatus === '출고' && newStatus === '재고') {
      return { valid: true };
    }

    // 재고 → 고장 (O)
    if (currentStatus === '재고' && newStatus === '고장') {
      return { valid: true };
    }

    // 출고 → 고장 (O, 사용 중 고장)
    if (currentStatus === '출고' && newStatus === '고장') {
      return { valid: true };
    }

    // 고장 → 폐기 (O, 유일한 경로)
    if (currentStatus === '고장' && newStatus === '폐기') {
      return { valid: true };
    }

    // 폐기는 최종 상태 (X)
    if (currentStatus === '폐기') {
      return { valid: false, error: '폐기된 장비는 상태 변경 불가' };
    }

    // 출고 → 폐기 (X, 반납 후에만)
    if (currentStatus === '출고' && newStatus === '폐기') {
      return {
        valid: false,
        error: '출고 상태에서는 폐기로 변경 불가. 반납 후 진행하세요.',
      };
    }

    // 기타 불가능한 전이
    return { valid: false, error: '허용되지 않는 상태 전이입니다' };
  }

  /**
   * 위치 변경 가능 여부 검증
   * 재고 상태에서만 위치 변경 가능
   */
  static canRelocate(currentStatus: InventoryStatus): boolean {
    return currentStatus === '재고';
  }

  /**
   * 과기 판정 (Overdue Status)
   * 조건: status = '출고' AND expected_checkin_date < today
   */
  static calculateOverdueStatus(
    currentStatus: InventoryStatus,
    expectedCheckinDate: Date | null
  ): { is_overdue: boolean; overdue_days: number | null } {
    if (currentStatus !== '출고' || !expectedCheckinDate) {
      return { is_overdue: false, overdue_days: null };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expectedDate = new Date(expectedCheckinDate);
    expectedDate.setHours(0, 0, 0, 0);

    if (expectedDate >= today) {
      return { is_overdue: false, overdue_days: null };
    }

    // 과기 일수 계산
    const diffTime = today.getTime() - expectedDate.getTime();
    const overdue_days = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    return { is_overdue: true, overdue_days };
  }

  /**
   * 출고 가능 여부 검증
   * 재고 상태에서만 출고 가능
   */
  static canCheckout(currentStatus: InventoryStatus): boolean {
    return currentStatus === '재고';
  }

  /**
   * 반납 가능 여부 검증
   * 출고 상태에서만 반납 가능
   */
  static canCheckin(currentStatus: InventoryStatus): boolean {
    return currentStatus === '출고';
  }

  /**
   * 상태 변경 가능 여부 검증
   * 고장/폐기로 변경 가능 여부 확인
   */
  static canChangeStatus(
    currentStatus: InventoryStatus,
    newStatus: string
  ): boolean {
    if (!['고장', '폐기'].includes(newStatus)) {
      return false;
    }

    const validation = this.validateStateTransition(
      currentStatus,
      newStatus as InventoryStatus
    );
    return validation.valid;
  }

  /**
   * 작업 가능 여부 정리
   */
  static getAvailableActions(currentStatus: InventoryStatus): {
    canCheckout: boolean;
    canCheckin: boolean;
    canRelocate: boolean;
    canChangeStatus: boolean;
  } {
    return {
      canCheckout: this.canCheckout(currentStatus),
      canCheckin: this.canCheckin(currentStatus),
      canRelocate: this.canRelocate(currentStatus),
      canChangeStatus: currentStatus !== '폐기',
    };
  }
}
```

---

## 상태 전이 다이어그램

```
[재고 (In Stock)]
├─→ [출고 (Checked Out)] ──→ [재고] (반납 시)
│                       └──→ [고장] (사용 중 고장 시)
├─→ [고장 (Broken)] ──→ [폐기] (유일한 경로)
└─→ [폐기 (Deprecated)] ──→ FINAL (변경 불가)
```

---

## 핵심 메서드

| 메서드 | 용도 | 반환값 |
|--------|------|--------|
| validateStateTransition | 상태 전이 검증 | `{ valid: boolean; error?: string }` |
| canCheckout | 출고 가능 여부 | `boolean` |
| canCheckin | 반납 가능 여부 | `boolean` |
| canRelocate | 위치변경 가능 여부 | `boolean` |
| canChangeStatus | 상태변경 가능 여부 | `boolean` |
| calculateOverdueStatus | 과기 판정 | `{ is_overdue: boolean; overdue_days: number \| null }` |
| getAvailableActions | 가능한 모든 작업 | 액션 boolean 객체 |

---

## Acceptance Criteria

- [ ] `src/lib/inventory-service.ts` 파일 생성
- [ ] validateStateTransition 메서드 구현 (모든 규칙)
- [ ] canCheckout 메서드 구현 (재고 상태만)
- [ ] canCheckin 메서드 구현 (출고 상태만)
- [ ] canRelocate 메서드 구현 (재고 상태만)
- [ ] canChangeStatus 메서드 구현 (고장/폐기)
- [ ] calculateOverdueStatus 메서드 구현 (과기 판정)
- [ ] getAvailableActions 메서드 구현 (종합)
- [ ] 모든 상태 전이 규칙 100% 구현
- [ ] 과기 판정 로직 정확성 (일수 계산 포함)
- [ ] TypeScript 컴파일 에러 없음

---

## 테스트 전략

```typescript
describe('InventoryService', () => {
  describe('validateStateTransition', () => {
    it('should allow 재고 → 출고', () => {
      const result = InventoryService.validateStateTransition('재고', '출고');
      expect(result.valid).toBe(true);
    });

    it('should allow 출고 → 재고', () => {
      const result = InventoryService.validateStateTransition('출고', '재고');
      expect(result.valid).toBe(true);
    });

    it('should deny 출고 → 폐기', () => {
      const result = InventoryService.validateStateTransition('출고', '폐기');
      expect(result.valid).toBe(false);
    });

    it('should deny 폐기 → 고장', () => {
      const result = InventoryService.validateStateTransition('폐기', '고장');
      expect(result.valid).toBe(false);
    });
  });

  describe('calculateOverdueStatus', () => {
    it('should return is_overdue=true when expected_checkin_date < today', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 5);

      const result = InventoryService.calculateOverdueStatus('출고', yesterday);
      expect(result.is_overdue).toBe(true);
      expect(result.overdue_days).toBe(5);
    });

    it('should return is_overdue=false for 재고 status', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 5);

      const result = InventoryService.calculateOverdueStatus('재고', yesterday);
      expect(result.is_overdue).toBe(false);
    });
  });
});
```

---

**다음 문서**: 2061_14_TanStack_Query_Hooks.md
