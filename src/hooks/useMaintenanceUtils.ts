// Generated: 2026-01-27 00:45:00 KST

'use client';

import { useMemo, useCallback, useState, useEffect, ReactNode } from 'react';
import { ContractStatus, ChangeType, ContractStatsResponse, StatusBadgeProps, ExpiryWarningProps } from '@/types/maintenance';
import { VALID_STATUS_TRANSITIONS } from '../lib/maintenance-constants';
import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';

// ============================================================================
// useStatusBadge Hook
// ============================================================================

/**
 * 계약 상태를 UI 배지 형식으로 변환
 */
export function useStatusBadge(status: ContractStatus): Omit<StatusBadgeProps, 'icon'> & { icon?: any } {
  return useMemo(() => {
    const badgeMap: Record<ContractStatus, Omit<StatusBadgeProps, 'icon'> & { icon?: any }> = {
      '활성': {
        status,
        label: '활성',
        color: 'success',
        icon: CheckCircle,
      },
      '종료': {
        status,
        label: '종료',
        color: 'destructive',
        icon: XCircle,
      },
      '갱신예정': {
        status,
        label: '갱신예정',
        color: 'warning',
        icon: Clock,
      },
    };

    return badgeMap[status];
  }, [status]);
}

// ============================================================================
// useExpiryWarning Hook
// ============================================================================

/**
 * 계약 만료일 기준 경고 레벨 계산
 * Note: Uses useEffect to avoid hydration mismatch (new Date() differs server/client)
 */
export function useExpiryWarning(endDate: Date | string): ExpiryWarningProps | null {
  const [expiryWarning, setExpiryWarning] = useState<ExpiryWarningProps | null>(null);

  useEffect(() => {
    const end = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    const daysUntilExpiry = Math.floor((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    let level: 'safe' | 'soon' | 'warning' | 'danger';
    let message: string;

    if (daysUntilExpiry < 0) {
      level = 'danger';
      message = `${Math.abs(daysUntilExpiry)}일 만료됨`;
    } else if (daysUntilExpiry < 7) {
      level = 'danger';
      message = `${daysUntilExpiry}일 남음`;
    } else if (daysUntilExpiry < 30) {
      level = 'warning';
      message = `${daysUntilExpiry}일 남음`;
    } else if (daysUntilExpiry < 60) {
      level = 'soon';
      message = `${Math.floor(daysUntilExpiry / 7)}주 남음`;
    } else {
      level = 'safe';
      message = '안전함';
    }

    setExpiryWarning({
      endDate,
      daysUntilExpiry,
      level,
      message,
    });
  }, [endDate]);

  return expiryWarning;
}

// ============================================================================
// useFileUpload Hook
// ============================================================================

/**
 * 파일 업로드 처리 (검증 + 진행률)
 */
export function useFileUpload(onUpload?: (file: File) => Promise<void>) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);

  const upload = useCallback(
    async (file: File) => {
      setUploading(true);
      setError(null);
      setProgress(0);

      try {
        // 파일 유효성 검증
        const validTypes = [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];

        if (!validTypes.includes(file.type) && !['.pdf', '.doc', '.docx'].includes(file.name.toLowerCase().substring(file.name.lastIndexOf('.')))) {
          throw new Error('PDF, DOC, DOCX 파일만 업로드 가능합니다');
        }

        const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
        if (file.size > MAX_FILE_SIZE) {
          throw new Error('파일 크기는 10MB 이하여야 합니다');
        }

        setProgress(20);

        // 업로드 실행
        if (onUpload) {
          await onUpload(file);
        }

        setProgress(100);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('파일 업로드 실패'));
        setProgress(0);
      } finally {
        setUploading(false);
      }
    },
    [onUpload]
  );

  const cancel = useCallback(() => {
    setUploading(false);
    setProgress(0);
    setError(null);
  }, []);

  return { uploading, progress, error, upload, cancel };
}

// ============================================================================
// useStatusTransition Hook
// ============================================================================

/**
 * 현재 상태에서 가능한 다음 상태들 조회
 */
export function useStatusTransition(currentStatus: ContractStatus) {
  return useMemo(() => {
    const transitions = VALID_STATUS_TRANSITIONS as any;
    const validNextStatuses: ContractStatus[] = (transitions[currentStatus] || []) as ContractStatus[];

    return {
      validNextStatuses,
      canTransitionTo: (status: ContractStatus) => validNextStatuses.includes(status),
    };
  }, [currentStatus]);
}

// ============================================================================
// useDateFormatter Hook
// ============================================================================

/**
 * 날짜 포맷팅 (한글/영어)
 */
