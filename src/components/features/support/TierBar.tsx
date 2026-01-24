// Generated: 2026-01-25 06:30:00 KST

'use client';

import React from 'react';
import { Check } from 'lucide-react';
import { isValidStatusTransition } from '@/types/tech-support';
import type { SupportStatus } from '@/types/tech-support';
import { cn } from '@/lib/utils';

interface TierBarProps {
  status: SupportStatus;
  canEdit: boolean;
  role: string;
  onStatusChange: (newStatus: SupportStatus) => void;
}

const STEPS: { value: SupportStatus; label: string; activeColor: string; barColor: string }[] = [
  { value: 'RECEIVED', label: '접수', activeColor: 'bg-gray-500', barColor: 'bg-gray-500' },
  { value: 'IN_PROGRESS', label: '진행', activeColor: 'bg-blue-500', barColor: 'bg-blue-500' },
  { value: 'COMPLETED', label: '완료', activeColor: 'bg-green-500', barColor: 'bg-green-500' },
];

export function TierBar({ status, canEdit, role, onStatusChange }: TierBarProps) {
  const currentIndex = STEPS.findIndex((s) => s.value === status);

  const handleClick = (targetStatus: SupportStatus) => {
    if (!canEdit) return;
    if (targetStatus === status) return;
    if (!isValidStatusTransition(status, targetStatus, role)) return;
    onStatusChange(targetStatus);
  };

  return (
    <div className="flex items-center w-full py-2">
      {STEPS.map((step, idx) => {
        const isCompleted = idx < currentIndex;
        const isCurrent = idx === currentIndex;
        const canTransition = canEdit && step.value !== status && isValidStatusTransition(status, step.value, role);

        return (
          <React.Fragment key={step.value}>
            {idx > 0 && (
              <div className={cn('h-1 flex-1', isCompleted ? step.barColor : 'bg-gray-200')} />
            )}
            <div className="flex flex-col items-center gap-1">
              <button
                type="button"
                onClick={() => handleClick(step.value)}
                disabled={!canTransition}
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all',
                  isCurrent && `${step.activeColor} text-white ring-2 ring-offset-2 ring-${step.activeColor}`,
                  isCompleted && `${step.activeColor} text-white`,
                  !isCompleted && !isCurrent && 'bg-gray-200 text-gray-500',
                  canTransition && 'cursor-pointer hover:ring-2 hover:ring-offset-1 hover:ring-gray-400',
                  !canTransition && !isCurrent && 'cursor-not-allowed',
                )}
              >
                {isCompleted ? <Check className="h-4 w-4" /> : idx + 1}
              </button>
              <span className={cn(
                'text-xs',
                (isCurrent || isCompleted) ? 'font-medium text-foreground' : 'text-muted-foreground'
              )}>
                {step.label}
              </span>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}
