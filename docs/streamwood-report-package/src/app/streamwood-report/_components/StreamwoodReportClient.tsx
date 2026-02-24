// Generated: 2026-02-24 20:00:00 KST
'use client';

import { useState } from 'react';
import { STREAMWOOD_MODULES } from './_data/modules';
import { ReportHero } from './ReportHero';
import { ModuleGrid } from './ModuleGrid';
import { TableOfContents } from './TableOfContents';
import { SectionDetail } from './SectionDetail';

export function StreamwoodReportClient() {
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(STREAMWOOD_MODULES[0].id);

  const selectedModule = STREAMWOOD_MODULES.find((m) => m.id === selectedModuleId) ?? null;

  const handleSelectModule = (moduleId: string) => {
    setSelectedModuleId(moduleId);
    // Scroll to detail section on mobile
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setTimeout(() => {
        document.getElementById('section-detail')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  };

  return (
    <div className="space-y-6">
      <ReportHero />

      <div className="flex gap-6 items-start">
        <TableOfContents
          modules={STREAMWOOD_MODULES}
          selectedModuleId={selectedModuleId}
          onSelectModule={handleSelectModule}
        />

        <div className="flex-1 min-w-0 space-y-6">
          <section>
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              모듈 목록
            </h2>
            <ModuleGrid
              modules={STREAMWOOD_MODULES}
              selectedModuleId={selectedModuleId}
              onSelectModule={handleSelectModule}
            />
          </section>

          {selectedModule && (
            <section id="section-detail">
              <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                기능 상세
              </h2>
              <SectionDetail module={selectedModule} />
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
