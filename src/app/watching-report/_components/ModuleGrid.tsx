// Generated: 2026-02-24 20:00:00 KST
'use client';

import { WatchingModule } from './_data/modules';
import { ModuleCard } from './ModuleCard';

interface ModuleGridProps {
  modules: WatchingModule[];
  selectedModuleId: string | null;
  onSelectModule: (moduleId: string) => void;
}

export function ModuleGrid({ modules, selectedModuleId, onSelectModule }: ModuleGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
      {modules.map((module) => (
        <ModuleCard
          key={module.id}
          module={module}
          isSelected={selectedModuleId === module.id}
          onClick={() => onSelectModule(module.id)}
        />
      ))}
    </div>
  );
}
