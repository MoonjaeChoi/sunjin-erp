// Generated: 2026-02-24 20:00:00 KST
import { Metadata } from 'next';
import { StreamwoodReportClient } from './_components/StreamwoodReportClient';

export const metadata: Metadata = {
  title: 'streamwood 시스템 보고서 | Sunjin ERP',
  description: '엘리에셀 교회 관리 시스템 streamwood 개발현황 보고서',
};

export default function WatchingReportPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <StreamwoodReportClient />
    </div>
  );
}
