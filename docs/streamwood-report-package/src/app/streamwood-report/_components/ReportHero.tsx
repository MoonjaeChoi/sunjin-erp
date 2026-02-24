// Generated: 2026-02-24 20:00:00 KST
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { TOTAL_SECTIONS } from './_data/modules';

const TOTAL_MODULES = 13;

export function ReportHero() {
  return (
    <Card className="border-0 bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 dark:from-indigo-950/30 dark:via-blue-950/30 dark:to-purple-950/30 shadow-sm">
      <CardContent className="p-6 md:p-8">
        <div className="flex items-start gap-4">
          <div className="text-4xl">⛪</div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 leading-tight">
              엘리에셀 교회 관리 시스템
            </h1>
            <p className="text-lg font-medium text-indigo-600 dark:text-indigo-400 mt-1">
              streamwood
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              교회 교인 정보, 출결, 심방, 보고, 통계 등 교회 행정 업무 전반을 웹 기반으로
              통합 관리하는 교회 관리 SaaS 플랫폼
            </p>

            <div className="flex flex-wrap gap-2 mt-4">
              <div className="flex items-center gap-1.5 bg-white dark:bg-gray-800 rounded-lg px-3 py-1.5 shadow-sm border border-gray-100 dark:border-gray-700">
                <span className="text-indigo-500 font-bold text-lg">{TOTAL_MODULES}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">개 모듈</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white dark:bg-gray-800 rounded-lg px-3 py-1.5 shadow-sm border border-gray-100 dark:border-gray-700">
                <span className="text-purple-500 font-bold text-lg">{TOTAL_SECTIONS}+</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">개 기능</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white dark:bg-gray-800 rounded-lg px-3 py-1.5 shadow-sm border border-gray-100 dark:border-gray-700">
                <span className="text-blue-500 font-bold text-sm">SaaS</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">플랫폼</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white dark:bg-gray-800 rounded-lg px-3 py-1.5 shadow-sm border border-gray-100 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-300 text-xs font-medium">2026.02.24</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 mt-4">
              {['교인관리', '출결', '심방', '보고', '통계', '교구사역', 'SMS', '게시판'].map(
                (tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="text-xs bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 border-0"
                  >
                    #{tag}
                  </Badge>
                ),
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
