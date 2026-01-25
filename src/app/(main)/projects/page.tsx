// Generated: 2026-01-25 15:35:00 KST

import { Metadata } from 'next';
import { ProjectPage } from '@/components/features/projects/ProjectPage';

export const metadata: Metadata = {
  title: '프로젝트 관리',
  description: '프로젝트 목록 및 상세 정보 관리',
};

/**
 * 프로젝트 목록 페이지
 * 서버 컴포넌트: 메타데이터 설정, 클라이언트 컴포넌트 렌더링
 */
export default function ProjectsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">프로젝트 관리</h1>
        <p className="mt-2 text-gray-600">프로젝트 현황을 조회하고 관리합니다.</p>
      </div>

      <ProjectPage initialPage={1} initialPageSize={20} />
    </div>
  );
}
