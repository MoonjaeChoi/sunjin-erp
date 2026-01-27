// Generated: 2026-01-28 00:30:00 KST

'use client';

import { DepartmentWithChildren } from '@/types/employee';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, Edit2, Trash2, Users } from 'lucide-react';

interface DepartmentTreeProps {
  departments: DepartmentWithChildren[];
  onEdit: (department: DepartmentWithChildren) => void;
  onDelete: (department: DepartmentWithChildren) => void;
  level?: number;
}

export function DepartmentTree({ departments, onEdit, onDelete, level = 0 }: DepartmentTreeProps) {
  return (
    <div className="space-y-1">
      {departments.map((department) => (
        <div key={department.id}>
          <div
            className="flex items-center justify-between py-2 px-2 hover:bg-gray-50 rounded-lg group"
            style={{ paddingLeft: `${level * 24 + 8}px` }}
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {department.children && department.children.length > 0 && (
                <ChevronRight className="h-4 w-4 text-gray-400" />
              )}
              {(!department.children || department.children.length === 0) && (
                <span className="w-4" />
              )}
              <span className="font-medium truncate">{department.name}</span>
              <Badge variant="outline" className="text-xs">
                {department.code}
              </Badge>
              {department.employeeCount !== undefined && department.employeeCount > 0 && (
                <Badge variant="secondary" className="text-xs gap-1">
                  <Users className="h-3 w-3" />
                  {department.employeeCount}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(department)}
                className="h-8 w-8 p-0"
              >
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(department)}
                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {department.children && department.children.length > 0 && (
            <DepartmentTree
              departments={department.children}
              onEdit={onEdit}
              onDelete={onDelete}
              level={level + 1}
            />
          )}
        </div>
      ))}
    </div>
  );
}
