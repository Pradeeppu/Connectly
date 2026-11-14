import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg'; text?: string }> = ({
  size = 'md',
  text,
}) => {
  const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 gap-3 text-slate-400">
      <Loader2 className={`${sizeMap[size]} animate-spin text-violet-500`} />
      {text && <p className="text-sm font-medium">{text}</p>}
    </div>
  );
};
