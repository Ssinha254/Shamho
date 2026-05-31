import React from 'react';
import { cn } from '../../utils/format';

interface LoadingSkeletonProps {
  count?: number;
  type?: 'card' | 'table' | 'text';
  className?: string;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  count = 1,
  type = 'card',
  className,
}) => {
  const skeletons = Array.from({ length: count });

  if (type === 'card') {
    return (
      <div className={cn('grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3', className)}>
        {skeletons.map((_, i) => (
          <div key={i} className="card animate-pulse">
            <div className="h-4 bg-border rounded w-3/4 mb-4"></div>
            <div className="h-8 bg-border rounded w-full"></div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'table') {
    return (
      <div className={cn('space-y-2', className)}>
        {skeletons.map((_, i) => (
          <div key={i} className="h-12 bg-border rounded-lg animate-pulse"></div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      {skeletons.map((_, i) => (
        <div key={i} className="h-4 bg-border rounded animate-pulse"></div>
      ))}
    </div>
  );
};
