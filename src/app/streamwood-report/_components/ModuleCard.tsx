// Generated: 2026-02-24 20:00:00 KST
'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Home,
  Users,
  ClipboardCheck,
  FileText,
  Heart,
  GraduationCap,
  BarChart3,
  Layers,
  MessageSquare,
  LayoutList,
  Settings,
  LucideIcon,
} from 'lucide-react';
import { StreamwoodModule } from './_data/modules';

const iconMap: Record<string, LucideIcon> = {
  Home,
  Users,
  ClipboardCheck,
  FileText,
  Heart,
  GraduationCap,
  BarChart3,
  Layers,
  MessageSquare,
  LayoutList,
  Settings,
};

// HandHeart and Church are not in all lucide versions, use fallbacks
function getIcon(name: string): LucideIcon {
  return iconMap[name] || Settings;
}

interface ModuleCardProps {
  module: StreamwoodModule;
  isSelected: boolean;
  onClick: () => void;
}

export function ModuleCard({ module, isSelected, onClick }: ModuleCardProps) {
  const Icon = getIcon(module.icon);

  return (
    <Card
      className={`cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${
        isSelected
          ? 'ring-2 ring-indigo-500 shadow-md bg-indigo-50 dark:bg-indigo-950/30'
          : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
      }`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div
            className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${module.color} text-white`}
          >
            <Icon size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-medium text-gray-400 dark:text-gray-500">
                {String(module.number).padStart(2, '0')}
              </span>
              <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                {module.title}
              </span>
              {module.isBeta && (
                <Badge
                  variant="secondary"
                  className="text-[10px] px-1 py-0 h-4 bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 border-0"
                >
                  Beta
                </Badge>
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2 leading-relaxed">
              {module.summary}
            </p>
            <div className="mt-2 text-xs text-indigo-600 dark:text-indigo-400 font-medium">
              {module.sections.length}개 기능
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
