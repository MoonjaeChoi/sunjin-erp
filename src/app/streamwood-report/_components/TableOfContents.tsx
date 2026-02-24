// Generated: 2026-02-24 20:00:00 KST
'use client';

import { StreamwoodModule } from './_data/modules';
import { cn } from '@/lib/utils';

interface TableOfContentsProps {
  modules: StreamwoodModule[];
  selectedModuleId: string | null;
  onSelectModule: (moduleId: string) => void;
}

export function TableOfContents({ modules, selectedModuleId, onSelectModule }: TableOfContentsProps) {
  return (
    <div className="w-48 flex-shrink-0 hidden lg:block">
      <div className="sticky top-4">
        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 px-2">
          목차
        </div>
        <div className="h-[calc(100vh-12rem)] overflow-y-auto">
          <nav className="space-y-0.5 pr-2">
            {modules.map((module) => (
              <button
                key={module.id}
                onClick={() => onSelectModule(module.id)}
                className={cn(
                  'w-full text-left px-2 py-1.5 rounded-md text-xs transition-colors',
                  selectedModuleId === module.id
                    ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 font-medium'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200',
                )}
              >
                <span className="text-gray-400 dark:text-gray-500 mr-1">
                  {String(module.number).padStart(2, '0')}.
                </span>
                {module.title}
              </button>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}
