// Generated: 2026-02-24 20:00:00 KST
import { Metadata } from 'next';
import { WatchingReportClient } from './_components/WatchingReportClient';

export const metadata: Metadata = {
  title: 'watching 시스템 보고서 | Sunjin ERP',
  description: '엘리에셀 교회 관리 시스템 watching 개발현황 보고서',
};

export default function WatchingReportPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <WatchingReportClient />
    </div>
  );
}
