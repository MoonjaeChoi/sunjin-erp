// Generated: 2026-01-27 21:45:00 KST

'use client';

import { useState, useCallback } from 'react';

type ModalType = 'create' | 'edit' | 'status-change' | 'delete' | null;

/**
 * 유지보수 계약 모달 상태 관리 훅
 * - 모달 오픈/클로즈 상태
 * - 선택된 계약 ID
 * - 각 모달 오픈/클로즈 메서드
 */
export function useMaintenanceModals() {
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [selectedContractId, setSelectedContractId] = useState<number | null>(null);

  const openCreateModal = useCallback(() => {
    setActiveModal('create');
    setSelectedContractId(null);
  }, []);

  const openEditModal = useCallback((contractId: number) => {
    setActiveModal('edit');
    setSelectedContractId(contractId);
  }, []);

  const openStatusChangeModal = useCallback((contractId: number) => {
    setActiveModal('status-change');
    setSelectedContractId(contractId);
  }, []);

  const openDeleteModal = useCallback((contractId: number) => {
    setActiveModal('delete');
    setSelectedContractId(contractId);
  }, []);

  const closeModal = useCallback(() => {
    setActiveModal(null);
    setSelectedContractId(null);
  }, []);

  return {
    activeModal,
    selectedContractId,
    openCreateModal,
    openEditModal,
    openStatusChangeModal,
    openDeleteModal,
    closeModal,
  };
}
