import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { cn } from '../lib/utils';

interface SortableWidgetProps {
  id: string;
  children: React.ReactNode;
  className?: string;
}

export function SortableWidget({ id, children, className }: SortableWidgetProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative group",
        isDragging && "opacity-50",
        className
      )}
    >
      <div 
        {...attributes} 
        {...listeners}
        className="absolute top-4 right-4 p-2 text-zinc-300 hover:text-zinc-500 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity z-20 bg-white/80 dark:bg-zinc-900/80 rounded-lg backdrop-blur-sm"
      >
        <GripVertical className="w-5 h-5" />
      </div>
      {children}
    </div>
  );
}
