// src/components/common/LoadingState.tsx
import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  fullHeight?: boolean;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Carregando dados...',
  size = 'md',
  fullHeight = false,
}) => {
  const sizeMap = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 p-6 text-slate-500 dark:text-slate-400 ${
        fullHeight ? 'min-h-[400px]' : 'py-12'
      }`}
    >
      <Loader2 className={`${sizeMap[size]} animate-spin text-rose-600`} />
      <span className="text-xs font-semibold uppercase tracking-wider">{message}</span>
    </div>
  );
};
