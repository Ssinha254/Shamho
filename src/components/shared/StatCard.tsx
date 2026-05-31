import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  trend,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`stat-card ${onClick ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-text-secondary text-sm font-medium">{label}</p>
          <p className="text-2xl font-bold text-text mt-2">{value}</p>
          {trend && (
            <p
              className={`text-xs font-medium mt-2 ${
                trend.isPositive ? 'text-success' : 'text-danger'
              }`}
            >
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </p>
          )}
        </div>
        {icon && (
          <div className="p-3 bg-primary-light rounded-lg text-primary">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};
