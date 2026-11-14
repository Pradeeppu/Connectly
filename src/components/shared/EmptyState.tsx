import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionText,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 border border-dashed border-slate-800 rounded-2xl bg-slate-900/40 max-w-md mx-auto my-6">
      <div className="p-4 rounded-2xl bg-violet-500/10 text-violet-400 mb-4 ring-1 ring-violet-500/20">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-semibold text-slate-100 mb-1">{title}</h3>
      <p className="text-sm text-slate-400 mb-6">{description}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white font-medium text-sm rounded-xl transition-all shadow-lg shadow-violet-600/25 active:scale-95 cursor-pointer"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
