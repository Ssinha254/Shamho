import React from 'react';
import { InboxIcon } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  action,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="text-text-secondary mb-4">
        {icon || <InboxIcon size={48} />}
      </div>
      <h3 className="text-lg font-semibold text-text mb-2">{title}</h3>
      {description && (
        <p className="text-text-secondary text-sm max-w-sm text-center mb-4">
          {description}
        </p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
};