export function useDateFormatter(locale: 'ko' | 'en' = 'ko') {
  return useMemo(() => {
    const format = (date: Date | string, pattern?: string): string => {
      const d = new Date(date);

      if (locale === 'ko') {
        if (!pattern || pattern === 'full') {
          return d.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          });
        } else if (pattern === 'short') {
          return d.toLocaleDateString('ko-KR', {
            year: '2-digit',
            month: '2-digit',
            day: '2-digit',
          });
        } else if (pattern === 'year-month') {
          return d.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
          });
        }
      } else {
        if (!pattern || pattern === 'full') {
          return d.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          });
        } else if (pattern === 'short') {
          return d.toLocaleDateString('en-US', {
            year: '2-digit',
            month: '2-digit',
            day: '2-digit',
          });
        } else if (pattern === 'year-month') {
          return d.toLocaleDateString('en-US', {
            year: 'numeric',
            month: '2-digit',
          });
        }
      }

      return d.toISOString().split('T')[0];
    };

    return { format };
  }, [locale]);
}

// ============================================================================
// useContractStats Hook
// ============================================================================

/**
 * 통계 데이터 처리 및 차트 데이터 생성
 */
export function useContractStats(stats: ContractStatsResponse['data'] | null) {
  return useMemo(() => {
    if (!stats) {
      return {
        formattedStats: {
          activeCount: 0,
          terminatedCount: 0,
          renewalPendingCount: 0,
          activePercent: 0,
          terminatedPercent: 0,
          renewalPendingPercent: 0,
          total: 0,
          expiringIn30Days: 0,
          expiringIn60Days: 0,
        },
        chartData: {
          labels: [],
          datasets: [],
        },
      };
    }

    const { byStatus, expiringIn30Days, expiringIn60Days, total } = stats;

    const activeCount = byStatus['활성'] || 0;
    const terminatedCount = byStatus['종료'] || 0;
    const renewalPendingCount = byStatus['갱신예정'] || 0;

    const activePercent = total > 0 ? Math.round((activeCount / total) * 100) : 0;
    const terminatedPercent = total > 0 ? Math.round((terminatedCount / total) * 100) : 0;
    const renewalPendingPercent = total > 0 ? Math.round((renewalPendingCount / total) * 100) : 0;

    return {
      formattedStats: {
        activeCount,
        terminatedCount,
        renewalPendingCount,
        activePercent,
        terminatedPercent,
        renewalPendingPercent,
        total,
        expiringIn30Days,
        expiringIn60Days,
      },
      chartData: {
        labels: ['활성', '종료', '갱신예정'],
        datasets: [
          {
            label: '계약 수',
            data: [activeCount, terminatedCount, renewalPendingCount],
            backgroundColor: ['#10b981', '#ef4444', '#f59e0b'],
            borderColor: ['#059669', '#dc2626', '#d97706'],
            borderWidth: 1,
          },
        ],
      },
    };
  }, [stats]);
}

// ============================================================================
// useContractStatusColor Hook
// ============================================================================

/**
 * 상태별 색상 코드 조회
 */
export function useContractStatusColor(status: ContractStatus) {
  return useMemo(() => {
    const colorMap: Record<ContractStatus, { bg: string; text: string; border: string }> = {
      '활성': {
        bg: 'bg-green-50',
        text: 'text-green-700',
        border: 'border-green-200',
      },
      '종료': {
        bg: 'bg-red-50',
        text: 'text-red-700',
        border: 'border-red-200',
      },
      '갱신예정': {
        bg: 'bg-yellow-50',
        text: 'text-yellow-700',
        border: 'border-yellow-200',
      },
    };

    return colorMap[status];
  }, [status]);
}

// ============================================================================
// useChangeTypeIcon Hook
// ============================================================================

/**
 * 변경 유형별 아이콘 조회
 */
export function useChangeTypeIcon(changeType: ChangeType) {
  return useMemo(() => {
    const iconMap: Record<ChangeType, any> = {
      '갱신': Clock,
      '상태변경': AlertCircle,
      '정보수정': CheckCircle,
    };

    return iconMap[changeType] || AlertCircle;
  }, [changeType]);
}

// ============================================================================
// useDaysUntilExpiry Hook
// ============================================================================

/**
 * 만료까지 남은 일수 계산
 * Note: Uses useEffect to avoid hydration mismatch (new Date() differs server/client)
 */
export function useDaysUntilExpiry(endDate: Date | string): number | null {
  const [daysUntilExpiry, setDaysUntilExpiry] = useState<number | null>(null);

  useEffect(() => {
    const end = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    setDaysUntilExpiry(Math.floor((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
  }, [endDate]);

  return daysUntilExpiry;
}
